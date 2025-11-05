"""
Configuration management for Vision Service
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Service configuration"""

    # Service info
    service_name: str = "vision-service"
    service_version: str = "0.1.0"

    # API keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    # Vision Analysis Configuration
    vision_enabled: bool = True
    default_provider: str = "openai-gpt4v"  # openai-gpt4v or anthropic-claude
    openai_model: str = "gpt-4-vision-preview"
    anthropic_model: str = "claude-3-opus-20240229"
    max_tokens: int = 1000
    temperature: float = 0.7

    # Image Processing
    max_image_size: int = 5 * 1024 * 1024  # 5MB
    allowed_formats: list = ["jpeg", "jpg", "png", "webp"]

    # Cost control
    max_cost_per_request: float = 0.05  # Max $0.05 per analysis
    daily_vision_budget: float = 100.0  # $100/day for vision analysis

    # Caching
    cache_enabled: bool = True
    cache_ttl: int = 86400  # 24 hours (vision analysis can be cached longer)

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0

    # CORS
    cors_origin: str = "*"

    # Service port
    port: int = 8002

    class Config:
        env_file = "../../.env"
        env_file_encoding = "utf-8"


settings = Settings()
