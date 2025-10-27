"""
Special Case Detection Logic
Determines when to use LLM vs template-based generation
"""
from typing import List, Dict, Any, Optional
from .models import DialogueRequest, Memory
from .config import settings


class SpecialCaseDetector:
    """Detects special cases that warrant LLM generation"""

    def __init__(self):
        self.detection_reasons: List[str] = []

    def should_use_llm(
        self,
        request: DialogueRequest,
        memories: Optional[List[Memory]] = None
    ) -> tuple[bool, List[str]]:
        """
        Determine if LLM should be used for this request

        Returns:
            (should_use_llm, reasons)
        """
        self.detection_reasons = []

        # Always use LLM if forced (for testing)
        if request.force_llm:
            self.detection_reasons.append("force_llm")
            return True, self.detection_reasons

        # Check if LLM is disabled
        if not settings.llm_enabled:
            return False, []

        # Check each special case condition
        if self._is_legendary_event(request):
            self.detection_reasons.append("legendary_rarity")

        if self._is_first_time_event(request):
            self.detection_reasons.append("first_time_event")

        if self._is_milestone_event(request):
            self.detection_reasons.append("milestone_event")

        if self._has_high_importance_memories(memories):
            self.detection_reasons.append("high_importance_memory")

        if self._is_complex_context(request):
            self.detection_reasons.append("complex_context")

        if self._is_long_streak(request):
            self.detection_reasons.append("long_streak")

        # Use LLM if any special case detected
        return len(self.detection_reasons) > 0, self.detection_reasons

    def _is_legendary_event(self, request: DialogueRequest) -> bool:
        """Check if event has legendary rarity"""
        if not settings.special_case_legendary:
            return False

        context = request.context or {}
        rarity = context.get("rarity", "").lower()
        return rarity in ["legendary", "mythic"]

    def _is_first_time_event(self, request: DialogueRequest) -> bool:
        """Check if this is a first-time event"""
        if not settings.special_case_first_time:
            return False

        context = request.context or {}
        return context.get("is_first_time", False) or context.get("first_time", False)

    def _is_milestone_event(self, request: DialogueRequest) -> bool:
        """Check if event is a milestone (e.g., 100th kill, level 50)"""
        if not settings.special_case_milestone:
            return False

        context = request.context or {}

        # Check for round number milestones
        milestones = [10, 50, 100, 250, 500, 1000, 5000, 10000]

        # Check common milestone fields
        for field in ["kill_count", "win_count", "level", "achievement_count", "quest_count"]:
            value = context.get(field)
            if value and isinstance(value, (int, float)) and value in milestones:
                return True

        # Check for win/loss streaks
        for field in ["win_streak", "loss_streak"]:
            streak = context.get(field, 0)
            if streak >= 10:  # 10+ streak is significant
                return True

        return False

    def _has_high_importance_memories(self, memories: Optional[List[Memory]]) -> bool:
        """Check if player has highly important related memories"""
        if not memories:
            return False

        # Check if any memory has importance above threshold
        threshold = settings.special_case_importance_threshold
        return any(m.importance >= threshold for m in memories)

    def _is_complex_context(self, request: DialogueRequest) -> bool:
        """Check if context has multiple interesting factors"""
        context = request.context or {}

        # Count interesting contextual factors
        interesting_factors = 0

        if context.get("mvp"):
            interesting_factors += 1
        if context.get("clutch"):
            interesting_factors += 1
        if context.get("comeback"):
            interesting_factors += 1
        if context.get("close_call"):
            interesting_factors += 1
        if context.get("critical_health"):
            interesting_factors += 1
        if context.get("multi_kill", 0) >= 3:
            interesting_factors += 1

        # Complex if 2+ factors present
        return interesting_factors >= 2

    def _is_long_streak(self, request: DialogueRequest) -> bool:
        """Check for significant win/loss streaks"""
        context = request.context or {}

        win_streak = context.get("win_streak", 0)
        loss_streak = context.get("loss_streak", 0)

        return win_streak >= 5 or loss_streak >= 5


class TemplateSelector:
    """Selects the best template for an event"""

    @staticmethod
    def get_template_key_variations(
        event_type: str,
        emotion: str,
        persona: str
    ) -> List[tuple]:
        """Generate template key variations in priority order"""
        return [
            # Exact match
            (event_type, emotion, persona),
            # Any persona with same emotion
            (event_type, emotion, "*"),
            # Fallback to emotion + persona
            ("*", emotion, persona),
        ]

    @staticmethod
    def has_template(
        templates: Dict,
        event_type: str,
        emotion: str,
        persona: str
    ) -> bool:
        """Check if template exists for this combination"""
        key = (event_type, emotion, persona)
        return key in templates
