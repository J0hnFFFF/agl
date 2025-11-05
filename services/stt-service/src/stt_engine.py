"""
Core STT Engine using OpenAI Whisper API
"""
import io
import base64
import time
from typing import Optional
from openai import OpenAI
from pydub import AudioSegment
from .config import settings
from .models import TranscribeRequest, TranscribeResponse, RecognitionMethod
from .cache import stt_cache
from .cost_tracker import cost_manager
from .vad import vad_processor


class STTEngine:
    """
    Speech-to-Text engine using OpenAI Whisper API

    Features:
    - Multi-language support (zh-CN, en-US, ja-JP, ko-KR)
    - Voice Activity Detection (VAD) for cost optimization
    - Result caching (7-day TTL)
    - Daily budget enforcement
    - Performance monitoring
    """

    def __init__(self):
        """Initialize STT engine"""
        self.client = None
        if settings.stt_enabled and settings.openai_api_key:
            self.client = OpenAI(api_key=settings.openai_api_key)

    async def transcribe(self, request: TranscribeRequest) -> TranscribeResponse:
        """
        Transcribe audio to text

        Process flow:
        1. Check cache
        2. Apply VAD (if enabled)
        3. Check budget
        4. Call Whisper API
        5. Cache result
        6. Record cost

        Args:
            request: Transcription request

        Returns:
            Transcription response

        Raises:
            Exception: If transcription fails
        """
        start_time = time.time()

        # Decode audio data
        audio_bytes = base64.b64decode(request.audio_data)
        audio_size = len(audio_bytes)

        # Check size limit
        max_size = settings.max_audio_size_mb * 1024 * 1024
        if audio_size > max_size:
            raise ValueError(f"Audio size {audio_size} bytes exceeds limit {max_size} bytes")

        # Check cache
        cached_result = stt_cache.get(audio_bytes, request.language)
        if cached_result:
            latency_ms = (time.time() - start_time) * 1000

            # Record cached request
            cost_manager.record_request(
                RecognitionMethod.CACHED,
                0.0,  # No cost for cache hit
                latency_ms,
                cached_result['duration_seconds']
            )

            return TranscribeResponse(
                text=cached_result['text'],
                language=cached_result.get('language'),
                confidence=cached_result.get('confidence'),
                duration_seconds=cached_result['duration_seconds'],
                method=RecognitionMethod.CACHED,
                cost=0.0,
                cache_hit=True,
                latency_ms=latency_ms,
                audio_size_bytes=audio_size,
                vad_applied=False
            )

        # Apply VAD if enabled
        vad_applied = False
        original_duration = 0
        if request.enable_vad and settings.vad_enabled:
            audio_bytes, original_duration, filtered_duration = vad_processor.process_audio(
                audio_bytes,
                request.format.value
            )
            vad_applied = filtered_duration < original_duration

            # Update audio size after VAD
            audio_size = len(audio_bytes)
        else:
            # Get duration without VAD
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes), format=request.format.value)
            original_duration = len(audio) / 1000.0
            filtered_duration = original_duration

        # Calculate cost
        estimated_cost = cost_manager.calculate_cost(filtered_duration)

        # Check budget
        can_use, reason = cost_manager.can_use_stt(estimated_cost)
        if not can_use:
            raise Exception(f"Budget check failed: {reason}")

        # Call Whisper API
        if not self.client:
            raise Exception("OpenAI client not initialized (check API key)")

        try:
            # Prepare audio file
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = f"audio.{request.format.value}"

            # Call Whisper API
            transcription = self.client.audio.transcriptions.create(
                model=settings.whisper_model,
                file=audio_file,
                language=self._map_language_code(request.language) if request.language else None,
                response_format="verbose_json"
            )

            # Extract result
            text = transcription.text
            detected_language = transcription.language if hasattr(transcription, 'language') else request.language

            # Calculate actual cost
            actual_cost = cost_manager.calculate_cost(filtered_duration)

            latency_ms = (time.time() - start_time) * 1000

            # Cache result
            cache_data = {
                'text': text,
                'language': detected_language,
                'duration_seconds': filtered_duration
            }
            stt_cache.set(audio_bytes, cache_data, request.language)

            # Record request
            cost_manager.record_request(
                RecognitionMethod.STT,
                actual_cost,
                latency_ms,
                filtered_duration
            )

            return TranscribeResponse(
                text=text,
                language=detected_language,
                confidence=None,  # Whisper API doesn't provide confidence in verbose_json
                duration_seconds=filtered_duration,
                method=RecognitionMethod.STT,
                cost=actual_cost,
                cache_hit=False,
                latency_ms=latency_ms,
                audio_size_bytes=audio_size,
                vad_applied=vad_applied
            )

        except Exception as e:
            raise Exception(f"Whisper API error: {str(e)}")

    def _map_language_code(self, language: Optional[str]) -> Optional[str]:
        """
        Map language code to Whisper API format

        Whisper expects: zh, en, ja, ko (no region code)

        Args:
            language: Language code (e.g., zh-CN, en-US)

        Returns:
            Mapped language code (e.g., zh, en)
        """
        if not language:
            return None

        # Map to base language code
        language_map = {
            "zh-CN": "zh",
            "zh-TW": "zh",
            "en-US": "en",
            "en-GB": "en",
            "ja-JP": "ja",
            "ko-KR": "ko"
        }

        return language_map.get(language, language.split("-")[0])

    def get_supported_languages(self) -> list[dict]:
        """
        Get list of supported languages

        Returns:
            List of language info dicts
        """
        languages = [
            {"code": "zh-CN", "name": "Chinese (Simplified)", "supported": True},
            {"code": "en-US", "name": "English (US)", "supported": True},
            {"code": "ja-JP", "name": "Japanese", "supported": True},
            {"code": "ko-KR", "name": "Korean", "supported": True},
        ]
        return languages

    async def health_check(self) -> dict:
        """
        Check STT engine health

        Returns:
            Health status dict
        """
        provider_status = "ok" if self.client else "not_initialized"

        return {
            "service": settings.service_name,
            "version": settings.service_version,
            "stt_enabled": settings.stt_enabled,
            "cache_enabled": settings.cache_enabled,
            "vad_enabled": settings.vad_enabled,
            "provider_status": provider_status,
            "cache_stats": stt_cache.get_stats(),
            "cost_stats": cost_manager.get_budget_status(),
            "vad_stats": vad_processor.get_stats()
        }


# Global STT engine instance
stt_engine = STTEngine()
