"""
Vision Service - FastAPI Application
Analyzes game screenshots using GPT-4V or Claude Vision
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time
import base64
from typing import Optional

from src.config import settings
from src.models import (
    VisionAnalysisRequest,
    VisionAnalysisResponse,
    BatchVisionRequest,
    BatchVisionResponse,
    HealthResponse,
    StatsResponse
)
from src.image_processor import image_processor
from src.vision_client import vision_client
from src.scene_analyzer import scene_analyzer
from src.cache import vision_cache, cost_tracker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Statistics
stats = {
    'total_requests': 0,
    'cache_hits': 0,
    'total_processing_time_ms': 0.0
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info(f"Starting {settings.service_name} v{settings.version}")
    logger.info(f"Vision provider: {settings.vision_provider}")
    yield
    logger.info(f"Shutting down {settings.service_name}")


# Initialize FastAPI app
app = FastAPI(
    title="Vision Service",
    description="Analyzes game screenshots using AI vision models (GPT-4V, Claude Vision)",
    version=settings.version,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.service_name,
        "version": settings.version,
        "status": "running",
        "providers": {
            "openai": vision_client.is_available("openai"),
            "anthropic": vision_client.is_available("anthropic")
        }
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint

    Returns service status and dependency health
    """
    # Check vision API availability
    openai_status = "ok" if vision_client.is_available("openai") else "unavailable"
    anthropic_status = "ok" if vision_client.is_available("anthropic") else "unavailable"
    cache_status = "ok" if vision_cache.enabled else "disabled"

    return HealthResponse(
        status="ok",
        service=settings.service_name,
        version=settings.version,
        dependencies={
            "openai_gpt4v": openai_status,
            "anthropic_claude_vision": anthropic_status,
            "cache": cache_status
        }
    )


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get service statistics

    Returns processing stats, costs, and cache metrics
    """
    avg_time = (
        stats['total_processing_time_ms'] / stats['total_requests']
        if stats['total_requests'] > 0
        else 0.0
    )

    cache_hit_rate = (
        stats['cache_hits'] / stats['total_requests']
        if stats['total_requests'] > 0
        else 0.0
    )

    # Get cost information
    total_cost = cost_tracker.get_total_cost()
    daily_cost = cost_tracker.get_daily_cost()
    budget_status = cost_tracker.get_budget_status()

    # Get available providers
    providers = []
    if vision_client.is_available("openai"):
        providers.append("openai")
    if vision_client.is_available("anthropic"):
        providers.append("anthropic")

    return StatsResponse(
        total_requests=stats['total_requests'],
        cache_hit_rate=cache_hit_rate,
        avg_processing_time_ms=avg_time,
        total_cost=total_cost,
        daily_cost=daily_cost,
        budget_remaining=budget_status['remaining'],
        supported_providers=providers,
        supported_formats=settings.supported_formats
    )


@app.post("/analyze", response_model=VisionAnalysisResponse)
async def analyze_image(request: VisionAnalysisRequest):
    """
    Analyze game screenshot

    **Process:**
    1. Load and optimize image
    2. Check cache for previous analysis
    3. Call vision API (GPT-4V or Claude Vision)
    4. Extract structured data (scene, events, character, UI)
    5. Return analysis with metadata

    **Performance:**
    - Cache hit: ~10-20ms, $0 cost
    - Cache miss: ~2-5s, ~$0.01-0.02 cost

    **Supported Analysis Types:**
    - `full`: Complete analysis (default)
    - `scene`: Scene description only
    - `event`: Event detection only
    - `ui`: UI elements only
    - `character`: Character status only

    **Example:**
    ```json
    {
      "image_data": "<base64-image>",
      "image_format": "png",
      "analysis_type": "full",
      "game_name": "Elden Ring",
      "enable_scene_detection": true
    }
    ```
    """
    start_time = time.time()
    stats['total_requests'] += 1

    try:
        # Decode image
        if request.image_data:
            image_bytes = base64.b64decode(request.image_data)
        else:
            # TODO: Fetch from URL
            raise HTTPException(
                status_code=400,
                detail="image_url not yet supported, use image_data"
            )

        # Validate image
        if not image_processor.validate_image(image_bytes):
            raise HTTPException(
                status_code=400,
                detail="Invalid image data"
            )

        # Calculate image hash for caching
        image_hash = image_processor.calculate_image_hash(image_bytes)

        # Check cache
        if request.enable_cache:
            cached_result = vision_cache.get(
                image_hash,
                request.analysis_type,
                request.custom_prompt
            )

            if cached_result:
                stats['cache_hits'] += 1
                processing_time = (time.time() - start_time) * 1000

                # Reconstruct response from cache
                return VisionAnalysisResponse(
                    **cached_result,
                    processing_time_ms=processing_time,
                    cache_hit=True
                )

        # Process image
        processed_image, image_metadata = image_processor.process_image(
            image_bytes,
            optimize=settings.enable_image_optimization
        )

        # Estimate cost
        provider = request.provider or settings.vision_provider
        if provider == "both":
            provider = "openai"  # Default to OpenAI for estimation

        estimated_cost = (
            settings.openai_cost_per_image["high"]
            if provider == "openai"
            else settings.anthropic_cost_per_image
        )

        # Check budget
        can_use, reason = cost_tracker.can_use_vision_api(estimated_cost)
        if not can_use:
            raise HTTPException(
                status_code=429,
                detail=f"Vision API unavailable: {reason}"
            )

        # Build analysis prompt
        if request.custom_prompt:
            prompt = request.custom_prompt
        else:
            prompt = settings.default_analysis_prompt

        # Add context if provided
        if request.game_name:
            prompt = f"Game: {request.game_name}\n\n{prompt}"

        if request.previous_scene:
            prompt = f"Previous scene: {request.previous_scene}\n\n{prompt}"

        # Call vision API
        vision_result = await vision_client.analyze_image(
            processed_image,
            prompt,
            provider=request.provider
        )

        # Extract structured data
        structured_data = scene_analyzer.analyze_text(
            vision_result['analysis_text'],
            request.analysis_type
        )

        # Record cost
        cost_tracker.record_cost(
            vision_result['cost'],
            vision_result['provider']
        )

        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000
        stats['total_processing_time_ms'] += processing_time

        # Build response
        response = VisionAnalysisResponse(
            analysis_text=vision_result['analysis_text'],
            scene=structured_data.get('scene'),
            character=structured_data.get('character'),
            events=structured_data.get('events', []),
            ui_elements=structured_data.get('ui_elements', []),
            scene_changed=False,  # TODO: Implement scene tracking
            scene_similarity=None,
            processing_time_ms=processing_time,
            cache_hit=False,
            provider=vision_result['provider'],
            model=vision_result['model'],
            cost=vision_result['cost'],
            image_size={
                'width': image_metadata['final_width'],
                'height': image_metadata['final_height']
            },
            image_optimized=image_metadata['optimized'],
            raw_response=vision_result.get('raw_response')
        )

        # Cache result
        if request.enable_cache:
            cache_data = response.model_dump(exclude={'processing_time_ms', 'cache_hit'})
            vision_cache.set(
                image_hash,
                request.analysis_type,
                cache_data,
                request.custom_prompt
            )

        logger.info(
            f"Vision analysis completed in {processing_time:.1f}ms "
            f"(provider: {vision_result['provider']}, cost: ${vision_result['cost']:.4f})"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vision analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Vision analysis failed: {str(e)}"
        )


@app.post("/analyze/file", response_model=VisionAnalysisResponse)
async def analyze_image_from_file(
    file: UploadFile = File(..., description="Image file"),
    analysis_type: str = Form(default="full", description="Analysis type"),
    game_name: Optional[str] = Form(None, description="Game name"),
    player_id: Optional[str] = Form(None, description="Player ID"),
    custom_prompt: Optional[str] = Form(None, description="Custom analysis prompt"),
    enable_cache: bool = Form(default=True, description="Enable caching"),
    provider: Optional[str] = Form(None, description="Vision API provider")
):
    """
    Analyze image from uploaded file

    **Supported Formats:**
    - PNG
    - JPEG/JPG
    - WebP
    - GIF (first frame)

    **Example:**
    ```bash
    curl -X POST http://localhost:8007/analyze/file \
      -F "file=@screenshot.png" \
      -F "game_name=Elden Ring" \
      -F "analysis_type=full"
    ```
    """
    try:
        # Read file
        image_data = await file.read()

        # Detect format
        image_format = file.filename.split('.')[-1].lower()
        if image_format not in settings.supported_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format: {image_format}"
            )

        # Encode to base64
        image_base64 = base64.b64encode(image_data).decode()

        # Create request
        request = VisionAnalysisRequest(
            image_data=image_base64,
            image_format=image_format,
            analysis_type=analysis_type,
            game_name=game_name,
            player_id=player_id,
            custom_prompt=custom_prompt,
            enable_cache=enable_cache,
            provider=provider
        )

        # Process
        return await analyze_image(request)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"File processing failed: {str(e)}"
        )


@app.post("/analyze/batch", response_model=BatchVisionResponse)
async def analyze_batch(request: BatchVisionRequest):
    """
    Analyze multiple images in batch

    **Use Cases:**
    - Analyze gameplay session screenshots
    - Create timeline of game events
    - Compare multiple scenes

    **Limits:**
    - Max 10 images per request
    - Each image analyzed independently
    - Optional aggregated summary

    **Example:**
    ```json
    {
      "images": [
        {"image_data": "<base64-1>", "analysis_type": "event"},
        {"image_data": "<base64-2>", "analysis_type": "event"}
      ],
      "aggregate_results": true
    }
    ```
    """
    start_time = time.time()
    results = []

    try:
        # Process each image
        for img_request in request.images:
            result = await analyze_image(img_request)
            results.append(result)

        # Calculate totals
        total_cost = sum(r.cost for r in results)
        total_processing_time = (time.time() - start_time) * 1000

        # Generate summary if requested
        summary = None
        if request.aggregate_results:
            # Aggregate event descriptions
            all_events = []
            for r in results:
                all_events.extend(r.events)

            if all_events:
                event_summary = ", ".join(e.description for e in all_events[:5])
                summary = f"Detected {len(all_events)} events across {len(results)} images: {event_summary}"

        return BatchVisionResponse(
            results=results,
            total_processing_time_ms=total_processing_time,
            total_cost=total_cost,
            summary=summary
        )

    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch analysis failed: {str(e)}"
        )


@app.delete("/cache")
async def clear_cache():
    """
    Clear all cached vision results

    Use this to force re-analysis of all images
    """
    try:
        vision_cache.clear_all()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cache clear failed: {str(e)}"
        )


@app.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics"""
    return vision_cache.get_stats()


@app.get("/budget")
async def get_budget_status():
    """
    Get budget status

    Returns daily budget information and usage
    """
    return cost_tracker.get_budget_status()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.port,
        log_level="info"
    )
