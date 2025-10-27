"""
Tests for Special Case Detector
"""
import pytest
from src.special_case_detector import SpecialCaseDetector
from src.models import DialogueRequest, Memory, Persona


class TestSpecialCaseDetector:
    """Test special case detection logic"""

    def setup_method(self):
        """Setup for each test"""
        self.detector = SpecialCaseDetector()

    def test_legendary_event_detection(self):
        """Test legendary rarity detection"""
        request = DialogueRequest(
            event_type="player.loot",
            emotion="amazed",
            persona=Persona.CHEERFUL,
            context={"rarity": "legendary"}
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "legendary_rarity" in reasons

    def test_mythic_event_detection(self):
        """Test mythic rarity detection"""
        request = DialogueRequest(
            event_type="player.achievement",
            emotion="amazed",
            persona=Persona.CHEERFUL,
            context={"rarity": "mythic"}
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "legendary_rarity" in reasons

    def test_first_time_event_detection(self):
        """Test first-time event detection"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="excited",
            persona=Persona.CHEERFUL,
            context={"is_first_time": True}
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "first_time_event" in reasons

    def test_milestone_detection_100_kills(self):
        """Test milestone detection for 100 kills"""
        request = DialogueRequest(
            event_type="player.kill",
            emotion="satisfied",
            persona=Persona.COOL,
            context={"kill_count": 100}
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "milestone_event" in reasons

    def test_milestone_detection_level_50(self):
        """Test milestone detection for level 50"""
        request = DialogueRequest(
            event_type="player.levelup",
            emotion="proud",
            persona=Persona.CUTE,
            context={"level": 50}
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "milestone_event" in reasons

    def test_win_streak_detection(self):
        """Test long win streak detection"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="excited",
            persona=Persona.CHEERFUL,
            context={"win_streak": 10}
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "long_streak" in reasons

    def test_loss_streak_detection(self):
        """Test long loss streak detection"""
        request = DialogueRequest(
            event_type="player.defeat",
            emotion="frustrated",
            persona=Persona.COOL,
            context={"loss_streak": 7}
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "long_streak" in reasons

    def test_high_importance_memory(self, sample_memory):
        """Test high importance memory detection"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL,
            player_id="player-123"
        )

        memories = [sample_memory]  # importance = 1.0

        should_use, reasons = self.detector.should_use_llm(request, memories)

        assert should_use is True
        assert "high_importance_memory" in reasons

    def test_complex_context_mvp_clutch(self):
        """Test complex context with multiple factors"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="amazed",
            persona=Persona.CHEERFUL,
            context={
                "mvp": True,
                "clutch": True,
                "close_call": True
            }
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "complex_context" in reasons

    def test_force_llm(self):
        """Test force LLM flag"""
        request = DialogueRequest(
            event_type="player.kill",
            emotion="satisfied",
            persona=Persona.COOL,
            force_llm=True
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert "force_llm" in reasons

    def test_no_special_case(self):
        """Test regular event without special cases"""
        request = DialogueRequest(
            event_type="player.kill",
            emotion="satisfied",
            persona=Persona.CHEERFUL,
            context={}
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is False
        assert len(reasons) == 0

    def test_multiple_special_cases(self):
        """Test multiple special cases triggering"""
        request = DialogueRequest(
            event_type="player.achievement",
            emotion="amazed",
            persona=Persona.CHEERFUL,
            context={
                "rarity": "legendary",
                "is_first_time": True,
                "achievement_count": 100
            }
        )

        should_use, reasons = self.detector.should_use_llm(request)

        assert should_use is True
        assert len(reasons) >= 2
        assert "legendary_rarity" in reasons
        assert "first_time_event" in reasons
        assert "milestone_event" in reasons
