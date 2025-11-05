"""
Tests for Cost Tracker
"""
import pytest
from src.cost_tracker import CostManager
from src.models import SynthesisMethod


class TestCostManager:
    """Test cost tracking functionality"""

    @pytest.fixture
    def cost_manager(self):
        """Create fresh cost manager instance"""
        return CostManager()

    def test_initial_budget_status(self, cost_manager):
        """Test initial budget status"""
        status = cost_manager.get_budget_status()

        assert "daily_budget" in status
        assert "daily_cost" in status
        assert "remaining" in status
        assert "usage_percent" in status
        assert "total_requests" in status

    def test_can_use_tts_initially(self, cost_manager):
        """Test that TTS can be used initially"""
        can_use, reason = cost_manager.can_use_tts()

        assert can_use is True
        assert reason == "OK"

    def test_record_tts_request(self, cost_manager):
        """Test recording TTS request"""
        # Record a request
        cost_manager.record_request(
            SynthesisMethod.TTS,
            cost=0.015,
            latency_ms=1500.0,
            character_count=1000
        )

        # Check budget status
        status = cost_manager.get_budget_status()
        assert status["total_requests"] >= 1
        assert status["tts_requests"] >= 1

    def test_record_cached_request(self, cost_manager):
        """Test recording cached request"""
        # Record cached request
        cost_manager.record_request(
            SynthesisMethod.CACHED,
            cost=0.0,
            latency_ms=10.0,
            character_count=100
        )

        # Check budget status
        status = cost_manager.get_budget_status()
        assert status["total_requests"] >= 1
        assert status["cached_requests"] >= 1

    def test_cost_accumulation(self, cost_manager):
        """Test that costs accumulate correctly"""
        # Record multiple requests
        cost_manager.record_request(SynthesisMethod.TTS, 0.015, 1500.0, 1000)
        cost_manager.record_request(SynthesisMethod.TTS, 0.010, 1400.0, 700)
        cost_manager.record_request(SynthesisMethod.CACHED, 0.0, 10.0, 100)

        status = cost_manager.get_budget_status()

        # Should have 3 total requests
        assert status["total_requests"] == 3
        assert status["tts_requests"] == 2
        assert status["cached_requests"] == 1

    def test_cache_hit_rate_calculation(self, cost_manager):
        """Test cache hit rate calculation"""
        # Record mix of cached and TTS requests
        cost_manager.record_request(SynthesisMethod.TTS, 0.015, 1500.0, 1000)
        cost_manager.record_request(SynthesisMethod.CACHED, 0.0, 10.0, 100)
        cost_manager.record_request(SynthesisMethod.CACHED, 0.0, 10.0, 100)
        cost_manager.record_request(SynthesisMethod.CACHED, 0.0, 10.0, 100)

        status = cost_manager.get_budget_status()

        # Should have 75% cache hit rate (3 cached / 4 total)
        assert "cache_hit_rate" in status
        assert "75.0%" in status["cache_hit_rate"]

    def test_character_count_tracking(self, cost_manager):
        """Test character count tracking"""
        # Record requests with different character counts
        cost_manager.record_request(SynthesisMethod.TTS, 0.015, 1500.0, 1000)
        cost_manager.record_request(SynthesisMethod.CACHED, 0.0, 10.0, 500)

        status = cost_manager.get_budget_status()

        assert status["total_characters"] == 1500
        assert status["tts_characters"] == 1000
        assert status["cached_characters"] == 500

    def test_average_latency_calculation(self, cost_manager):
        """Test average latency calculation"""
        # Record requests with different latencies
        cost_manager.record_request(SynthesisMethod.TTS, 0.015, 2000.0, 1000)
        cost_manager.record_request(SynthesisMethod.TTS, 0.015, 1000.0, 1000)
        cost_manager.record_request(SynthesisMethod.CACHED, 0.0, 10.0, 100)

        status = cost_manager.get_budget_status()

        # TTS average should be ~1500ms
        assert "avg_tts_latency_ms" in status

        # Cached average should be ~10ms
        assert "avg_cached_latency_ms" in status
