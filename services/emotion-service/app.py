"""
AGL Emotion Service - Enhanced with ML
FastAPI application with hybrid emotion detection
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from src.config import settings
from src.models import EmotionRequest, EmotionResponse, HealthResponse
from src.emotion_service import EmotionService
from src.cache import emotion_cache
from src.cost_tracker import cost_manager

# Load environment variables
load_dotenv(dotenv_path="../../.env")

# Create FastAPI app
app = FastAPI(
    title="AGL Emotion Service",
    description="Hybrid rule-based + ML emotion detection for game events",
    version=settings.service_version
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize emotion service
emotion_service = EmotionService()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "status": "ok"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    health_data = await emotion_service.health_check()
    return HealthResponse(**health_data)


@app.post("/analyze", response_model=EmotionResponse)
async def analyze_emotion(request: EmotionRequest):
    """
    Analyze emotion from game event using hybrid detection

    The service uses a hybrid approach:
    1. Rule-based analysis (fast, free)
    2. ML analysis when rule confidence < 0.8 (accurate, has cost)
    3. Automatic caching and budget management

    Returns emotion, intensity, action, confidence, and detection method used.
    """
    response = await emotion_service.analyze_emotion(request)
    return response


@app.get("/stats")
async def get_stats():
    """Get service statistics"""
    cache_stats = emotion_cache.get_stats()
    cost_stats = cost_manager.get_budget_status()

    return {
        "cache": cache_stats,
        "cost": cost_stats,
        "ml_enabled": settings.ml_enabled
    }


@app.post("/cache/clear")
async def clear_cache():
    """Clear emotion cache"""
    emotion_cache.clear()
    return {
        "status": "ok",
        "message": "Cache cleared successfully"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("EMOTION_SERVICE_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
