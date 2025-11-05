"""
Pytest configuration and fixtures for Voice Service
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import base64


@pytest.fixture
def sample_request():
    """Sample synthesis request"""
    return {
        "text": "你真厉害！继续加油！",
        "persona": "cheerful",
        "language": "zh-CN",
        "speed": 1.0,
        "format": "mp3"
    }


@pytest.fixture
def sample_english_request():
    """Sample English synthesis request"""
    return {
        "text": "Great job! Keep it up!",
        "persona": "cool",
        "language": "en-US",
        "voice": "onyx",
        "format": "mp3"
    }


@pytest.fixture
def sample_audio_bytes():
    """Sample audio bytes (minimal MP3 header)"""
    # This is a minimal valid MP3 file header
    return b'\xff\xfb\x90\x00' + b'\x00' * 100


@pytest.fixture
def sample_audio_data_url(sample_audio_bytes):
    """Sample audio data URL"""
    audio_base64 = base64.b64encode(sample_audio_bytes).decode('utf-8')
    return f"data:audio/mp3;base64,{audio_base64}"


@pytest.fixture
def mock_openai_response(sample_audio_bytes):
    """Mock OpenAI TTS API response"""
    mock_response = MagicMock()
    mock_response.content = sample_audio_bytes
    return mock_response


@pytest.fixture
def mock_openai_client(mock_openai_response):
    """Mock OpenAI AsyncClient"""
    mock_client = MagicMock()
    mock_speech = AsyncMock()
    mock_speech.create = AsyncMock(return_value=mock_openai_response)
    mock_client.audio.speech = mock_speech
    return mock_client


@pytest.fixture(autouse=True)
def mock_redis():
    """Mock Redis for all tests"""
    with patch('redis.Redis') as mock:
        mock_instance = MagicMock()
        mock_instance.ping.return_value = True
        mock_instance.get.return_value = None
        mock_instance.setex.return_value = True
        mock_instance.incrbyfloat.return_value = 0.015
        mock_instance.hincrby.return_value = 1
        mock_instance.hgetall.return_value = {}
        mock_instance.scan_iter.return_value = []
        mock.return_value = mock_instance
        yield mock
