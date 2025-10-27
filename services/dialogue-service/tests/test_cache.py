"""
Tests for Dialogue Cache
"""
import pytest
import time
from src.cache import DialogueCache
from src.models import DialogueRequest, Persona


class TestDialogueCache:
    """Test dialogue caching system"""

    def setup_method(self):
        """Setup for each test"""
        self.cache = DialogueCache()
        self.cache.clear()

    def test_cache_set_and_get(self):
        """Test basic cache set and get"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )

        # Set cache
        self.cache.set(request, "太棒了！", 0.0)

        # Get from cache
        result = self.cache.get(request)

        assert result is not None
        dialogue, cost = result
        assert dialogue == "太棒了！"
        assert cost == 0.0

    def test_cache_miss(self):
        """Test cache miss"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )

        result = self.cache.get(request)
        assert result is None

    def test_cache_different_requests(self):
        """Test cache differentiates between requests"""
        request1 = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )
        request2 = DialogueRequest(
            event_type="player.defeat",
            emotion="sad",
            persona=Persona.CHEERFUL
        )

        self.cache.set(request1, "赢了！", 0.0)
        self.cache.set(request2, "输了...", 0.0)

        result1 = self.cache.get(request1)
        result2 = self.cache.get(request2)

        assert result1[0] == "赢了！"
        assert result2[0] == "输了..."

    def test_cache_same_key_different_persona(self):
        """Test cache treats different personas as different keys"""
        request1 = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )
        request2 = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.COOL
        )

        self.cache.set(request1, "太棒了！✨", 0.0)
        self.cache.set(request2, "不错。", 0.0)

        result1 = self.cache.get(request1)
        result2 = self.cache.get(request2)

        assert result1[0] == "太棒了！✨"
        assert result2[0] == "不错。"

    def test_cache_expiration(self):
        """Test cache entries expire"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )

        # Set with 1 second TTL
        self.cache.set(request, "太棒了！", 0.0, ttl=1)

        # Should be available immediately
        result = self.cache.get(request)
        assert result is not None

        # Wait for expiration
        time.sleep(1.1)

        # Should be expired
        result = self.cache.get(request)
        assert result is None

    def test_cache_stats(self):
        """Test cache statistics"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )

        # Set and hit cache
        self.cache.set(request, "太棒了！", 0.0)
        self.cache.get(request)
        self.cache.get(request)

        # Miss cache
        request2 = DialogueRequest(
            event_type="player.defeat",
            emotion="sad",
            persona=Persona.CHEERFUL
        )
        self.cache.get(request2)

        stats = self.cache.get_stats()

        assert stats["hits"] == 2
        assert stats["misses"] == 1
        assert stats["total_requests"] == 3
        assert stats["hit_rate"] == pytest.approx(2/3)
        assert stats["size"] == 1

    def test_cache_clear(self):
        """Test cache clear"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )

        self.cache.set(request, "太棒了！", 0.0)
        assert self.cache.get(request) is not None

        self.cache.clear()

        assert self.cache.get(request) is None
        stats = self.cache.get_stats()
        assert stats["size"] == 0
        assert stats["hits"] == 0
        assert stats["misses"] == 0

    def test_cache_ignores_player_id(self):
        """Test cache key doesn't include player_id"""
        request1 = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL,
            player_id="player-123"
        )
        request2 = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL,
            player_id="player-456"
        )

        self.cache.set(request1, "太棒了！", 0.0)

        # Should hit cache even with different player_id
        result = self.cache.get(request2)
        assert result is not None

    def test_cache_includes_context_stable_fields(self):
        """Test cache includes important context fields"""
        request1 = DialogueRequest(
            event_type="player.loot",
            emotion="excited",
            persona=Persona.CHEERFUL,
            context={"rarity": "legendary"}
        )
        request2 = DialogueRequest(
            event_type="player.loot",
            emotion="excited",
            persona=Persona.CHEERFUL,
            context={"rarity": "common"}
        )

        self.cache.set(request1, "传奇！！", 0.001)
        self.cache.set(request2, "不错！", 0.0)

        # Should be different cache entries
        result1 = self.cache.get(request1)
        result2 = self.cache.get(request2)

        assert result1[0] == "传奇！！"
        assert result2[0] == "不错！"
