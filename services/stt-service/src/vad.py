"""
Voice Activity Detection (VAD) for audio preprocessing

Uses WebRTC VAD to detect speech segments and filter out silence.
This significantly reduces Whisper API costs by only sending speech segments.
"""
import io
import wave
from typing import Tuple, Optional
from pydub import AudioSegment
from .config import settings


class VADProcessor:
    """
    Voice Activity Detection processor

    Filters silence from audio to reduce STT API costs.
    Uses energy-based detection as a simple, fast alternative to WebRTC VAD.
    """

    def __init__(self, aggressiveness: int = 2):
        """
        Initialize VAD processor

        Args:
            aggressiveness: VAD aggressiveness (0-3)
                0 = Least aggressive (more false positives)
                3 = Most aggressive (more false negatives)
        """
        self.aggressiveness = aggressiveness
        self.enabled = settings.vad_enabled

    def process_audio(self, audio_data: bytes, audio_format: str = "mp3") -> Tuple[bytes, float, float]:
        """
        Process audio with VAD to remove silence

        Args:
            audio_data: Raw audio bytes
            audio_format: Audio format (mp3, wav, etc.)

        Returns:
            Tuple of (processed_audio_bytes, original_duration, filtered_duration)
        """
        if not self.enabled:
            # VAD disabled, return original
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format=audio_format)
            duration = len(audio) / 1000.0  # ms to seconds
            return audio_data, duration, duration

        try:
            # Load audio
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format=audio_format)
            original_duration = len(audio) / 1000.0  # ms to seconds

            # Convert to mono 16kHz for consistent processing
            audio = audio.set_channels(1).set_frame_rate(16000)

            # Simple energy-based VAD
            # Split into chunks and keep chunks above threshold
            chunk_length_ms = 30  # 30ms chunks
            chunks = self._split_audio(audio, chunk_length_ms)

            # Calculate energy threshold based on aggressiveness
            # Higher aggressiveness = higher threshold = more silence removed
            energy_threshold = self._calculate_threshold(audio, self.aggressiveness)

            # Filter chunks below threshold
            filtered_chunks = [
                chunk for chunk in chunks
                if self._get_energy(chunk) > energy_threshold
            ]

            if not filtered_chunks:
                # All audio was silence, return original
                return audio_data, original_duration, original_duration

            # Combine filtered chunks
            filtered_audio = filtered_chunks[0]
            for chunk in filtered_chunks[1:]:
                filtered_audio += chunk

            filtered_duration = len(filtered_audio) / 1000.0

            # Export back to original format
            output = io.BytesIO()
            filtered_audio.export(output, format=audio_format)
            filtered_data = output.getvalue()

            return filtered_data, original_duration, filtered_duration

        except Exception as e:
            print(f"VAD processing error: {e}, returning original audio")
            audio = AudioSegment.from_file(io.BytesIO(audio_data), format=audio_format)
            duration = len(audio) / 1000.0
            return audio_data, duration, duration

    def _split_audio(self, audio: AudioSegment, chunk_length_ms: int) -> list[AudioSegment]:
        """Split audio into chunks"""
        chunks = []
        for i in range(0, len(audio), chunk_length_ms):
            chunks.append(audio[i:i + chunk_length_ms])
        return chunks

    def _get_energy(self, chunk: AudioSegment) -> float:
        """Calculate energy of audio chunk"""
        return chunk.dBFS if chunk.dBFS != float('-inf') else -100

    def _calculate_threshold(self, audio: AudioSegment, aggressiveness: int) -> float:
        """
        Calculate energy threshold based on aggressiveness

        Args:
            audio: Audio segment
            aggressiveness: 0-3 (0=least, 3=most aggressive)

        Returns:
            Energy threshold in dBFS
        """
        # Get overall audio energy
        mean_energy = audio.dBFS

        # Adjust threshold based on aggressiveness
        # More aggressive = higher threshold = more silence removed
        threshold_offsets = {
            0: -20,  # Keep more (threshold 20dB below mean)
            1: -15,  #
            2: -10,  # Default
            3: -5    # Remove more (threshold only 5dB below mean)
        }

        offset = threshold_offsets.get(aggressiveness, -10)
        return mean_energy + offset

    def get_stats(self) -> dict:
        """Get VAD statistics"""
        return {
            "enabled": self.enabled,
            "aggressiveness": self.aggressiveness,
            "description": "Energy-based Voice Activity Detection"
        }


# Global VAD processor instance
vad_processor = VADProcessor(aggressiveness=settings.vad_aggressiveness)
