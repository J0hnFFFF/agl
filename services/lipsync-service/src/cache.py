"""
Cache manager for lip sync results
"""
import hashlib
import json
import logging
from typing import Optional, Dict, Any, List
import redis
from .config import settings
from .models import VisemeEvent

logger = logging.getLogger(__name__)


class LipSyncCache:
    """Cache for lip sync results"""

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
                logger.info("LipSync cache initialized")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}, cache disabled")
                self.enabled = False

    def _generate_key(
        self,
        audio_data: bytes,
        language: str,
        output_format: str,
        blend_transitions: bool
    ) -> str:
        """
        Generate cache key from audio and parameters

        Args:
            audio_data: Raw audio bytes
            language: Language code
            output_format: Output format
            blend_transitions: Whether blending is enabled

        Returns:
            Cache key
        """
        # Hash audio data
        audio_hash = hashlib.sha256(audio_data).hexdigest()[:16]

        # Build key
        key = f"lipsync:{audio_hash}:{language}:{output_format}:{blend_transitions}"
        return key

    def get(
        self,
        audio_data: bytes,
        language: str,
        output_format: str,
        blend_transitions: bool
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached lip sync result

        Args:
            audio_data: Raw audio bytes
            language: Language code
            output_format: Output format
            blend_transitions: Whether blending is enabled

        Returns:
            Cached result or None
        """
        if not self.enabled or not self.redis_client:
            return None

        try:
            key = self._generate_key(audio_data, language, output_format, blend_transitions)
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
        audio_data: bytes,
        language: str,
        output_format: str,
        blend_transitions: bool,
        result: Dict[str, Any]
    ):
        """
        Cache lip sync result

        Args:
            audio_data: Raw audio bytes
            language: Language code
            output_format: Output format
            blend_transitions: Whether blending is enabled
            result: Result to cache
        """
        if not self.enabled or not self.redis_client:
            return

        try:
            key = self._generate_key(audio_data, language, output_format, blend_transitions)
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
        """Clear all lip sync cache"""
        if not self.enabled or not self.redis_client:
            return

        try:
            # Find all lip sync keys
            keys = self.redis_client.keys("lipsync:*")
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
            keys = self.redis_client.keys("lipsync:*")
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


# Global instance
lipsync_cache = LipSyncCache()
