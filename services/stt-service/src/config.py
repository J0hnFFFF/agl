"""
Configuration for STT Service
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """STT Service configuration"""

    # Service info
    service_name: str = "stt-service"
    service_version: str = "1.0.0"
    port: int = int(os.getenv("STT_SERVICE_PORT", "8004"))
    host: str = os.getenv("STT_SERVICE_HOST", "0.0.0.0")

    # OpenAI Whisper API
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    whisper_model: str = os.getenv("WHISPER_MODEL", "whisper-1")
    stt_enabled: bool = os.getenv("STT_ENABLED", "true").lower() == "true"

    # Supported languages
    supported_languages: list[str] = ["zh-CN", "en-US", "ja-JP", "ko-KR"]

    # Audio processing
    max_audio_size_mb: int = int(os.getenv("MAX_AUDIO_SIZE_MB", "25"))  # Whisper API limit
    vad_enabled: bool = os.getenv("VAD_ENABLED", "true").lower() == "true"
    vad_aggressiveness: int = int(os.getenv("VAD_AGGRESSIVENESS", "2"))  # 0-3, higher = more aggressive

    # Caching
    cache_enabled: bool = os.getenv("STT_CACHE_ENABLED", "true").lower() == "true"
    cache_ttl_seconds: int = int(os.getenv("STT_CACHE_TTL", "604800"))  # 7 days
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_db: int = int(os.getenv("REDIS_DB", "0"))
    redis_password: Optional[str] = os.getenv("REDIS_PASSWORD")

    # Cost management
    daily_stt_budget: float = float(os.getenv("DAILY_STT_BUDGET", "30.0"))  # USD
    max_cost_per_request: float = float(os.getenv("MAX_COST_PER_REQUEST", "1.0"))  # USD

    # Pricing (OpenAI Whisper as of 2025)
    # $0.006 per minute of audio
    whisper_cost_per_minute: float = 0.006

    # Performance
    timeout_seconds: int = int(os.getenv("STT_TIMEOUT", "30"))

    # CORS
    cors_origins: str = os.getenv("CORS_ORIGINS", "*")

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
