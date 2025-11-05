"""
Tests for Voice Cache
"""
import pytest
from src.cache import VoiceCache
from src.models import SynthesizeRequest, Persona, Language, AudioFormat


class TestVoiceCache:
    """Test voice caching functionality"""

    @pytest.fixture
    def cache(self):
        """Create fresh cache instance"""
        cache = VoiceCache()
        cache.clear()
        return cache

    @pytest.fixture
    def sample_request(self):
        """Sample synthesis request"""
        return SynthesizeRequest(
            text="测试文本",
            persona=Persona.CHEERFUL,
            language=Language.ZH_CN,
            format=AudioFormat.MP3
        )

    @pytest.fixture
    def sample_audio(self):
        """Sample audio bytes"""
        return b'\xff\xfb\x90\x00' + b'\x00' * 100

    def test_cache_miss(self, cache, sample_request):
        """Test cache miss returns None"""
        result = cache.get(sample_request)
        assert result is None
        assert cache.misses == 1
        assert cache.hits == 0

    def test_cache_set_and_get(self, cache, sample_request, sample_audio):
        """Test setting and getting cache"""
        metadata = {"duration": 2.1}

        # Set cache
        cache.set(sample_request, sample_audio, 0.00015, metadata)

        # Get from cache
        result = cache.get(sample_request)

        assert result is not None
        audio_bytes, cost, cached_metadata = result
        assert audio_bytes == sample_audio
        assert cost == 0.00015
        assert cached_metadata["duration"] == 2.1
        assert cache.hits == 1

    def test_cache_key_generation(self, cache):
        """Test that different requests generate different keys"""
        request1 = SynthesizeRequest(
            text="Hello",
            persona=Persona.CHEERFUL,
            language=Language.EN_US,
            format=AudioFormat.MP3
        )

        request2 = SynthesizeRequest(
            text="Hello",
            persona=Persona.COOL,  # Different persona
            language=Language.EN_US,
            format=AudioFormat.MP3
        )

        key1 = cache._generate_key(request1)
        key2 = cache._generate_key(request2)

        assert key1 != key2

    def test_cache_same_request_same_key(self, cache):
        """Test that identical requests generate the same key"""
        request1 = SynthesizeRequest(
            text="测试",
            persona=Persona.CHEERFUL,
            language=Language.ZH_CN,
            format=AudioFormat.MP3
        )

        request2 = SynthesizeRequest(
            text="测试",
            persona=Persona.CHEERFUL,
            language=Language.ZH_CN,
            format=AudioFormat.MP3
        )

        key1 = cache._generate_key(request1)
        key2 = cache._generate_key(request2)

        assert key1 == key2

    def test_cache_clear(self, cache, sample_request, sample_audio):
        """Test cache clearing"""
        # Add some items
        cache.set(sample_request, sample_audio, 0.00015)

        # Clear cache
        cache.clear()

        # Should not find cached item
        result = cache.get(sample_request)
        assert result is None

        # Stats should be reset
        stats = cache.get_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 1  # From the get above

    def test_cache_stats(self, cache, sample_request, sample_audio):
        """Test cache statistics"""
        # Initial stats
        stats = cache.get_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 0
        assert "hit_rate" in stats
        assert "enabled" in stats

        # Add cache miss
        cache.get(sample_request)
        stats = cache.get_stats()
        assert stats["hits"] == 0
        assert stats["misses"] == 1
        assert "0.0%" in stats["hit_rate"]

        # Add cache entry and hit
        cache.set(sample_request, sample_audio, 0.00015)
        cache.get(sample_request)

        stats = cache.get_stats()
        assert stats["hits"] == 1
        assert stats["misses"] == 1
        assert "50.0%" in stats["hit_rate"]

    def test_cache_with_different_speeds(self, cache, sample_audio):
        """Test that different speeds are cached separately"""
        request_normal = SynthesizeRequest(
            text="测试",
            persona=Persona.CHEERFUL,
            language=Language.ZH_CN,
            speed=1.0,
            format=AudioFormat.MP3
        )

        request_fast = SynthesizeRequest(
            text="测试",
            persona=Persona.CHEERFUL,
            language=Language.ZH_CN,
            speed=1.5,
            format=AudioFormat.MP3
        )

        # Cache both
        cache.set(request_normal, sample_audio, 0.00015)
        cache.set(request_fast, sample_audio + b'\x01', 0.00015)

        # They should be cached separately
        result_normal = cache.get(request_normal)
        result_fast = cache.get(request_fast)

        assert result_normal is not None
        assert result_fast is not None
        assert result_normal[0] != result_fast[0]  # Different audio

    def test_cache_with_different_formats(self, cache, sample_audio):
        """Test that different formats are cached separately"""
        request_mp3 = SynthesizeRequest(
            text="测试",
            persona=Persona.CHEERFUL,
            language=Language.ZH_CN,
            format=AudioFormat.MP3
        )

        request_opus = SynthesizeRequest(
            text="测试",
            persona=Persona.CHEERFUL,
            language=Language.ZH_CN,
            format=AudioFormat.OPUS
        )

        # Cache both
        cache.set(request_mp3, sample_audio, 0.00015)
        cache.set(request_opus, sample_audio + b'\x01', 0.00015)

        # Should retrieve correct format
        result_mp3 = cache.get(request_mp3)
        result_opus = cache.get(request_opus)

        assert result_mp3 is not None
        assert result_opus is not None
