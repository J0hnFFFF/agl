"""
Pytest configuration and fixtures
"""
import pytest
from unittest.mock import Mock, AsyncMock
import sys
import os

# Add src to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.models import Memory, Persona


@pytest.fixture
def sample_memory():
    """Sample memory for testing"""
    return Memory(
        id="mem-123",
        content="Defeated legendary boss on nightmare difficulty",
        type="achievement",
        emotion="amazed",
        importance=1.0,
        created_at="2025-10-25T12:00:00Z",
        similarity_score=0.95
    )


@pytest.fixture
def sample_memories(sample_memory):
    """Sample list of memories"""
    return [
        sample_memory,
        Memory(
            id="mem-124",
            content="Won 10 matches in a row",
            type="milestone",
            emotion="excited",
            importance=0.9,
            created_at="2025-10-25T11:00:00Z"
        ),
        Memory(
            id="mem-125",
            content="Reached level 100",
            type="milestone",
            emotion="proud",
            importance=0.8,
            created_at="2025-10-25T10:00:00Z"
        )
    ]


@pytest.fixture
def mock_memory_client():
    """Mock Memory Service client"""
    client = Mock()
    client.get_context_memories = AsyncMock(return_value=[])
    client.check_health = AsyncMock(return_value=True)
    return client


@pytest.fixture
def mock_llm_generator():
    """Mock LLM generator"""
    generator = Mock()
    generator.generate = AsyncMock(
        return_value=("这是LLM生成的对话！", 0.0005, 450.0)
    )
    return generator


@pytest.fixture
def mock_anthropic_client():
    """Mock Anthropic client"""
    client = Mock()
    message = Mock()
    message.content = [Mock(text="Generated dialogue")]
    message.usage = Mock(input_tokens=100, output_tokens=50)
    client.messages.create = Mock(return_value=message)
    return client
