"""
Tests for STT Service API endpoints
"""
import pytest
import base64
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from app import app
from src.models import RecognitionMethod


client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "stt-service"
    assert data["status"] == "ok"
    assert "version" in data


def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "stt-service"
    assert "version" in data
    assert "stt_enabled" in data


def test_languages_endpoint():
    """Test languages list endpoint"""
    response = client.get("/languages")
    assert response.status_code == 200
    languages = response.json()
    assert isinstance(languages, list)
    assert len(languages) >= 4  # zh-CN, en-US, ja-JP, ko-KR

    # Check language structure
    lang = languages[0]
    assert "code" in lang
    assert "name" in lang
    assert "supported" in lang


def test_stats_endpoint():
    """Test statistics endpoint"""
    response = client.get("/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "cache" in stats
    assert "cost" in stats
    assert "vad" in stats


@patch('src.stt_engine.stt_engine.transcribe')
def test_transcribe_success(mock_transcribe):
    """Test successful transcription"""
    # Mock response
    mock_transcribe.return_value = AsyncMock(
        text="Hello world",
        language="en-US",
        confidence=0.98,
        duration_seconds=2.5,
        method=RecognitionMethod.STT,
        cost=0.00025,
        cache_hit=False,
        latency_ms=450.0,
        audio_size_bytes=48000,
        vad_applied=True
    )

    # Create request with dummy base64 audio
    audio_data = base64.b64encode(b"fake audio data").decode('utf-8')
    request_data = {
        "audio_data": audio_data,
        "format": "mp3",
        "language": "en-US",
        "enable_vad": True
    }

    response = client.post("/transcribe", json=request_data)
    assert response.status_code == 200

    data = response.json()
    assert "text" in data
    assert "cost" in data
    assert "latency_ms" in data


def test_transcribe_invalid_audio():
    """Test transcription with invalid base64"""
    request_data = {
        "audio_data": "invalid_base64!!",
        "format": "mp3"
    }

    response = client.post("/transcribe", json=request_data)
    assert response.status_code != 200  # Should fail


def test_transcribe_missing_audio():
    """Test transcription without audio data"""
    request_data = {
        "format": "mp3"
    }

    response = client.post("/transcribe", json=request_data)
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_cache_clear():
    """Test cache clearing"""
    response = client.post("/cache/clear")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "message" in data
