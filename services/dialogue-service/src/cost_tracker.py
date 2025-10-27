"""
Cost Tracking and Budget Management
"""
from datetime import datetime, date
from typing import Dict
from .models import CostTracker, GenerationMethod
from .config import settings
import logging

logger = logging.getLogger(__name__)


class CostManager:
    """Manages daily cost tracking and budget enforcement"""

    def __init__(self):
        self._daily_costs: Dict[str, CostTracker] = {}
        self._current_date = date.today()

    def record_request(
        self,
        method: GenerationMethod,
        cost: float,
        latency_ms: float
    ):
        """Record a dialogue generation request"""
        today = date.today()

        # Reset if new day
        if today != self._current_date:
            self._daily_costs.clear()
            self._current_date = today

        # Get or create tracker for today
        date_str = today.isoformat()
        if date_str not in self._daily_costs:
            self._daily_costs[date_str] = CostTracker(date=date_str)

        tracker = self._daily_costs[date_str]

        # Update counts
        tracker.total_requests += 1
        tracker.total_cost += cost

        if method == GenerationMethod.LLM:
            tracker.llm_requests += 1
        elif method == GenerationMethod.TEMPLATE:
            tracker.template_requests += 1
        elif method == GenerationMethod.CACHED:
            tracker.cached_requests += 1

        # Update averages
        tracker.average_cost = tracker.total_cost / tracker.total_requests
        total_latency = tracker.average_latency_ms * (tracker.total_requests - 1) + latency_ms
        tracker.average_latency_ms = total_latency / tracker.total_requests

    def can_use_llm(self) -> tuple[bool, str]:
        """
        Check if LLM can be used based on budget

        Returns:
            (can_use, reason)
        """
        if not settings.llm_enabled:
            return False, "LLM disabled in settings"

        today = date.today().isoformat()
        if today not in self._daily_costs:
            return True, "OK"

        tracker = self._daily_costs[today]

        # Check daily budget
        if tracker.total_cost >= settings.daily_llm_budget:
            logger.warning(
                f"Daily LLM budget exceeded: ${tracker.total_cost:.2f} / ${settings.daily_llm_budget:.2f}"
            )
            return False, f"Daily budget exceeded (${tracker.total_cost:.2f})"

        # Check LLM usage rate (should be around 10%)
        if tracker.total_requests > 0:
            llm_rate = tracker.llm_requests / tracker.total_requests
            if llm_rate > settings.llm_usage_rate * 1.5:  # 50% tolerance
                logger.warning(
                    f"LLM usage rate too high: {llm_rate:.1%} (target: {settings.llm_usage_rate:.1%})"
                )
                return False, f"LLM usage rate too high ({llm_rate:.1%})"

        return True, "OK"

    def get_stats(self) -> CostTracker:
        """Get today's cost statistics"""
        today = date.today().isoformat()
        if today in self._daily_costs:
            return self._daily_costs[today]

        # Return empty tracker
        return CostTracker(date=today)

    def get_budget_status(self) -> dict:
        """Get budget status"""
        tracker = self.get_stats()

        budget_used_pct = (tracker.total_cost / settings.daily_llm_budget) * 100 if settings.daily_llm_budget > 0 else 0
        llm_rate = (tracker.llm_requests / tracker.total_requests * 100) if tracker.total_requests > 0 else 0

        return {
            "date": tracker.date,
            "total_cost": tracker.total_cost,
            "daily_budget": settings.daily_llm_budget,
            "budget_used_pct": budget_used_pct,
            "budget_remaining": max(0, settings.daily_llm_budget - tracker.total_cost),
            "total_requests": tracker.total_requests,
            "llm_requests": tracker.llm_requests,
            "template_requests": tracker.template_requests,
            "cached_requests": tracker.cached_requests,
            "llm_rate": llm_rate,
            "target_llm_rate": settings.llm_usage_rate * 100,
            "average_cost": tracker.average_cost,
            "average_latency_ms": tracker.average_latency_ms,
        }


# Global cost manager instance
cost_manager = CostManager()
