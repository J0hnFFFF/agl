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
        assert data["service"] == "dialogue-service"
        assert "version" in data
        assert data["status"] == "ok"

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "dialogue-service"
        assert "llm_enabled" in data
        assert "cache_enabled" in data

    def test_generate_dialogue_basic(self, client):
        """Test basic dialogue generation"""
        request_data = {
            "event_type": "player.victory",
            "emotion": "happy",
            "persona": "cheerful"
        }

        response = client.post("/generate", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert "dialogue" in data
        assert "method" in data
        assert "cost" in data
        assert len(data["dialogue"]) > 0
        assert data["method"] in ["template", "llm", "cached"]

    def test_generate_dialogue_with_context(self, client):
        """Test dialogue generation with context"""
        request_data = {
            "event_type": "player.achievement",
            "emotion": "amazed",
            "persona": "cheerful",
            "context": {
                "rarity": "legendary",
                "is_first_time": True
            }
        }

        response = client.post("/generate", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert "dialogue" in data
        assert len(data["dialogue"]) > 0

    def test_generate_dialogue_all_personas(self, client):
        """Test all persona types"""
        personas = ["cheerful", "cool", "cute"]

        for persona in personas:
            request_data = {
                "event_type": "player.victory",
                "emotion": "happy",
                "persona": persona
            }

            response = client.post("/generate", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert len(data["dialogue"]) > 0

    def test_generate_dialogue_invalid_persona(self, client):
        """Test invalid persona"""
        request_data = {
            "event_type": "player.victory",
            "emotion": "happy",
            "persona": "invalid_persona"
        }

        response = client.post("/generate", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_generate_dialogue_missing_fields(self, client):
        """Test missing required fields"""
        request_data = {
            "emotion": "happy"
            # Missing event_type
        }

        response = client.post("/generate", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_stats_endpoint(self, client):
        """Test stats endpoint"""
        response = client.get("/stats")

        assert response.status_code == 200
        data = response.json()
        assert "cache" in data
        assert "cost" in data
        assert "llm_enabled" in data

    def test_template_count_endpoint(self, client):
        """Test template count endpoint"""
        response = client.get("/templates/count")

        assert response.status_code == 200
        data = response.json()
        assert "total_templates" in data
        assert "emotion_fallbacks" in data
        assert data["total_templates"] > 80

    def test_clear_cache_endpoint(self, client):
        """Test cache clear endpoint"""
        response = client.post("/cache/clear")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    def test_generate_caches_response(self, client):
        """Test that responses are cached"""
        request_data = {
            "event_type": "player.victory",
            "emotion": "happy",
            "persona": "cheerful"
        }

        # First request
        response1 = client.post("/generate", json=request_data)
        assert response1.status_code == 200
        data1 = response1.json()

        # Second request - should hit cache
        response2 = client.post("/generate", json=request_data)
        assert response2.status_code == 200
        data2 = response2.json()

        # Should return same dialogue
        assert data1["dialogue"] == data2["dialogue"]
        # Second should be cached
        assert data2["method"] == "cached" or data2["cache_hit"] is True

    def test_cors_headers(self, client):
        """Test CORS headers are set"""
        response = client.get("/", headers={"Origin": "http://localhost:3000"})

        assert response.status_code == 200
        # CORS headers should be present
        assert "access-control-allow-origin" in response.headers

    def test_generate_with_player_id(self, client):
        """Test generation with player ID"""
        request_data = {
            "event_type": "player.victory",
            "emotion": "happy",
            "persona": "cheerful",
            "player_id": "player-123"
        }

        response = client.post("/generate", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert "dialogue" in data

    def test_generate_performance(self, client):
        """Test that generation is fast"""
        request_data = {
            "event_type": "player.victory",
            "emotion": "happy",
            "persona": "cheerful"
        }

        response = client.post("/generate", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Template-based should be very fast
        if data["method"] == "template":
            assert data["latency_ms"] < 50  # Should be under 50ms

    def test_multiple_concurrent_requests(self, client):
        """Test handling multiple requests"""
        request_data = {
            "event_type": "player.victory",
            "emotion": "happy",
            "persona": "cheerful"
        }

        # Make multiple requests
        responses = []
        for _ in range(10):
            response = client.post("/generate", json=request_data)
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 200
