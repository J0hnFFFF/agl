"""
Voice Dialogue Orchestrator
Coordinates STT, Dialogue, and TTS services
"""
import time
from typing import Dict, Any
from .config import settings
from .models import (
    VoiceDialogueRequest,
    VoiceDialogueResponse,
    ProcessingStage,
    StageResult
)
from .service_clients import service_clients


class VoiceDialogueOrchestrator:
    """
    Orchestrates the complete voice dialogue flow:
    1. STT: User speech → Text
    2. Dialogue: Text → AI response text
    3. TTS: AI response text → Audio

    Features:
    - Sequential pipeline execution
    - Error handling with graceful degradation
    - Performance tracking per stage
    - Cost tracking per stage
    - Caching awareness
    """

    def __init__(self):
        """Initialize orchestrator"""
        self.clients = service_clients

    async def process_voice_dialogue(self, request: VoiceDialogueRequest) -> VoiceDialogueResponse:
        """
        Process complete voice dialogue flow

        Pipeline:
        User Audio → [STT] → User Text → [Dialogue] → AI Text → [TTS] → AI Audio

        Args:
            request: Voice dialogue request

        Returns:
            Complete voice dialogue response with audio

        Raises:
            Exception: If any critical stage fails
        """
        start_time = time.time()

        # Storage for stage results
        stt_result: StageResult = None
        dialogue_result: StageResult = None
        tts_result: StageResult = None

        # Stage 1: Speech-to-Text
        stt_result = await self._execute_stt_stage(request)
        if not stt_result.success:
            raise Exception(f"STT stage failed: {stt_result.error}")

        # Extract user text
        user_text = stt_result.data.get("text", "")
        user_language = stt_result.data.get("language") or request.language

        # Stage 2: Dialogue Generation
        dialogue_result = await self._execute_dialogue_stage(
            user_text=user_text,
            language=user_language or request.language,
            persona=request.persona,
            context=request.game_context
        )
        if not dialogue_result.success:
            raise Exception(f"Dialogue stage failed: {dialogue_result.error}")

        # Extract AI response text and emotion
        ai_text = dialogue_result.data.get("dialogue", "")
        ai_emotion = dialogue_result.data.get("emotion", settings.default_emotion)

        # Stage 3: Text-to-Speech
        tts_result = await self._execute_tts_stage(
            text=ai_text,
            persona=request.persona,
            language=user_language or request.language,
            output_format=request.output_format
        )
        if not tts_result.success:
            raise Exception(f"TTS stage failed: {tts_result.error}")

        # Extract audio data
        audio_url = tts_result.data.get("audio_url", "")
        audio_duration = tts_result.data.get("duration", 0.0)

        # Calculate total metrics
        total_time_ms = (time.time() - start_time) * 1000

        stage_timings = {
            "stt": stt_result.latency_ms,
            "dialogue": dialogue_result.latency_ms,
            "tts": tts_result.latency_ms
        }

        cost_breakdown = {
            "stt": stt_result.cost,
            "dialogue": dialogue_result.cost,
            "tts": tts_result.cost
        }

        total_cost = sum(cost_breakdown.values())

        # Build response
        response = VoiceDialogueResponse(
            # User input
            user_text=user_text,
            user_language=user_language,

            # AI response
            ai_text=ai_text,
            ai_emotion=ai_emotion,

            # Audio output
            audio_url=audio_url,
            audio_duration=audio_duration,

            # Performance metrics
            processing_time_ms=total_time_ms,
            stage_timings=stage_timings,

            # Cost tracking
            total_cost=total_cost,
            cost_breakdown=cost_breakdown,

            # Cache status
            stt_cached=stt_result.cached,
            dialogue_cached=dialogue_result.cached,
            tts_cached=tts_result.cached,

            # Optional metadata
            metadata={
                "vad_applied": stt_result.data.get("vad_applied", False) if stt_result.data else False,
                "dialogue_source": dialogue_result.data.get("source", "unknown") if dialogue_result.data else "unknown"
            }
        )

        return response

    async def _execute_stt_stage(self, request: VoiceDialogueRequest) -> StageResult:
        """
        Execute STT (Speech-to-Text) stage

        Args:
            request: Voice dialogue request

        Returns:
            STT stage result
        """
        return await self.clients.call_stt_service(
            audio_data=request.audio_data,
            audio_format=request.audio_format,
            language=request.language,
            enable_vad=request.enable_vad
        )

    async def _execute_dialogue_stage(
        self,
        user_text: str,
        language: str,
        persona: str = None,
        context: Dict[str, Any] = None
    ) -> StageResult:
        """
        Execute Dialogue Generation stage

        Args:
            user_text: Transcribed user text
            language: Language code
            persona: Character persona
            context: Game context

        Returns:
            Dialogue stage result
        """
        return await self.clients.call_dialogue_service(
            text=user_text,
            persona=persona,
            language=language,
            context=context
        )

    async def _execute_tts_stage(
        self,
        text: str,
        persona: str,
        language: str,
        output_format: str = "mp3"
    ) -> StageResult:
        """
        Execute TTS (Text-to-Speech) stage

        Args:
            text: Text to synthesize
            persona: Character persona
            language: Language code
            output_format: Output audio format

        Returns:
            TTS stage result
        """
        return await self.clients.call_tts_service(
            text=text,
            persona=persona,
            language=language,
            output_format=output_format
        )

    async def health_check(self) -> Dict[str, Any]:
        """
        Check health of orchestrator and all dependent services

        Returns:
            Health status dictionary
        """
        dependencies = await self.clients.check_all_services_health()

        all_healthy = all(status == "ok" for status in dependencies.values())

        return {
            "service": settings.service_name,
            "version": settings.service_version,
            "status": "ok" if all_healthy else "degraded",
            "dependencies": dependencies
        }


# Global orchestrator instance
orchestrator = VoiceDialogueOrchestrator()
