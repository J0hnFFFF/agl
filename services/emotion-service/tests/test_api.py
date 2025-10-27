"""
Tests for FastAPI endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app import app


class TestAPI:
    """Test API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "emotion-service"
        assert "version" in data
        assert data["status"] == "ok"

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "emotion-service"
        assert "ml_enabled" in data
        assert "ml_status" in data

    def test_analyze_basic_event(self, client):
        """Test basic emotion analysis"""
        request_data = {
            "type": "player.victory",
            "data": {},
            "context": {}
        }

        response = client.post("/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["emotion"] == "happy"
        assert data["intensity"] > 0
        assert data["action"] == "smile"
        assert data["confidence"] >= 0.8
        assert "method" in data
        assert data["method"] in ["rule", "ml", "cached"]

    def test_analyze_with_context(self, client):
        """Test analysis with rich context"""
        request_data = {
            "type": "player.victory",
            "data": {
                "mvp": True,
                "winStreak": 5,
                "difficulty": "nightmare"
            },
            "context": {
                "playerHealth": 25,
                "inCombat": False
            }
        }

        response = client.post("/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["emotion"] == "happy"
        assert data["intensity"] == 1.0  # Maxed out by context
        assert "MVP" in data["reasoning"]
        assert "win streak" in data["reasoning"]

    def test_analyze_low_confidence_event(self, client):
        """Test event that might trigger ML"""
        request_data = {
            "type": "player.achievement",
            "data": {
                "rarity": "legendary",
                "name": "Dragon Slayer"
            },
            "context": {}
        }

        response = client.post("/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["emotion"] == "amazed"
        assert data["intensity"] >= 0.9
        # Could be rule or ML depending on confidence
        assert data["method"] in ["rule", "ml"]

    def test_analyze_all_major_emotions(self, client):
        """Test detection of all major emotions"""
        test_cases = [
            ("player.victory", {}, "happy"),
            ("player.defeat", {}, "sad"),
            ("player.kill", {"isLegendary": True}, "amazed"),
            ("player.achievement", {"rarity": "epic"}, "excited"),
            ("player.levelup", {"level": 50}, "proud"),
            ("player.death", {}, "disappointed"),
            ("player.betrayed", {}, "angry"),
        ]

        for event_type, data, expected_emotion in test_cases:
            request_data = {
                "type": event_type,
                "data": data,
                "context": {}
            }

            response = client.post("/analyze", json=request_data)

            assert response.status_code == 200
            result = response.json()
            assert result["emotion"] == expected_emotion

    def test_stats_endpoint(self, client):
        """Test stats endpoint"""
        response = client.get("/stats")

        assert response.status_code == 200
        data = response.json()
        assert "cache" in data
        assert "cost" in data
        assert "ml_enabled" in data

    def test_cache_clear_endpoint(self, client):
        """Test cache clear endpoint"""
        response = client.post("/cache/clear")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_analyze_caches_response(self, client):
        """Test that responses are cached"""
        request_data = {
            "type": "player.victory",
            "data": {"mvp": True},
            "context": {}
        }

        # First request
        response1 = client.post("/analyze", json=request_data)
        assert response1.status_code == 200
        data1 = response1.json()

        # Second request - should hit cache
        response2 = client.post("/analyze", json=request_data)
        assert response2.status_code == 200
        data2 = response2.json()

        # Should return same emotion and intensity
        assert data1["emotion"] == data2["emotion"]
        assert data1["intensity"] == data2["intensity"]
        # Second should be cached
        assert data2["method"] == "cached" or data2["cache_hit"] is True

    def test_analyze_invalid_request(self, client):
        """Test invalid request handling"""
        # Missing required 'type' field
        request_data = {
            "data": {},
            "context": {}
        }

        response = client.post("/analyze", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_analyze_performance(self, client):
        """Test that analysis is fast"""
        request_data = {
            "type": "player.victory",
            "data": {},
            "context": {}
        }

        response = client.post("/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Rule-based should be very fast
        if data["method"] == "rule":
            assert data["latency_ms"] < 50  # Should be under 50ms

    def test_multiple_concurrent_requests(self, client):
        """Test handling multiple requests"""
        request_data = {
            "type": "player.victory",
            "data": {},
            "context": {}
        }

        # Make multiple requests
        responses = []
        for _ in range(10):
            response = client.post("/analyze", json=request_data)
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 200

    def test_analyze_unknown_event(self, client):
        """Test analysis of unknown event type"""
        request_data = {
            "type": "player.unknown_event",
            "data": {},
            "context": {}
        }

        response = client.post("/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["emotion"] == "neutral"
        assert data["intensity"] == 0.5

    def test_analyze_with_force_ml(self, client):
        """Test forcing ML detection"""
        request_data = {
            "type": "player.victory",
            "data": {},
            "context": {},
            "force_ml": True
        }

        response = client.post("/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()
        # May fail to ML if not configured, but should not error
        assert "method" in data
