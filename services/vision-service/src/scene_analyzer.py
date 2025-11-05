"""
Scene analysis and event detection
"""
import re
import logging
from typing import List, Optional, Dict, Any

from .config import settings
from .models import (
    SceneInfo,
    CharacterInfo,
    GameEvent,
    UIElement
)

logger = logging.getLogger(__name__)


class SceneAnalyzer:
    """Analyze vision API results to extract structured data"""

    def __init__(self):
        """Initialize scene analyzer"""
        self.combat_keywords = settings.combat_keywords
        self.dialogue_keywords = settings.dialogue_keywords
        self.exploration_keywords = settings.exploration_keywords

    def analyze_text(
        self,
        analysis_text: str,
        analysis_type: str = "full"
    ) -> Dict[str, Any]:
        """
        Analyze vision API text output to extract structured data

        Args:
            analysis_text: Text from vision API
            analysis_type: Type of analysis (full, scene, event, etc.)

        Returns:
            Dictionary with structured analysis
        """
        result: Dict[str, Any] = {}

        if analysis_type in ["full", "scene"]:
            result['scene'] = self._extract_scene_info(analysis_text)

        if analysis_type in ["full", "character"]:
            result['character'] = self._extract_character_info(analysis_text)

        if analysis_type in ["full", "event"]:
            result['events'] = self._detect_events(analysis_text)

        if analysis_type in ["full", "ui"]:
            result['ui_elements'] = self._extract_ui_elements(analysis_text)

        return result

    def _extract_scene_info(self, text: str) -> Optional[SceneInfo]:
        """
        Extract scene information from analysis text

        Args:
            text: Analysis text

        Returns:
            SceneInfo or None
        """
        try:
            # Look for scene description patterns
            scene_desc = None
            location = None
            environment = None
            atmosphere = None
            time_of_day = None
            weather = None

            # Extract scene description (first paragraph or sentence)
            lines = text.strip().split('\n')
            if lines:
                scene_desc = lines[0].strip()

            # Extract specific details using keywords
            text_lower = text.lower()

            # Location
            location_patterns = [
                r"location[:\s]+([^.\n]+)",
                r"area[:\s]+([^.\n]+)",
                r"at\s+(?:a|an|the)\s+([^.\n]+)",
            ]
            for pattern in location_patterns:
                match = re.search(pattern, text_lower)
                if match:
                    location = match.group(1).strip()
                    break

            # Environment type
            env_keywords = ["forest", "dungeon", "city", "castle", "cave", "outdoor", "indoor", "battlefield"]
            for keyword in env_keywords:
                if keyword in text_lower:
                    environment = keyword
                    break

            # Atmosphere
            atmosphere_keywords = {
                "tense": ["tense", "intense", "stressful", "dangerous"],
                "peaceful": ["peaceful", "calm", "serene", "relaxed"],
                "exciting": ["exciting", "thrilling", "action-packed"],
                "mysterious": ["mysterious", "eerie", "ominous", "dark"],
                "cheerful": ["cheerful", "bright", "happy", "vibrant"]
            }
            for atm, keywords in atmosphere_keywords.items():
                if any(kw in text_lower for kw in keywords):
                    atmosphere = atm
                    break

            # Time of day
            time_keywords = ["morning", "noon", "afternoon", "evening", "night", "dawn", "dusk"]
            for time_kw in time_keywords:
                if time_kw in text_lower:
                    time_of_day = time_kw
                    break

            # Weather
            weather_keywords = ["sunny", "rainy", "cloudy", "snowy", "foggy", "stormy"]
            for weather_kw in weather_keywords:
                if weather_kw in text_lower:
                    weather = weather_kw
                    break

            if scene_desc:
                return SceneInfo(
                    description=scene_desc,
                    location=location,
                    environment=environment,
                    atmosphere=atmosphere,
                    time_of_day=time_of_day,
                    weather=weather
                )

        except Exception as e:
            logger.error(f"Failed to extract scene info: {e}")

        return None

    def _extract_character_info(self, text: str) -> Optional[CharacterInfo]:
        """
        Extract character information

        Args:
            text: Analysis text

        Returns:
            CharacterInfo or None
        """
        try:
            text_lower = text.lower()

            # Extract health status
            health = None
            health_patterns = [
                r"health[:\s]+([^.\n]+)",
                r"hp[:\s]+([0-9]+)",
                r"([0-9]+)%\s+health",
            ]
            for pattern in health_patterns:
                match = re.search(pattern, text_lower)
                if match:
                    health = match.group(1).strip()
                    break

            # Extract level
            level = None
            level_patterns = [
                r"level[:\s]+([0-9]+)",
                r"lvl[:\s]+([0-9]+)",
            ]
            for pattern in level_patterns:
                match = re.search(pattern, text_lower)
                if match:
                    level = match.group(1).strip()
                    break

            # Extract equipment mentions
            equipment = []
            equipment_keywords = [
                "sword", "shield", "armor", "helmet", "bow", "staff",
                "weapon", "gun", "rifle", "axe", "hammer"
            ]
            for eq in equipment_keywords:
                if eq in text_lower:
                    equipment.append(eq)

            # Extract status effects
            status_effects = []
            status_keywords = [
                "poisoned", "burning", "frozen", "stunned", "buffed",
                "debuffed", "blessed", "cursed"
            ]
            for status in status_keywords:
                if status in text_lower:
                    status_effects.append(status)

            # Only return if we found something
            if health or level or equipment or status_effects:
                return CharacterInfo(
                    health=health,
                    level=level,
                    equipment=equipment,
                    status_effects=status_effects
                )

        except Exception as e:
            logger.error(f"Failed to extract character info: {e}")

        return None

    def _detect_events(self, text: str) -> List[GameEvent]:
        """
        Detect game events from text

        Args:
            text: Analysis text

        Returns:
            List of detected events
        """
        events: List[GameEvent] = []
        text_lower = text.lower()

        # Detect combat events
        combat_score = sum(1 for kw in self.combat_keywords if kw in text_lower)
        if combat_score >= 2:
            # Extract combat description
            description = "Combat situation detected"
            if "boss" in text_lower:
                description = "Boss battle in progress"
            elif "enemy" in text_lower or "enemies" in text_lower:
                description = "Fighting enemies"

            events.append(GameEvent(
                event_type="combat",
                description=description,
                importance="high" if combat_score >= 4 else "medium",
                confidence=min(combat_score / 6, 1.0)
            ))

        # Detect dialogue events
        dialogue_score = sum(1 for kw in self.dialogue_keywords if kw in text_lower)
        if dialogue_score >= 2:
            description = "Dialogue or conversation in progress"
            if "quest" in text_lower:
                description = "Quest-related dialogue"

            events.append(GameEvent(
                event_type="dialogue",
                description=description,
                importance="medium",
                confidence=min(dialogue_score / 4, 1.0)
            ))

        # Detect exploration events
        exploration_score = sum(1 for kw in self.exploration_keywords if kw in text_lower)
        if exploration_score >= 2:
            events.append(GameEvent(
                event_type="exploration",
                description="Exploring game world",
                importance="low",
                confidence=min(exploration_score / 4, 1.0)
            ))

        # Detect specific high-importance events
        if any(kw in text_lower for kw in ["died", "death", "game over"]):
            events.append(GameEvent(
                event_type="death",
                description="Character died",
                importance="high",
                confidence=0.9
            ))

        if any(kw in text_lower for kw in ["victory", "won", "defeated boss"]):
            events.append(GameEvent(
                event_type="victory",
                description="Victory achieved",
                importance="high",
                confidence=0.9
            ))

        if any(kw in text_lower for kw in ["level up", "leveled up"]):
            events.append(GameEvent(
                event_type="level_up",
                description="Character leveled up",
                importance="medium",
                confidence=0.8
            ))

        return events

    def _extract_ui_elements(self, text: str) -> List[UIElement]:
        """
        Extract UI element information

        Args:
            text: Analysis text

        Returns:
            List of UI elements
        """
        ui_elements: List[UIElement] = []
        text_lower = text.lower()

        # Common UI elements
        ui_keywords = {
            "health_bar": ["health bar", "hp bar"],
            "minimap": ["minimap", "map"],
            "inventory": ["inventory", "backpack"],
            "quest_log": ["quest log", "quest tracker", "objectives"],
            "chat": ["chat", "text chat"],
            "menu": ["menu", "settings"],
        }

        for element_type, keywords in ui_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    # Find context around keyword
                    idx = text_lower.find(keyword)
                    context_start = max(0, idx - 50)
                    context_end = min(len(text), idx + 100)
                    context = text[context_start:context_end].strip()

                    ui_elements.append(UIElement(
                        element_type=element_type,
                        content=context,
                        importance="medium"
                    ))
                    break

        return ui_elements

    def calculate_scene_similarity(
        self,
        scene1: Optional[SceneInfo],
        scene2: Optional[SceneInfo]
    ) -> float:
        """
        Calculate similarity between two scenes

        Args:
            scene1: First scene
            scene2: Second scene

        Returns:
            Similarity score 0-1
        """
        if not scene1 or not scene2:
            return 0.0

        similarity = 0.0
        total_factors = 0

        # Compare location
        if scene1.location and scene2.location:
            total_factors += 1
            if scene1.location.lower() == scene2.location.lower():
                similarity += 1.0

        # Compare environment
        if scene1.environment and scene2.environment:
            total_factors += 1
            if scene1.environment.lower() == scene2.environment.lower():
                similarity += 1.0

        # Compare atmosphere
        if scene1.atmosphere and scene2.atmosphere:
            total_factors += 1
            if scene1.atmosphere.lower() == scene2.atmosphere.lower():
                similarity += 0.5

        # Compare time of day
        if scene1.time_of_day and scene2.time_of_day:
            total_factors += 1
            if scene1.time_of_day.lower() == scene2.time_of_day.lower():
                similarity += 0.5

        return similarity / total_factors if total_factors > 0 else 0.0


# Global instance
scene_analyzer = SceneAnalyzer()
