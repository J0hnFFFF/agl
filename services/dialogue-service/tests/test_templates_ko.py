"""
Tests for Korean Dialogue Templates
"""
import pytest
from src.templates_ko import (
    get_dialogue_templates_ko,
    get_random_ko_dialogue,
    get_template_stats,
)


class TestKoreanTemplates:
    """Test Korean dialogue template library"""

    def test_get_dialogue_templates_ko_returns_dict(self):
        """Should return a dictionary of templates"""
        templates = get_dialogue_templates_ko()

        assert isinstance(templates, dict)
        assert len(templates) > 0

    def test_template_keys_are_tuples(self):
        """Template keys should be (event_type, emotion, persona) tuples"""
        templates = get_dialogue_templates_ko()

        for key in templates.keys():
            assert isinstance(key, tuple)
            assert len(key) == 3
            assert all(isinstance(item, str) for item in key)

    def test_template_values_are_lists(self):
        """Template values should be lists of strings"""
        templates = get_dialogue_templates_ko()

        for value in templates.values():
            assert isinstance(value, list)
            assert len(value) > 0
            assert all(isinstance(dialogue, str) for dialogue in value)

    def test_all_dialogues_are_non_empty_strings(self):
        """All dialogue strings should be non-empty"""
        templates = get_dialogue_templates_ko()

        for dialogues in templates.values():
            for dialogue in dialogues:
                assert len(dialogue) > 0
                assert dialogue.strip() == dialogue  # No leading/trailing whitespace

    def test_templates_contain_korean_characters(self):
        """Templates should contain Korean characters"""
        templates = get_dialogue_templates_ko()

        korean_char_found = False
        for dialogues in templates.values():
            for dialogue in dialogues:
                # Check if string contains Hangul characters (Korean)
                if any('\uac00' <= char <= '\ud7a3' for char in dialogue):
                    korean_char_found = True
                    break
            if korean_char_found:
                break

        assert korean_char_found, "No Korean characters found in templates"

    def test_victory_templates_exist(self):
        """Should have victory templates for multiple personas"""
        templates = get_dialogue_templates_ko()

        # Check cheerful persona
        assert ("player.victory", "happy", "cheerful") in templates
        assert len(templates[("player.victory", "happy", "cheerful")]) >= 5

        # Check cool persona
        assert ("player.victory", "happy", "cool") in templates
        assert len(templates[("player.victory", "happy", "cool")]) >= 3

        # Check cute persona
        assert ("player.victory", "happy", "cute") in templates
        assert len(templates[("player.victory", "happy", "cute")]) >= 5

    def test_defeat_templates_exist(self):
        """Should have defeat templates for multiple emotions"""
        templates = get_dialogue_templates_ko()

        # Check sad defeat
        assert ("player.defeat", "sad", "cheerful") in templates
        assert len(templates[("player.defeat", "sad", "cheerful")]) >= 5

        # Check disappointed defeat
        assert ("player.defeat", "disappointed", "cheerful") in templates
        assert len(templates[("player.defeat", "disappointed", "cheerful")]) >= 3

        # Check frustrated defeat
        assert ("player.defeat", "frustrated", "cheerful") in templates
        assert len(templates[("player.defeat", "frustrated", "cheerful")]) >= 3

    def test_levelup_templates_exist(self):
        """Should have level up templates"""
        templates = get_dialogue_templates_ko()

        assert ("player.levelup", "happy", "cheerful") in templates
        assert ("player.levelup", "happy", "cool") in templates
        assert ("player.levelup", "happy", "cute") in templates

    def test_achievement_templates_exist(self):
        """Should have achievement templates"""
        templates = get_dialogue_templates_ko()

        assert ("player.achievement", "happy", "cheerful") in templates
        assert ("player.achievement", "excited", "cheerful") in templates
        assert ("player.achievement", "proud", "cheerful") in templates

    def test_loot_templates_exist(self):
        """Should have loot acquisition templates"""
        templates = get_dialogue_templates_ko()

        assert ("player.loot", "happy", "cheerful") in templates
        assert ("player.loot", "excited", "cheerful") in templates
        assert ("player.loot", "happy", "cool") in templates

    def test_combat_templates_exist(self):
        """Should have combat-related templates"""
        templates = get_dialogue_templates_ko()

        # Combat start
        assert ("combat.start", "confident", "cheerful") in templates

        # Critical hit
        assert ("combat.critical", "excited", "cheerful") in templates

        # Near death
        assert ("combat.neardeath", "worried", "cheerful") in templates

    def test_quest_templates_exist(self):
        """Should have quest-related templates"""
        templates = get_dialogue_templates_ko()

        # Quest start
        assert ("player.queststart", "neutral", "cheerful") in templates

        # Quest complete
        assert ("player.questcomplete", "happy", "cheerful") in templates

    def test_session_templates_exist(self):
        """Should have session start/end templates"""
        templates = get_dialogue_templates_ko()

        # Session start
        assert ("player.sessionstart", "cheerful", "cheerful") in templates
        assert ("player.sessionstart", "cheerful", "cool") in templates
        assert ("player.sessionstart", "cheerful", "cute") in templates

        # Session end
        assert ("player.sessionend", "neutral", "cheerful") in templates
        assert ("player.sessionend", "neutral", "cool") in templates
        assert ("player.sessionend", "neutral", "cute") in templates

    def test_idle_templates_exist(self):
        """Should have idle chatter templates"""
        templates = get_dialogue_templates_ko()

        assert ("idle.chatter", "neutral", "cheerful") in templates
        assert ("idle.chatter", "neutral", "cool") in templates
        assert ("idle.chatter", "neutral", "cute") in templates

    def test_multiple_personas_supported(self):
        """Should support multiple persona types"""
        templates = get_dialogue_templates_ko()

        personas = set(key[2] for key in templates.keys())

        # Should have at least these personas
        assert "cheerful" in personas
        assert "cool" in personas
        assert "cute" in personas
        assert "serious" in personas
        assert "mysterious" in personas

    def test_multiple_emotions_supported(self):
        """Should support multiple emotion types"""
        templates = get_dialogue_templates_ko()

        emotions = set(key[1] for key in templates.keys())

        # Should have at least these emotions
        assert "happy" in emotions
        assert "excited" in emotions
        assert "sad" in emotions
        assert "disappointed" in emotions

    def test_multiple_event_types_supported(self):
        """Should support multiple event types"""
        templates = get_dialogue_templates_ko()

        event_types = set(key[0] for key in templates.keys())

        # Should have at least these event types
        expected_events = [
            "player.victory",
            "player.defeat",
            "player.levelup",
            "player.achievement",
            "player.loot",
            "combat.start",
            "combat.critical",
            "combat.neardeath",
            "player.sessionstart",
            "player.sessionend",
        ]

        for event in expected_events:
            assert event in event_types, f"Missing event type: {event}"


