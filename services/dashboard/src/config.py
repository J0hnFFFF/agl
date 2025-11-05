"""
Configuration management for Flask Dashboard
"""
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from project root
load_dotenv(os.path.join(os.path.dirname(__file__), '../../../.env'))


class Config:
    """Dashboard configuration"""

    # Service info
    SERVICE_NAME = "dashboard"
    SERVICE_VERSION = "0.1.0"

    # Flask settings
    SECRET_KEY = os.getenv('DASHBOARD_SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('NODE_ENV', 'development') == 'development'

    # Dashboard server
    HOST = os.getenv('DASHBOARD_HOST', '0.0.0.0')
    PORT = int(os.getenv('DASHBOARD_PORT', '5000'))

    # API Service connection
    API_SERVICE_URL = os.getenv('API_SERVICE_URL', 'http://localhost:3000')
    API_KEY = os.getenv('DASHBOARD_API_KEY', '')  # API key for authenticating with API service

    # Analytics API endpoints
    ANALYTICS_BASE_URL = f"{API_SERVICE_URL}/api/v1/analytics"

    # Pagination
    DEFAULT_PAGE_SIZE = 50
    MAX_PAGE_SIZE = 200

    # Cache settings (for storing API responses briefly)
    CACHE_TIMEOUT = 60  # 1 minute

    # Dashboard settings
    DEFAULT_DAYS = 30  # Default time range for analytics
    REFRESH_INTERVAL = 30  # Auto-refresh interval in seconds

    # CORS settings (security)
    CORS_ORIGIN = os.getenv('CORS_ORIGIN', 'http://localhost:3000,http://localhost:5173')


config = Config()
