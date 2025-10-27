"""
Rule-based emotion analyzer
Extracted from original main.py logic
"""
from typing import Dict, Any
from .models import RuleResult


class RuleBasedAnalyzer:
    """Rule-based emotion detection engine"""

    def analyze(self, event_type: str, event_data: Dict[str, Any], context: Dict[str, Any]) -> RuleResult:
        """
        Analyze emotion using rule-based system

        Args:
            event_type: Type of game event
            event_data: Event-specific data
            context: Player context (health, combat state, etc.)

        Returns:
            RuleResult with emotion, intensity, reasoning, confidence
        """
        # Get base emotion from event type
        base = self._get_base_emotion(event_type, event_data)

        # Adjust based on context
        adjusted = self._adjust_emotion_by_context(base, context, event_data)

        return RuleResult(
            emotion=adjusted["emotion"],
            intensity=adjusted["intensity"],
            reasoning=adjusted["reasoning"],
            confidence=adjusted["confidence"]
        )

    def get_action(self, emotion: str) -> str:
        """Map emotion to character action"""
        action_map = {
            "happy": "smile",
            "excited": "cheer",
            "amazed": "surprised_jump",
            "proud": "proud_pose",
            "satisfied": "nod",
            "cheerful": "wave",
            "grateful": "thank",
            "sad": "comfort",
            "disappointed": "sigh",
            "frustrated": "encourage",
            "angry": "calm_down",
            "worried": "concerned",
            "tired": "rest",
            "neutral": "idle",
        }
        return action_map.get(emotion, "idle")

    def _get_base_emotion(self, event_type: str, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get base emotion from event type and data
        Returns: {"emotion": str, "intensity": float, "reasoning": str}
        """
        # Combat events
        if event_type == "player.victory":
            return {"emotion": "happy", "intensity": 0.9, "reasoning": "Player won the match"}
        elif event_type == "player.defeat":
            return {"emotion": "sad", "intensity": 0.7, "reasoning": "Player lost the match"}
        elif event_type == "player.kill":
            kill_count = event_data.get("killCount", 1)
            is_multi_kill = kill_count >= 2
            is_legendary = event_data.get("isLegendary", False)

            if is_legendary:
                return {"emotion": "amazed", "intensity": 1.0, "reasoning": "Legendary kill achievement"}
            elif is_multi_kill:
                return {"emotion": "excited", "intensity": 0.95, "reasoning": f"Multi-kill ({kill_count})"}
            else:
                return {"emotion": "satisfied", "intensity": 0.7, "reasoning": "Successful kill"}
        elif event_type == "player.death":
            death_streak = event_data.get("deathStreak", 1)
            if death_streak >= 3:
                return {"emotion": "frustrated", "intensity": 0.8, "reasoning": f"Death streak ({death_streak})"}
            else:
                return {"emotion": "disappointed", "intensity": 0.6, "reasoning": "Player died"}
        elif event_type == "player.assist":
            return {"emotion": "satisfied", "intensity": 0.6, "reasoning": "Assisted teammate"}

        # Achievement events
        elif event_type == "player.achievement":
            achievement_rarity = event_data.get("rarity", "common")
            if achievement_rarity == "legendary":
                return {"emotion": "amazed", "intensity": 1.0, "reasoning": "Legendary achievement unlocked"}
            elif achievement_rarity == "epic":
                return {"emotion": "excited", "intensity": 0.9, "reasoning": "Epic achievement unlocked"}
            else:
                return {"emotion": "happy", "intensity": 0.7, "reasoning": "Achievement unlocked"}

        # Level/progression events
        elif event_type == "player.levelup":
            new_level = event_data.get("level", 0)
            if new_level >= 50:
                return {"emotion": "proud", "intensity": 0.9, "reasoning": f"Reached level {new_level}"}
            else:
                return {"emotion": "happy", "intensity": 0.7, "reasoning": f"Level up to {new_level}"}

        # Social events
        elif event_type == "player.teamvictory":
            return {"emotion": "happy", "intensity": 0.85, "reasoning": "Team won together"}
        elif event_type == "player.teamdefeat":
            return {"emotion": "disappointed", "intensity": 0.6, "reasoning": "Team lost"}
        elif event_type == "player.revived":
            return {"emotion": "grateful", "intensity": 0.75, "reasoning": "Revived by teammate"}
        elif event_type == "player.savedally":
            return {"emotion": "proud", "intensity": 0.8, "reasoning": "Saved teammate"}

        # Resource/loot events
        elif event_type == "player.lootlegendary":
            return {"emotion": "excited", "intensity": 0.95, "reasoning": "Found legendary loot"}
        elif event_type == "player.lootepic":
            return {"emotion": "happy", "intensity": 0.8, "reasoning": "Found epic loot"}
        elif event_type == "player.loot":
            return {"emotion": "satisfied", "intensity": 0.6, "reasoning": "Found loot"}

        # Quest events
        elif event_type == "player.questcomplete":
            return {"emotion": "satisfied", "intensity": 0.75, "reasoning": "Quest completed"}
        elif event_type == "player.questfailed":
            return {"emotion": "disappointed", "intensity": 0.65, "reasoning": "Quest failed"}

        # Skill/combo events
        elif event_type == "player.skillcombo":
            combo_length = event_data.get("comboLength", 0)
            if combo_length >= 10:
                return {"emotion": "excited", "intensity": 0.95, "reasoning": f"Amazing combo ({combo_length})"}
            else:
                return {"emotion": "satisfied", "intensity": 0.75, "reasoning": f"Combo executed ({combo_length})"}

        # Negative events
        elif event_type == "player.betrayed":
            return {"emotion": "angry", "intensity": 0.8, "reasoning": "Betrayed by teammate"}
        elif event_type == "player.timeout":
            return {"emotion": "frustrated", "intensity": 0.7, "reasoning": "Connection timeout"}
        elif event_type == "player.outofresources":
            return {"emotion": "worried", "intensity": 0.65, "reasoning": "Running low on resources"}

        # Session events
        elif event_type == "player.sessionstart":
            return {"emotion": "cheerful", "intensity": 0.7, "reasoning": "Starting new session"}
        elif event_type == "player.sessionend":
            play_duration = event_data.get("duration", 0)
            if play_duration > 7200:  # > 2 hours
                return {"emotion": "tired", "intensity": 0.6, "reasoning": "Long gaming session"}
            else:
                return {"emotion": "neutral", "intensity": 0.5, "reasoning": "Session ended"}

        # Default
        else:
            return {"emotion": "neutral", "intensity": 0.5, "reasoning": "Unknown event type"}

    def _adjust_emotion_by_context(
        self,
        base_emotion: Dict[str, Any],
        context: Dict[str, Any],
        event_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Adjust emotion intensity based on player context
        """
        emotion = base_emotion["emotion"]
        intensity = base_emotion["intensity"]
        reasoning = base_emotion["reasoning"]
        confidence = 0.85

        # Adjust based on player health
        player_health = context.get("playerHealth", 100)
        if player_health < 20:
            if emotion in ["happy", "excited", "satisfied"]:
                # Reduce positive emotions when health is critical
                intensity *= 0.8
                reasoning += " (but health is critical)"
            elif emotion in ["worried", "frustrated"]:
                # Increase negative emotions when health is critical
                intensity = min(1.0, intensity * 1.2)
                reasoning += " (and health is critical)"

        # Adjust based on combat state
        in_combat = context.get("inCombat", False)
        if in_combat and emotion not in ["excited", "amazed", "angry", "frustrated"]:
            # Increase intensity during combat
            intensity = min(1.0, intensity * 1.1)
            reasoning += " (in combat)"

        # Adjust based on win/loss streak
        win_streak = event_data.get("winStreak", 0)
        loss_streak = event_data.get("lossStreak", 0)

        if win_streak >= 3:
            if emotion in ["happy", "excited", "satisfied"]:
                intensity = min(1.0, intensity * 1.2)
                reasoning += f" (win streak: {win_streak})"
                confidence = 0.95

        if loss_streak >= 3:
            if emotion in ["sad", "frustrated", "disappointed"]:
                intensity = min(1.0, intensity * 1.3)
                reasoning += f" (loss streak: {loss_streak})"
                confidence = 0.95

        # Adjust based on difficulty
        difficulty = event_data.get("difficulty", "normal")
        if difficulty == "hard" or difficulty == "nightmare":
            if emotion in ["happy", "excited", "satisfied", "proud"]:
                intensity = min(1.0, intensity * 1.25)
                reasoning += f" (on {difficulty} difficulty)"
                confidence = 0.9

        # Adjust based on MVP status
        is_mvp = event_data.get("mvp", False) or event_data.get("isMVP", False)
        if is_mvp:
            if emotion in ["happy", "excited", "satisfied"]:
                intensity = min(1.0, intensity * 1.3)
                reasoning += " (MVP!)"
                confidence = 0.95

        return {
            "emotion": emotion,
            "intensity": round(intensity, 2),
            "reasoning": reasoning,
            "confidence": confidence
        }