class TestRandomKoDialogue:
    """Test random Korean dialogue generation"""

    def test_get_random_ko_dialogue_returns_string(self):
        """Should return a string"""
        dialogue = get_random_ko_dialogue("player.victory", "happy", "cheerful")

        assert isinstance(dialogue, str)
        assert len(dialogue) > 0

    def test_get_random_ko_dialogue_varies(self):
        """Should return different dialogues on multiple calls"""
        dialogues = set()
        for _ in range(20):
            dialogue = get_random_ko_dialogue("player.victory", "happy", "cheerful")
            dialogues.add(dialogue)

        # Should get at least 2 different dialogues in 20 tries
        # (unless there's only 1 template, which would be a problem)
        assert len(dialogues) >= 2

    def test_get_random_ko_dialogue_valid_combinations(self):
        """Should return dialogues for valid combinations"""
        test_cases = [
            ("player.victory", "happy", "cheerful"),
            ("player.defeat", "sad", "cheerful"),
            ("player.levelup", "excited", "cute"),
            ("player.achievement", "proud", "cool"),
            ("combat.critical", "excited", "serious"),
        ]

        for event_type, emotion, persona in test_cases:
            dialogue = get_random_ko_dialogue(event_type, emotion, persona)
            assert isinstance(dialogue, str)
            assert len(dialogue) > 0

    def test_get_random_ko_dialogue_fallback(self):
        """Should return fallback for invalid combinations"""
        dialogue = get_random_ko_dialogue("invalid.event", "invalid_emotion", "invalid_persona")

        assert isinstance(dialogue, str)
        # Fallback should be a minimal response
        assert dialogue == "..."

    def test_get_random_ko_dialogue_contains_korean(self):
        """Should return dialogues containing Korean characters"""
        dialogue = get_random_ko_dialogue("player.victory", "happy", "cheerful")

        # Check if string contains Hangul characters (Korean)
        has_korean = any('\uac00' <= char <= '\ud7a3' for char in dialogue)
        assert has_korean or dialogue == "...", "Dialogue should contain Korean characters"


class TestTemplateStats:
    """Test template statistics"""

    def test_get_template_stats_returns_dict(self):
        """Should return statistics dictionary"""
        stats = get_template_stats()

        assert isinstance(stats, dict)
        assert "total_templates" in stats
        assert "total_combinations" in stats
        assert "unique_event_types" in stats
        assert "unique_emotions" in stats
        assert "unique_personas" in stats

    def test_template_stats_positive_values(self):
        """All statistics should be positive"""
        stats = get_template_stats()

        assert stats["total_templates"] > 0
        assert stats["total_combinations"] > 0
        assert stats["unique_event_types"] > 0
        assert stats["unique_emotions"] > 0
        assert stats["unique_personas"] > 0

    def test_template_stats_total_count(self):
        """Should have 300+ total templates"""
        stats = get_template_stats()

        assert stats["total_templates"] >= 300, (
            f"Expected at least 300 templates, got {stats['total_templates']}"
        )

    def test_template_stats_combinations(self):
        """Should have many combinations"""
        stats = get_template_stats()

        # With multiple personas, emotions, and events, should have 50+ combinations
        assert stats["total_combinations"] >= 50

    def test_template_stats_event_types(self):
        """Should have 10+ event types"""
        stats = get_template_stats()

        assert stats["unique_event_types"] >= 10

    def test_template_stats_emotions(self):
        """Should have 5+ emotions"""
        stats = get_template_stats()

        assert stats["unique_emotions"] >= 5

    def test_template_stats_personas(self):
        """Should have 5+ personas"""
        stats = get_template_stats()

        assert stats["unique_personas"] >= 5


