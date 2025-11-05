"""
FastAPI Application for Voice Dialogue Service
Orchestrates STT + Dialogue + TTS for complete voice interaction
"""
from fastapi import FastAPI, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
import base64
from typing import Optional

from src.config import settings
from src.models import (
    VoiceDialogueRequest,
    VoiceDialogueResponse,
    HealthResponse
)
from src.orchestrator import orchestrator

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
    logger.info(f"STT Service: {settings.stt_service_url}")
    logger.info(f"Dialogue Service: {settings.dialogue_service_url}")
    logger.info(f"TTS Service: {settings.tts_service_url}")
    logger.info(f"VAD Enabled: {settings.enable_vad}")
    logger.info(f"Default Language: {settings.default_language}")
    logger.info(f"Default Persona: {settings.default_persona}")

    # Check service health
    health = await orchestrator.health_check()
    logger.info(f"Service dependencies: {health['dependencies']}")

    yield

    logger.info(f"Shutting down {settings.service_name}")


# Create FastAPI app
app = FastAPI(
    title="AGL Voice Dialogue Service",
    description="Complete voice interaction orchestration: Speech-to-Text → Dialogue Generation → Text-to-Speech",
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
        "pipeline": "STT → Dialogue → TTS",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check endpoint

    Checks health of this service and all dependencies:
    - STT Service
    - Dialogue Service
    - TTS Service

    Returns:
        Health status with dependency statuses
    """
    try:
        health_data = await orchestrator.health_check()

        return HealthResponse(
            status=health_data["status"],
            service=health_data["service"],
            version=health_data["version"],
            dependencies=health_data["dependencies"]
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )


@app.post("/dialogue", response_model=VoiceDialogueResponse)
async def voice_dialogue(request: VoiceDialogueRequest):
    """
    Complete voice dialogue interaction

    **Pipeline**:
    1. **STT** (Speech-to-Text): Transcribe user's speech
    2. **Dialogue**: Generate AI response based on input
    3. **TTS** (Text-to-Speech): Synthesize AI response to audio

    **Request Example**:
    ```json
    {
        "audio_data": "<base64-encoded-audio>",
        "audio_format": "mp3",
        "language": "zh-CN",
        "persona": "cheerful",
        "player_id": "player_123",
        "game_context": {
            "scene": "battle",
            "event": "victory"
        },
        "enable_vad": true,
        "output_format": "mp3"
    }
    ```

    **Response Example**:
    ```json
    {
        "user_text": "你好，今天天气怎么样？",
        "user_language": "zh-CN",
        "ai_text": "今天天气很好！阳光明媚~",
        "ai_emotion": "cheerful",
        "audio_url": "data:audio/mp3;base64,...",
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
        "stt_cached": false,
        "dialogue_cached": false,
        "tts_cached": true
    }
    ```

    **Performance**:
    - Typical latency: 1-2 seconds (with caching)
    - Cache hit rate: 60-80%
    - Total cost: $0.0005-0.002 per interaction

    **Features**:
    - Voice Activity Detection (VAD) reduces STT costs by 20-50%
    - Multi-stage caching (STT, Dialogue, TTS)
    - Automatic retry with exponential backoff
    - Cost tracking per stage
    """
    try:
        logger.info(f"Processing voice dialogue request (language={request.language}, persona={request.persona})")

        response = await orchestrator.process_voice_dialogue(request)

        logger.info(
            f"Voice dialogue completed in {response.processing_time_ms:.1f}ms "
            f"(cost=${response.total_cost:.4f}, "
            f"cached: STT={response.stt_cached}, Dialogue={response.dialogue_cached}, TTS={response.tts_cached})"
        )

        return response

    except Exception as e:
        logger.error(f"Voice dialogue failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice dialogue processing failed: {str(e)}"
        )


@app.post("/dialogue/file", response_model=VoiceDialogueResponse)
async def voice_dialogue_file(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    persona: Optional[str] = Form(None),
    player_id: Optional[str] = Form(None),
    enable_vad: bool = Form(True),
    output_format: str = Form("mp3")
):
    """
    Voice dialogue with file upload

    Alternative endpoint that accepts audio file upload directly.

    Args:
        file: Audio file upload
        language: Optional language code
        persona: Optional character persona
        player_id: Optional player ID
        enable_vad: Enable Voice Activity Detection
        output_format: Output audio format

    Returns:
        Complete voice dialogue response
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
        request = VoiceDialogueRequest(
            audio_data=audio_data,
            audio_format=file_ext,
            language=language,
            persona=persona,
            player_id=player_id,
            enable_vad=enable_vad,
            output_format=output_format
        )

        # Process
        response = await orchestrator.process_voice_dialogue(request)
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File voice dialogue failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process voice dialogue: {str(e)}"
        )


@app.get("/config")
async def get_config():
    """
    Get service configuration

    Returns current configuration including:
    - Service URLs
    - Timeout settings
    - Default settings
    - Feature flags

    Useful for debugging and monitoring.
    """
    return {
        "service": {
            "name": settings.service_name,
            "version": settings.service_version,
            "port": settings.port
        },
        "services": {
            "stt_url": settings.stt_service_url,
            "dialogue_url": settings.dialogue_service_url,
            "tts_url": settings.tts_service_url
        },
        "timeouts": {
            "stt": settings.stt_timeout,
            "dialogue": settings.dialogue_timeout,
            "tts": settings.tts_timeout,
            "total": settings.total_timeout
        },
        "retry": {
            "max_retries": settings.max_retries,
            "retry_delay": settings.retry_delay
        },
        "defaults": {
            "language": settings.default_language,
            "persona": settings.default_persona,
            "emotion": settings.default_emotion
        },
        "features": {
            "vad_enabled": settings.enable_vad,
            "emotion_detection": settings.enable_emotion_detection,
            "memory_context": settings.enable_memory_context,
            "cache_enabled": settings.cache_enabled
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level="info"
    )
