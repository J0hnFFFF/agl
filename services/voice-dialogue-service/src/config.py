"""
Configuration for Voice Dialogue Service
Orchestrates STT, Dialogue, and TTS services
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Voice Dialogue Service configuration"""

    # Service info
    service_name: str = "voice-dialogue-service"
    service_version: str = "1.0.0"
    port: int = int(os.getenv("VOICE_DIALOGUE_PORT", "8005"))
    host: str = os.getenv("VOICE_DIALOGUE_HOST", "0.0.0.0")

    # Service URLs
    stt_service_url: str = os.getenv("STT_SERVICE_URL", "http://localhost:8004")
    dialogue_service_url: str = os.getenv("DIALOGUE_SERVICE_URL", "http://localhost:8001")
    tts_service_url: str = os.getenv("TTS_SERVICE_URL", "http://localhost:8003")

    # Timeouts (seconds)
    stt_timeout: int = int(os.getenv("STT_TIMEOUT", "30"))
    dialogue_timeout: int = int(os.getenv("DIALOGUE_TIMEOUT", "10"))
    tts_timeout: int = int(os.getenv("TTS_TIMEOUT", "15"))
    total_timeout: int = int(os.getenv("TOTAL_TIMEOUT", "60"))

    # Retry configuration
    max_retries: int = int(os.getenv("MAX_RETRIES", "2"))
    retry_delay: float = float(os.getenv("RETRY_DELAY", "1.0"))

    # Default settings
    default_language: str = os.getenv("DEFAULT_LANGUAGE", "zh-CN")
    default_persona: str = os.getenv("DEFAULT_PERSONA", "cheerful")
    default_emotion: str = os.getenv("DEFAULT_EMOTION", "neutral")

    # Feature flags
    enable_vad: bool = os.getenv("ENABLE_VAD", "true").lower() == "true"
    enable_emotion_detection: bool = os.getenv("ENABLE_EMOTION_DETECTION", "true").lower() == "true"
    enable_memory_context: bool = os.getenv("ENABLE_MEMORY_CONTEXT", "false").lower() == "true"

    # Redis for caching (optional)
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_db: int = int(os.getenv("REDIS_DB", "0"))
    redis_password: Optional[str] = os.getenv("REDIS_PASSWORD")
    cache_enabled: bool = os.getenv("VD_CACHE_ENABLED", "false").lower() == "true"

    # CORS
    cors_origins: str = os.getenv("CORS_ORIGINS", "*")

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
