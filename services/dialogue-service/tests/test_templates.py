"""
Tests for Template Selection
"""
import pytest
from src.templates import (
    get_dialogue_templates,
    get_emotion_fallbacks,
    get_persona_fallbacks,
    select_template
)


class TestTemplates:
    """Test template selection and fallback logic"""

    def test_get_dialogue_templates(self):
        """Test template dictionary retrieval"""
        templates = get_dialogue_templates()

        assert isinstance(templates, dict)
        assert len(templates) > 80  # Should have 80+ templates

        # Check structure
        for key, dialogues in templates.items():
            assert isinstance(key, tuple)
            assert len(key) == 3  # (event_type, emotion, persona)
            assert isinstance(dialogues, list)
            assert len(dialogues) > 0

    def test_get_emotion_fallbacks(self):
        """Test emotion fallback retrieval"""
        fallbacks = get_emotion_fallbacks()

        assert isinstance(fallbacks, dict)
        assert len(fallbacks) > 0

        # Check key personas exist
        for emotion in ["happy", "sad", "excited", "frustrated"]:
            for persona in ["cheerful", "cool", "cute"]:
                key = (emotion, persona)
                assert key in fallbacks

    def test_get_persona_fallbacks(self):
        """Test persona fallback retrieval"""
        fallbacks = get_persona_fallbacks()

        assert isinstance(fallbacks, dict)
        assert "cheerful" in fallbacks
        assert "cool" in fallbacks
        assert "cute" in fallbacks

    def test_select_template_exact_match(self):
        """Test exact template match"""
        dialogue = select_template("player.victory", "happy", "cheerful")

        assert dialogue is not None
        assert isinstance(dialogue, str)
        assert len(dialogue) > 0

    def test_select_template_event_emotion_match(self):
        """Test event+emotion match fallback"""
        # This should fallback to any persona with same event+emotion
        dialogue = select_template("player.victory", "excited", "cheerful")

        assert dialogue is not None
        assert isinstance(dialogue, str)

    def test_select_template_emotion_fallback(self):
        """Test emotion+persona fallback"""
        dialogue = select_template("unknown.event", "happy", "cheerful")

        assert dialogue is not None
        assert isinstance(dialogue, str)
        # Should contain cheerful characteristics
        assert any(char in dialogue for char in ["！", "✨", "哇", "太"])

    def test_select_template_persona_fallback(self):
        """Test ultimate persona fallback"""
        dialogue = select_template("unknown.event", "unknown_emotion", "cheerful")

        assert dialogue is not None
        assert dialogue == "继续加油！✨"

    def test_cheerful_persona_characteristics(self):
        """Test cheerful persona maintains characteristics"""
        dialogue = select_template("player.victory", "happy", "cheerful")

        # Cheerful should have enthusiasm
        assert any(char in dialogue for char in ["！", "✨", "哇", "🎉"])

    def test_cool_persona_characteristics(self):
        """Test cool persona maintains characteristics"""
        dialogue = select_template("player.victory", "happy", "cool")

        # Cool should be concise
        assert len(dialogue) < 20
        assert "。" in dialogue or len(dialogue) < 10

    def test_cute_persona_characteristics(self):
        """Test cute persona maintains characteristics"""
        dialogue = select_template("player.victory", "happy", "cute")

        # Cute should have softness
        assert any(char in dialogue for char in ["~", "哇", "呜", "💕", "呀"])

    def test_template_variety(self):
        """Test that templates have variety"""
        dialogues = set()

        # Get same template multiple times
        for _ in range(20):
            dialogue = select_template("player.victory", "happy", "cheerful")
            dialogues.add(dialogue)

        # Should have gotten different variations
        assert len(dialogues) > 1

    def test_all_emotions_covered(self):
        """Test that all common emotions have fallbacks"""
        emotions = [
            "happy", "excited", "amazed", "sad", "frustrated",
            "disappointed", "neutral", "satisfied", "proud",
            "grateful", "angry", "worried", "tired"
        ]

        for emotion in emotions:
            for persona in ["cheerful", "cool", "cute"]:
                dialogue = select_template("unknown.event", emotion, persona)
                assert dialogue is not None
                assert len(dialogue) > 0

    def test_combat_events_coverage(self):
        """Test combat events are covered"""
        combat_events = [
            "player.victory",
            "player.defeat",
            "player.kill",
            "player.death"
        ]

        for event in combat_events:
            dialogue = select_template(event, "happy", "cheerful")
            assert dialogue is not None

    def test_achievement_events_coverage(self):
        """Test achievement events are covered"""
        dialogue = select_template("player.achievement", "happy", "cheerful")
        assert dialogue is not None
        assert "成就" in dialogue or "达成" in dialogue

    def test_loot_events_coverage(self):
        """Test loot events are covered"""
        loot_events = [
            "player.lootlegendary",
            "player.lootepic",
            "player.loot"
        ]

        for event in loot_events:
            dialogue = select_template(event, "excited", "cheerful")
            assert dialogue is not None