class TestTemplateQuality:
    """Test Korean template quality"""

    def test_templates_have_variety(self):
        """Each key should have multiple dialogue options"""
        templates = get_dialogue_templates_ko()

        # Most keys should have at least 3 dialogue options
        keys_with_multiple_options = sum(
            1 for dialogues in templates.values() if len(dialogues) >= 3
        )

        # At least 80% of keys should have 3+ options
        total_keys = len(templates)
        assert keys_with_multiple_options / total_keys >= 0.8

    def test_dialogues_not_too_long(self):
        """Dialogues should be reasonably short"""
        templates = get_dialogue_templates_ko()

        for dialogues in templates.values():
            for dialogue in dialogues:
                # Most dialogues should be under 100 characters
                assert len(dialogue) < 200, f"Dialogue too long: {dialogue}"

    def test_dialogues_not_too_short(self):
        """Dialogues should not be too short"""
        templates = get_dialogue_templates_ko()

        for dialogues in templates.values():
            for dialogue in dialogues:
                # Dialogue should be at least 2 characters (excluding fallback)
                if dialogue != "...":
                    assert len(dialogue) >= 2

    def test_no_duplicate_dialogues_in_same_key(self):
        """Each key should have unique dialogue options"""
        templates = get_dialogue_templates_ko()

        for key, dialogues in templates.items():
            unique_dialogues = set(dialogues)
            assert len(unique_dialogues) == len(dialogues), (
                f"Duplicate dialogues found for key {key}"
            )

    def test_consistent_persona_style(self):
        """Dialogues should match persona style"""
        templates = get_dialogue_templates_ko()

        # Test cheerful persona (should be enthusiastic)
        cheerful_keys = [k for k in templates.keys() if k[2] == "cheerful"]
        for key in cheerful_keys[:5]:  # Test first 5
            dialogues = templates[key]
            # Cheerful dialogues often contain exclamation marks
            has_enthusiasm = any('!' in d or '!' in d for d in dialogues)
            assert has_enthusiasm, f"Cheerful persona should show enthusiasm: {key}"

        # Test cool persona (should be calm/short)
        cool_keys = [k for k in templates.keys() if k[2] == "cool"]
        for key in cool_keys[:5]:  # Test first 5
            dialogues = templates[key]
            # Cool dialogues should generally be shorter
            avg_length = sum(len(d) for d in dialogues) / len(dialogues)
            assert avg_length < 50, f"Cool persona should have shorter dialogues: {key}"

        # Test cute persona (should use ~ tilde)
        cute_keys = [k for k in templates.keys() if k[2] == "cute"]
        for key in cute_keys[:5]:  # Test first 5
            dialogues = templates[key]
            # Cute dialogues often use ~ tilde in Korean
            has_tilde = any('~' in d for d in dialogues)
            assert has_tilde, f"Cute persona should use ~ tilde: {key}"


class TestIntegration:
    """Integration tests for Korean templates"""

    def test_can_generate_full_conversation(self):
        """Should be able to generate a full conversation flow"""
        conversation = []

        # Session start
        conversation.append(get_random_ko_dialogue("player.sessionstart", "cheerful", "cheerful"))

        # Victory
        conversation.append(get_random_ko_dialogue("player.victory", "happy", "cheerful"))

        # Level up
        conversation.append(get_random_ko_dialogue("player.levelup", "excited", "cheerful"))

        # Achievement
        conversation.append(get_random_ko_dialogue("player.achievement", "proud", "cheerful"))

        # Session end
        conversation.append(get_random_ko_dialogue("player.sessionend", "neutral", "cheerful"))

        # All dialogues should be valid
        assert all(len(d) > 0 for d in conversation)
        assert all(isinstance(d, str) for d in conversation)

    def test_coverage_for_common_scenarios(self):
        """Should have templates for all common game scenarios"""
        common_scenarios = [
            ("player.victory", "happy", "cheerful"),
            ("player.victory", "excited", "cool"),
            ("player.defeat", "sad", "cheerful"),
            ("player.levelup", "happy", "cute"),
            ("player.achievement", "proud", "serious"),
            ("player.loot", "excited", "cheerful"),
            ("combat.start", "confident", "cool"),
            ("combat.critical", "excited", "cute"),
            ("combat.neardeath", "worried", "cheerful"),
            ("idle.chatter", "neutral", "mysterious"),
        ]

        templates = get_dialogue_templates_ko()

        for scenario in common_scenarios:
            assert scenario in templates, f"Missing common scenario: {scenario}"
            assert len(templates[scenario]) >= 2, (
                f"Scenario needs more dialogue options: {scenario}"
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
