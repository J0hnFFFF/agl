"""
Pytest configuration and fixtures for dashboard tests
"""
import pytest
import sys
import os
from unittest.mock import Mock, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app as flask_app
from src.api_client import AnalyticsAPIClient


@pytest.fixture
def app():
    """Flask app fixture"""
    flask_app.config['TESTING'] = True
    flask_app.config['DEBUG'] = False
    return flask_app


@pytest.fixture
def client(app):
    """Flask test client fixture"""
    return app.test_client()


@pytest.fixture
def mock_api_client(monkeypatch):
    """Mock Analytics API client"""
    mock_client = Mock(spec=AnalyticsAPIClient)

    # Mock platform stats
    mock_client.get_platform_stats.return_value = {
        'activeGames': 5,
        'totalEvents': 10000,
        'totalPlayers': 250,
        'emotionRequests': 5000,
        'dialogueRequests': 3000,
        'memoryCreated': 500,
        'memorySearches': 1500,
        'totalCost': 15.67,
        'usage': {
            'emotionRule': 4000,
            'emotionMl': 800,
            'emotionCached': 200,
            'dialogueTemplate': 2700,
            'dialogueLlm': 200,
            'dialogueCached': 100
        }
    }

    # Mock hourly analytics
    mock_client.get_hourly_analytics.return_value = [
        {
            'hour': '2024-01-15T10:00:00Z',
            'totalEvents': 420,
            'uniquePlayers': 12,
            'emotionRequests': 210,
            'dialogueRequests': 126,
            'emotionAvgLatency': 45.2,
            'dialogueAvgLatency': 312.5,
            'totalCost': 0.65
        },
        {
            'hour': '2024-01-15T11:00:00Z',
            'totalEvents': 380,
            'uniquePlayers': 11,
            'emotionRequests': 190,
            'dialogueRequests': 114,
            'emotionAvgLatency': 43.8,
            'dialogueAvgLatency': 298.3,
            'totalCost': 0.59
        }
    ]

    # Mock cost analytics
    mock_client.get_cost_analytics.return_value = {
        'totalCost': 15.67,
        'totalRequests': 8000,
        'costByService': [
            {
                'service': 'EMOTION',
                'totalCost': 5.23,
                'averageCost': 0.001046,
                'requestCount': 5000
            },
            {
                'service': 'DIALOGUE',
                'totalCost': 9.12,
                'averageCost': 0.00304,
                'requestCount': 3000
            },
            {
                'service': 'MEMORY',
                'totalCost': 1.32,
                'averageCost': 0.00066,
                'requestCount': 2000
            }
        ],
        'dailyCost': [
            {
                'date': '2024-01-15T00:00:00Z',
                'emotionCost': 0.52,
                'dialogueCost': 0.91,
                'memoryCost': 0.13,
                'totalCost': 1.56
            }
        ]
    }

    # Mock game usage stats
    mock_client.get_game_usage_stats.return_value = {
        'summary': {
            'totalEvents': 5000,
            'totalPlayers': 120,
            'emotionRequests': 2500,
            'dialogueRequests': 1500,
            'memoryOperations': 1000,
            'totalCost': 7.83,
            'avgLatency': 156.3
        },
        'dailyStats': [
            {
                'date': '2024-01-15T00:00:00Z',
                'totalEvents': 500,
                'uniquePlayers': 12,
                'emotionRequests': 250,
                'dialogueRequests': 150
            }
        ]
    }

    # Mock emotion distribution
    mock_client.get_emotion_distribution.return_value = {
        'happy': 1200,
        'sad': 300,
        'angry': 200,
        'surprised': 150,
        'neutral': 2150
    }

    return mock_client
