"""
Main Voice Service
TTS synthesis with caching and cost optimization
"""
import time
import base64
import logging
from typing import Optional
from .models import (
    SynthesizeRequest,
    SynthesizeResponse,
    SynthesisMethod,
    VoiceInfo,
    VoiceProvider,
    Language
)
from .tts_engine import TTSEngine
from .cache import voice_cache
from .cost_tracker import cost_manager
from .config import settings

logger = logging.getLogger(__name__)


class VoiceService:
    """
    Main voice synthesis service

    Implements cost-optimized synthesis with caching:
    1. Check cache first (instant, $0)
    2. Check daily budget
    3. Synthesize with TTS engine (OpenAI)
    4. Cache result for 7 days
    5. Track costs
    """

    def __init__(self):
        """Initialize service with TTS engine"""
        self.tts_engine: Optional[TTSEngine] = None

        # Initialize TTS engine if enabled
        if settings.tts_enabled and settings.openai_api_key:
            try:
                self.tts_engine = TTSEngine()
                logger.info("TTS engine initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize TTS engine: {e}")
                logger.warning("Voice service will run in cache-only mode")

    async def synthesize(self, request: SynthesizeRequest) -> SynthesizeResponse:
        """
        Synthesize speech from text

        Flow:
        1. Check cache for existing audio
        2. If miss and budget allows, synthesize with TTS
        3. Cache result
        4. Track costs
        5. Return audio as base64 data URL

        Args:
            request: Synthesis request

        Returns:
            SynthesizeResponse with audio data URL

        Raises:
            Exception: If synthesis fails and no cache available
        """
        start_time = time.time()

        try:
            # 1. Check cache first (unless force_synthesis)
            if not request.force_synthesis:
                cached = voice_cache.get(request)
                if cached:
                    audio_bytes, cost, metadata = cached
                    latency_ms = (time.time() - start_time) * 1000

                    logger.info(f"Cache hit: {len(audio_bytes)} bytes")

                    # Record cache hit
                    cost_manager.record_request(
                        SynthesisMethod.CACHED,
                        cost,
                        latency_ms,
                        len(request.text)
                    )

                    # Convert to data URL
                    audio_url = self._create_data_url(
                        audio_bytes,
                        request.format.value
                    )

                    return SynthesizeResponse(
                        audio_url=audio_url,
                        text=request.text,
                        persona=request.persona,
                        language=request.language,
                        voice=metadata.get("voice", "unknown"),
                        format=request.format,
                        method=SynthesisMethod.CACHED,
                        cost=cost,
                        cache_hit=True,
                        latency_ms=latency_ms,
                        audio_duration_seconds=metadata.get("duration"),
                        character_count=len(request.text)
                    )

            # 2. Cache miss - check if TTS engine available
            if not self.tts_engine:
                raise Exception("TTS engine not available and no cache hit")

            # 3. Check daily budget
            can_use, reason = cost_manager.can_use_tts()
            if not can_use:
                logger.warning(f"Budget exceeded: {reason}")
                raise Exception(f"Daily budget exceeded: {reason}")

            # 4. Synthesize with TTS engine
            response = await self._synthesize_with_tts(request, start_time)

            # 5. Cache the result
            if settings.cache_enabled and not request.force_synthesis:
                # Extract audio bytes from data URL
                audio_bytes = base64.b64decode(
                    response.audio_url.split(',')[1]
                )
                metadata = {
                    "voice": response.voice,
                    "duration": response.audio_duration_seconds
                }
                voice_cache.set(request, audio_bytes, response.cost, metadata)

            # 6. Record cost
            cost_manager.record_request(
                response.method,
                response.cost,
                response.latency_ms,
                response.character_count
            )

            logger.info(
                f"Synthesis complete: method={response.method.value}, "
                f"cost=${response.cost:.4f}, latency={response.latency_ms:.1f}ms"
            )

            return response

        except Exception as e:
            logger.error(f"Error in voice synthesis: {e}", exc_info=True)
            raise

    async def _synthesize_with_tts(
        self,
        request: SynthesizeRequest,
        start_time: float
    ) -> SynthesizeResponse:
        """
        Synthesize with TTS engine

        Args:
            request: Synthesis request
            start_time: Start timestamp for latency calculation

        Returns:
            SynthesizeResponse with synthesized audio
        """
        # Call TTS engine
        tts_result = await self.tts_engine.synthesize(request)

        # Calculate total latency
        total_latency_ms = (time.time() - start_time) * 1000

        # Get the voice that was actually used
        voice = self.tts_engine._select_voice(request)

        # Convert audio bytes to data URL
        audio_url = self._create_data_url(
            tts_result.audio_bytes,
            request.format.value
        )

        return SynthesizeResponse(
            audio_url=audio_url,
            text=request.text,
            persona=request.persona,
            language=request.language,
            voice=voice,
            format=request.format,
            method=SynthesisMethod.TTS,
            cost=tts_result.cost,
            cache_hit=False,
            latency_ms=total_latency_ms,
            audio_duration_seconds=tts_result.audio_duration_seconds,
            character_count=tts_result.character_count
        )

    def _create_data_url(self, audio_bytes: bytes, format: str) -> str:
        """
        Create data URL from audio bytes

        Args:
            audio_bytes: Raw audio data
            format: Audio format (mp3, opus, etc.)

        Returns:
            Data URL string (data:audio/{format};base64,...)
        """
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        return f"data:audio/{format};base64,{audio_base64}"

    def get_available_voices(self) -> list[VoiceInfo]:
        """
        Get list of available voices

        Returns:
            List of VoiceInfo objects
        """
        if not self.tts_engine:
            return []

        voices_data = self.tts_engine.get_available_voices()

        voices = []
        for voice_id, info in voices_data.items():
            voices.append(VoiceInfo(
                voice_id=voice_id,
                provider=VoiceProvider.OPENAI,
                name=info["name"],
                gender=info["gender"],
                languages=[Language(lang) for lang in info["languages"]],
                persona=self._get_persona_for_voice(voice_id),
                description=info["description"]
            ))

        return voices

    def _get_persona_for_voice(self, voice_id: str) -> str:
        """
        Get recommended persona for a voice

        Args:
            voice_id: Voice ID

        Returns:
            Persona string
        """
        voice_to_persona = {
            "nova": "cheerful",
            "onyx": "cool",
            "shimmer": "cute",
            "alloy": "cheerful",
            "echo": "cool",
            "fable": "cheerful"
        }
        return voice_to_persona.get(voice_id, "cheerful")

    async def health_check(self) -> dict:
        """
        Check service health

        Returns:
            Health status dictionary
        """
        # Check TTS engine status
        tts_status = "disabled"
        if self.tts_engine:
            try:
                is_healthy = await self.tts_engine.health_check()
                tts_status = "ok" if is_healthy else "error"
            except Exception as e:
                tts_status = f"error: {str(e)}"

        return {
            "service": settings.service_name,
            "version": settings.service_version,
            "tts_enabled": settings.tts_enabled,
            "cache_enabled": settings.cache_enabled,
            "provider_status": {
                "openai": tts_status
            },
            "cache_stats": voice_cache.get_stats(),
            "cost_stats": cost_manager.get_budget_status()
        }


# Global service instance
voice_service = VoiceService()
