"""
Caching system for emotion detection
"""
import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any


class EmotionCache:
    """In-memory cache for emotion detection results"""

    def __init__(self):
        """Initialize cache"""
        self._cache: Dict[str, Tuple[str, float, str, float, datetime]] = {}
        self._hits = 0
        self._misses = 0

    def get(self, event_type: str, event_data: Dict[str, Any], context: Dict[str, Any]) -> Optional[Tuple[str, float, str, float]]:
        """
        Get cached emotion result

        Args:
            event_type: Event type
            event_data: Event data
            context: Player context

        Returns:
            Tuple of (emotion, intensity, reasoning, confidence) or None if not found/expired
        """
        cache_key = self._generate_key(event_type, event_data, context)

        if cache_key in self._cache:
            emotion, intensity, reasoning, confidence, expiry = self._cache[cache_key]

            # Check if expired
            if datetime.now() > expiry:
                del self._cache[cache_key]
                self._misses += 1
                return None

            self._hits += 1
            return (emotion, intensity, reasoning, confidence)

        self._misses += 1
        return None

    def set(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        context: Dict[str, Any],
        emotion: str,
        intensity: float,
        reasoning: str,
        confidence: float,
        ttl: int = 1800
    ):
        """
        Cache emotion result

        Args:
            event_type: Event type
            event_data: Event data
            context: Player context
            emotion: Detected emotion
            intensity: Emotion intensity
            reasoning: Detection reasoning
            confidence: Detection confidence
            ttl: Time to live in seconds
        """
        cache_key = self._generate_key(event_type, event_data, context)
        expiry = datetime.now() + timedelta(seconds=ttl)

        self._cache[cache_key] = (emotion, intensity, reasoning, confidence, expiry)

    def clear(self):
        """Clear all cache entries"""
        self._cache.clear()
        self._hits = 0
        self._misses = 0

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self._hits + self._misses
        hit_rate = self._hits / total_requests if total_requests > 0 else 0.0

        return {
            "hits": self._hits,
            "misses": self._misses,
            "total_requests": total_requests,
            "hit_rate": round(hit_rate, 3),
            "size": len(self._cache)
        }

    def _generate_key(self, event_type: str, event_data: Dict[str, Any], context: Dict[str, Any]) -> str:
        """
        Generate cache key from request parameters

        Includes stable fields that affect emotion detection:
        - event_type
        - Important event_data fields (rarity, difficulty, streaks, etc.)
        - Important context fields (health status, combat state)

        Excludes unstable fields:
        - Exact numeric values (use ranges)
        - Timestamps
        - Random IDs
        """
        # Extract stable event data fields
        stable_event_data = {}

        # Rarity levels
        if "rarity" in event_data:
            stable_event_data["rarity"] = event_data["rarity"]

        # Difficulty
        if "difficulty" in event_data:
            stable_event_data["difficulty"] = event_data["difficulty"]

        # MVP status
        if event_data.get("mvp") or event_data.get("isMVP"):
            stable_event_data["mvp"] = True

        # Kill count (grouped)
        kill_count = event_data.get("killCount", 0)
        if kill_count > 0:
            if kill_count == 1:
                stable_event_data["kill_count"] = "single"
            elif kill_count < 5:
                stable_event_data["kill_count"] = "multi"
            else:
                stable_event_data["kill_count"] = "ultra"

        # Streaks (grouped)
        win_streak = event_data.get("winStreak", 0)
        if win_streak >= 3:
            if win_streak < 5:
                stable_event_data["win_streak"] = "medium"
            else:
                stable_event_data["win_streak"] = "high"

        loss_streak = event_data.get("lossStreak", 0)
        if loss_streak >= 3:
            if loss_streak < 5:
                stable_event_data["loss_streak"] = "medium"
            else:
                stable_event_data["loss_streak"] = "high"

        # Extract stable context fields
        stable_context = {}

        # Health status (grouped)
        health = context.get("playerHealth", 100)
        if health < 20:
            stable_context["health"] = "critical"
        elif health < 50:
            stable_context["health"] = "low"

        # Combat state
        if context.get("inCombat"):
            stable_context["in_combat"] = True

        # Create cache key from stable fields
        key_data = {
            "event_type": event_type,
            "event_data": stable_event_data,
            "context": stable_context
        }

        # Generate hash
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()


# Global cache instance
emotion_cache = EmotionCache()
