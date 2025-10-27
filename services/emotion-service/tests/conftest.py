"""
Pytest configuration and fixtures
"""
import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def sample_event():
    """Sample game event"""
    return {
        "type": "player.victory",
        "data": {
            "mvp": True,
            "winStreak": 5
        },
        "context": {
            "playerHealth": 75,
            "inCombat": False
        }
    }


@pytest.fixture
def sample_legendary_event():
    """Sample legendary event for ML triggering"""
    return {
        "type": "player.achievement",
        "data": {
            "rarity": "legendary",
            "name": "Dragon Slayer"
        },
        "context": {
            "playerHealth": 100,
            "inCombat": False
        }
    }


@pytest.fixture
def mock_claude_response():
    """Mock Claude API response"""
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text='{"emotion": "happy", "intensity": 0.9, "reasoning": "玩家获得了胜利", "confidence": 0.95}')]
    mock_message.usage = MagicMock(input_tokens=100, output_tokens=50)
    return mock_message


@pytest.fixture
def mock_claude_client(mock_claude_response):
    """Mock Anthropic client"""
    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_claude_response
    return mock_client
