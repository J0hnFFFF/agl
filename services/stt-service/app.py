"""
FastAPI Application for STT Service
Speech-to-text recognition with cost optimization
"""
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
import base64

from src.config import settings
from src.models import (
    TranscribeRequest,
    TranscribeResponse,
    HealthResponse,
    LanguageInfo
)
from src.stt_engine import stt_engine
from src.cache import stt_cache
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
    logger.info(f"STT enabled: {settings.stt_enabled}")
    logger.info(f"Whisper model: {settings.whisper_model}")
    logger.info(f"VAD enabled: {settings.vad_enabled}")
    logger.info(f"Cache enabled: {settings.cache_enabled}")
    logger.info(f"Daily budget: ${settings.daily_stt_budget}")

    yield

    logger.info(f"Shutting down {settings.service_name}")


# Create FastAPI app
app = FastAPI(
    title="AGL STT Service",
    description="Speech-to-Text recognition with intelligent cost optimization using OpenAI Whisper API",
    version=settings.service_version,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
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
        "stt_enabled": settings.stt_enabled,
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check endpoint

    Returns service health status including:
    - STT provider status
    - Cache statistics
    - Cost tracking stats
    - VAD stats
    """
    try:
        health_data = await stt_engine.health_check()

        return HealthResponse(
            status="ok",
            service=health_data["service"],
            version=health_data["version"],
            stt_enabled=health_data["stt_enabled"],
            cache_enabled=health_data["cache_enabled"],
            vad_enabled=health_data["vad_enabled"],
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


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_speech(request: TranscribeRequest):
    """
    Transcribe speech from audio

    This endpoint implements a hybrid cost optimization strategy:
    - Cache hit: Return cached transcription instantly (~10ms, $0)
    - Cache miss: Transcribe with OpenAI Whisper (~500ms, ~$0.006/min)

    **Voice Activity Detection (VAD)**:
    - Enabled by default
    - Removes silence to reduce API costs
    - Can save 20-50% on costs for typical recordings

    The service enforces daily budget limits to prevent cost overruns.

    **Supported Languages**: Chinese (zh-CN), English (en-US), Japanese (ja-JP), Korean (ko-KR)

    **Supported Audio Formats**: mp3, mp4, mpeg, mpga, m4a, wav, webm

    Example Request:
    ```json
    {
        "audio_data": "//uQx...",  // Base64-encoded audio
        "format": "mp3",
        "language": "zh-CN",
        "enable_vad": true
    }
    ```

    Example Response:
    ```json
    {
        "text": "你好，我是AI助手",
        "language": "zh-CN",
        "confidence": 0.98,
        "duration_seconds": 2.5,
        "method": "stt",
        "cost": 0.00025,
        "cache_hit": false,
        "latency_ms": 452.3,
        "audio_size_bytes": 48000,
        "vad_applied": true
    }
    ```

    **Cost Estimates** (OpenAI Whisper):
    - $0.006 per minute of audio
    - Typical 5-second dialogue: ~$0.0005
    - With VAD: ~$0.0003 (40% savings)
    """
    try:
        response = await stt_engine.transcribe(request)
        return response
    except Exception as e:
        logger.error(f"Transcription failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe audio: {str(e)}"
        )


@app.post("/transcribe/file", response_model=TranscribeResponse)
async def transcribe_file(
    file: UploadFile = File(...),
    language: str = Form(None),
    enable_vad: bool = Form(True)
):
    """
    Transcribe speech from uploaded audio file

    Alternative endpoint that accepts file upload directly instead of base64.

    Args:
        file: Audio file upload
        language: Optional language code (zh-CN, en-US, ja-JP, ko-KR)
        enable_vad: Enable Voice Activity Detection (default: true)

    Returns:
        TranscribeResponse with transcription result
    """
    try:
        # Read file
        audio_bytes = await file.read()

        # Detect format from filename
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported audio format: {file_ext}"
            )

        # Encode to base64
        audio_data = base64.b64encode(audio_bytes).decode('utf-8')

        # Create request
        request = TranscribeRequest(
            audio_data=audio_data,
            format=file_ext,
            language=language,
            enable_vad=enable_vad
        )

        # Transcribe
        response = await stt_engine.transcribe(request)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File transcription failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transcribe file: {str(e)}"
        )


@app.get("/languages", response_model=list[LanguageInfo])
async def list_languages():
    """
    Get list of supported languages

    Returns information about all supported languages including:
    - Language code
    - Language name
    - Whether it's supported

    Example Response:
    ```json
    [
        {
            "code": "zh-CN",
            "name": "Chinese (Simplified)",
            "supported": true
        },
        {
            "code": "en-US",
            "name": "English (US)",
            "supported": true
        }
    ]
    ```
    """
    try:
        languages = stt_engine.get_supported_languages()
        return [LanguageInfo(**lang) for lang in languages]
    except Exception as e:
        logger.error(f"Failed to get languages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve languages: {str(e)}"
        )


@app.get("/stats")
async def get_stats():
    """
    Get service statistics

    Returns detailed statistics including:
    - Cache hit rate and size
    - Daily cost and budget status
    - Request counts (cached vs STT)
    - Audio duration processed
    - Average latencies
    - VAD statistics

    Useful for monitoring cost efficiency and cache effectiveness.

    Example Response:
    ```json
    {
        "cache": {
            "enabled": true,
            "cache_size": 148,
            "ttl_seconds": 604800,
            "ttl_days": 7.0
        },
        "cost": {
            "daily_budget": "$30.00",
            "daily_cost": "$1.2450",
            "remaining": "$28.76",
            "usage_percent": "4.2%",
            "total_requests": 148,
            "cached_requests": 125,
            "stt_requests": 23,
            "cache_hit_rate": "84.5%",
            "total_duration_minutes": "12.50",
            "stt_duration_minutes": "2.08",
            "avg_cached_latency_ms": "8.2",
            "avg_stt_latency_ms": "452.3"
        },
        "vad": {
            "enabled": true,
            "aggressiveness": 2,
            "description": "Energy-based Voice Activity Detection"
        }
    }
    ```
    """
    try:
        health_data = await stt_engine.health_check()

        return {
            "cache": health_data["cache_stats"],
            "cost": health_data["cost_stats"],
            "vad": health_data["vad_stats"],
            "stt_enabled": settings.stt_enabled,
            "cache_enabled": settings.cache_enabled,
            "vad_enabled": settings.vad_enabled,
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
    Clear STT cache

    Removes all cached transcription results. Useful for:
    - Testing new audio processing settings
    - Freeing up Redis memory
    - Forcing re-transcription after model updates

    Returns:
    ```json
    {
        "status": "ok",
        "message": "Cache cleared successfully"
    }
    ```
    """
    try:
        stt_cache.clear()
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
