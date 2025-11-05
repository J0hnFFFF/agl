"""
FastAPI Application for Voice Service
TTS synthesis with caching and cost optimization
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from src.config import settings
from src.models import (
    SynthesizeRequest,
    SynthesizeResponse,
    HealthResponse,
    VoiceInfo
)
from src.voice_service import voice_service
from src.cache import voice_cache
from src.cost_tracker import cost_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler"""
    logger.info(f"Starting {settings.service_name} v{settings.service_version}")
    logger.info(f"TTS enabled: {settings.tts_enabled}")
    logger.info(f"TTS model: {settings.tts_model}")
    logger.info(f"Cache enabled: {settings.cache_enabled}")
    logger.info(f"Daily budget: ${settings.daily_tts_budget}")

    yield

    logger.info(f"Shutting down {settings.service_name}")


# Create FastAPI app
app = FastAPI(
    title="AGL Voice Service",
    description="Text-to-Speech synthesis with intelligent caching and cost optimization",
    version=settings.service_version,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "status": "ok",
        "tts_enabled": settings.tts_enabled,
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check endpoint

    Returns service health status including:
    - TTS provider status
    - Cache statistics
    - Cost tracking stats
    """
    try:
        health_data = await voice_service.health_check()

        return HealthResponse(
            status="ok",
            service=health_data["service"],
            version=health_data["version"],
            tts_enabled=health_data["tts_enabled"],
            cache_enabled=health_data["cache_enabled"],
            provider_status=health_data["provider_status"],
            cache_stats=health_data.get("cache_stats"),
            cost_stats=health_data.get("cost_stats")
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )


@app.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_speech(request: SynthesizeRequest):
    """
    Synthesize speech from text

    This endpoint implements a hybrid caching strategy:
    - Cache hit: Return cached audio instantly (~10ms, $0)
    - Cache miss: Synthesize with OpenAI TTS (~2s, ~$0.015/1K chars)

    The service enforces daily budget limits to prevent cost overruns.

    **Supported Languages**: Chinese (zh-CN), English (en-US), Japanese (ja-JP), Korean (ko-KR)

    **Available Voices**:
    - `alloy`: Neutral, balanced
    - `echo`: Clear male voice
    - `fable`: Expressive storytelling
    - `onyx`: Deep, authoritative (Cool persona)
    - `nova`: Warm, energetic (Cheerful persona)
    - `shimmer`: Light, friendly (Cute persona)

    **Personas**:
    - `cheerful`: Energetic and positive
    - `cool`: Calm and authoritative
    - `cute`: Friendly and approachable

    Example Request:
    ```json
    {
        "text": "你真厉害！继续加油！",
        "persona": "cheerful",
        "language": "zh-CN",
        "speed": 1.0,
        "format": "mp3"
    }
    ```

    Example Response:
    ```json
    {
        "audio_url": "data:audio/mp3;base64,//uQx...",
        "text": "你真厉害！继续加油！",
        "persona": "cheerful",
        "language": "zh-CN",
        "voice": "nova",
        "format": "mp3",
        "method": "tts",
        "cost": 0.00015,
        "cache_hit": false,
        "latency_ms": 1842.5,
        "audio_duration_seconds": 2.1,
        "character_count": 10
    }
    ```

    **Cost Estimates** (OpenAI TTS-1):
    - Chinese: ~0.015 USD / 1000 characters
    - English: ~0.015 USD / 1000 words
    - Typical dialogue (20 chars): ~$0.0003
    """
    try:
        response = await voice_service.synthesize(request)
        return response
    except Exception as e:
        logger.error(f"Synthesis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to synthesize speech: {str(e)}"
        )


@app.get("/voices", response_model=list[VoiceInfo])
async def list_voices():
    """
    Get list of available voices

    Returns information about all available TTS voices including:
    - Voice ID
    - Provider (OpenAI)
    - Name and gender
    - Supported languages
    - Recommended persona
    - Description

    Example Response:
    ```json
    [
        {
            "voice_id": "nova",
            "provider": "openai",
            "name": "Nova",
            "gender": "female",
            "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"],
            "persona": "cheerful",
            "description": "Warm, energetic voice (Cheerful persona)"
        },
        ...
    ]
    ```
    """
    try:
        voices = voice_service.get_available_voices()
        return voices
    except Exception as e:
        logger.error(f"Failed to get voices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve voices: {str(e)}"
        )


@app.get("/stats")
async def get_stats():
    """
    Get service statistics

    Returns detailed statistics including:
    - Cache hit rate and size
    - Daily cost and budget status
    - Request counts (cached vs TTS)
    - Character counts
    - Average latencies

    Useful for monitoring cost efficiency and cache effectiveness.

    Example Response:
    ```json
    {
        "cache": {
            "hits": 125,
            "misses": 23,
            "hit_rate": "84.5%",
            "cache_size": 148,
            "ttl_seconds": 604800,
            "enabled": true
        },
        "cost": {
            "daily_budget": "$50.00",
            "daily_cost": "$2.3450",
            "remaining": "$47.66",
            "usage_percent": "4.7%",
            "total_requests": 148,
            "cached_requests": 125,
            "tts_requests": 23,
            "cache_hit_rate": "84.5%",
            "total_characters": 2850,
            "tts_characters": 1530,
            "avg_cached_latency_ms": "8.2",
            "avg_tts_latency_ms": "1842.5"
        },
        "tts_enabled": true,
        "cache_enabled": true
    }
    ```
    """
    try:
        health_data = await voice_service.health_check()

        return {
            "cache": health_data["cache_stats"],
            "cost": health_data["cost_stats"],
            "tts_enabled": settings.tts_enabled,
            "cache_enabled": settings.cache_enabled,
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )


@app.post("/cache/clear")
async def clear_cache():
    """
    Clear voice cache

    Removes all cached audio files. Useful for:
    - Testing new TTS settings
    - Freeing up Redis memory
    - Forcing re-synthesis after voice updates

    Returns:
    ```json
    {
        "status": "ok",
        "message": "Cache cleared successfully"
    }
    ```
    """
    try:
        voice_cache.clear()
        return {
            "status": "ok",
            "message": "Cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level="info"
    )
