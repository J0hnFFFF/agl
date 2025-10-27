"""
Data models for Dialogue Service
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from enum import Enum


class Persona(str, Enum):
    """Character persona types"""
    CHEERFUL = "cheerful"
    COOL = "cool"
    CUTE = "cute"


class GenerationMethod(str, Enum):
    """Dialogue generation method"""
    TEMPLATE = "template"
    LLM = "llm"
    CACHED = "cached"


class DialogueRequest(BaseModel):
    """Request for dialogue generation"""
    event_type: str = Field(..., description="Type of game event")
    emotion: str = Field(..., description="Detected emotion")
    persona: Persona = Field(default=Persona.CHEERFUL, description="Character persona")
    player_id: Optional[str] = Field(None, description="Player ID for memory context")
    player_name: Optional[str] = Field(None, description="Player display name")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Event context data")
    language: Optional[str] = Field(default="zh", description="Language code (zh, en, ja)")
    force_llm: bool = Field(default=False, description="Force LLM generation (for testing)")

    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "player.victory",
                "emotion": "amazed",
                "persona": "cheerful",
                "player_id": "player-123",
                "context": {
                    "rarity": "legendary",
                    "win_streak": 10,
                    "is_first_time": True
                }
            }
        }


class Memory(BaseModel):
    """Player memory from Memory Service"""
    id: str
    content: str
    type: str
    emotion: Optional[str] = None
    importance: float
    created_at: str
    similarity_score: Optional[float] = None


class DialogueResponse(BaseModel):
    """Response with generated dialogue"""
    dialogue: str = Field(..., description="Generated dialogue text")
    method: GenerationMethod = Field(..., description="Generation method used")
    cost: float = Field(default=0.0, description="Cost in USD")
    used_special_case: bool = Field(default=False, description="Whether special case detection triggered")
    special_case_reasons: List[str] = Field(default_factory=list, description="Reasons for special case")
    memory_count: int = Field(default=0, description="Number of memories used")
    cache_hit: bool = Field(default=False, description="Whether response was cached")
    latency_ms: float = Field(default=0.0, description="Generation latency in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "dialogue": "天啊！传奇胜利！这是你的第10连胜！太不可思议了！",
                "method": "llm",
                "cost": 0.0008,
                "used_special_case": True,
                "special_case_reasons": ["legendary_rarity", "milestone_streak"],
                "memory_count": 3,
                "cache_hit": False,
                "latency_ms": 450.5
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    llm_enabled: bool
    cache_enabled: bool
    memory_service_available: bool


class CostTracker(BaseModel):
    """Daily cost tracking"""
    date: str
    total_requests: int = 0
    llm_requests: int = 0
    template_requests: int = 0
    cached_requests: int = 0
    total_cost: float = 0.0
    average_cost: float = 0.0
    average_latency_ms: float = 0.0
