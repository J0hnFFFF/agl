"""
Cost tracking and budget management for Voice Service
"""
import redis
from datetime import datetime
from typing import Tuple
from .config import settings
from .models import SynthesisMethod


class CostManager:
    """
    Manage daily budget and track TTS costs

    OpenAI TTS Pricing (as of 2024):
    - tts-1: $0.015 per 1K characters
    - tts-1-hd: $0.030 per 1K characters
    """

    def __init__(self):
        """Initialize cost tracker"""
        try:
            self.redis = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                decode_responses=True
            )
            # Test connection
            self.redis.ping()
        except Exception as e:
            print(f"Warning: Redis connection failed for cost tracking: {e}")
            self.redis = None

        self.daily_budget = settings.daily_tts_budget
        self.max_cost_per_request = settings.max_cost_per_request

    def _get_daily_key(self) -> str:
        """
        Get Redis key for today's costs

        Budget resets daily at UTC 00:00.
        Example: '2024-01-15' resets at 2024-01-15T00:00:00Z
        """
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        return f"{settings.service_name}:cost:{date_str}"

    def _get_stats_key(self) -> str:
        """Get Redis key for request stats"""
        date_str = datetime.now().strftime("%Y-%m-%d")
        return f"{settings.service_name}:stats:{date_str}"

    def get_daily_cost(self) -> float:
        """
        Get today's total cost

        Returns:
            Total cost in USD
        """
        if not self.redis:
            return 0.0

        key = self._get_daily_key()
        cost = self.redis.get(key)
        return float(cost) if cost else 0.0

    def can_use_tts(self) -> Tuple[bool, str]:
        """
        Check if we can use TTS based on daily budget

        Includes alerting at 80% and 95% thresholds.

        Returns:
            Tuple of (can_use, reason)
        """
        if not self.redis:
            return True, "Cost tracking unavailable, allowing request"

        daily_cost = self.get_daily_cost()
        usage_percent = (daily_cost / self.daily_budget) * 100

        # Budget exceeded
        if daily_cost >= self.daily_budget:
            self._trigger_alert('budget_exceeded', daily_cost, usage_percent)
            return False, f"Daily budget ${self.daily_budget} exceeded (current: ${daily_cost:.2f})"

        # Warning at 95%
        if usage_percent >= 95 and not self._alert_sent('warning_95'):
            self._trigger_alert('warning_95', daily_cost, usage_percent)

        # Warning at 80%
        if usage_percent >= 80 and not self._alert_sent('warning_80'):
            self._trigger_alert('warning_80', daily_cost, usage_percent)

        return True, "OK"

    def _alert_sent(self, alert_type: str) -> bool:
        """Check if alert has been sent today"""
        if not self.redis:
            return False
        key = f"{self._get_daily_key()}:alert:{alert_type}"
        return self.redis.exists(key)

    def _trigger_alert(self, alert_type: str, cost: float, usage_percent: float):
        """
        Trigger cost alert

        In production, integrate with:
        - Email (SendGrid, AWS SES)
        - Slack webhook
        - PagerDuty
        - Prometheus Alertmanager
        """
        import logging
        logger = logging.getLogger(__name__)

        messages = {
            'warning_80': f'⚠️  Voice Service: Budget usage at {usage_percent:.1f}% (${cost:.2f} / ${self.daily_budget})',
            'warning_95': f'🚨 Voice Service: Budget usage at {usage_percent:.1f}% (${cost:.2f} / ${self.daily_budget}) - CRITICAL',
            'budget_exceeded': f'❌ Voice Service: Budget EXCEEDED! ({usage_percent:.1f}%, ${cost:.2f} / ${self.daily_budget})'
        }

        message = messages.get(alert_type, f'Alert: {alert_type}')
        logger.warning(message)

        # Mark alert as sent
        if self.redis:
            key = f"{self._get_daily_key()}:alert:{alert_type}"
            self.redis.set(key, '1', ex=86400)  # Expire after 1 day

        # TODO: Integrate with external alerting system
        # self._send_email_alert(message)
        # self._send_slack_alert(message)
        # self._send_pagerduty_alert(alert_type, message)

    def record_request(self, method: SynthesisMethod, cost: float, latency_ms: float, character_count: int):
        """
        Record synthesis request cost and stats

        Args:
            method: Synthesis method used (CACHED or TTS)
            cost: Cost in USD
            latency_ms: Request latency in milliseconds
            character_count: Number of characters synthesized
        """
        if not self.redis:
            return

        # Record cost
        daily_key = self._get_daily_key()
        self.redis.incrbyfloat(daily_key, cost)
        self.redis.expire(daily_key, 86400 * 2)  # Keep for 2 days

        # Record stats
        stats_key = self._get_stats_key()
        self.redis.hincrby(stats_key, f"{method.value}_count", 1)
        self.redis.hincrby(stats_key, f"{method.value}_latency", int(latency_ms))
        self.redis.hincrby(stats_key, f"{method.value}_characters", character_count)
        self.redis.expire(stats_key, 86400 * 2)

    def get_budget_status(self) -> dict:
        """
        Get current budget status and usage statistics

        Returns:
            Dictionary with budget and usage stats
        """
        if not self.redis:
            return {
                "error": "Cost tracking unavailable (Redis not connected)"
            }

        daily_cost = self.get_daily_cost()

        stats_key = self._get_stats_key()
        stats = self.redis.hgetall(stats_key)

        # Calculate request counts
        cached_count = int(stats.get("cached_count", 0))
        tts_count = int(stats.get("tts_count", 0))
        total_requests = cached_count + tts_count

        # Calculate character counts
        cached_chars = int(stats.get("cached_characters", 0))
        tts_chars = int(stats.get("tts_characters", 0))
        total_chars = cached_chars + tts_chars

        # Calculate average latencies
        avg_cached_latency = 0
        if cached_count > 0:
            avg_cached_latency = int(stats.get("cached_latency", 0)) / cached_count

        avg_tts_latency = 0
        if tts_count > 0:
            avg_tts_latency = int(stats.get("tts_latency", 0)) / tts_count

        # Calculate cache hit rate
        cache_hit_rate = (cached_count / total_requests * 100) if total_requests > 0 else 0

        return {
            "daily_budget": f"${self.daily_budget:.2f}",
            "daily_cost": f"${daily_cost:.4f}",
            "remaining": f"${max(0, self.daily_budget - daily_cost):.4f}",
            "usage_percent": f"{(daily_cost / self.daily_budget * 100):.1f}%",
            "total_requests": total_requests,
            "cached_requests": cached_count,
            "tts_requests": tts_count,
            "cache_hit_rate": f"{cache_hit_rate:.1f}%",
            "total_characters": total_chars,
            "cached_characters": cached_chars,
            "tts_characters": tts_chars,
            "avg_cached_latency_ms": f"{avg_cached_latency:.1f}",
            "avg_tts_latency_ms": f"{avg_tts_latency:.1f}"
        }


# Global cost manager instance
cost_manager = CostManager()
