"""
Data models for Vision Service
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from enum import Enum


class AnalysisMethod(str, Enum):
    """Vision analysis method"""
    CACHED = "cached"
    OPENAI_GPT4V = "openai-gpt4v"
    ANTHROPIC_CLAUDE = "anthropic-claude"


class VisionProvider(str, Enum):
    """Vision provider"""
    OPENAI = "openai-gpt4v"
    ANTHROPIC = "anthropic-claude"


class GameState(str, Enum):
    """Game state categories"""
    COMBAT = "combat"
    MENU = "menu"
    DIALOGUE = "dialogue"
    INVENTORY = "inventory"
    MAP = "map"
    CUTSCENE = "cutscene"
    LOADING = "loading"
    PAUSED = "paused"
    VICTORY = "victory"
    DEFEAT = "defeat"
    GAMEPLAY = "gameplay"
    UNKNOWN = "unknown"


class AnalyzeRequest(BaseModel):
    """Request for vision analysis"""
    screenshot: str = Field(..., description="Base64 encoded image data")
    prompt: str = Field(..., description="Analysis prompt", min_length=1, max_length=2000)
    provider: Optional[VisionProvider] = Field(None, description="Specific provider to use")
    context: Optional[str] = Field(None, description="Additional context for analysis")
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0, description="Temperature (0-1)")
    max_tokens: Optional[int] = Field(None, ge=1, le=4000, description="Max tokens to generate")
    force_analysis: bool = Field(default=False, description="Force new analysis, bypass cache")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                    "prompt": "What is happening in this game scene?",
                    "provider": "openai-gpt4v",
                    "context": "This is a screenshot from an RPG game",
                    "max_tokens": 1000
                }
            ]
        }
    }


class AnalyzeResponse(BaseModel):
    """Response from vision analysis"""
    content: str = Field(..., description="Analysis result")
    confidence: Optional[float] = Field(None, description="Confidence score (0-1)")
    method: AnalysisMethod = Field(..., description="Analysis method used")
    provider: VisionProvider = Field(..., description="Provider used")
    cost: float = Field(default=0.0, description="Cost in USD")
    cache_hit: bool = Field(default=False, description="Whether result was cached")
    latency_ms: float = Field(default=0.0, description="Processing latency in milliseconds")
    token_usage: Optional[Dict[str, int]] = Field(None, description="Token usage details")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "content": "The player is in combat with two enemies. Health bar shows 75% HP remaining.",
                    "confidence": 0.95,
                    "method": "openai-gpt4v",
                    "provider": "openai-gpt4v",
                    "cost": 0.0123,
                    "cache_hit": False,
                    "latency_ms": 2456.7,
                    "token_usage": {
                        "prompt_tokens": 1205,
                        "completion_tokens": 42,
                        "total_tokens": 1247
                    }
                }
            ]
        }
    }


class GameStateRequest(BaseModel):
    """Request for game state recognition"""
    screenshot: str = Field(..., description="Base64 encoded image data")
    provider: Optional[VisionProvider] = Field(None, description="Specific provider to use")
    confidence_threshold: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum confidence")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                    "provider": "openai-gpt4v",
                    "confidence_threshold": 0.8
                }
            ]
        }
    }


class GameStateResponse(BaseModel):
    """Response from game state recognition"""
    category: GameState = Field(..., description="Detected game state category")
    confidence: float = Field(..., description="Confidence score (0-1)")
    scene_description: str = Field(..., description="Description of the scene")
    method: AnalysisMethod = Field(..., description="Analysis method used")
    cost: float = Field(default=0.0, description="Cost in USD")
    cache_hit: bool = Field(default=False, description="Whether result was cached")
    latency_ms: float = Field(default=0.0, description="Processing latency in milliseconds")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "category": "combat",
                    "confidence": 0.92,
                    "scene_description": "Player is engaged in combat with multiple enemies",
                    "method": "openai-gpt4v",
                    "cost": 0.0098,
                    "cache_hit": False,
                    "latency_ms": 1987.3
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    vision_enabled: bool
    cache_enabled: bool
    provider_status: Dict[str, str]
    cache_stats: Optional[Dict[str, Any]] = None
    cost_stats: Optional[Dict[str, Any]] = None


class VisionResult(BaseModel):
    """Internal vision analysis result"""
    content: str
    confidence: Optional[float]
    cost: float
    token_usage: Optional[Dict[str, int]]
    processing_time: float
