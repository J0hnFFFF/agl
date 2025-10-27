"""
Data models for Emotion Service
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from enum import Enum


class DetectionMethod(str, Enum):
    """Emotion detection method"""
    RULE = "rule"
    ML = "ml"
    CACHED = "cached"


class EmotionRequest(BaseModel):
    """Request for emotion analysis"""
    type: str = Field(..., description="Event type (e.g., player.victory)")
    data: Dict[str, Any] = Field(default_factory=dict, description="Event data")
    context: Dict[str, Any] = Field(default_factory=dict, description="Player context")
    force_ml: bool = Field(default=False, description="Force ML detection (debug only)")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "type": "player.victory",
                    "data": {
                        "mvp": True,
                        "winStreak": 5
                    },
                    "context": {
                        "playerHealth": 75,
                        "inCombat": False
                    }
                }
            ]
        }
    }


class EmotionResponse(BaseModel):
    """Response from emotion analysis"""
    emotion: str = Field(..., description="Detected emotion")
    intensity: float = Field(..., description="Emotion intensity (0-1)")
    action: str = Field(..., description="Suggested character action")
    confidence: float = Field(..., description="Detection confidence (0-1)")
    reasoning: str = Field(..., description="Explanation of detection")
    method: DetectionMethod = Field(..., description="Detection method used")
    cost: float = Field(default=0.0, description="Cost in USD")
    cache_hit: bool = Field(default=False, description="Whether result was cached")
    latency_ms: float = Field(default=0.0, description="Processing latency in milliseconds")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "emotion": "happy",
                    "intensity": 0.9,
                    "action": "smile",
                    "confidence": 0.95,
                    "reasoning": "Player won the match (MVP!) (win streak: 5)",
                    "method": "rule",
                    "cost": 0.0,
                    "cache_hit": False,
                    "latency_ms": 2.5
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    ml_enabled: bool
    ml_status: str
    cache_stats: Optional[Dict[str, Any]] = None
    cost_stats: Optional[Dict[str, Any]] = None


class RuleResult(BaseModel):
    """Result from rule-based analysis"""
    emotion: str
    intensity: float
    reasoning: str
    confidence: float


class MLResult(BaseModel):
    """Result from ML analysis"""
    emotion: str
    intensity: float
    reasoning: str
    confidence: float
    cost: float
    latency_ms: float
