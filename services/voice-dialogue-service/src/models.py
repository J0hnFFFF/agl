"""
Pydantic models for Voice Dialogue Service
"""
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ProcessingStage(str, Enum):
    """Voice dialogue processing stages"""
    STT = "stt"  # Speech-to-text
    DIALOGUE = "dialogue"  # Dialogue generation
    TTS = "tts"  # Text-to-speech
    COMPLETE = "complete"  # All stages complete


class VoiceDialogueRequest(BaseModel):
    """Request model for voice dialogue"""
    audio_data: str = Field(..., description="Base64-encoded input audio from user")
    audio_format: str = Field("mp3", description="Input audio format")
    language: Optional[str] = Field(None, description="Language code (e.g., zh-CN, en-US)")
    persona: Optional[str] = Field(None, description="Character persona (cheerful, cool, cute)")
    player_id: Optional[str] = Field(None, description="Player ID for memory context")
    game_context: Optional[Dict[str, Any]] = Field(None, description="Additional game context")
    enable_vad: bool = Field(True, description="Enable Voice Activity Detection")
    output_format: str = Field("mp3", description="Output audio format for TTS")

    class Config:
        json_schema_extra = {
            "example": {
                "audio_data": "//uQx...",
                "audio_format": "mp3",
                "language": "zh-CN",
                "persona": "cheerful",
                "player_id": "player_123",
                "game_context": {
                    "scene": "battle",
                    "event": "victory"
                },
                "enable_vad": True,
                "output_format": "mp3"
            }
        }


class VoiceDialogueResponse(BaseModel):
    """Response model for voice dialogue"""
    # User input (STT result)
    user_text: str = Field(..., description="Transcribed user speech")
    user_language: Optional[str] = Field(None, description="Detected user language")

    # AI response (Dialogue result)
    ai_text: str = Field(..., description="Generated AI response text")
    ai_emotion: str = Field(..., description="AI response emotion")

    # Audio output (TTS result)
    audio_url: str = Field(..., description="Base64 or URL of synthesized audio")
    audio_duration: float = Field(..., description="Audio duration in seconds")

    # Processing details
    processing_time_ms: float = Field(..., description="Total processing time")
    stage_timings: Dict[str, float] = Field(..., description="Timing for each stage")

    # Cost tracking
    total_cost: float = Field(..., description="Total cost in USD")
    cost_breakdown: Dict[str, float] = Field(..., description="Cost per service")

    # Caching info
    stt_cached: bool = Field(False, description="STT result was cached")
    dialogue_cached: bool = Field(False, description="Dialogue was cached")
    tts_cached: bool = Field(False, description="TTS audio was cached")

    # Optional metadata
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "user_text": "你好，今天天气怎么样？",
                "user_language": "zh-CN",
                "ai_text": "今天天气很好！阳光明媚，适合出去玩哦~",
                "ai_emotion": "cheerful",
                "audio_url": "data:audio/mp3;base64,//uQx...",
                "audio_duration": 3.2,
                "processing_time_ms": 1250.5,
                "stage_timings": {
                    "stt": 450.2,
                    "dialogue": 320.1,
                    "tts": 480.2
                },
                "total_cost": 0.00095,
                "cost_breakdown": {
                    "stt": 0.00025,
                    "dialogue": 0.0002,
                    "tts": 0.0005
                },
                "stt_cached": False,
                "dialogue_cached": False,
                "tts_cached": True
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    dependencies: Dict[str, str]  # service_name -> status


class ServiceError(BaseModel):
    """Error details for a specific service"""
    service: str
    stage: ProcessingStage
    error_message: str
    retry_count: int


class StageResult(BaseModel):
    """Result of a processing stage"""
    stage: ProcessingStage
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    latency_ms: float
    cost: float
    cached: bool = False
