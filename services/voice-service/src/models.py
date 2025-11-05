"""
Data models for Voice Service
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from enum import Enum


class SynthesisMethod(str, Enum):
    """Voice synthesis method"""
    CACHED = "cached"
    TTS = "tts"


class VoiceProvider(str, Enum):
    """TTS provider"""
    OPENAI = "openai"
    # Future: ELEVENLABS = "elevenlabs"


class VoiceGender(str, Enum):
    """Voice gender"""
    MALE = "male"
    FEMALE = "female"
    NEUTRAL = "neutral"


class Language(str, Enum):
    """Supported languages"""
    ZH_CN = "zh-CN"  # Chinese (Simplified)
    EN_US = "en-US"  # English (US)
    JA_JP = "ja-JP"  # Japanese
    KO_KR = "ko-KR"  # Korean


class Persona(str, Enum):
    """Character persona"""
    CHEERFUL = "cheerful"
    COOL = "cool"
    CUTE = "cute"


class AudioFormat(str, Enum):
    """Audio output format"""
    MP3 = "mp3"
    OPUS = "opus"
    AAC = "aac"
    FLAC = "flac"


class SynthesizeRequest(BaseModel):
    """Request for voice synthesis"""
    text: str = Field(..., description="Text to synthesize", min_length=1, max_length=4096)
    persona: Persona = Field(default=Persona.CHEERFUL, description="Character persona")
    language: Language = Field(default=Language.ZH_CN, description="Target language")
    voice: Optional[str] = Field(None, description="Specific voice ID (OpenAI: alloy/echo/fable/onyx/nova/shimmer)")
    speed: Optional[float] = Field(None, ge=0.25, le=4.0, description="Speech speed (0.25-4.0)")
    format: AudioFormat = Field(default=AudioFormat.MP3, description="Audio format")
    force_synthesis: bool = Field(default=False, description="Force new synthesis, bypass cache")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "你真厉害！继续加油！",
                    "persona": "cheerful",
                    "language": "zh-CN",
                    "speed": 1.0,
                    "format": "mp3"
                },
                {
                    "text": "Incredible performance! Keep it up!",
                    "persona": "cool",
                    "language": "en-US",
                    "voice": "onyx",
                    "format": "mp3"
                }
            ]
        }
    }


class SynthesizeResponse(BaseModel):
    """Response from voice synthesis"""
    audio_url: str = Field(..., description="URL to audio file (base64 data URL or CDN URL)")
    text: str = Field(..., description="Original text")
    persona: Persona = Field(..., description="Character persona used")
    language: Language = Field(..., description="Language used")
    voice: str = Field(..., description="Voice ID used")
    format: AudioFormat = Field(..., description="Audio format")
    method: SynthesisMethod = Field(..., description="Synthesis method used")
    cost: float = Field(default=0.0, description="Cost in USD")
    cache_hit: bool = Field(default=False, description="Whether result was cached")
    latency_ms: float = Field(default=0.0, description="Processing latency in milliseconds")
    audio_duration_seconds: Optional[float] = Field(None, description="Audio duration in seconds")
    character_count: int = Field(..., description="Number of characters synthesized")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "audio_url": "data:audio/mp3;base64,//uQx...",
                    "text": "你真厉害！",
                    "persona": "cheerful",
                    "language": "zh-CN",
                    "voice": "nova",
                    "format": "mp3",
                    "method": "cached",
                    "cost": 0.0,
                    "cache_hit": True,
                    "latency_ms": 8.5,
                    "audio_duration_seconds": 1.5,
                    "character_count": 5
                }
            ]
        }
    }


class VoiceInfo(BaseModel):
    """Information about an available voice"""
    voice_id: str = Field(..., description="Voice identifier")
    provider: VoiceProvider = Field(..., description="TTS provider")
    name: str = Field(..., description="Voice name")
    gender: VoiceGender = Field(..., description="Voice gender")
    languages: List[Language] = Field(..., description="Supported languages")
    persona: Persona = Field(..., description="Recommended persona")
    description: str = Field(..., description="Voice description")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "voice_id": "nova",
                    "provider": "openai",
                    "name": "Nova",
                    "gender": "female",
                    "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"],
                    "persona": "cheerful",
                    "description": "Warm, energetic female voice"
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    tts_enabled: bool
    cache_enabled: bool
    provider_status: Dict[str, str]
    cache_stats: Optional[Dict[str, Any]] = None
    cost_stats: Optional[Dict[str, Any]] = None


class TTSResult(BaseModel):
    """Internal TTS result"""
    audio_bytes: bytes
    format: AudioFormat
    cost: float
    character_count: int
    audio_duration_seconds: Optional[float] = None
