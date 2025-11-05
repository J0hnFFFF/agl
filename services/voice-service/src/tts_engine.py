"""
TTS Engine - OpenAI Text-to-Speech integration
"""
import logging
from typing import Dict
from openai import OpenAI, AsyncOpenAI
from .models import (
    SynthesizeRequest,
    TTSResult,
    AudioFormat,
    Persona,
    Language,
    VoiceGender
)
from .config import settings

logger = logging.getLogger(__name__)


class TTSEngine:
    """
    OpenAI Text-to-Speech engine

    Features:
    - Multiple voices (alloy, echo, fable, onyx, nova, shimmer)
    - Variable speech speed (0.25-4.0)
    - Multiple audio formats (mp3, opus, aac, flac)
    - Persona-based voice selection

    Pricing:
    - tts-1: $0.015 per 1K characters
    - tts-1-hd: $0.030 per 1K characters
    """

    # Voice mappings: persona -> (language -> voice)
    PERSONA_VOICE_MAP: Dict[str, Dict[str, str]] = {
        "cheerful": {
            "zh-CN": "nova",    # Warm, energetic female
            "en-US": "nova",
            "ja-JP": "nova",
            "ko-KR": "nova"
        },
        "cool": {
            "zh-CN": "onyx",    # Deep, authoritative male
            "en-US": "onyx",
            "ja-JP": "onyx",
            "ko-KR": "onyx"
        },
        "cute": {
            "zh-CN": "shimmer", # Light, friendly female
            "en-US": "shimmer",
            "ja-JP": "shimmer",
            "ko-KR": "shimmer"
        }
    }

    # Cost per 1K characters
    COST_PER_1K_CHARS = {
        "tts-1": 0.015,
        "tts-1-hd": 0.030
    }

    def __init__(self):
        """Initialize OpenAI TTS client"""
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY not configured")

        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.tts_model  # tts-1 or tts-1-hd

    def _select_voice(self, request: SynthesizeRequest) -> str:
        """
        Select appropriate voice based on persona and language

        Args:
            request: Synthesis request

        Returns:
            Voice ID (alloy/echo/fable/onyx/nova/shimmer)
        """
        # Use explicit voice if provided
        if request.voice:
            return request.voice

        # Select based on persona and language
        persona_key = request.persona.value
        language_key = request.language.value

        voice = self.PERSONA_VOICE_MAP.get(persona_key, {}).get(
            language_key,
            "alloy"  # Default fallback
        )

        logger.debug(f"Selected voice: {voice} for persona={persona_key}, language={language_key}")
        return voice

    def _calculate_cost(self, character_count: int) -> float:
        """
        Calculate TTS cost based on character count

        Args:
            character_count: Number of characters

        Returns:
            Cost in USD
        """
        cost_per_char = self.COST_PER_1K_CHARS[self.model] / 1000
        return character_count * cost_per_char

    async def synthesize(self, request: SynthesizeRequest) -> TTSResult:
        """
        Synthesize speech from text using OpenAI TTS

        Args:
            request: Synthesis request

        Returns:
            TTSResult with audio bytes, cost, metadata

        Raises:
            Exception: If synthesis fails
        """
        voice = self._select_voice(request)
        speed = request.speed if request.speed else settings.tts_speed

        logger.info(
            f"Synthesizing: text_len={len(request.text)}, "
            f"voice={voice}, speed={speed}, format={request.format.value}"
        )

        try:
            # Call OpenAI TTS API
            response = await self.client.audio.speech.create(
                model=self.model,
                voice=voice,
                input=request.text,
                speed=speed,
                response_format=request.format.value
            )

            # Get audio bytes
            audio_bytes = response.content

            # Calculate cost
            character_count = len(request.text)
            cost = self._calculate_cost(character_count)

            # Estimate duration (rough approximation: ~200 chars per minute)
            estimated_duration = character_count / 200 * 60 / speed

            logger.info(
                f"Synthesis successful: {len(audio_bytes)} bytes, "
                f"cost=${cost:.4f}, duration~{estimated_duration:.1f}s"
            )

            return TTSResult(
                audio_bytes=audio_bytes,
                format=request.format,
                cost=cost,
                character_count=character_count,
                audio_duration_seconds=estimated_duration
            )

        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}", exc_info=True)
            raise Exception(f"Failed to synthesize speech: {str(e)}")

    def get_available_voices(self) -> Dict:
        """
        Get list of available voices with metadata

        Returns:
            Dictionary mapping voice IDs to metadata
        """
        return {
            "alloy": {
                "name": "Alloy",
                "gender": VoiceGender.NEUTRAL,
                "description": "Balanced, neutral voice",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"]
            },
            "echo": {
                "name": "Echo",
                "gender": VoiceGender.MALE,
                "description": "Clear, male voice",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"]
            },
            "fable": {
                "name": "Fable",
                "gender": VoiceGender.MALE,
                "description": "Expressive, storytelling voice",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"]
            },
            "onyx": {
                "name": "Onyx",
                "gender": VoiceGender.MALE,
                "description": "Deep, authoritative voice (Cool persona)",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"]
            },
            "nova": {
                "name": "Nova",
                "gender": VoiceGender.FEMALE,
                "description": "Warm, energetic voice (Cheerful persona)",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"]
            },
            "shimmer": {
                "name": "Shimmer",
                "gender": VoiceGender.FEMALE,
                "description": "Light, friendly voice (Cute persona)",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"]
            }
        }

    async def health_check(self) -> bool:
        """
        Check if TTS engine is healthy

        Returns:
            True if healthy, False otherwise
        """
        try:
            # Simple test: check if API key is valid by attempting a minimal synthesis
            # (In production, you might want to cache this check)
            return True  # For now, assume healthy if initialized
        except Exception as e:
            logger.error(f"TTS engine health check failed: {e}")
            return False
