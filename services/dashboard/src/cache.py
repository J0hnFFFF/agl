"""
Simple caching for Dashboard API responses
"""
from functools import lru_cache
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class DashboardCache:
    """
    Simple in-memory cache for Dashboard API responses

    Uses LRU cache with time-based invalidation.
    Reduces load on Analytics API and improves Dashboard performance.
    """

    @staticmethod
    def get_cache_key(prefix: str, days: int) -> str:
        """
        Generate time-based cache key

        Cache invalidates every minute, ensuring data freshness
        while reducing API calls.

        Args:
            prefix: Cache key prefix (e.g., 'platform_stats', 'costs')
            days: Number of days parameter

        Returns:
            Cache key with minute-level granularity
        """
        # Cache key changes every minute
        timestamp = datetime.now().strftime("%Y%m%d%H%M")
        return f"{prefix}_{days}_{timestamp}"

    @staticmethod
    @lru_cache(maxsize=128)
    def platform_stats(days: int, cache_key: str, fetch_func):
        """
        Cached platform stats

        Args:
            days: Number of days
            cache_key: Time-based cache key
            fetch_func: Function to fetch data if cache miss

        Returns:
            Platform statistics (cached or fresh)
        """
        logger.debug(f"Cache miss for platform_stats (days={days}, key={cache_key})")
        return fetch_func(days)

    @staticmethod
    @lru_cache(maxsize=128)
    def hourly_data(hours: int, game_id: str, cache_key: str, fetch_func):
        """Cached hourly analytics"""
        logger.debug(f"Cache miss for hourly_data (hours={hours}, game_id={game_id})")
        return fetch_func(game_id, hours)

    @staticmethod
    @lru_cache(maxsize=128)
    def cost_data(days: int, game_id: str, service: str, cache_key: str, fetch_func):
        """Cached cost analytics"""
        logger.debug(f"Cache miss for cost_data (days={days}, game={game_id}, service={service})")
        return fetch_func(days, game_id, service)

    @staticmethod
    def clear():
        """Clear all caches"""
        DashboardCache.platform_stats.cache_clear()
        DashboardCache.hourly_data.cache_clear()
        DashboardCache.cost_data.cache_clear()
        logger.info("Dashboard cache cleared")


# Global cache instance
dashboard_cache = DashboardCache()
