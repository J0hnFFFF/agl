"""
Pydantic models for Lip Sync Service
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator
import base64


class PhonemeEvent(BaseModel):
    """Single phoneme event with timing"""
    phoneme: str = Field(..., description="Phoneme symbol (IPA or ARPABET)")
    start_time: float = Field(..., description="Start time in seconds", ge=0)
    end_time: float = Field(..., description="End time in seconds", ge=0)
    confidence: float = Field(default=1.0, description="Confidence score", ge=0, le=1)

    @field_validator('end_time')
    @classmethod
    def validate_time_range(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be greater than start_time')
        return v


class VisemeEvent(BaseModel):
    """Single viseme event with timing"""
    viseme: str = Field(..., description="Viseme identifier")
    viseme_name: str = Field(..., description="Human-readable viseme name")
    start_time: float = Field(..., description="Start time in seconds", ge=0)
    end_time: float = Field(..., description="End time in seconds", ge=0)
    weight: float = Field(default=1.0, description="Blend weight", ge=0, le=1)

    @field_validator('end_time')
    @classmethod
    def validate_time_range(cls, v, info):
        if 'start_time' in info.data and v <= info.data['start_time']:
            raise ValueError('end_time must be greater than start_time')
        return v


class LipSyncRequest(BaseModel):
    """Request for lip sync generation"""

    # Audio input (one of these required)
    audio_data: Optional[str] = Field(None, description="Base64-encoded audio data")
    audio_url: Optional[str] = Field(None, description="URL to audio file")

    # Audio metadata
    audio_format: str = Field(default="mp3", description="Audio format (mp3, wav, ogg)")
    language: str = Field(default="en-US", description="Language code")

    # Processing options
    enable_cache: bool = Field(default=True, description="Enable result caching")
    blend_transitions: bool = Field(default=True, description="Smooth viseme transitions")
    min_viseme_duration_ms: int = Field(default=40, description="Minimum viseme duration")

    # Output format
    output_format: str = Field(
        default="standard",
        description="Output format: standard, unity, unreal, web"
    )

    @field_validator('audio_data')
    @classmethod
    def validate_audio_data(cls, v):
        if v:
            try:
                base64.b64decode(v)
            except Exception:
                raise ValueError('audio_data must be valid base64')
        return v

    def model_post_init(self, __context):
        """Validate that at least one audio source is provided"""
        if not self.audio_data and not self.audio_url:
            raise ValueError('Either audio_data or audio_url must be provided')


class LipSyncResponse(BaseModel):
    """Response with lip sync data"""

    # Viseme timeline
    visemes: List[VisemeEvent] = Field(..., description="Viseme timeline")
    total_duration: float = Field(..., description="Total duration in seconds")

    # Optional phoneme data
    phonemes: Optional[List[PhonemeEvent]] = Field(
        None,
        description="Original phoneme data (optional)"
    )

    # Processing metadata
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    cache_hit: bool = Field(default=False, description="Whether result was cached")
    method: str = Field(..., description="Processing method used")

    # Statistics
    viseme_count: int = Field(..., description="Total number of visemes")
    unique_visemes: List[str] = Field(..., description="Unique visemes used")

    # Format-specific output
    output_data: Optional[Dict[str, Any]] = Field(
        None,
        description="Format-specific output data"
    )


class UnityLipSyncData(BaseModel):
    """Unity-specific lip sync format"""
    clips: List[Dict[str, Any]] = Field(..., description="Animation clips")
    duration: float = Field(..., description="Total duration")
    frameRate: int = Field(default=30, description="Animation frame rate")


class UnrealLipSyncData(BaseModel):
    """Unreal Engine-specific format"""
    curves: List[Dict[str, Any]] = Field(..., description="Animation curves")
    duration: float = Field(..., description="Total duration")


class WebLipSyncData(BaseModel):
    """Web-friendly format (Three.js, Babylon.js)"""
    morphTargets: List[Dict[str, Any]] = Field(..., description="Morph target keyframes")
    duration: float = Field(..., description="Total duration")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    dependencies: Dict[str, str] = {}


class StatsResponse(BaseModel):
    """Service statistics"""
    total_requests: int
    cache_hit_rate: float
    avg_processing_time_ms: float
    supported_languages: List[str]
    supported_visemes: List[str]
