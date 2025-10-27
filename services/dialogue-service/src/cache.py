"""
Dialogue Cache System
Caches LLM responses to reduce cost and latency
"""
from typing import Optional
import hashlib
import json
from datetime import datetime, timedelta
from .models import DialogueRequest
from .config import settings
import logging

logger = logging.getLogger(__name__)


class DialogueCache:
    """In-memory cache for dialogue responses"""

    def __init__(self):
        self._cache: dict[str, tuple[str, datetime, float]] = {}  # key -> (dialogue, expiry, cost)
        self._hits = 0
        self._misses = 0

    def get(self, request: DialogueRequest) -> Optional[tuple[str, float]]:
        """
        Get cached dialogue if available

        Returns:
            (dialogue, cost) or None if not cached
        """
        cache_key = self._generate_key(request)

        if cache_key in self._cache:
            dialogue, expiry, cost = self._cache[cache_key]

            # Check if expired
            if datetime.now() > expiry:
                del self._cache[cache_key]
                self._misses += 1
                return None

            self._hits += 1
            logger.debug(f"Cache hit for key {cache_key[:16]}...")
            return dialogue, cost

        self._misses += 1
        return None

    def set(
        self,
        request: DialogueRequest,
        dialogue: str,
        cost: float,
        ttl: Optional[int] = None
    ):
        """
        Cache dialogue response

        Args:
            request: Original request
            dialogue: Generated dialogue
            cost: Generation cost
            ttl: Time-to-live in seconds (default from settings)
        """
        if not settings.cache_enabled:
            return

        cache_key = self._generate_key(request)
        ttl = ttl or settings.cache_ttl
        expiry = datetime.now() + timedelta(seconds=ttl)

        self._cache[cache_key] = (dialogue, expiry, cost)
        logger.debug(f"Cached dialogue for key {cache_key[:16]}...")

        # Cleanup expired entries periodically
        self._cleanup_expired()

    def _generate_key(self, request: DialogueRequest) -> str:
        """
        Generate cache key from request

        Key includes: event_type, emotion, persona, and relevant context
        """
        # Create deterministic key from request
        key_data = {
            "event_type": request.event_type,
            "emotion": request.emotion,
            "persona": request.persona.value,
        }

        # Include important context fields
        if request.context:
            # Only cache on stable context fields
            stable_fields = ["rarity", "is_first_time", "mvp"]
            for field in stable_fields:
                if field in request.context:
                    key_data[field] = request.context[field]

        # Generate hash
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.sha256(key_string.encode()).hexdigest()

    def _cleanup_expired(self):
        """Remove expired entries from cache"""
        now = datetime.now()
        expired_keys = [
            key for key, (_, expiry, _) in self._cache.items()
            if now > expiry
        ]

        for key in expired_keys:
            del self._cache[key]

        if expired_keys:
            logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")

    def clear(self):
        """Clear all cache"""
        self._cache.clear()
        self._hits = 0
        self._misses = 0
        logger.info("Cache cleared")

    def get_stats(self) -> dict:
        """Get cache statistics"""
        total_requests = self._hits + self._misses
        hit_rate = self._hits / total_requests if total_requests > 0 else 0.0

        return {
            "size": len(self._cache),
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": hit_rate,
            "total_requests": total_requests,
        }


# Global cache instance
dialogue_cache = DialogueCache()
