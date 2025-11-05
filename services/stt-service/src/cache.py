"""
Redis cache for STT results
"""
import redis
import hashlib
import json
from typing import Optional
from .config import settings


class STTCache:
    """
    Cache for speech-to-text results

    Caching Strategy:
    - Key: SHA256 hash of audio data
    - Value: JSON with transcription result
    - TTL: 7 days (configurable)
    - Reduces API calls for repeated audio
    """

    def __init__(self):
        """Initialize Redis connection"""
        try:
            self.redis = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                password=settings.redis_password,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5
            )
            # Test connection
            self.redis.ping()
            self.enabled = settings.cache_enabled
        except Exception as e:
            print(f"Warning: Redis connection failed for STT cache: {e}")
            self.redis = None
            self.enabled = False

    def _generate_key(self, audio_data: bytes, language: Optional[str] = None) -> str:
        """
        Generate cache key from audio data

        Args:
            audio_data: Raw audio bytes
            language: Optional language code for language-specific caching

        Returns:
            Cache key (SHA256 hash)
        """
        # Hash audio data
        hash_obj = hashlib.sha256(audio_data)

        # Include language in hash for language-specific results
        if language:
            hash_obj.update(language.encode())

        audio_hash = hash_obj.hexdigest()
        return f"{settings.service_name}:transcription:{audio_hash}"

    def get(self, audio_data: bytes, language: Optional[str] = None) -> Optional[dict]:
        """
        Get cached transcription result

        Args:
            audio_data: Raw audio bytes
            language: Optional language code

        Returns:
            Cached result dict or None
        """
        if not self.enabled or not self.redis:
            return None

        try:
            key = self._generate_key(audio_data, language)
            cached = self.redis.get(key)

            if cached:
                return json.loads(cached)

            return None

        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set(self, audio_data: bytes, result: dict, language: Optional[str] = None):
        """
        Cache transcription result

        Args:
            audio_data: Raw audio bytes
            result: Transcription result dict
            language: Optional language code
        """
        if not self.enabled or not self.redis:
            return

        try:
            key = self._generate_key(audio_data, language)
            self.redis.setex(
                key,
                settings.cache_ttl_seconds,
                json.dumps(result)
            )
        except Exception as e:
            print(f"Cache set error: {e}")

    def get_stats(self) -> dict:
        """
        Get cache statistics

        Returns:
            Dictionary with cache stats
        """
        if not self.redis:
            return {
                "enabled": False,
                "error": "Redis not connected"
            }

        try:
            # Get all STT cache keys
            pattern = f"{settings.service_name}:transcription:*"
            keys = self.redis.keys(pattern)

            return {
                "enabled": self.enabled,
                "cache_size": len(keys),
                "ttl_seconds": settings.cache_ttl_seconds,
                "ttl_days": settings.cache_ttl_seconds / 86400
            }

        except Exception as e:
            return {
                "enabled": self.enabled,
                "error": str(e)
            }

    def clear(self):
        """Clear all STT cache entries"""
        if not self.redis:
            return

        try:
            pattern = f"{settings.service_name}:transcription:*"
            keys = self.redis.keys(pattern)

            if keys:
                self.redis.delete(*keys)

        except Exception as e:
            print(f"Cache clear error: {e}")


# Global cache instance
stt_cache = STTCache()
