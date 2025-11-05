"""
Tests for FastAPI endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from app import app


class TestAPI:
    """Test Voice Service API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.fixture(autouse=True)
    def mock_tts_engine(self, mock_openai_client, sample_audio_bytes):
        """Mock TTS engine for all tests"""
        with patch('src.voice_service.TTSEngine') as mock:
            mock_instance = MagicMock()
            mock_instance.client = mock_openai_client

            # Mock synthesize method
            async def mock_synthesize(request):
                from src.models import TTSResult, AudioFormat
                return TTSResult(
                    audio_bytes=sample_audio_bytes,
                    format=AudioFormat.MP3,
                    cost=0.00015,
                    character_count=len(request.text),
                    audio_duration_seconds=2.1
                )

            mock_instance.synthesize = mock_synthesize
            mock_instance._select_voice = MagicMock(return_value="nova")
            mock_instance.get_available_voices = MagicMock(return_value={
                "nova": {
                    "name": "Nova",
                    "gender": "female",
                    "description": "Warm voice",
                    "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"]
                }
            })
            mock_instance.health_check = AsyncMock(return_value=True)

            mock.return_value = mock_instance
            yield mock

    def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "voice-service"
        assert "version" in data
        assert data["status"] == "ok"
        assert "tts_enabled" in data

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "voice-service"
        assert "tts_enabled" in data
        assert "cache_enabled" in data
        assert "provider_status" in data

    def test_synthesize_basic_request(self, client, sample_request):
        """Test basic synthesis"""
        response = client.post("/synthesize", json=sample_request)

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "audio_url" in data
        assert data["audio_url"].startswith("data:audio/mp3;base64,")
        assert data["text"] == sample_request["text"]
        assert data["persona"] == sample_request["persona"]
        assert data["language"] == sample_request["language"]
        assert data["voice"] in ["nova", "onyx", "shimmer", "alloy", "echo", "fable"]
        assert data["format"] == "mp3"
        assert data["method"] in ["tts", "cached"]
        assert data["cost"] >= 0
        assert data["latency_ms"] > 0
        assert data["character_count"] == len(sample_request["text"])

    def test_synthesize_english_text(self, client, sample_english_request):
        """Test English text synthesis"""
        response = client.post("/synthesize", json=sample_english_request)

        assert response.status_code == 200
        data = response.json()
        assert data["text"] == sample_english_request["text"]
        assert data["language"] == "en-US"
        assert data["voice"] == "onyx"  # Explicitly requested voice

    def test_synthesize_with_specific_voice(self, client):
        """Test synthesis with specific voice selection"""
        request_data = {
            "text": "こんにちは",
            "persona": "cute",
            "language": "ja-JP",
            "voice": "shimmer",
            "format": "mp3"
        }

        response = client.post("/synthesize", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["voice"] == "shimmer"  # Should use specified voice

    def test_synthesize_with_speed_control(self, client):
        """Test synthesis with custom speed"""
        request_data = {
            "text": "快速说话",
            "persona": "cheerful",
            "language": "zh-CN",
            "speed": 1.5,
            "format": "mp3"
        }

        response = client.post("/synthesize", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["text"] == "快速说话"

    def test_synthesize_different_formats(self, client):
        """Test synthesis with different audio formats"""
        formats = ["mp3", "opus", "aac", "flac"]

        for audio_format in formats:
            request_data = {
                "text": "测试音频格式",
                "persona": "cheerful",
                "language": "zh-CN",
                "format": audio_format
            }

            response = client.post("/synthesize", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert data["format"] == audio_format
            assert f"data:audio/{audio_format};base64," in data["audio_url"]

    def test_synthesize_all_personas(self, client):
        """Test synthesis with all personas"""
        personas = ["cheerful", "cool", "cute"]

        for persona in personas:
            request_data = {
                "text": "测试人设",
                "persona": persona,
                "language": "zh-CN",
                "format": "mp3"
            }

            response = client.post("/synthesize", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert data["persona"] == persona

    def test_synthesize_all_languages(self, client):
        """Test synthesis with all supported languages"""
        test_cases = [
            ("你好", "zh-CN"),
            ("Hello", "en-US"),
            ("こんにちは", "ja-JP"),
            ("안녕하세요", "ko-KR")
        ]

        for text, language in test_cases:
            request_data = {
                "text": text,
                "persona": "cheerful",
                "language": language,
                "format": "mp3"
            }

            response = client.post("/synthesize", json=request_data)

            assert response.status_code == 200
            data = response.json()
            assert data["language"] == language
            assert data["text"] == text

    def test_synthesize_caches_response(self, client, sample_request):
        """Test that responses are cached"""
        # First request
        response1 = client.post("/synthesize", json=sample_request)
        assert response1.status_code == 200
        data1 = response1.json()

        # Second request - should hit cache
        response2 = client.post("/synthesize", json=sample_request)
        assert response2.status_code == 200
        data2 = response2.json()

        # Should return same audio
        assert data1["audio_url"] == data2["audio_url"]
        # Second should be cached
        assert data2["method"] == "cached" or data2["cache_hit"] is True
        # Cached request should be faster
        if data2["cache_hit"]:
            assert data2["latency_ms"] < data1["latency_ms"]

    def test_synthesize_force_synthesis(self, client, sample_request):
        """Test force synthesis bypasses cache"""
        # First request to populate cache
        client.post("/synthesize", json=sample_request)

        # Second request with force_synthesis=true
        request_with_force = {**sample_request, "force_synthesis": True}
        response = client.post("/synthesize", json=request_with_force)

        assert response.status_code == 200
        data = response.json()
        # Should not be cached even if exists
        assert data["cache_hit"] is False

    def test_synthesize_invalid_request_missing_text(self, client):
        """Test invalid request - missing required field"""
        request_data = {
            "persona": "cheerful",
            "language": "zh-CN"
            # Missing 'text' field
        }

        response = client.post("/synthesize", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_synthesize_invalid_request_empty_text(self, client):
        """Test invalid request - empty text"""
        request_data = {
            "text": "",
            "persona": "cheerful",
            "language": "zh-CN"
        }

        response = client.post("/synthesize", json=request_data)

        assert response.status_code == 422  # Validation error (min_length=1)

    def test_synthesize_invalid_request_text_too_long(self, client):
        """Test invalid request - text exceeds max length"""
        request_data = {
            "text": "a" * 5000,  # Exceeds 4096 limit
            "persona": "cheerful",
            "language": "zh-CN"
        }

        response = client.post("/synthesize", json=request_data)

        assert response.status_code == 422  # Validation error (max_length=4096)

    def test_synthesize_invalid_speed(self, client):
        """Test invalid speed parameter"""
        request_data = {
            "text": "测试",
            "persona": "cheerful",
            "language": "zh-CN",
            "speed": 5.0  # Exceeds 4.0 limit
        }

        response = client.post("/synthesize", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_list_voices_endpoint(self, client):
        """Test /voices endpoint"""
        response = client.get("/voices")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should return at least one voice
        assert len(data) >= 1

        # Check voice structure
        if len(data) > 0:
            voice = data[0]
            assert "voice_id" in voice
            assert "provider" in voice
            assert "name" in voice
            assert "gender" in voice
            assert "languages" in voice
            assert "persona" in voice
            assert "description" in voice

    def test_stats_endpoint(self, client):
        """Test /stats endpoint"""
        response = client.get("/stats")

        assert response.status_code == 200
        data = response.json()
        assert "cache" in data
        assert "cost" in data
        assert "tts_enabled" in data
        assert "cache_enabled" in data

        # Check cache stats structure
        cache = data["cache"]
        assert "hits" in cache
        assert "misses" in cache
        assert "hit_rate" in cache
        assert "enabled" in cache

    def test_cache_clear_endpoint(self, client):
        """Test /cache/clear endpoint"""
        response = client.post("/cache/clear")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "message" in data

    def test_synthesize_performance(self, client, sample_request):
        """Test that synthesis completes in reasonable time"""
        response = client.post("/synthesize", json=sample_request)

        assert response.status_code == 200
        data = response.json()

        # TTS should complete within 5 seconds
        assert data["latency_ms"] < 5000

        # Cached requests should be very fast
        if data["cache_hit"]:
            assert data["latency_ms"] < 100

    def test_synthesize_long_text(self, client):
        """Test synthesis with longer text"""
        long_text = "这是一段很长的文本。" * 20  # ~200 characters

        request_data = {
            "text": long_text,
            "persona": "cheerful",
            "language": "zh-CN",
            "format": "mp3"
        }

        response = client.post("/synthesize", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data["character_count"] == len(long_text)
        assert data["cost"] > 0  # Should have non-zero cost

    def test_multiple_concurrent_requests(self, client, sample_request):
        """Test handling multiple requests"""
        # Make multiple requests
        responses = []
        for _ in range(5):
            response = client.post("/synthesize", json=sample_request)
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 200

    def test_synthesize_cost_tracking(self, client, sample_request):
        """Test that costs are tracked correctly"""
        response = client.post("/synthesize", json=sample_request)

        assert response.status_code == 200
        data = response.json()

        # Check cost is calculated
        if data["method"] == "tts":
            assert data["cost"] > 0
            # Cost should be reasonable for small text (~$0.015/1K chars)
            assert data["cost"] < 0.01  # Less than 1 cent for short text
        elif data["method"] == "cached":
            assert data["cost"] >= 0  # Cached may have original cost recorded

    def test_audio_url_is_base64_encoded(self, client, sample_request):
        """Test that audio URL is properly base64 encoded"""
        response = client.post("/synthesize", json=sample_request)

        assert response.status_code == 200
        data = response.json()

        # Check data URL format
        assert data["audio_url"].startswith("data:audio/")
        assert ";base64," in data["audio_url"]

        # Verify base64 can be decoded
        import base64
        audio_part = data["audio_url"].split(",")[1]
        try:
            decoded = base64.b64decode(audio_part)
            assert len(decoded) > 0
        except Exception:
            pytest.fail("Audio URL is not valid base64")
