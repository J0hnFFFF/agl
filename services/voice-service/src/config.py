"""
Configuration management for Voice Service
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Service configuration"""

    # Service info
    service_name: str = "voice-service"
    service_version: str = "0.1.0"

    # API keys
    openai_api_key: Optional[str] = None

    # TTS Configuration
    tts_enabled: bool = True
    tts_model: str = "tts-1"  # tts-1 (standard) or tts-1-hd (high quality)
    tts_voice_default: str = "alloy"  # alloy, echo, fable, onyx, nova, shimmer
    tts_speed: float = 1.0  # 0.25 to 4.0

    # Cost control
    max_cost_per_request: float = 0.02  # Max $0.02 per synthesis
    daily_tts_budget: float = 50.0  # $50/day for TTS synthesis

    # Caching
    cache_enabled: bool = True
    cache_ttl: int = 604800  # 7 days (audio files can be cached longer)

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0

    # CORS
    cors_origin: str = "*"

    # Service port
    port: int = 8003

    class Config:
        env_file = "../../.env"
        env_file_encoding = "utf-8"


settings = Settings()
