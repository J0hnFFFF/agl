"""
Tests for Analytics API Client
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from src.api_client import AnalyticsAPIClient, AnalyticsAPIError, get_date_range
from datetime import datetime, timedelta


class TestAnalyticsAPIClient:
    """Tests for AnalyticsAPIClient class"""

    def test_init_with_defaults(self):
        """Test client initialization with default values"""
        client = AnalyticsAPIClient()
        assert client.base_url is not None
        assert client.api_key is not None
        assert client.session is not None

    def test_init_with_custom_values(self):
        """Test client initialization with custom values"""
        base_url = "http://custom-api:3000/api/v1/analytics"
        api_key = "custom-key"

        client = AnalyticsAPIClient(base_url=base_url, api_key=api_key)
        assert client.base_url == base_url
        assert client.api_key == api_key

    @patch('requests.Session.request')
    def test_make_request_success(self, mock_request):
        """Test successful API request"""
        mock_response = Mock()
        mock_response.json.return_value = {'result': 'success'}
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response

        client = AnalyticsAPIClient()
        result = client._make_request('GET', '/test')

        assert result == {'result': 'success'}
        mock_request.assert_called_once()

    @patch('requests.Session.request')
    def test_make_request_http_error(self, mock_request):
        """Test HTTP error handling"""
        import requests

        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("404")
        mock_request.return_value = mock_response

        client = AnalyticsAPIClient()

        with pytest.raises(AnalyticsAPIError):
            client._make_request('GET', '/test')

    @patch('requests.Session.request')
    def test_make_request_network_error(self, mock_request):
        """Test network error handling"""
        import requests

        mock_request.side_effect = requests.exceptions.RequestException("Network error")

        client = AnalyticsAPIClient()

        with pytest.raises(AnalyticsAPIError):
            client._make_request('GET', '/test')

    @patch('requests.Session.request')
    def test_get_platform_stats(self, mock_request):
        """Test getting platform statistics"""
        mock_response = Mock()
        mock_response.json.return_value = {
            'activeGames': 5,
            'totalEvents': 10000,
            'totalPlayers': 250
        }
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response

        client = AnalyticsAPIClient()
        result = client.get_platform_stats(days=30)

        assert result['activeGames'] == 5
        assert result['totalEvents'] == 10000
        mock_request.assert_called_once()

    @patch('requests.Session.request')
    def test_get_hourly_analytics(self, mock_request):
        """Test getting hourly analytics"""
        mock_response = Mock()
        mock_response.json.return_value = [
            {'hour': '2024-01-15T10:00:00Z', 'totalEvents': 420}
        ]
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response

        client = AnalyticsAPIClient()
        result = client.get_hourly_analytics(hours=24)

        assert isinstance(result, list)
        assert len(result) > 0
        mock_request.assert_called_once()

    @patch('requests.Session.request')
    def test_get_cost_analytics(self, mock_request):
        """Test getting cost analytics"""
        mock_response = Mock()
        mock_response.json.return_value = {
            'totalCost': 15.67,
            'totalRequests': 8000,
            'costByService': []
        }
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response

        client = AnalyticsAPIClient()
        result = client.get_cost_analytics()

        assert result['totalCost'] == 15.67
        assert result['totalRequests'] == 8000
        mock_request.assert_called_once()

    @patch('requests.Session.request')
    def test_get_game_usage_stats(self, mock_request):
        """Test getting game usage statistics"""
        mock_response = Mock()
        mock_response.json.return_value = {
            'summary': {'totalEvents': 5000},
            'dailyStats': []
        }
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response

        client = AnalyticsAPIClient()
        result = client.get_game_usage_stats('game-123', days=30)

        assert 'summary' in result
        assert result['summary']['totalEvents'] == 5000
        mock_request.assert_called_once()

    @patch('requests.Session.request')
    def test_get_emotion_distribution(self, mock_request):
        """Test getting emotion distribution"""
        mock_response = Mock()
        mock_response.json.return_value = {
            'happy': 1200,
            'sad': 300,
            'neutral': 2150
        }
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response

        client = AnalyticsAPIClient()
        result = client.get_emotion_distribution('game-123')

        assert result['happy'] == 1200
        assert result['sad'] == 300
        mock_request.assert_called_once()


class TestDateRangeHelper:
    """Tests for date range helper function"""

    def test_get_date_range_default(self):
        """Test default 30 days date range"""
        start_date, end_date = get_date_range()

        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

        # Should be approximately 30 days apart (allow 1 second tolerance)
        diff = (end - start).total_seconds()
        assert abs(diff - (30 * 24 * 3600)) < 1

    def test_get_date_range_custom_days(self):
        """Test custom days date range"""
        start_date, end_date = get_date_range(days=7)

        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))

        # Should be approximately 7 days apart
        diff = (end - start).total_seconds()
        assert abs(diff - (7 * 24 * 3600)) < 1

    def test_get_date_range_format(self):
        """Test date range format is ISO 8601"""
        start_date, end_date = get_date_range()

        # Should be parseable as ISO format
        datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        datetime.fromisoformat(end_date.replace('Z', '+00:00'))
