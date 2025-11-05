"""
FastAPI Application for Vision Service (Optional Backend Proxy)
Provides API key security, caching, and cost optimization for Vision SDK
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

from src.config import settings
from src.models import (
    AnalyzeRequest,
    AnalyzeResponse,
    GameStateRequest,
    GameStateResponse,
    HealthResponse
)

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
    logger.info(f"Vision enabled: {settings.vision_enabled}")
    logger.info(f"Default provider: {settings.default_provider}")
    logger.info(f"Cache enabled: {settings.cache_enabled}")
    logger.info(f"Daily budget: ${settings.daily_vision_budget}")

    yield

    logger.info(f"Shutting down {settings.service_name}")


# Create FastAPI app
app = FastAPI(
    title="AGL Vision Service",
    description="Optional backend proxy for Vision SDK - API key security, caching, cost optimization",
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
        "vision_enabled": settings.vision_enabled,
        "description": "Optional backend proxy for Vision SDK",
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check endpoint

    Returns service health status including:
    - Provider availability (OpenAI, Anthropic)
    - Cache statistics
    - Cost tracking stats
    """
    provider_status = {}

    # Check OpenAI
    if settings.openai_api_key:
        provider_status["openai"] = "ok"
    else:
        provider_status["openai"] = "not_configured"

    # Check Anthropic
    if settings.anthropic_api_key:
        provider_status["anthropic"] = "ok"
    else:
        provider_status["anthropic"] = "not_configured"

    return HealthResponse(
        status="ok",
        service=settings.service_name,
        version=settings.service_version,
        vision_enabled=settings.vision_enabled,
        cache_enabled=settings.cache_enabled,
        provider_status=provider_status,
        cache_stats={
            "hits": 0,
            "misses": 0,
            "hit_rate": "0.0%",
            "enabled": settings.cache_enabled
        },
        cost_stats={
            "daily_budget": f"${settings.daily_vision_budget:.2f}",
            "daily_cost": "$0.00",
            "remaining": f"${settings.daily_vision_budget:.2f}",
            "total_requests": 0
        }
    )


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_screenshot(request: AnalyzeRequest):
    """
    Analyze game screenshot with Vision AI

    This endpoint acts as a secure proxy between Vision SDK and LLM APIs.
    It provides:
    - **API Key Security**: Keys never exposed to client
    - **Intelligent Caching**: 24h cache, same screenshot = instant response
    - **Cost Control**: Daily budget limits, cost tracking
    - **Multi-Provider**: OpenAI GPT-4V or Anthropic Claude Vision

    **Cost Estimates**:
    - OpenAI GPT-4V: ~$0.01-0.02 per image
    - Anthropic Claude: ~$0.015-0.03 per image
    - Cached response: $0 (instant)

    **Example Request**:
    ```json
    {
        "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
        "prompt": "What is happening in this game scene?",
        "provider": "openai-gpt4v",
        "max_tokens": 1000
    }
    ```

    **Example Response**:
    ```json
    {
        "content": "The player is in combat with two enemies...",
        "confidence": 0.95,
        "method": "openai-gpt4v",
        "provider": "openai-gpt4v",
        "cost": 0.0123,
        "cache_hit": false,
        "latency_ms": 2456.7,
        "token_usage": {
            "prompt_tokens": 1205,
            "completion_tokens": 42,
            "total_tokens": 1247
        }
    }
    ```
    """
    # TODO: Implement vision analysis logic
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Vision analysis not yet implemented. This is a placeholder service demonstrating the architecture pattern. To implement: create vision_service.py following emotion/dialogue service patterns."
    )


@app.post("/recognize-game-state", response_model=GameStateResponse)
async def recognize_game_state(request: GameStateRequest):
    """
    Recognize game state from screenshot

    Automatically detects the current game state category:
    - combat, menu, dialogue, inventory, map, cutscene, loading,
      paused, victory, defeat, gameplay, unknown

    Uses specialized prompts optimized for game state detection.

    **Example Request**:
    ```json
    {
        "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
        "provider": "openai-gpt4v",
        "confidence_threshold": 0.8
    }
    ```

    **Example Response**:
    ```json
    {
        "category": "combat",
        "confidence": 0.92,
        "scene_description": "Player engaged in combat with multiple enemies",
        "method": "openai-gpt4v",
        "cost": 0.0098,
        "cache_hit": false,
        "latency_ms": 1987.3
    }
    ```
    """
    # TODO: Implement game state recognition logic
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Game state recognition not yet implemented. This is a placeholder service."
    )


@app.get("/stats")
async def get_stats():
    """
    Get service statistics

    Returns detailed statistics including:
    - Cache performance (hit rate, size)
    - Cost tracking (daily spend, remaining budget)
    - Provider usage breakdown
    - Request counts

    **Example Response**:
    ```json
    {
        "cache": {
            "hits": 89,
            "misses": 34,
            "hit_rate": "72.4%",
            "cache_size": 123
        },
        "cost": {
            "daily_budget": "$100.00",
            "daily_cost": "$15.67",
            "remaining": "$84.33",
            "total_requests": 123,
            "cached_requests": 89,
            "openai_requests": 20,
            "anthropic_requests": 14
        }
    }
    ```
    """
    return {
        "cache": {
            "hits": 0,
            "misses": 0,
            "hit_rate": "0.0%",
            "cache_size": 0,
            "enabled": settings.cache_enabled
        },
        "cost": {
            "daily_budget": f"${settings.daily_vision_budget:.2f}",
            "daily_cost": "$0.00",
            "remaining": f"${settings.daily_vision_budget:.2f}",
            "total_requests": 0,
            "cached_requests": 0,
            "openai_requests": 0,
            "anthropic_requests": 0
        },
        "vision_enabled": settings.vision_enabled,
        "cache_enabled": settings.cache_enabled
    }


@app.post("/cache/clear")
async def clear_cache():
    """
    Clear vision analysis cache

    Useful for:
    - Testing new prompts
    - Forcing re-analysis
    - Freeing up Redis memory
    """
    return {
        "status": "ok",
        "message": "Cache cleared successfully (not implemented - placeholder)"
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
