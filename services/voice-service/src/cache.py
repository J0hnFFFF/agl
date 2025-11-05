"""
Redis cache for Voice Service
"""
import redis
import hashlib
import json
import base64
from typing import Optional, Tuple
from .config import settings
from .models import SynthesizeRequest


class VoiceCache:
    """
    Redis-based cache for synthesized audio

    Cache Strategy:
    - Key: SHA256 hash of (text + persona + language + voice + speed)
    - Value: JSON with audio_bytes (base64), cost, metadata
    - TTL: 7 days (audio can be reused for longer periods)
    """

    def __init__(self):
        """Initialize Redis connection"""
        self.enabled = settings.cache_enabled
        if self.enabled:
            try:
                self.redis = redis.Redis(
                    host=settings.redis_host,
                    port=settings.redis_port,
                    db=settings.redis_db,
                    decode_responses=False  # Binary data for audio
                )
                # Test connection
                self.redis.ping()
            except Exception as e:
                print(f"Warning: Redis connection failed: {e}")
                self.redis = None
                self.enabled = False
        else:
            self.redis = None

        self.ttl = settings.cache_ttl
        self.hits = 0
        self.misses = 0

    def _generate_key(self, request: SynthesizeRequest) -> str:
        """
        Generate cache key from request parameters

        Args:
            request: Synthesis request

        Returns:
            Cache key string
        """
        # Create consistent hash from all relevant parameters
        key_data = {
            "text": request.text,
            "persona": request.persona.value,
            "language": request.language.value,
            "voice": request.voice or "default",
            "speed": request.speed or 1.0,
            "format": request.format.value
        }
        key_str = json.dumps(key_data, sort_keys=True)
        key_hash = hashlib.sha256(key_str.encode()).hexdigest()[:16]
        return f"{settings.service_name}:audio:{key_hash}"

    def get(self, request: SynthesizeRequest) -> Optional[Tuple[bytes, float, dict]]:
        """
        Get cached audio

        Args:
            request: Synthesis request

        Returns:
            Tuple of (audio_bytes, cost, metadata) or None if not found
        """
        if not self.enabled or not self.redis:
            return None

        key = self._generate_key(request)
        try:
            cached = self.redis.get(key)
            if cached:
                self.hits += 1
                data = json.loads(cached)

                # Decode base64 audio
                audio_bytes = base64.b64decode(data["audio_bytes"])
                cost = data["cost"]
                metadata = data.get("metadata", {})

                return audio_bytes, cost, metadata
            else:
                self.misses += 1
                return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None

    def set(self, request: SynthesizeRequest, audio_bytes: bytes, cost: float, metadata: dict = None):
        """
        Cache synthesized audio

        Args:
            request: Synthesis request
            audio_bytes: Audio binary data
            cost: Synthesis cost
            metadata: Additional metadata (duration, etc.)
        """
        if not self.enabled or not self.redis:
            return

        key = self._generate_key(request)
        try:
            # Encode audio as base64 for JSON storage
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

            data = {
                "audio_bytes": audio_base64,
                "cost": cost,
                "metadata": metadata or {}
            }

            self.redis.setex(key, self.ttl, json.dumps(data))
        except Exception as e:
            print(f"Cache set error: {e}")

    def clear(self):
        """Clear all voice cache"""
        if self.redis:
            # Clear only this service's keys
            pattern = f"{settings.service_name}:audio:*"
            keys = list(self.redis.scan_iter(match=pattern))
            if keys:
                self.redis.delete(*keys)
            self.hits = 0
            self.misses = 0

    def get_stats(self) -> dict:
        """
        Get cache statistics

        Returns:
            Dictionary with cache stats
        """
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0

        # Get cache size
        cache_size = 0
        if self.redis:
            pattern = f"{settings.service_name}:audio:*"
            cache_size = len(list(self.redis.scan_iter(match=pattern)))

        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": f"{hit_rate:.1f}%",
            "cache_size": cache_size,
            "ttl_seconds": self.ttl,
            "enabled": self.enabled
        }


# Global cache instance
voice_cache = VoiceCache()
