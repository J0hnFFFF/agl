"""
HTTP clients for calling STT, Dialogue, and TTS services
"""
import httpx
import asyncio
from typing import Optional, Tuple, Dict, Any
from .config import settings
from .models import ProcessingStage, StageResult


class ServiceClients:
    """
    Manages HTTP clients for all dependent services

    Features:
    - Async HTTP calls
    - Retry mechanism
    - Timeout handling
    - Error tracking
    """

    def __init__(self):
        """Initialize service clients"""
        self.stt_url = settings.stt_service_url
        self.dialogue_url = settings.dialogue_service_url
        self.tts_url = settings.tts_service_url

    async def call_stt_service(
        self,
        audio_data: str,
        audio_format: str = "mp3",
        language: Optional[str] = None,
        enable_vad: bool = True
    ) -> StageResult:
        """
        Call STT Service to transcribe speech

        Args:
            audio_data: Base64-encoded audio
            audio_format: Audio format
            language: Optional language code
            enable_vad: Enable Voice Activity Detection

        Returns:
            StageResult with transcription data
        """
        import time
        start_time = time.time()

        request_data = {
            "audio_data": audio_data,
            "format": audio_format,
            "language": language,
            "enable_vad": enable_vad
        }

        try:
            async with httpx.AsyncClient(timeout=settings.stt_timeout) as client:
                response = await self._retry_request(
                    client.post,
                    f"{self.stt_url}/transcribe",
                    json=request_data
                )

                if response.status_code == 200:
                    data = response.json()
                    latency_ms = (time.time() - start_time) * 1000

                    return StageResult(
                        stage=ProcessingStage.STT,
                        success=True,
                        data=data,
                        latency_ms=latency_ms,
                        cost=data.get("cost", 0.0),
                        cached=data.get("cache_hit", False)
                    )
                else:
                    return StageResult(
                        stage=ProcessingStage.STT,
                        success=False,
                        error=f"STT API error: {response.status_code} - {response.text}",
                        latency_ms=(time.time() - start_time) * 1000,
                        cost=0.0
                    )

        except Exception as e:
            return StageResult(
                stage=ProcessingStage.STT,
                success=False,
                error=f"STT service error: {str(e)}",
                latency_ms=(time.time() - start_time) * 1000,
                cost=0.0
            )

    async def call_dialogue_service(
        self,
        text: Optional[str] = None,
        emotion: Optional[str] = None,
        persona: Optional[str] = None,
        language: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> StageResult:
        """
        Call Dialogue Service to generate response

        Args:
            text: User input text (optional)
            emotion: Detected emotion (optional)
            persona: Character persona
            language: Language code
            context: Additional context

        Returns:
            StageResult with dialogue data
        """
        import time
        start_time = time.time()

        # Build request
        request_data = {
            "persona": persona or settings.default_persona,
            "language": language or settings.default_language,
        }

        # Add emotion if detected or use default
        if emotion:
            request_data["emotion"] = emotion
        elif settings.enable_emotion_detection and context:
            # If emotion detection is enabled and we have context, try to detect
            # For now, use default
            request_data["emotion"] = settings.default_emotion
        else:
            request_data["emotion"] = settings.default_emotion

        # Add context
        if context:
            request_data["context"] = context

        # Add user input text if available
        if text:
            if "context" not in request_data:
                request_data["context"] = {}
            request_data["context"]["user_input"] = text

        try:
            async with httpx.AsyncClient(timeout=settings.dialogue_timeout) as client:
                response = await self._retry_request(
                    client.post,
                    f"{self.dialogue_url}/generate",
                    json=request_data
                )

                if response.status_code == 200:
                    data = response.json()
                    latency_ms = (time.time() - start_time) * 1000

                    return StageResult(
                        stage=ProcessingStage.DIALOGUE,
                        success=True,
                        data=data,
                        latency_ms=latency_ms,
                        cost=data.get("cost", 0.0),
                        cached=data.get("cached", False)
                    )
                else:
                    return StageResult(
                        stage=ProcessingStage.DIALOGUE,
                        success=False,
                        error=f"Dialogue API error: {response.status_code} - {response.text}",
                        latency_ms=(time.time() - start_time) * 1000,
                        cost=0.0
                    )

        except Exception as e:
            return StageResult(
                stage=ProcessingStage.DIALOGUE,
                success=False,
                error=f"Dialogue service error: {str(e)}",
                latency_ms=(time.time() - start_time) * 1000,
                cost=0.0
            )

    async def call_tts_service(
        self,
        text: str,
        persona: Optional[str] = None,
        language: Optional[str] = None,
        output_format: str = "mp3"
    ) -> StageResult:
        """
        Call TTS Service to synthesize speech

        Args:
            text: Text to synthesize
            persona: Character persona (maps to voice)
            language: Language code
            output_format: Output audio format

        Returns:
            StageResult with audio data
        """
        import time
        start_time = time.time()

        request_data = {
            "text": text,
            "persona": persona or settings.default_persona,
            "language": language or settings.default_language,
            "format": output_format
        }

        try:
            async with httpx.AsyncClient(timeout=settings.tts_timeout) as client:
                response = await self._retry_request(
                    client.post,
                    f"{self.tts_url}/synthesize",
                    json=request_data
                )

                if response.status_code == 200:
                    data = response.json()
                    latency_ms = (time.time() - start_time) * 1000

                    return StageResult(
                        stage=ProcessingStage.TTS,
                        success=True,
                        data=data,
                        latency_ms=latency_ms,
                        cost=data.get("cost_usd", 0.0),
                        cached=data.get("cached", False)
                    )
                else:
                    return StageResult(
                        stage=ProcessingStage.TTS,
                        success=False,
                        error=f"TTS API error: {response.status_code} - {response.text}",
                        latency_ms=(time.time() - start_time) * 1000,
                        cost=0.0
                    )

        except Exception as e:
            return StageResult(
                stage=ProcessingStage.TTS,
                success=False,
                error=f"TTS service error: {str(e)}",
                latency_ms=(time.time() - start_time) * 1000,
                cost=0.0
            )

    async def _retry_request(self, request_func, *args, **kwargs):
        """
        Retry mechanism for HTTP requests

        Args:
            request_func: HTTP request function (client.post, client.get, etc.)
            *args, **kwargs: Arguments for request function

        Returns:
            HTTP response

        Raises:
            Exception: If all retries fail
        """
        last_error = None

        for attempt in range(settings.max_retries + 1):
            try:
                response = await request_func(*args, **kwargs)
                return response

            except Exception as e:
                last_error = e
                if attempt < settings.max_retries:
                    await asyncio.sleep(settings.retry_delay * (attempt + 1))
                    continue
                else:
                    raise

        # Should not reach here, but just in case
        raise last_error if last_error else Exception("All retries failed")

    async def check_service_health(self, service_url: str, service_name: str) -> Tuple[bool, str]:
        """
        Check health of a service

        Args:
            service_url: Base URL of service
            service_name: Name of service

        Returns:
            Tuple of (is_healthy, status_message)
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{service_url}/health")
                if response.status_code == 200:
                    return True, "ok"
                else:
                    return False, f"unhealthy (status {response.status_code})"
        except Exception as e:
            return False, f"unreachable ({str(e)})"

    async def check_all_services_health(self) -> Dict[str, str]:
        """
        Check health of all dependent services

        Returns:
            Dictionary of service_name -> status
        """
        stt_healthy, stt_status = await self.check_service_health(self.stt_url, "stt-service")
        dialogue_healthy, dialogue_status = await self.check_service_health(self.dialogue_url, "dialogue-service")
        tts_healthy, tts_status = await self.check_service_health(self.tts_url, "tts-service")

        return {
            "stt-service": stt_status,
            "dialogue-service": dialogue_status,
            "tts-service": tts_status
        }


# Global service clients instance
service_clients = ServiceClients()
