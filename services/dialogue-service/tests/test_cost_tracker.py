"""
Tests for Cost Tracker
"""
import pytest
from datetime import date
from src.cost_tracker import CostManager
from src.models import GenerationMethod


class TestCostManager:
    """Test cost tracking and budget management"""

    def setup_method(self):
        """Setup for each test"""
        self.manager = CostManager()
        self.manager._daily_costs.clear()

    def test_record_llm_request(self):
        """Test recording LLM request"""
        self.manager.record_request(GenerationMethod.LLM, 0.0005, 450.0)

        stats = self.manager.get_stats()

        assert stats.total_requests == 1
        assert stats.llm_requests == 1
        assert stats.template_requests == 0
        assert stats.total_cost == 0.0005
        assert stats.average_cost == 0.0005
        assert stats.average_latency_ms == 450.0

    def test_record_template_request(self):
        """Test recording template request"""
        self.manager.record_request(GenerationMethod.TEMPLATE, 0.0, 5.0)

        stats = self.manager.get_stats()

        assert stats.total_requests == 1
        assert stats.template_requests == 1
        assert stats.llm_requests == 0
        assert stats.total_cost == 0.0
        assert stats.average_latency_ms == 5.0

    def test_record_cached_request(self):
        """Test recording cached request"""
        self.manager.record_request(GenerationMethod.CACHED, 0.0, 1.0)

        stats = self.manager.get_stats()

        assert stats.total_requests == 1
        assert stats.cached_requests == 1
        assert stats.llm_requests == 0
        assert stats.total_cost == 0.0

    def test_multiple_requests(self):
        """Test recording multiple requests"""
        self.manager.record_request(GenerationMethod.LLM, 0.0005, 450.0)
        self.manager.record_request(GenerationMethod.TEMPLATE, 0.0, 5.0)
        self.manager.record_request(GenerationMethod.TEMPLATE, 0.0, 4.0)
        self.manager.record_request(GenerationMethod.LLM, 0.0008, 500.0)

        stats = self.manager.get_stats()

        assert stats.total_requests == 4
        assert stats.llm_requests == 2
        assert stats.template_requests == 2
        assert stats.total_cost == 0.0013
        assert stats.average_cost == pytest.approx(0.000325)

    def test_average_latency_calculation(self):
        """Test average latency calculation"""
        self.manager.record_request(GenerationMethod.LLM, 0.0, 400.0)
        self.manager.record_request(GenerationMethod.LLM, 0.0, 600.0)
        self.manager.record_request(GenerationMethod.TEMPLATE, 0.0, 5.0)

        stats = self.manager.get_stats()

        expected_avg = (400.0 + 600.0 + 5.0) / 3
        assert stats.average_latency_ms == pytest.approx(expected_avg)

    def test_can_use_llm_within_budget(self):
        """Test LLM can be used within budget"""
        # Record some requests within budget
        self.manager.record_request(GenerationMethod.LLM, 0.5, 450.0)

        can_use, reason = self.manager.can_use_llm()

        assert can_use is True
        assert reason == "OK"

    def test_can_use_llm_budget_exceeded(self):
        """Test LLM blocked when budget exceeded"""
        # Record requests exceeding budget
        self.manager.record_request(GenerationMethod.LLM, 15.0, 450.0)

        can_use, reason = self.manager.can_use_llm()

        assert can_use is False
        assert "budget exceeded" in reason.lower()

    def test_can_use_llm_rate_too_high(self):
        """Test LLM blocked when usage rate too high"""
        # Record requests with >15% LLM rate (target is 10%)
        for _ in range(5):
            self.manager.record_request(GenerationMethod.TEMPLATE, 0.0, 5.0)
        for _ in range(2):
            self.manager.record_request(GenerationMethod.LLM, 0.001, 450.0)

        # LLM rate is 2/7 = 28.5% > 15% threshold
        can_use, reason = self.manager.can_use_llm()

        assert can_use is False
        assert "rate too high" in reason.lower()

    def test_get_budget_status(self):
        """Test budget status retrieval"""
        self.manager.record_request(GenerationMethod.LLM, 0.5, 450.0)
        self.manager.record_request(GenerationMethod.TEMPLATE, 0.0, 5.0)

        status = self.manager.get_budget_status()

        assert status["total_cost"] == 0.5
        assert status["total_requests"] == 2
        assert status["llm_requests"] == 1
        assert status["template_requests"] == 1
        assert status["budget_remaining"] > 0

    def test_daily_reset(self):
        """Test that stats reset on new day"""
        # Record request
        self.manager.record_request(GenerationMethod.LLM, 0.5, 450.0)

        stats1 = self.manager.get_stats()
        assert stats1.total_requests == 1

        # Simulate new day
        self.manager._current_date = date(2000, 1, 1)  # Force day change

        # Record new request
        self.manager.record_request(GenerationMethod.TEMPLATE, 0.0, 5.0)

        stats2 = self.manager.get_stats()
        # Should only show today's requests
        assert stats2.total_requests == 1
        assert stats2.llm_requests == 0  # Old LLM request was yesterday

    def test_empty_stats(self):
        """Test stats when no requests recorded"""
        stats = self.manager.get_stats()

        assert stats.total_requests == 0
        assert stats.llm_requests == 0
        assert stats.template_requests == 0
        assert stats.total_cost == 0.0
        assert stats.average_cost == 0.0

    def test_llm_rate_calculation(self):
        """Test LLM usage rate calculation"""
        # 10 template, 1 LLM = 9.09% LLM rate
        for _ in range(10):
            self.manager.record_request(GenerationMethod.TEMPLATE, 0.0, 5.0)
        self.manager.record_request(GenerationMethod.LLM, 0.001, 450.0)

        status = self.manager.get_budget_status()

        expected_rate = (1 / 11) * 100
        assert status["llm_rate"] == pytest.approx(expected_rate)
        assert status["target_llm_rate"] == 10.0  # 10% target
