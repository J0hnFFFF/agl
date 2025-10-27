"""
Configuration for Dialogue Service
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Service configuration"""

    # Service
    service_name: str = "dialogue-service"
    service_version: str = "0.2.0"
    port: int = 8001

    # API Keys
    anthropic_api_key: Optional[str] = None

    # Memory Service
    memory_service_url: str = "http://localhost:3002"

    # LLM Strategy (90% template, 10% LLM)
    llm_usage_rate: float = 0.10  # 10% of requests use LLM
    llm_enabled: bool = True

    # Special case triggers (when to use LLM)
    special_case_importance_threshold: float = 0.8  # High importance memories
    special_case_first_time: bool = True  # First time events
    special_case_legendary: bool = True  # Legendary rarity
    special_case_milestone: bool = True  # Round number milestones (100th kill, etc)

    # LLM Configuration
    llm_model: str = "claude-3-haiku-20240307"  # Fast and cheap
    llm_max_tokens: int = 100  # Short responses
    llm_temperature: float = 0.7  # Balanced creativity
    llm_timeout: float = 5.0  # 5 second timeout

    # Cache Configuration
    cache_enabled: bool = True
    cache_ttl: int = 3600  # 1 hour cache

    # Cost Control
    max_cost_per_request: float = 0.01  # Max $0.01 per dialogue
    daily_llm_budget: float = 10.0  # Max $10/day for LLM

    # Performance
    max_memory_context: int = 5  # Max memories to include
    dialogue_max_length: int = 50  # Max characters in Chinese

    class Config:
        env_file = "../../.env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
