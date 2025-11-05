"""
Configuration for Vision Service
"""
import os
from typing import Optional, Literal
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Service configuration"""

    # Service settings
    service_name: str = "vision-service"
    version: str = "1.0.0"
    port: int = 8007

    # Vision API providers
    vision_provider: Literal["openai", "anthropic", "both"] = "openai"

    # OpenAI GPT-4V settings
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    openai_model: str = "gpt-4-vision-preview"
    openai_max_tokens: int = 500
    openai_detail: Literal["low", "high", "auto"] = "auto"  # Image detail level

    # Anthropic Claude Vision settings
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    anthropic_model: str = "claude-3-5-sonnet-20250129"
    anthropic_max_tokens: int = 1024

    # Image processing
    max_image_size: int = 2048  # Max width/height in pixels
    compression_quality: int = 85  # JPEG quality 0-100
    supported_formats: list = ["jpg", "jpeg", "png", "webp", "gif"]

    # Image optimization for cost savings
    enable_image_optimization: bool = True
    auto_resize_threshold: int = 2048  # Resize if larger than this

    # Analysis settings
    default_analysis_prompt: str = """Analyze this game screenshot and provide:
1. Scene description (location, environment, atmosphere)
2. Character status (health, level, equipment visible)
3. Game events (combat, dialogue, exploration, etc.)
4. UI elements and important information
5. Emotional context (tense, peaceful, exciting, etc.)

Be concise and focus on game-relevant information."""

    custom_prompt_max_length: int = 2000

    # Scene detection
    scene_change_threshold: float = 0.3  # Similarity threshold for scene changes
    enable_scene_tracking: bool = True

    # Event detection keywords
    combat_keywords: list = [
        "combat", "battle", "fighting", "enemy", "attack", "damage",
        "health bar", "weapon", "boss", "died", "killed"
    ]
    dialogue_keywords: list = [
        "dialogue", "conversation", "talking", "speech bubble", "npc",
        "quest", "character speaking", "text box"
    ]
    exploration_keywords: list = [
        "map", "exploring", "world", "landscape", "location",
        "area", "environment", "navigation"
    ]

    # Redis cache
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_db: int = 4
    cache_enabled: bool = True
    cache_ttl_seconds: int = 3600  # 1 hour for vision analysis

    # Visual memory storage
    enable_visual_memory: bool = True
    memory_retention_days: int = 30
    store_analyzed_images: bool = False  # Save images to storage (privacy)

    # Cost management
    daily_vision_budget: float = 50.0  # $50/day
    cost_alert_threshold: float = 0.8  # Alert at 80%

    # Vision API pricing (approximate, per image)
    openai_cost_per_image: dict = {
        "low": 0.00765,   # Low detail
        "high": 0.01275   # High detail
    }
    anthropic_cost_per_image: float = 0.012  # ~$0.012 per image

    # Rate limiting
    max_requests_per_minute: int = 10
    max_concurrent_requests: int = 3

    # Performance
    request_timeout: int = 30  # seconds
    max_retries: int = 2
    retry_delay: float = 1.0

    class Config:
        env_file = ".env"


settings = Settings()
