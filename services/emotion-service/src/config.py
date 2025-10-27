"""
Configuration management for Emotion Service
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Service configuration"""

    # Service info
    service_name: str = "emotion-service"
    service_version: str = "0.2.0"

    # API keys
    anthropic_api_key: Optional[str] = None

    # ML Configuration
    ml_enabled: bool = True
    ml_confidence_threshold: float = 0.8  # Use ML when rule confidence < this
    ml_model: str = "claude-3-haiku-20240307"
    ml_max_tokens: int = 50
    ml_temperature: float = 0.3

    # Cost control
    max_cost_per_request: float = 0.005
    daily_ml_budget: float = 5.0  # $5/day for ML emotion detection
    ml_usage_rate_target: float = 0.15  # Target 15% ML usage

    # Caching
    cache_enabled: bool = True
    cache_ttl: int = 1800  # 30 minutes

    # CORS
    cors_origin: str = "*"

    class Config:
        env_file = "../../.env"
        env_file_encoding = "utf-8"


settings = Settings()
