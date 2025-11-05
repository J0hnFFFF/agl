"""
Phoneme extraction from audio
Uses word-level timestamps from Whisper and estimates phoneme timing
"""
import io
import time
from typing import List, Tuple
from pydub import AudioSegment
import numpy as np
from openai import OpenAI
import os
from .models import PhonemeEvent
from .config import settings
import logging

logger = logging.getLogger(__name__)


class PhonemeExtractor:
    """Extract phonemes from audio with timing information"""

    # Simplified phoneme duration estimates (in seconds)
    # Based on average speech rates
    PHONEME_DURATIONS = {
        # Vowels (longer)
        'vowel': 0.08,
        # Consonants (shorter)
        'consonant': 0.06,
        # Silence
        'silence': 0.1,
    }

    # Simple English word to phoneme approximations
    # In production, use a proper phoneme dictionary like CMU Pronouncing Dictionary
    WORD_TO_PHONEMES = {
        'hello': ['HH', 'EH', 'L', 'OW'],
        'world': ['W', 'ER', 'L', 'D'],
        'the': ['DH', 'AH'],
        'a': ['AH'],
        'and': ['AE', 'N', 'D'],
        'is': ['IH', 'Z'],
        'are': ['AA', 'R'],
        'you': ['Y', 'UW'],
        'i': ['AY'],
        'we': ['W', 'IY'],
        'they': ['DH', 'EY'],
        'it': ['IH', 'T'],
        'that': ['DH', 'AE', 'T'],
        'for': ['F', 'AO', 'R'],
        'on': ['AA', 'N'],
        'with': ['W', 'IH', 'TH'],
        'as': ['AE', 'Z'],
        'at': ['AE', 'T'],
        'by': ['B', 'AY'],
        'from': ['F', 'R', 'AA', 'M'],
    }

    def __init__(self):
        """Initialize phoneme extractor"""
        self.client = None
        if os.getenv("OPENAI_API_KEY"):
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def extract_phonemes(
        self,
        audio_data: bytes,
        audio_format: str = "mp3",
        language: str = "en-US"
    ) -> List[PhonemeEvent]:
        """
        Extract phonemes from audio with timing

        Process:
        1. Use Whisper for word-level timestamps
        2. Map words to phonemes
        3. Distribute phonemes evenly across word duration
        4. Add silence markers between words

        Args:
            audio_data: Raw audio bytes
            audio_format: Audio format
            language: Language code

        Returns:
            List of phoneme events with timing
        """
        start_time = time.time()

        # Load audio
        audio = AudioSegment.from_file(io.BytesIO(audio_data), format=audio_format)
        duration = len(audio) / 1000.0  # Duration in seconds

        phonemes: List[PhonemeEvent] = []

        # Method 1: Use Whisper with word timestamps (if available)
        if self.client:
            try:
                phonemes = await self._extract_with_whisper(audio_data, audio_format, language)
            except Exception as e:
                logger.warning(f"Whisper extraction failed: {e}, falling back to energy-based")
                phonemes = self._extract_with_energy_analysis(audio, duration)
        else:
            # Method 2: Energy-based estimation (fallback)
            phonemes = self._extract_with_energy_analysis(audio, duration)

        logger.info(
            f"Extracted {len(phonemes)} phonemes in {(time.time() - start_time)*1000:.1f}ms"
        )

        return phonemes

    async def _extract_with_whisper(
        self,
        audio_data: bytes,
        audio_format: str,
        language: str
    ) -> List[PhonemeEvent]:
        """
        Extract phonemes using Whisper word timestamps

        Note: This is a simplified implementation. Production should use
        forced alignment tools like Montreal Forced Aligner or Gentle.
        """
        phonemes: List[PhonemeEvent] = []

        # Convert audio to suitable format for Whisper
        audio_file = io.BytesIO(audio_data)
        audio_file.name = f"audio.{audio_format}"

        # Call Whisper with word timestamps
        lang_code = language.split('-')[0]  # en-US -> en
        transcription = self.client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["word"],
            language=lang_code if lang_code != 'zh' else 'zh'
        )

        # Process word timestamps
        if hasattr(transcription, 'words') and transcription.words:
            for word_data in transcription.words:
                word = word_data.word.strip().lower()
                start = word_data.start
                end = word_data.end
                duration = end - start

                # Get phonemes for this word
                word_phonemes = self._word_to_phonemes(word)

                # Distribute phonemes evenly across word duration
                phoneme_count = len(word_phonemes)
                if phoneme_count > 0:
                    phoneme_duration = duration / phoneme_count

                    for i, phoneme in enumerate(word_phonemes):
                        phoneme_start = start + (i * phoneme_duration)
                        phoneme_end = phoneme_start + phoneme_duration

                        phonemes.append(PhonemeEvent(
                            phoneme=phoneme,
                            start_time=phoneme_start,
                            end_time=phoneme_end,
                            confidence=0.8  # Word-level confidence
                        ))

                # Add short silence between words
                if word_data != transcription.words[-1]:
                    next_start = transcription.words[
                        transcription.words.index(word_data) + 1
                    ].start
                    if next_start - end > 0.05:  # Gap > 50ms
                        phonemes.append(PhonemeEvent(
                            phoneme='sil',
                            start_time=end,
                            end_time=next_start,
                            confidence=1.0
                        ))
        else:
            # No word timestamps available, fall back to energy analysis
            raise Exception("No word timestamps available from Whisper")

        return phonemes

    def _extract_with_energy_analysis(
        self,
        audio: AudioSegment,
        duration: float
    ) -> List[PhonemeEvent]:
        """
        Fallback: Extract approximate phonemes using energy analysis

        This is a very simplified approach for demo purposes.
        """
        phonemes: List[PhonemeEvent] = []

        # Convert to numpy array
        samples = np.array(audio.get_array_of_samples())
        sample_rate = audio.frame_rate

        # Calculate frame energy
        frame_length = int(settings.frame_duration_ms * sample_rate / 1000)
        num_frames = len(samples) // frame_length

        current_time = 0.0
        for i in range(num_frames):
            frame_start = i * frame_length
            frame_end = min(frame_start + frame_length, len(samples))
            frame = samples[frame_start:frame_end]

            # Calculate energy
            energy = np.sqrt(np.mean(frame ** 2))

            # Determine phoneme based on energy
            frame_duration = len(frame) / sample_rate

            if energy < settings.silence_threshold:
                phoneme = 'sil'
            else:
                # Simplified: alternate between vowel and consonant
                phoneme = 'AH' if i % 2 == 0 else 'N'

            phonemes.append(PhonemeEvent(
                phoneme=phoneme,
                start_time=current_time,
                end_time=current_time + frame_duration,
                confidence=0.5  # Low confidence for energy-based
            ))

            current_time += frame_duration

        return self._merge_consecutive_phonemes(phonemes)

    def _word_to_phonemes(self, word: str) -> List[str]:
        """
        Convert word to phonemes

        In production, use CMU Pronouncing Dictionary or g2p model
        """
        # Check dictionary
        if word in self.WORD_TO_PHONEMES:
            return self.WORD_TO_PHONEMES[word]

        # Fallback: Generate approximate phonemes based on letters
        # This is VERY simplified and inaccurate
        phonemes = []
        for char in word:
            if char in 'aeiou':
                phonemes.append('AH')  # Generic vowel
            elif char.isalpha():
                phonemes.append('N')   # Generic consonant

        return phonemes if phonemes else ['sil']

    def _merge_consecutive_phonemes(
        self,
        phonemes: List[PhonemeEvent]
    ) -> List[PhonemeEvent]:
        """Merge consecutive identical phonemes"""
        if not phonemes:
            return []

        merged = [phonemes[0]]

        for phoneme in phonemes[1:]:
            last = merged[-1]

            if phoneme.phoneme == last.phoneme:
                # Merge with previous
                merged[-1] = PhonemeEvent(
                    phoneme=last.phoneme,
                    start_time=last.start_time,
                    end_time=phoneme.end_time,
                    confidence=max(last.confidence, phoneme.confidence)
                )
            else:
                merged.append(phoneme)

        return merged


# Global instance
phoneme_extractor = PhonemeExtractor()
