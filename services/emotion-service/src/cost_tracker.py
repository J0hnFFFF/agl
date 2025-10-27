"""
Cost tracking and budget management for ML emotion detection
"""
from datetime import date
from typing import Tuple, Dict, Any
from .models import DetectionMethod
from .config import settings


class CostStats:
    """Statistics for cost tracking"""

    def __init__(self):
        self.total_requests = 0
        self.rule_requests = 0
        self.ml_requests = 0
        self.cached_requests = 0
        self.total_cost = 0.0
        self.total_latency_ms = 0.0

    @property
    def average_cost(self) -> float:
        """Average cost per request"""
        return self.total_cost / self.total_requests if self.total_requests > 0 else 0.0

    @property
    def average_latency_ms(self) -> float:
        """Average latency per request"""
        return self.total_latency_ms / self.total_requests if self.total_requests > 0 else 0.0

    @property
    def ml_rate(self) -> float:
        """ML usage rate (percentage)"""
        non_cached = self.total_requests - self.cached_requests
        return (self.ml_requests / non_cached * 100) if non_cached > 0 else 0.0


class CostManager:
    """Manage costs and budgets for ML emotion detection"""

    def __init__(self):
        """Initialize cost manager"""
        self._daily_costs: Dict[date, CostStats] = {}
        self._current_date = date.today()

    def record_request(self, method: DetectionMethod, cost: float, latency_ms: float):
        """
        Record a request for cost tracking

        Args:
            method: Detection method used
            cost: Cost in USD
            latency_ms: Latency in milliseconds
        """
        stats = self._get_today_stats()

        stats.total_requests += 1
        stats.total_cost += cost
        stats.total_latency_ms += latency_ms

        if method == DetectionMethod.RULE:
            stats.rule_requests += 1
        elif method == DetectionMethod.ML:
            stats.ml_requests += 1
        elif method == DetectionMethod.CACHED:
            stats.cached_requests += 1

    def can_use_ml(self) -> Tuple[bool, str]:
        """
        Check if ML can be used based on budget and usage rate

        Returns:
            Tuple of (can_use, reason)
        """
        stats = self._get_today_stats()

        # Check daily budget
        if stats.total_cost >= settings.daily_ml_budget:
            return False, f"Daily budget exceeded (${stats.total_cost:.4f} >= ${settings.daily_ml_budget})"

        # Check ML usage rate (should not exceed target * 1.5)
        if stats.total_requests > 0:
            max_ml_rate = settings.ml_usage_rate_target * 1.5
            if stats.ml_rate > max_ml_rate * 100:
                return False, f"ML usage rate too high ({stats.ml_rate:.1f}% > {max_ml_rate * 100:.1f}%)"

        return True, "OK"

    def get_stats(self) -> CostStats:
        """Get today's statistics"""
        return self._get_today_stats()

    def get_budget_status(self) -> Dict[str, Any]:
        """Get current budget status"""
        stats = self._get_today_stats()

        return {
            "total_cost": round(stats.total_cost, 4),
            "total_requests": stats.total_requests,
            "rule_requests": stats.rule_requests,
            "ml_requests": stats.ml_requests,
            "cached_requests": stats.cached_requests,
            "average_cost": round(stats.average_cost, 6),
            "average_latency_ms": round(stats.average_latency_ms, 2),
            "budget_remaining": round(settings.daily_ml_budget - stats.total_cost, 4),
            "ml_rate": round(stats.ml_rate, 2),
            "target_ml_rate": settings.ml_usage_rate_target * 100
        }

    def _get_today_stats(self) -> CostStats:
        """Get or create today's stats"""
        today = date.today()

        # Check if day changed
        if today != self._current_date:
            self._current_date = today

        # Get or create stats for today
        if today not in self._daily_costs:
            self._daily_costs[today] = CostStats()

        return self._daily_costs[today]


# Global cost manager instance
cost_manager = CostManager()
