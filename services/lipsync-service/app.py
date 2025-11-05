"""
Lip Sync Service - FastAPI Application
Generates lip sync animation data from audio
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
    LipSyncRequest,
    LipSyncResponse,
    VisemeEvent,
    HealthResponse,
    StatsResponse
)
from src.phoneme_extractor import phoneme_extractor
from src.viseme_mapper import viseme_mapper
from src.timeline_generator import timeline_generator
from src.cache import lipsync_cache

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
    yield
    logger.info(f"Shutting down {settings.service_name}")


# Initialize FastAPI app
app = FastAPI(
    title="Lip Sync Service",
    description="Generates lip sync animation data from speech audio",
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
        "status": "running"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint

    Returns service status and dependency health
    """
    # Check Redis cache
    cache_status = "ok" if lipsync_cache.enabled else "disabled"

    return HealthResponse(
        status="ok",
        service=settings.service_name,
        version=settings.version,
        dependencies={
            "cache": cache_status
        }
    )


@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get service statistics

    Returns processing stats and cache metrics
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

    return StatsResponse(
        total_requests=stats['total_requests'],
        cache_hit_rate=cache_hit_rate,
        avg_processing_time_ms=avg_time,
        supported_languages=['en-US', 'zh-CN', 'ja-JP', 'ko-KR'],
        supported_visemes=list(timeline_generator.VISEME_TO_BLEND_SHAPE.keys())
    )


@app.post("/lipsync", response_model=LipSyncResponse)
async def generate_lipsync(request: LipSyncRequest):
    """
    Generate lip sync animation from audio

    **Process:**
    1. Extract phonemes from audio (with timestamps)
    2. Map phonemes to visemes (mouth shapes)
    3. Generate animation timeline in requested format

    **Performance:**
    - Cache hit: ~10-20ms, instant response
    - Cache miss: ~500-1500ms, full processing

    **Supported Formats:**
    - `standard`: Generic keyframe format
    - `unity`: Unity AnimationClip curves
    - `unreal`: Unreal FRichCurve format
    - `web`: Three.js/Babylon.js morph targets

    **Example:**
    ```json
    {
      "audio_data": "<base64-audio>",
      "audio_format": "mp3",
      "language": "en-US",
      "output_format": "unity"
    }
    ```
    """
    start_time = time.time()
    stats['total_requests'] += 1

    try:
        # Decode audio data
        audio_bytes = base64.b64decode(request.audio_data)

        # Check cache
        if request.enable_cache:
            cached_result = lipsync_cache.get(
                audio_bytes,
                request.language,
                request.output_format,
                request.blend_transitions
            )

            if cached_result:
                stats['cache_hits'] += 1

                # Reconstruct response from cache
                processing_time = (time.time() - start_time) * 1000

                return LipSyncResponse(
                    visemes=[VisemeEvent(**v) for v in cached_result['visemes']],
                    total_duration=cached_result['total_duration'],
                    phonemes=cached_result.get('phonemes'),
                    processing_time_ms=processing_time,
                    cache_hit=True,
                    method="cached",
                    viseme_count=cached_result['viseme_count'],
                    unique_visemes=cached_result['unique_visemes'],
                    output_data=cached_result.get('output_data')
                )

        # Step 1: Extract phonemes from audio
        logger.info(f"Extracting phonemes from {len(audio_bytes)} bytes of audio")
        phonemes = await phoneme_extractor.extract_phonemes(
            audio_bytes,
            request.audio_format,
            request.language
        )

        if not phonemes:
            raise HTTPException(
                status_code=400,
                detail="No phonemes extracted from audio. Audio may be too short or silent."
            )

        logger.info(f"Extracted {len(phonemes)} phonemes")

        # Step 2: Map phonemes to visemes
        visemes = viseme_mapper.map_phonemes_to_visemes(
            phonemes,
            blend_transitions=request.blend_transitions
        )

        logger.info(f"Mapped to {len(visemes)} visemes")

        # Step 3: Generate timeline in requested format
        timeline_data = timeline_generator.generate_timeline(
            visemes,
            output_format=request.output_format
        )

        # Calculate metrics
        processing_time = (time.time() - start_time) * 1000
        stats['total_processing_time_ms'] += processing_time

        total_duration = max(v.end_time for v in visemes) if visemes else 0.0
        unique_visemes = list(set(v.viseme for v in visemes))

        # Build response
        response = LipSyncResponse(
            visemes=visemes,
            total_duration=total_duration,
            phonemes=phonemes if request.output_format == "standard" else None,
            processing_time_ms=processing_time,
            cache_hit=False,
            method="whisper" if phoneme_extractor.client else "energy",
            viseme_count=len(visemes),
            unique_visemes=unique_visemes,
            output_data=timeline_data
        )

        # Cache result
        if request.enable_cache:
            cache_data = {
                'visemes': [v.model_dump() for v in visemes],
                'total_duration': total_duration,
                'phonemes': [p.model_dump() for p in phonemes] if phonemes else None,
                'viseme_count': len(visemes),
                'unique_visemes': unique_visemes,
                'output_data': timeline_data
            }
            lipsync_cache.set(
                audio_bytes,
                request.language,
                request.output_format,
                request.blend_transitions,
                cache_data
            )

        logger.info(
            f"Generated lip sync in {processing_time:.1f}ms "
            f"({len(visemes)} visemes, {total_duration:.2f}s duration)"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lip sync generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Lip sync generation failed: {str(e)}"
        )


@app.post("/lipsync/file", response_model=LipSyncResponse)
async def generate_lipsync_from_file(
    file: UploadFile = File(..., description="Audio file"),
    language: str = Form(default="en-US", description="Language code"),
    output_format: str = Form(default="standard", description="Output format"),
    blend_transitions: bool = Form(default=True, description="Smooth transitions"),
    enable_cache: bool = Form(default=True, description="Enable caching")
):
    """
    Generate lip sync from uploaded audio file

    **Supported Audio Formats:**
    - MP3
    - WAV
    - OGG
    - FLAC
    - M4A

    **Example:**
    ```bash
    curl -X POST http://localhost:8006/lipsync/file \
      -F "file=@speech.mp3" \
      -F "language=en-US" \
      -F "output_format=unity"
    ```
    """
    try:
        # Read file
        audio_data = await file.read()

        # Detect format from filename
        audio_format = file.filename.split('.')[-1].lower()
        if audio_format not in ['mp3', 'wav', 'ogg', 'flac', 'm4a']:
            audio_format = 'mp3'  # Default

        # Encode to base64
        audio_base64 = base64.b64encode(audio_data).decode()

        # Create request
        request = LipSyncRequest(
            audio_data=audio_base64,
            audio_format=audio_format,
            language=language,
            output_format=output_format,
            blend_transitions=blend_transitions,
            enable_cache=enable_cache
        )

        # Process
        return await generate_lipsync(request)

    except Exception as e:
        logger.error(f"File upload failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"File processing failed: {str(e)}"
        )


@app.delete("/cache")
async def clear_cache():
    """
    Clear all cached lip sync results

    Use this to force regeneration of all lip sync data
    """
    try:
        lipsync_cache.clear_all()
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Cache clear failed: {str(e)}"
        )


@app.get("/cache/stats")
async def get_cache_stats():
    """Get cache statistics"""
    return lipsync_cache.get_stats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.port,
        log_level="info"
    )
