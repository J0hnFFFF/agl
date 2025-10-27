"""
Tests for CostManager
"""
import pytest
from datetime import date
from src.cost_tracker import CostManager
from src.models import DetectionMethod


class TestCostManager:
    """Test cost tracking and budget management"""

    def setup_method(self):
        """Setup for each test"""
        self.manager = CostManager()
        self.manager._daily_costs.clear()

    def test_record_rule_request(self):
        """Test recording rule-based request"""
        self.manager.record_request(DetectionMethod.RULE, 0.0, 5.0)

        stats = self.manager.get_stats()

        assert stats.total_requests == 1
        assert stats.rule_requests == 1
        assert stats.ml_requests == 0
        assert stats.total_cost == 0.0
        assert stats.average_latency_ms == 5.0

    def test_record_ml_request(self):
        """Test recording ML request"""
        self.manager.record_request(DetectionMethod.ML, 0.0003, 450.0)

        stats = self.manager.get_stats()

        assert stats.total_requests == 1
        assert stats.ml_requests == 1
        assert stats.rule_requests == 0
        assert stats.total_cost == 0.0003
        assert stats.average_cost == 0.0003
        assert stats.average_latency_ms == 450.0

    def test_record_cached_request(self):
        """Test recording cached request"""
        self.manager.record_request(DetectionMethod.CACHED, 0.0, 0.5)

        stats = self.manager.get_stats()

        assert stats.total_requests == 1
        assert stats.cached_requests == 1
        assert stats.ml_requests == 0
        assert stats.total_cost == 0.0

    def test_multiple_requests(self):
        """Test recording multiple requests"""
        self.manager.record_request(DetectionMethod.ML, 0.0003, 450.0)
        self.manager.record_request(DetectionMethod.RULE, 0.0, 5.0)
        self.manager.record_request(DetectionMethod.RULE, 0.0, 4.0)
        self.manager.record_request(DetectionMethod.ML, 0.0005, 500.0)

        stats = self.manager.get_stats()

        assert stats.total_requests == 4
        assert stats.ml_requests == 2
        assert stats.rule_requests == 2
        assert stats.total_cost == 0.0008
        assert stats.average_cost == pytest.approx(0.0002)

    def test_average_latency_calculation(self):
        """Test average latency calculation"""
        self.manager.record_request(DetectionMethod.ML, 0.0, 400.0)
        self.manager.record_request(DetectionMethod.ML, 0.0, 600.0)
        self.manager.record_request(DetectionMethod.RULE, 0.0, 5.0)

        stats = self.manager.get_stats()

        expected_avg = (400.0 + 600.0 + 5.0) / 3
        assert stats.average_latency_ms == pytest.approx(expected_avg)

    def test_ml_rate_calculation(self):
        """Test ML usage rate calculation"""
        # 10 rule, 2 ML = 16.67% ML rate (excluding cached)
        for _ in range(10):
            self.manager.record_request(DetectionMethod.RULE, 0.0, 5.0)
        for _ in range(2):
            self.manager.record_request(DetectionMethod.ML, 0.0003, 450.0)

        stats = self.manager.get_stats()

        expected_rate = (2 / 12) * 100
        assert stats.ml_rate == pytest.approx(expected_rate)

    def test_ml_rate_excludes_cached(self):
        """Test ML rate calculation excludes cached requests"""
        self.manager.record_request(DetectionMethod.RULE, 0.0, 5.0)
        self.manager.record_request(DetectionMethod.ML, 0.0003, 450.0)
        self.manager.record_request(DetectionMethod.CACHED, 0.0, 1.0)
        self.manager.record_request(DetectionMethod.CACHED, 0.0, 1.0)

        stats = self.manager.get_stats()

        # ML rate should be 1/2 = 50% (cached not counted)
        assert stats.ml_rate == pytest.approx(50.0)

    def test_can_use_ml_within_budget(self):
        """Test ML can be used within budget"""
        self.manager.record_request(DetectionMethod.ML, 0.5, 450.0)

        can_use, reason = self.manager.can_use_ml()

        assert can_use is True
        assert reason == "OK"

    def test_can_use_ml_budget_exceeded(self):
        """Test ML blocked when budget exceeded"""
        # Exhaust budget (default is $5.00)
        self.manager.record_request(DetectionMethod.ML, 5.5, 450.0)

        can_use, reason = self.manager.can_use_ml()

        assert can_use is False
        assert "budget exceeded" in reason.lower()

    def test_can_use_ml_rate_too_high(self):
        """Test ML blocked when usage rate too high"""
        # Default target is 15%, max allowed is 22.5% (15% * 1.5)
        # Create 5 rule, 2 ML = 28.5% ML rate
        for _ in range(5):
            self.manager.record_request(DetectionMethod.RULE, 0.0, 5.0)
        for _ in range(2):
            self.manager.record_request(DetectionMethod.ML, 0.001, 450.0)

        # ML rate is 2/7 = 28.5% > 22.5% threshold
        can_use, reason = self.manager.can_use_ml()

        assert can_use is False
        assert "rate too high" in reason.lower()

    def test_get_budget_status(self):
        """Test budget status retrieval"""
        self.manager.record_request(DetectionMethod.ML, 0.5, 450.0)
        self.manager.record_request(DetectionMethod.RULE, 0.0, 5.0)

        status = self.manager.get_budget_status()

        assert status["total_cost"] == 0.5
        assert status["total_requests"] == 2
        assert status["ml_requests"] == 1
        assert status["rule_requests"] == 1
        assert status["budget_remaining"] > 0
        assert "ml_rate" in status
        assert "target_ml_rate" in status

    def test_daily_reset(self):
        """Test that stats reset on new day"""
        # Record request
        self.manager.record_request(DetectionMethod.ML, 0.5, 450.0)

        stats1 = self.manager.get_stats()
        assert stats1.total_requests == 1

        # Simulate new day
        self.manager._current_date = date(2000, 1, 1)

        # Record new request
        self.manager.record_request(DetectionMethod.RULE, 0.0, 5.0)

        stats2 = self.manager.get_stats()
        # Should only show today's requests
        assert stats2.total_requests == 1
        assert stats2.ml_requests == 0  # Old ML request was yesterday

    def test_empty_stats(self):
        """Test stats when no requests recorded"""
        stats = self.manager.get_stats()

        assert stats.total_requests == 0
        assert stats.ml_requests == 0
        assert stats.rule_requests == 0
        assert stats.total_cost == 0.0
        assert stats.average_cost == 0.0
