"""
Cache manager for vision analysis results
"""
import hashlib
import json
import logging
from typing import Optional, Dict, Any
import redis
from datetime import datetime, timedelta

from .config import settings

logger = logging.getLogger(__name__)


class VisionCache:
    """Cache for vision analysis results"""

    def __init__(self):
        """Initialize cache"""
        self.enabled = settings.cache_enabled
        self.ttl = settings.cache_ttl_seconds
        self.redis_client: Optional[redis.Redis] = None

        if self.enabled:
            try:
                self.redis_client = redis.Redis(
                    host=settings.redis_host,
                    port=settings.redis_port,
                    db=settings.redis_db,
                    decode_responses=True
                )
                # Test connection
                self.redis_client.ping()
                logger.info("Vision cache initialized")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}, cache disabled")
                self.enabled = False

    def _generate_key(
        self,
        image_hash: str,
        analysis_type: str,
        custom_prompt: Optional[str] = None
    ) -> str:
        """
        Generate cache key

        Args:
            image_hash: Image hash
            analysis_type: Analysis type
            custom_prompt: Custom prompt if any

        Returns:
            Cache key
        """
        # Include prompt hash if custom prompt used
        if custom_prompt:
            prompt_hash = hashlib.md5(custom_prompt.encode()).hexdigest()[:8]
            key = f"vision:{image_hash}:{analysis_type}:{prompt_hash}"
        else:
            key = f"vision:{image_hash}:{analysis_type}"

        return key

    def get(
        self,
        image_hash: str,
        analysis_type: str,
        custom_prompt: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached vision analysis

        Args:
            image_hash: Image hash
            analysis_type: Analysis type
            custom_prompt: Custom prompt if any

        Returns:
            Cached result or None
        """
        if not self.enabled or not self.redis_client:
            return None

        try:
            key = self._generate_key(image_hash, analysis_type, custom_prompt)
            cached_json = self.redis_client.get(key)

            if cached_json:
                logger.info(f"Cache HIT for {key}")
                return json.loads(cached_json)
            else:
                logger.info(f"Cache MISS for {key}")
                return None

        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    def set(
        self,
        image_hash: str,
        analysis_type: str,
        result: Dict[str, Any],
        custom_prompt: Optional[str] = None
    ):
        """
        Cache vision analysis result

        Args:
            image_hash: Image hash
            analysis_type: Analysis type
            result: Result to cache
            custom_prompt: Custom prompt if any
        """
        if not self.enabled or not self.redis_client:
            return

        try:
            key = self._generate_key(image_hash, analysis_type, custom_prompt)
            result_json = json.dumps(result)

            self.redis_client.setex(
                key,
                self.ttl,
                result_json
            )

            logger.info(f"Cached result for {key} (TTL: {self.ttl}s)")

        except Exception as e:
            logger.error(f"Cache set error: {e}")

    def clear_all(self):
        """Clear all vision cache"""
        if not self.enabled or not self.redis_client:
            return

        try:
            keys = self.redis_client.keys("vision:*")
            if keys:
                self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} cache entries")
        except Exception as e:
            logger.error(f"Cache clear error: {e}")

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.enabled or not self.redis_client:
            return {
                'enabled': False,
                'total_keys': 0
            }

        try:
            keys = self.redis_client.keys("vision:*")
            return {
                'enabled': True,
                'total_keys': len(keys),
                'ttl_seconds': self.ttl
            }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {
                'enabled': False,
                'error': str(e)
            }


class CostTracker:
    """Track vision API costs"""

    def __init__(self):
        """Initialize cost tracker"""
        self.redis_client: Optional[redis.Redis] = None

        try:
            self.redis_client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                decode_responses=False  # Store floats
            )
            logger.info("Cost tracker initialized")
        except Exception as e:
            logger.warning(f"Cost tracker initialization failed: {e}")

    def record_cost(self, cost: float, provider: str):
        """
        Record API cost

        Args:
            cost: Cost in USD
            provider: API provider
        """
        if not self.redis_client:
            return

        try:
            today = datetime.now().strftime("%Y-%m-%d")

            # Increment daily total
            total_key = f"cost:daily:{today}"
            self.redis_client.incrbyfloat(total_key, cost)
            self.redis_client.expire(total_key, 86400 * 7)  # Keep for 7 days

            # Increment provider-specific
            provider_key = f"cost:daily:{today}:{provider}"
            self.redis_client.incrbyfloat(provider_key, cost)
            self.redis_client.expire(provider_key, 86400 * 7)

            # Increment all-time total
            self.redis_client.incrbyfloat("cost:total", cost)

            logger.info(f"Recorded cost: ${cost:.4f} ({provider})")

        except Exception as e:
            logger.error(f"Failed to record cost: {e}")

    def get_daily_cost(self, date: Optional[datetime] = None) -> float:
        """
        Get total cost for a day

        Args:
            date: Date to query (None for today)

        Returns:
            Total cost in USD
        """
        if not self.redis_client:
            return 0.0

        try:
            if date is None:
                date = datetime.now()

            date_str = date.strftime("%Y-%m-%d")
            key = f"cost:daily:{date_str}"

            cost_bytes = self.redis_client.get(key)
            if cost_bytes:
                return float(cost_bytes)
            return 0.0

        except Exception as e:
            logger.error(f"Failed to get daily cost: {e}")
            return 0.0

    def get_total_cost(self) -> float:
        """
        Get all-time total cost

        Returns:
            Total cost in USD
        """
        if not self.redis_client:
            return 0.0

        try:
            cost_bytes = self.redis_client.get("cost:total")
            if cost_bytes:
                return float(cost_bytes)
            return 0.0

        except Exception as e:
            logger.error(f"Failed to get total cost: {e}")
            return 0.0

    def get_budget_status(self) -> Dict[str, Any]:
        """
        Get budget status

        Returns:
            Budget information
        """
        daily_cost = self.get_daily_cost()
        budget = settings.daily_vision_budget
        remaining = budget - daily_cost
        percentage_used = (daily_cost / budget * 100) if budget > 0 else 0

        return {
            'daily_budget': budget,
            'daily_cost': daily_cost,
            'remaining': remaining,
            'percentage_used': percentage_used,
            'budget_exceeded': daily_cost >= budget
        }

    def can_use_vision_api(self, estimated_cost: float) -> tuple[bool, str]:
        """
        Check if vision API can be used

        Args:
            estimated_cost: Estimated cost of operation

        Returns:
            Tuple of (can_use, reason)
        """
        budget_status = self.get_budget_status()

        if budget_status['budget_exceeded']:
            return False, "Daily budget exceeded"

        if budget_status['remaining'] < estimated_cost:
            return False, f"Insufficient budget (remaining: ${budget_status['remaining']:.2f})"

        # Warning at threshold
        if budget_status['percentage_used'] >= settings.cost_alert_threshold * 100:
            logger.warning(
                f"Budget alert: {budget_status['percentage_used']:.1f}% used "
                f"(${budget_status['daily_cost']:.2f}/${budget_status['daily_budget']})"
            )

        return True, "OK"


# Global instances
vision_cache = VisionCache()
cost_tracker = CostTracker()
