"""
Viseme mapper - Convert phonemes to visemes (mouth shapes)
"""
from typing import List, Dict
from .models import PhonemeEvent, VisemeEvent
from .config import PHONEME_TO_VISEME_MAP, VISEME_NAMES, settings
import logging

logger = logging.getLogger(__name__)


class VisemeMapper:
    """Map phonemes to visemes with blending support"""

    def __init__(self):
        """Initialize viseme mapper"""
        self.phoneme_to_viseme = PHONEME_TO_VISEME_MAP
        self.viseme_names = VISEME_NAMES

    def map_phonemes_to_visemes(
        self,
        phonemes: List[PhonemeEvent],
        blend_transitions: bool = True
    ) -> List[VisemeEvent]:
        """
        Convert phonemes to visemes

        Args:
            phonemes: List of phoneme events
            blend_transitions: Whether to smooth transitions between visemes

        Returns:
            List of viseme events
        """
        if not phonemes:
            return []

        visemes: List[VisemeEvent] = []

        for phoneme in phonemes:
            # Map phoneme to viseme
            viseme_id = self._get_viseme_for_phoneme(phoneme.phoneme)
            viseme_name = self.viseme_names.get(viseme_id, "Unknown")

            # Create viseme event
            viseme_event = VisemeEvent(
                viseme=viseme_id,
                viseme_name=viseme_name,
                start_time=phoneme.start_time,
                end_time=phoneme.end_time,
                weight=1.0
            )

            visemes.append(viseme_event)

        # Apply blending if requested
        if blend_transitions:
            visemes = self._apply_blending(visemes)

        # Merge consecutive identical visemes
        visemes = self._merge_consecutive_visemes(visemes)

        # Filter out very short visemes
        visemes = self._filter_short_visemes(visemes)

        logger.info(f"Mapped {len(phonemes)} phonemes to {len(visemes)} visemes")

        return visemes

    def _get_viseme_for_phoneme(self, phoneme: str) -> str:
        """
        Get viseme ID for phoneme

        Args:
            phoneme: Phoneme symbol

        Returns:
            Viseme ID
        """
        # Normalize phoneme
        phoneme = phoneme.upper().strip()

        # Direct mapping
        if phoneme in self.phoneme_to_viseme:
            return self.phoneme_to_viseme[phoneme]

        # Handle variants (e.g., AA0, AA1, AA2 -> AA)
        base_phoneme = phoneme.rstrip('012')
        if base_phoneme in self.phoneme_to_viseme:
            return self.phoneme_to_viseme[base_phoneme]

        # Default to silence
        logger.warning(f"Unknown phoneme '{phoneme}', using silence viseme")
        return settings.default_viseme

    def _apply_blending(self, visemes: List[VisemeEvent]) -> List[VisemeEvent]:
        """
        Apply smooth blending between visemes

        Adds transition periods where adjacent visemes blend together.
        This creates more natural-looking mouth movements.
        """
        if len(visemes) < 2:
            return visemes

        blended = []
        blend_time = settings.viseme_blend_time_ms / 1000.0  # Convert to seconds

        for i, viseme in enumerate(visemes):
            if i == 0:
                # First viseme - no blending at start
                blended.append(viseme)
                continue

            prev_viseme = visemes[i - 1]

            # Check if there's enough time for blending
            gap = viseme.start_time - prev_viseme.end_time

            if gap >= blend_time * 2:
                # Large gap - add explicit transition
                blend_start = prev_viseme.end_time + gap / 3
                blend_end = viseme.start_time - gap / 3

                # Add blend viseme (halfway between previous and current)
                blended.append(VisemeEvent(
                    viseme=prev_viseme.viseme,
                    viseme_name=prev_viseme.viseme_name,
                    start_time=blend_start,
                    end_time=blend_start + (blend_end - blend_start) / 2,
                    weight=0.5
                ))
                blended.append(VisemeEvent(
                    viseme=viseme.viseme,
                    viseme_name=viseme.viseme_name,
                    start_time=blend_start + (blend_end - blend_start) / 2,
                    end_time=blend_end,
                    weight=0.5
                ))
            elif gap > 0:
                # Small gap - simple transition
                blended.append(VisemeEvent(
                    viseme=viseme.viseme,
                    viseme_name=viseme.viseme_name,
                    start_time=prev_viseme.end_time + gap / 2,
                    end_time=viseme.end_time,
                    weight=1.0
                ))
                continue

            # Add current viseme
            blended.append(viseme)

        return blended

    def _merge_consecutive_visemes(
        self,
        visemes: List[VisemeEvent]
    ) -> List[VisemeEvent]:
        """Merge consecutive identical visemes"""
        if not visemes:
            return []

        merged = [visemes[0]]

        for viseme in visemes[1:]:
            last = merged[-1]

            # Check if same viseme and touching/overlapping
            if (viseme.viseme == last.viseme and
                viseme.start_time <= last.end_time + 0.01):  # 10ms tolerance

                # Merge
                merged[-1] = VisemeEvent(
                    viseme=last.viseme,
                    viseme_name=last.viseme_name,
                    start_time=last.start_time,
                    end_time=max(last.end_time, viseme.end_time),
                    weight=max(last.weight, viseme.weight)
                )
            else:
                merged.append(viseme)

        return merged

    def _filter_short_visemes(
        self,
        visemes: List[VisemeEvent]
    ) -> List[VisemeEvent]:
        """
        Remove visemes that are too short to be visible

        Very short visemes can cause jittery animations.
        """
        min_duration = settings.phoneme_min_duration_ms / 1000.0
        filtered = []

        for viseme in visemes:
            duration = viseme.end_time - viseme.start_time

            if duration >= min_duration:
                filtered.append(viseme)
            else:
                # Too short - skip or merge with previous
                if filtered and filtered[-1].viseme == viseme.viseme:
                    # Extend previous viseme
                    filtered[-1] = VisemeEvent(
                        viseme=filtered[-1].viseme,
                        viseme_name=filtered[-1].viseme_name,
                        start_time=filtered[-1].start_time,
                        end_time=viseme.end_time,
                        weight=filtered[-1].weight
                    )
                elif filtered:
                    # Different viseme - extend previous to cover gap
                    filtered[-1] = VisemeEvent(
                        viseme=filtered[-1].viseme,
                        viseme_name=filtered[-1].viseme_name,
                        start_time=filtered[-1].start_time,
                        end_time=viseme.end_time,
                        weight=filtered[-1].weight
                    )

        return filtered

    def get_viseme_stats(self, visemes: List[VisemeEvent]) -> Dict:
        """
        Get statistics about viseme usage

        Args:
            visemes: List of viseme events

        Returns:
            Dictionary with statistics
        """
        if not visemes:
            return {
                'total': 0,
                'unique': 0,
                'distribution': {},
                'total_duration': 0.0
            }

        # Count viseme occurrences
        distribution = {}
        for viseme in visemes:
            vid = viseme.viseme
            distribution[vid] = distribution.get(vid, 0) + 1

        # Calculate total duration
        total_duration = max(v.end_time for v in visemes)

        return {
            'total': len(visemes),
            'unique': len(set(v.viseme for v in visemes)),
            'distribution': distribution,
            'total_duration': total_duration
        }


# Global instance
viseme_mapper = VisemeMapper()
