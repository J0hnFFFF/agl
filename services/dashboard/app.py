"""
Flask Dashboard Application

Provides web-based visualization of Analytics API data.
Displays platform statistics, cost analytics, and real-time monitoring.
"""
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import logging
from datetime import datetime, timedelta
from src.config import config
from src.api_client import AnalyticsAPIClient, AnalyticsAPIError, get_date_range
from src.cache import dashboard_cache

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config.from_object(config)

# Enable CORS with restricted origins
# In production, only allow specific domains
allowed_origins = config.CORS_ORIGIN.split(',') if hasattr(config, 'CORS_ORIGIN') else [
    'http://localhost:3000',  # API Service
    'http://localhost:5173',  # Frontend dev server
]
CORS(app, origins=allowed_origins, supports_credentials=True)

# Initialize API client
api_client = AnalyticsAPIClient()


@app.route('/')
def index():
    """
    Dashboard overview page

    Displays:
    - Platform statistics (games, events, players, costs)
    - Method usage breakdown (rule-based, ML, LLM, cached)
    - Recent trends
    """
    try:
        # Get query parameters
        days = request.args.get('days', config.DEFAULT_DAYS, type=int)

        # Fetch platform stats with caching (1-minute TTL)
        cache_key = dashboard_cache.get_cache_key('platform', days)
        platform_stats = dashboard_cache.platform_stats(
            days,
            cache_key,
            lambda d: api_client.get_platform_stats(days=d)
        )

        return render_template(
            'index.html',
            stats=platform_stats,
            days=days,
            error=None
        )

    except AnalyticsAPIError as e:
        logger.error(f"Error fetching platform stats: {e}")
        return render_template(
            'index.html',
            stats=None,
            days=days,
            error=str(e)
        )


@app.route('/costs')
def costs():
    """
    Cost analytics page

    Displays:
    - Total costs
    - Cost breakdown by service (emotion, dialogue, memory)
    - Daily cost trends
    - Cost per request averages
    """
    try:
        # Get query parameters
        days = request.args.get('days', config.DEFAULT_DAYS, type=int)
        game_id = request.args.get('gameId', None)
        service = request.args.get('service', None)

        # Calculate date range
        start_date, end_date = get_date_range(days)

        # Fetch cost analytics
        cost_data = api_client.get_cost_analytics(
            start_date=start_date,
            end_date=end_date,
            game_id=game_id,
            service=service
        )

        return render_template(
            'costs.html',
            cost_data=cost_data,
            days=days,
            game_id=game_id,
            service=service,
            error=None
        )

    except AnalyticsAPIError as e:
        logger.error(f"Error fetching cost analytics: {e}")
        return render_template(
            'costs.html',
            cost_data=None,
            days=days,
            error=str(e)
        )


@app.route('/realtime')
def realtime():
    """
    Real-time monitoring page

    Displays:
    - Hourly analytics (last 24 hours)
    - Request rate
    - Latency trends
    - Live charts with auto-refresh
    """
    try:
        # Get query parameters
        hours = request.args.get('hours', 24, type=int)
        game_id = request.args.get('gameId', None)

        # Fetch hourly analytics
        hourly_data = api_client.get_hourly_analytics(
            game_id=game_id,
            hours=hours
        )

        return render_template(
            'realtime.html',
            hourly_data=hourly_data,
            hours=hours,
            game_id=game_id,
            refresh_interval=config.REFRESH_INTERVAL,
            error=None
        )

    except AnalyticsAPIError as e:
        logger.error(f"Error fetching hourly analytics: {e}")
        return render_template(
            'realtime.html',
            hourly_data=None,
            hours=hours,
            error=str(e)
        )


@app.route('/game/<game_id>')
def game_detail(game_id: str):
    """
    Game-specific analytics page

    Args:
        game_id: Game ID

    Displays:
    - Usage statistics
    - Emotion distribution
    - Daily trends
    - Cost breakdown
    """
    try:
        # Get query parameters
        days = request.args.get('days', config.DEFAULT_DAYS, type=int)

        # Calculate date range
        start_date, end_date = get_date_range(days)

        # Fetch game data
        usage_stats = api_client.get_game_usage_stats(game_id, days=days)
        emotion_dist = api_client.get_emotion_distribution(
            game_id,
            start_date=start_date,
            end_date=end_date
        )

        return render_template(
            'game_detail.html',
            game_id=game_id,
            usage_stats=usage_stats,
            emotion_dist=emotion_dist,
            days=days,
            error=None
        )

    except AnalyticsAPIError as e:
        logger.error(f"Error fetching game analytics: {e}")
        return render_template(
            'game_detail.html',
            game_id=game_id,
            usage_stats=None,
            emotion_dist=None,
            days=days,
            error=str(e)
        )


# API endpoints for AJAX requests

@app.route('/api/platform-stats')
def api_platform_stats():
    """
    API endpoint for fetching platform stats

    Query params:
        days: Number of days (default 30)

    Returns:
        JSON response with platform statistics
    """
    try:
        days = request.args.get('days', config.DEFAULT_DAYS, type=int)
        stats = api_client.get_platform_stats(days=days)
        return jsonify(stats)

    except AnalyticsAPIError as e:
        logger.error(f"Error in API endpoint: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/hourly-data')
def api_hourly_data():
    """
    API endpoint for fetching hourly analytics

    Query params:
        hours: Number of hours (default 24)
        gameId: Optional game ID filter

    Returns:
        JSON response with hourly data
    """
    try:
        hours = request.args.get('hours', 24, type=int)
        game_id = request.args.get('gameId', None)

        hourly_data = api_client.get_hourly_analytics(
            game_id=game_id,
            hours=hours
        )
        return jsonify(hourly_data)

    except AnalyticsAPIError as e:
        logger.error(f"Error in API endpoint: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/cost-data')
def api_cost_data():
    """
    API endpoint for fetching cost analytics

    Query params:
        days: Number of days (default 30)
        gameId: Optional game ID filter
        service: Optional service filter

    Returns:
        JSON response with cost analytics
    """
    try:
        days = request.args.get('days', config.DEFAULT_DAYS, type=int)
        game_id = request.args.get('gameId', None)
        service = request.args.get('service', None)

        start_date, end_date = get_date_range(days)

        cost_data = api_client.get_cost_analytics(
            start_date=start_date,
            end_date=end_date,
            game_id=game_id,
            service=service
        )
        return jsonify(cost_data)

    except AnalyticsAPIError as e:
        logger.error(f"Error in API endpoint: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/health')
def health():
    """
    Health check endpoint

    Returns:
        JSON response with service health status
    """
    return jsonify({
        'status': 'ok',
        'service': config.SERVICE_NAME,
        'version': config.SERVICE_VERSION,
        'timestamp': datetime.now().isoformat(),
        'api_service_url': config.API_SERVICE_URL
    })


@app.errorhandler(404)
def not_found(error):
    """404 error handler"""
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    """500 error handler"""
    logger.error(f"Internal server error: {error}")
    return render_template('500.html'), 500


if __name__ == '__main__':
    logger.info(f"Starting {config.SERVICE_NAME} v{config.SERVICE_VERSION}")
    logger.info(f"Dashboard URL: http://{config.HOST}:{config.PORT}")
    logger.info(f"API Service: {config.API_SERVICE_URL}")

    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG
    )
