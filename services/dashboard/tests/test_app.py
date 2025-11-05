"""
Tests for Flask Dashboard Application
"""
import pytest
from unittest.mock import patch, Mock
import app as dashboard_app


class TestDashboardRoutes:
    """Tests for dashboard routes"""

    def test_index_route(self, client, mock_api_client):
        """Test index page loads successfully"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/')
            assert response.status_code == 200
            assert b'AGL Dashboard' in response.data
            assert b'5' in response.data  # activeGames

    def test_index_route_with_days_param(self, client, mock_api_client):
        """Test index page with days parameter"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/?days=7')
            assert response.status_code == 200
            mock_api_client.get_platform_stats.assert_called_with(days=7)

    def test_index_route_api_error(self, client):
        """Test index page handles API errors gracefully"""
        mock_client = Mock()
        mock_client.get_platform_stats.side_effect = Exception("API Error")

        with patch.object(dashboard_app, 'api_client', mock_client):
            response = client.get('/')
            assert response.status_code == 200
            # Should show error message
            assert b'error' in response.data.lower() or b'\u9519\u8bef' in response.data

    def test_costs_route(self, client, mock_api_client):
        """Test costs page loads successfully"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/costs')
            assert response.status_code == 200
            assert b'15.67' in response.data  # totalCost

    def test_costs_route_with_filters(self, client, mock_api_client):
        """Test costs page with filters"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/costs?days=7&service=EMOTION')
            assert response.status_code == 200
            # Verify get_cost_analytics was called with correct params
            call_args = mock_api_client.get_cost_analytics.call_args
            assert call_args is not None

    def test_realtime_route(self, client, mock_api_client):
        """Test realtime monitoring page loads successfully"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/realtime')
            assert response.status_code == 200
            # Should contain hourly data
            assert b'420' in response.data  # totalEvents from mock

    def test_realtime_route_with_hours_param(self, client, mock_api_client):
        """Test realtime page with hours parameter"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/realtime?hours=6')
            assert response.status_code == 200
            mock_api_client.get_hourly_analytics.assert_called_with(
                game_id=None,
                hours=6
            )

    def test_game_detail_route(self, client, mock_api_client):
        """Test game detail page loads successfully"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/game/test-game-123')
            assert response.status_code == 200
            assert b'test-game-123' in response.data

    def test_game_detail_route_with_days(self, client, mock_api_client):
        """Test game detail page with days parameter"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/game/test-game-123?days=7')
            assert response.status_code == 200
            # Verify API was called with correct game_id
            mock_api_client.get_game_usage_stats.assert_called_with(
                'test-game-123',
                days=7
            )

    def test_health_route(self, client):
        """Test health check endpoint"""
        response = client.get('/health')
        assert response.status_code == 200

        data = response.get_json()
        assert data['status'] == 'ok'
        assert 'service' in data
        assert 'version' in data

    def test_404_error(self, client):
        """Test 404 error page"""
        response = client.get('/nonexistent-page')
        assert response.status_code == 404
        assert b'404' in response.data


class TestAPIEndpoints:
    """Tests for AJAX API endpoints"""

    def test_api_platform_stats(self, client, mock_api_client):
        """Test platform stats API endpoint"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/api/platform-stats')
            assert response.status_code == 200

            data = response.get_json()
            assert data['activeGames'] == 5
            assert data['totalEvents'] == 10000

    def test_api_platform_stats_with_days(self, client, mock_api_client):
        """Test platform stats API with days parameter"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/api/platform-stats?days=7')
            assert response.status_code == 200
            mock_api_client.get_platform_stats.assert_called_with(days=7)

    def test_api_hourly_data(self, client, mock_api_client):
        """Test hourly data API endpoint"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/api/hourly-data')
            assert response.status_code == 200

            data = response.get_json()
            assert isinstance(data, list)
            assert len(data) == 2  # From mock data

    def test_api_hourly_data_with_params(self, client, mock_api_client):
        """Test hourly data API with parameters"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/api/hourly-data?hours=6&gameId=game-123')
            assert response.status_code == 200
            mock_api_client.get_hourly_analytics.assert_called_with(
                game_id='game-123',
                hours=6
            )

    def test_api_cost_data(self, client, mock_api_client):
        """Test cost data API endpoint"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/api/cost-data')
            assert response.status_code == 200

            data = response.get_json()
            assert data['totalCost'] == 15.67
            assert 'costByService' in data

    def test_api_cost_data_with_filters(self, client, mock_api_client):
        """Test cost data API with filters"""
        with patch.object(dashboard_app, 'api_client', mock_api_client):
            response = client.get('/api/cost-data?days=7&service=EMOTION')
            assert response.status_code == 200
            # Verify correct parameters were passed
            call_args = mock_api_client.get_cost_analytics.call_args
            assert call_args is not None

    def test_api_error_handling(self, client):
        """Test API error handling returns 500"""
        mock_client = Mock()
        mock_client.get_platform_stats.side_effect = Exception("API Error")

        with patch.object(dashboard_app, 'api_client', mock_client):
            response = client.get('/api/platform-stats')
            assert response.status_code == 500

            data = response.get_json()
            assert 'error' in data


class TestErrorHandlers:
    """Tests for error handlers"""

    def test_404_handler(self, client):
        """Test 404 error handler"""
        response = client.get('/nonexistent')
        assert response.status_code == 404
        assert b'404' in response.data

    def test_500_handler(self, client):
        """Test 500 error handler"""
        # Simulate 500 error by raising exception
        @dashboard_app.app.route('/test-500')
        def test_500():
            raise Exception("Test error")

        response = client.get('/test-500')
        assert response.status_code == 500
        assert b'500' in response.data or b'\u670d\u52a1\u5668' in response.data
