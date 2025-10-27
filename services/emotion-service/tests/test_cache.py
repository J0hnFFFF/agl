"""
Tests for EmotionCache
"""
import pytest
import time
from src.cache import EmotionCache


class TestEmotionCache:
    """Test emotion caching system"""

    def setup_method(self):
        """Setup for each test"""
        self.cache = EmotionCache()
        self.cache.clear()

    def test_cache_set_and_get(self):
        """Test basic cache set and get"""
        event_type = "player.victory"
        event_data = {"mvp": True}
        context = {"playerHealth": 100}

        # Set cache
        self.cache.set(event_type, event_data, context, "happy", 0.9, "Victory!", 0.95)

        # Get from cache
        result = self.cache.get(event_type, event_data, context)

        assert result is not None
        emotion, intensity, reasoning, confidence = result
        assert emotion == "happy"
        assert intensity == 0.9
        assert reasoning == "Victory!"
        assert confidence == 0.95

    def test_cache_miss(self):
        """Test cache miss"""
        result = self.cache.get("player.victory", {}, {})
        assert result is None

    def test_cache_different_events(self):
        """Test cache differentiates between events"""
        self.cache.set("player.victory", {}, {}, "happy", 0.9, "Win", 0.9)
        self.cache.set("player.defeat", {}, {}, "sad", 0.7, "Loss", 0.85)

        result1 = self.cache.get("player.victory", {}, {})
        result2 = self.cache.get("player.defeat", {}, {})

        assert result1[0] == "happy"
        assert result2[0] == "sad"

    def test_cache_expiration(self):
        """Test cache entries expire"""
        event_type = "player.victory"
        event_data = {}
        context = {}

        # Set with 1 second TTL
        self.cache.set(event_type, event_data, context, "happy", 0.9, "Win", 0.9, ttl=1)

        # Should be available immediately
        result = self.cache.get(event_type, event_data, context)
        assert result is not None

        # Wait for expiration
        time.sleep(1.1)

        # Should be expired
        result = self.cache.get(event_type, event_data, context)
        assert result is None

    def test_cache_stats(self):
        """Test cache statistics"""
        event_type = "player.victory"
        event_data = {}
        context = {}

        # Set and hit cache
        self.cache.set(event_type, event_data, context, "happy", 0.9, "Win", 0.9)
        self.cache.get(event_type, event_data, context)
        self.cache.get(event_type, event_data, context)

        # Miss cache
        self.cache.get("player.defeat", {}, {})

        stats = self.cache.get_stats()

        assert stats["hits"] == 2
        assert stats["misses"] == 1
        assert stats["total_requests"] == 3
        assert stats["hit_rate"] == pytest.approx(2/3)
        assert stats["size"] == 1

    def test_cache_clear(self):
        """Test cache clear"""
        self.cache.set("player.victory", {}, {}, "happy", 0.9, "Win", 0.9)
        assert self.cache.get("player.victory", {}, {}) is not None

        self.cache.clear()

        assert self.cache.get("player.victory", {}, {}) is None
        stats = self.cache.get_stats()
        assert stats["size"] == 0
        assert stats["hits"] == 0

    def test_cache_key_groups_similar_events(self):
        """Test cache key groups similar kill counts"""
        # Single kills should match
        self.cache.set("player.kill", {"killCount": 1}, {}, "satisfied", 0.7, "Kill", 0.85)

        result1 = self.cache.get("player.kill", {"killCount": 1}, {})
        assert result1 is not None

        # Multi-kills (2-4) should match each other
        self.cache.set("player.kill", {"killCount": 2}, {}, "excited", 0.95, "Double", 0.9)

        result2 = self.cache.get("player.kill", {"killCount": 3}, {})
        assert result2 is not None
        assert result2[0] == "excited"

    def test_cache_key_groups_health_status(self):
        """Test cache key groups health into categories"""
        # Critical health
        self.cache.set("player.victory", {}, {"playerHealth": 15}, "happy", 0.7, "Close call", 0.85)

        result1 = self.cache.get("player.victory", {}, {"playerHealth": 10})
        assert result1 is not None

        # Low health
        self.cache.set("player.victory", {}, {"playerHealth": 40}, "happy", 0.8, "Won", 0.85)

        result2 = self.cache.get("player.victory", {}, {"playerHealth": 45})
        assert result2 is not None

        # Normal health (not cached separately)
        result3 = self.cache.get("player.victory", {}, {"playerHealth": 100})
        # Should not match critical or low health
        assert result3 != result1
        assert result3 != result2

    def test_cache_includes_mvp_status(self):
        """Test cache includes MVP status"""
        self.cache.set("player.victory", {"mvp": True}, {}, "excited", 1.0, "MVP!", 0.95)

        # Should match with isMVP variant
        result = self.cache.get("player.victory", {"isMVP": True}, {})
        assert result is not None

        # Should not match without MVP
        result_no_mvp = self.cache.get("player.victory", {}, {})
        assert result_no_mvp != result
