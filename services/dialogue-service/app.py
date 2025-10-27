"""
FastAPI Application for Dialogue Service
Enhanced with LLM generation and memory integration
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from src.config import settings
from src.models import (
    DialogueRequest,
    DialogueResponse,
    HealthResponse
)
from src.dialogue_service import dialogue_service
from src.cache import dialogue_cache
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
    logger.info(f"LLM enabled: {settings.llm_enabled}")
    logger.info(f"Cache enabled: {settings.cache_enabled}")
    logger.info(f"Memory Service: {settings.memory_service_url}")

    yield

    logger.info(f"Shutting down {settings.service_name}")


# Create FastAPI app
app = FastAPI(
    title="AGL Dialogue Service",
    description="Hybrid dialogue generation with templates and LLM (90/10 strategy)",
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
        "llm_enabled": settings.llm_enabled,
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check endpoint

    Returns service health status and statistics
    """
    try:
        health_data = await dialogue_service.health_check()

        return HealthResponse(
            status="ok",
            service=settings.service_name,
            version=settings.service_version,
            llm_enabled=settings.llm_enabled,
            cache_enabled=settings.cache_enabled,
            memory_service_available=health_data["memory_service_available"]
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )


@app.post("/generate", response_model=DialogueResponse)
async def generate_dialogue(request: DialogueRequest):
    """
    Generate dialogue for game event

    Hybrid strategy:
    - 90% template-based (fast, free)
    - 10% LLM-based for special cases (smart, contextual)

    Special cases:
    - Legendary/Mythic events
    - First-time achievements
    - Milestone numbers (100, 500, 1000, etc.)
    - High win/loss streaks (5+)
    - High importance memories
    - Complex contextual factors

    Example:
        ```json
        {
            "event_type": "player.victory",
            "emotion": "amazed",
            "persona": "cheerful",
            "player_id": "player-123",
            "context": {
                "rarity": "legendary",
                "win_streak": 10,
                "is_first_time": true
            }
        }
        ```
    """
    try:
        response = await dialogue_service.generate_dialogue(request)
        return response
    except Exception as e:
        logger.error(f"Dialogue generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dialogue: {str(e)}"
        )


@app.get("/stats")
async def get_stats():
    """
    Get service statistics

    Returns:
    - Cache statistics (hit rate, size)
    - Cost tracking (daily spend, request counts)
    - Budget status
    """
    try:
        health_data = await dialogue_service.health_check()

        return {
            "cache": health_data["cache_stats"],
            "cost": health_data["cost_stats"],
            "llm_enabled": settings.llm_enabled,
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
    Clear dialogue cache

    Useful for testing or after template updates
    """
    try:
        dialogue_cache.clear()
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


@app.get("/templates/count")
async def get_template_count():
    """Get count of available templates"""
    from src.templates import get_dialogue_templates, get_emotion_fallbacks

    templates = get_dialogue_templates()
    fallbacks = get_emotion_fallbacks()

    return {
        "total_templates": len(templates),
        "emotion_fallbacks": len(fallbacks),
        "total_combinations": len(templates) + len(fallbacks)
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
