"""
Pydantic models for STT Service
"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class RecognitionMethod(str, Enum):
    """Speech recognition method"""
    STT = "stt"  # Whisper API
    CACHED = "cached"  # Cached result


class AudioFormat(str, Enum):
    """Supported audio formats"""
    MP3 = "mp3"
    MP4 = "mp4"
    MPEG = "mpeg"
    MPGA = "mpga"
    M4A = "m4a"
    WAV = "wav"
    WEBM = "webm"


class TranscribeRequest(BaseModel):
    """Request model for transcription"""
    audio_data: str = Field(..., description="Base64-encoded audio data")
    format: AudioFormat = Field(AudioFormat.MP3, description="Audio format")
    language: Optional[str] = Field(None, description="Language code (e.g., zh-CN, en-US)")
    enable_vad: bool = Field(True, description="Enable Voice Activity Detection to reduce costs")

    class Config:
        json_schema_extra = {
            "example": {
                "audio_data": "//uQx...",  # Base64 audio
                "format": "mp3",
                "language": "zh-CN",
                "enable_vad": True
            }
        }


class TranscribeResponse(BaseModel):
    """Response model for transcription"""
    text: str = Field(..., description="Transcribed text")
    language: Optional[str] = Field(None, description="Detected language code")
    confidence: Optional[float] = Field(None, description="Confidence score (0-1)")
    duration_seconds: float = Field(..., description="Audio duration in seconds")
    method: RecognitionMethod = Field(..., description="Recognition method (stt or cached)")
    cost: float = Field(..., description="Cost in USD")
    cache_hit: bool = Field(..., description="Whether result was from cache")
    latency_ms: float = Field(..., description="Processing time in milliseconds")
    audio_size_bytes: int = Field(..., description="Original audio size")
    vad_applied: bool = Field(False, description="Whether VAD was applied")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "你好，我是AI助手",
                "language": "zh-CN",
                "confidence": 0.98,
                "duration_seconds": 2.5,
                "method": "stt",
                "cost": 0.00025,
                "cache_hit": False,
                "latency_ms": 452.3,
                "audio_size_bytes": 48000,
                "vad_applied": True
            }
        }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    stt_enabled: bool
    cache_enabled: bool
    vad_enabled: bool
    provider_status: str
    cache_stats: Optional[dict] = None
    cost_stats: Optional[dict] = None


class LanguageInfo(BaseModel):
    """Language information"""
    code: str = Field(..., description="Language code (e.g., zh-CN)")
    name: str = Field(..., description="Language name")
    supported: bool = Field(..., description="Whether language is supported")

    class Config:
        json_schema_extra = {
            "example": {
                "code": "zh-CN",
                "name": "Chinese (Simplified)",
                "supported": True
            }
        }


class VADStats(BaseModel):
    """Voice Activity Detection statistics"""
    enabled: bool
    aggressiveness: int
    original_duration: float
    filtered_duration: float
    reduction_percent: float
