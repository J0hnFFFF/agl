"""
API Client for calling Analytics API endpoints
"""
import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from .config import config

logger = logging.getLogger(__name__)


class AnalyticsAPIError(Exception):
    """Exception raised when Analytics API call fails"""
    pass


class AnalyticsAPIClient:
    """
    Client for calling Analytics API endpoints

    Responsibilities:
    - Make HTTP requests to Analytics API
    - Handle authentication (API key)
    - Parse responses
    - Handle errors gracefully
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize API client

        Args:
            base_url: Base URL for Analytics API (default from config)
            api_key: API key for authentication (default from config)
        """
        self.base_url = base_url or config.ANALYTICS_BASE_URL
        self.api_key = api_key or config.API_KEY
        self.session = requests.Session()

        # Set default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        })

    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to Analytics API

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint path
            **kwargs: Additional arguments for requests

        Returns:
            Parsed JSON response

        Raises:
            AnalyticsAPIError: If request fails
        """
        url = f"{self.base_url}{endpoint}"

        try:
            logger.info(f"Making {method} request to {url}")
            response = self.session.request(method, url, timeout=10, **kwargs)
            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling {url}: {e}")
            raise AnalyticsAPIError(f"API request failed: {e}")

        except requests.exceptions.RequestException as e:
            logger.error(f"Request error calling {url}: {e}")
            raise AnalyticsAPIError(f"Network error: {e}")

        except ValueError as e:
            logger.error(f"JSON parse error from {url}: {e}")
            raise AnalyticsAPIError(f"Invalid JSON response: {e}")

    def get_platform_stats(self, days: int = 30) -> Dict[str, Any]:
        """
        Get overall platform statistics

        Args:
            days: Number of days to include (default 30)

        Returns:
            Platform statistics including:
            - activeGames: Number of active games
            - totalEvents: Total events count
            - totalPlayers: Total unique players
            - emotionRequests: Total emotion requests
            - dialogueRequests: Total dialogue requests
            - memoryCreated: Total memories created
            - memorySearches: Total memory searches
            - totalCost: Total cost in USD
            - usage: Method breakdown (rule, ML, LLM, cached)
        """
        return self._make_request('GET', '/platform', params={'days': days})

    def get_hourly_analytics(self, game_id: Optional[str] = None, hours: int = 24) -> List[Dict[str, Any]]:
        """
        Get hourly analytics for real-time monitoring

        Args:
            game_id: Optional game ID to filter by
            hours: Number of hours to include (default 24)

        Returns:
            List of hourly analytics records
        """
        params = {'hours': hours}
        if game_id:
            params['gameId'] = game_id

        return self._make_request('GET', '/hourly', params=params)

    def get_cost_analytics(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        game_id: Optional[str] = None,
        service: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get cost analytics with breakdown by service

        Args:
            start_date: Start date (ISO format)
            end_date: End date (ISO format)
            game_id: Optional game ID to filter by
            service: Optional service to filter by (EMOTION, DIALOGUE, MEMORY)

        Returns:
            Cost analytics including:
            - totalCost: Total cost in USD
            - totalRequests: Total request count
            - costByService: Breakdown by service
            - dailyCost: Daily cost trend
        """
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date
        if game_id:
            params['gameId'] = game_id
        if service:
            params['service'] = service

        return self._make_request('GET', '/costs', params=params)

    def get_game_analytics(
        self,
        game_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get daily analytics for a specific game

        Args:
            game_id: Game ID
            start_date: Start date (ISO format)
            end_date: End date (ISO format)

        Returns:
            List of daily analytics records
        """
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        return self._make_request('GET', f'/games/{game_id}', params=params)

    def get_game_usage_stats(self, game_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get game usage statistics

        Args:
            game_id: Game ID
            days: Number of days to include (default 30)

        Returns:
            Usage statistics including:
            - summary: Aggregated summary
            - dailyStats: Daily breakdown
        """
        return self._make_request('GET', f'/games/{game_id}/usage', params={'days': days})

    def get_emotion_distribution(
        self,
        game_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Get emotion distribution for a game

        Args:
            game_id: Game ID
            start_date: Start date (ISO format)
            end_date: End date (ISO format)

        Returns:
            Dictionary mapping emotion names to counts
        """
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        return self._make_request('GET', f'/games/{game_id}/emotions', params=params)

    def get_service_metrics(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        game_id: Optional[str] = None,
        service: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get raw service metrics

        Args:
            start_date: Start date (ISO format)
            end_date: End date (ISO format)
            game_id: Optional game ID to filter by
            service: Optional service to filter by
            limit: Maximum number of records
            offset: Offset for pagination

        Returns:
            Service metrics with pagination info
        """
        params = {
            'limit': limit,
            'offset': offset
        }
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date
        if game_id:
            params['gameId'] = game_id
        if service:
            params['service'] = service

        return self._make_request('GET', '/metrics', params=params)


def get_date_range(days: int = 30) -> tuple[str, str]:
    """
    Get ISO formatted date range

    Args:
        days: Number of days from today

    Returns:
        Tuple of (start_date, end_date) in ISO format
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    return start_date.isoformat(), end_date.isoformat()
