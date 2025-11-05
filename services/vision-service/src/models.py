"""
Pydantic models for Vision Service
"""
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import base64


class VisionAnalysisRequest(BaseModel):
    """Request for vision analysis"""

    # Image input (one of these required)
    image_data: Optional[str] = Field(None, description="Base64-encoded image data")
    image_url: Optional[str] = Field(None, description="URL to image")

    # Image metadata
    image_format: str = Field(default="png", description="Image format")

    # Analysis options
    analysis_type: Literal["full", "scene", "event", "ui", "character"] = Field(
        default="full",
        description="Type of analysis to perform"
    )
    custom_prompt: Optional[str] = Field(
        None,
        description="Custom analysis prompt (overrides default)"
    )

    # Context for better analysis
    game_name: Optional[str] = Field(None, description="Game being played")
    player_id: Optional[str] = Field(None, description="Player identifier")
    session_id: Optional[str] = Field(None, description="Game session ID")
    previous_scene: Optional[str] = Field(None, description="Previous scene context")

    # Processing options
    enable_cache: bool = Field(default=True, description="Enable result caching")
    enable_scene_detection: bool = Field(
        default=True,
        description="Detect scene changes"
    )
    enable_event_detection: bool = Field(
        default=True,
        description="Detect game events"
    )

    # API provider preference
    provider: Optional[Literal["openai", "anthropic"]] = Field(
        None,
        description="Preferred vision API provider"
    )

    @field_validator('image_data')
    @classmethod
    def validate_image_data(cls, v):
        if v:
            try:
                base64.b64decode(v)
            except Exception:
                raise ValueError('image_data must be valid base64')
        return v

    def model_post_init(self, __context):
        """Validate that at least one image source is provided"""
        if not self.image_data and not self.image_url:
            raise ValueError('Either image_data or image_url must be provided')


class SceneInfo(BaseModel):
    """Scene information"""
    description: str = Field(..., description="Scene description")
    location: Optional[str] = Field(None, description="Game location/area")
    environment: Optional[str] = Field(None, description="Environment type")
    atmosphere: Optional[str] = Field(None, description="Emotional atmosphere")
    time_of_day: Optional[str] = Field(None, description="Time of day if visible")
    weather: Optional[str] = Field(None, description="Weather if visible")


class CharacterInfo(BaseModel):
    """Character information"""
    name: Optional[str] = Field(None, description="Character name if visible")
    health: Optional[str] = Field(None, description="Health status")
    level: Optional[str] = Field(None, description="Level if visible")
    equipment: List[str] = Field(default_factory=list, description="Visible equipment")
    status_effects: List[str] = Field(
        default_factory=list,
        description="Status effects"
    )


class GameEvent(BaseModel):
    """Detected game event"""
    event_type: str = Field(..., description="Event type (combat, dialogue, etc.)")
    description: str = Field(..., description="Event description")
    importance: Literal["low", "medium", "high"] = Field(
        default="medium",
        description="Event importance"
    )
    confidence: float = Field(..., description="Detection confidence", ge=0, le=1)


class UIElement(BaseModel):
    """UI element information"""
    element_type: str = Field(..., description="UI element type")
    content: str = Field(..., description="Content or description")
    importance: Literal["low", "medium", "high"] = Field(default="medium")


class VisionAnalysisResponse(BaseModel):
    """Response with vision analysis"""

    # Core analysis
    analysis_text: str = Field(..., description="Complete analysis text")

    # Structured data
    scene: Optional[SceneInfo] = Field(None, description="Scene information")
    character: Optional[CharacterInfo] = Field(None, description="Character info")
    events: List[GameEvent] = Field(
        default_factory=list,
        description="Detected events"
    )
    ui_elements: List[UIElement] = Field(
        default_factory=list,
        description="UI elements"
    )

    # Scene tracking
    scene_changed: bool = Field(
        default=False,
        description="Whether scene changed from previous"
    )
    scene_similarity: Optional[float] = Field(
        None,
        description="Similarity to previous scene"
    )

    # Processing metadata
    processing_time_ms: float = Field(..., description="Processing time")
    cache_hit: bool = Field(default=False, description="Cache hit status")
    provider: str = Field(..., description="Vision API provider used")
    model: str = Field(..., description="Model used")
    cost: float = Field(..., description="Analysis cost in USD")

    # Image metadata
    image_size: Dict[str, int] = Field(..., description="Image dimensions")
    image_optimized: bool = Field(
        default=False,
        description="Whether image was optimized"
    )

    # Raw response (optional)
    raw_response: Optional[Dict[str, Any]] = Field(
        None,
        description="Raw API response"
    )


class BatchVisionRequest(BaseModel):
    """Request for batch vision analysis"""
    images: List[VisionAnalysisRequest] = Field(
        ...,
        description="List of images to analyze",
        min_length=1,
        max_length=10
    )
    aggregate_results: bool = Field(
        default=True,
        description="Aggregate results into timeline"
    )


class BatchVisionResponse(BaseModel):
    """Response for batch analysis"""
    results: List[VisionAnalysisResponse] = Field(..., description="Individual results")
    total_processing_time_ms: float = Field(..., description="Total processing time")
    total_cost: float = Field(..., description="Total cost")
    summary: Optional[str] = Field(None, description="Aggregated summary")


class VisualMemoryEntry(BaseModel):
    """Visual memory storage entry"""
    memory_id: str = Field(..., description="Unique memory ID")
    timestamp: datetime = Field(..., description="When captured")
    player_id: str = Field(..., description="Player identifier")
    session_id: Optional[str] = Field(None, description="Game session")
    game_name: Optional[str] = Field(None, description="Game name")

    # Analysis data
    scene_description: str = Field(..., description="Scene description")
    events: List[GameEvent] = Field(default_factory=list)
    importance: Literal["low", "medium", "high"] = Field(default="medium")

    # Image data (optional)
    image_url: Optional[str] = Field(None, description="Stored image URL")
    image_hash: str = Field(..., description="Image hash for deduplication")

    # Metadata
    cost: float = Field(..., description="Analysis cost")


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
    total_cost: float
    daily_cost: float
    budget_remaining: float
    supported_providers: List[str]
    supported_formats: List[str]
