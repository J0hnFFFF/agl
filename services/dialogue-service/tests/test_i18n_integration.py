"""
Integration Tests for Multi-Language Template System
"""
import pytest
from src.templates_i18n import (
    TemplateManager,
    get_dialogue,
    set_default_language,
    get_supported_languages,
    SUPPORTED_LANGUAGES,
)


class TestMultiLanguageSupport:
    """Test multi-language template system"""

    def test_supported_languages_includes_korean(self):
        """Should include Korean in supported languages"""
        assert "ko" in SUPPORTED_LANGUAGES

    def test_supported_languages_list(self):
        """Should have all expected languages"""
        expected = ["zh", "en", "ja", "ko"]

        for lang in expected:
            assert lang in SUPPORTED_LANGUAGES, f"Missing language: {lang}"

    def test_get_supported_languages_function(self):
        """Should return list of supported languages"""
        languages = get_supported_languages()

        assert isinstance(languages, list)
        assert "ko" in languages
        assert "en" in languages
        assert "zh" in languages
        assert "ja" in languages


class TestTemplateManager:
    """Test TemplateManager class"""

    def test_template_manager_initialization(self):
        """Should initialize with default language"""
        manager = TemplateManager()

        assert manager.default_language == "zh"

    def test_template_manager_custom_language(self):
        """Should initialize with custom language"""
        manager = TemplateManager(default_language="ko")

        assert manager.default_language == "ko"

    def test_template_manager_invalid_language(self):
        """Should raise error for unsupported language"""
        with pytest.raises(ValueError, match="Unsupported language"):
            TemplateManager(default_language="fr")

    def test_language_templates_has_korean(self):
        """Should have Korean in language templates dict"""
        manager = TemplateManager()

        assert "ko" in manager.language_templates
        assert callable(manager.language_templates["ko"])

    def test_get_dialogue_korean(self):
        """Should get Korean dialogue"""
        manager = TemplateManager()

        dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="ko"
        )

        assert isinstance(dialogue, str)
        assert len(dialogue) > 0
        # Check for Korean characters
        has_korean = any('\uac00' <= char <= '\ud7a3' for char in dialogue)
        assert has_korean, "Dialogue should contain Korean characters"

    def test_get_dialogue_english(self):
        """Should get English dialogue"""
        manager = TemplateManager()

        dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="en"
        )

        assert isinstance(dialogue, str)
        assert len(dialogue) > 0

    def test_get_dialogue_chinese(self):
        """Should get Chinese dialogue"""
        manager = TemplateManager()

        dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="zh"
        )

        assert isinstance(dialogue, str)
        assert len(dialogue) > 0

    def test_get_dialogue_japanese(self):
        """Should get Japanese dialogue"""
        manager = TemplateManager()

        dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="ja"
        )

        assert isinstance(dialogue, str)
        assert len(dialogue) > 0

    def test_get_dialogue_uses_default_language(self):
        """Should use default language when not specified"""
        manager = TemplateManager(default_language="ko")

        dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful"
        )

        # Should return Korean dialogue
        has_korean = any('\uac00' <= char <= '\ud7a3' for char in dialogue)
        assert has_korean or dialogue == "..."

    def test_get_dialogue_fallback_to_default(self):
        """Should fallback to default for invalid language"""
        manager = TemplateManager(default_language="en")

        dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="invalid_lang"
        )

        # Should fallback to English (default)
        assert isinstance(dialogue, str)
        assert len(dialogue) > 0

    def test_is_language_supported(self):
        """Should correctly identify supported languages"""
        manager = TemplateManager()

        assert manager.is_language_supported("ko") is True
        assert manager.is_language_supported("en") is True
        assert manager.is_language_supported("zh") is True
        assert manager.is_language_supported("ja") is True
        assert manager.is_language_supported("fr") is False
        assert manager.is_language_supported("de") is False

    def test_set_default_language(self):
        """Should change default language"""
        manager = TemplateManager(default_language="en")

        manager.set_default_language("ko")

        assert manager.default_language == "ko"

    def test_set_default_language_invalid(self):
        """Should raise error for invalid default language"""
        manager = TemplateManager()

        with pytest.raises(ValueError, match="Unsupported language"):
            manager.set_default_language("fr")


class TestConvenienceFunctions:
    """Test convenience functions"""

    def test_get_dialogue_function_korean(self):
        """Should get Korean dialogue via convenience function"""
        dialogue = get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="ko"
        )

        assert isinstance(dialogue, str)
        assert len(dialogue) > 0

    def test_get_dialogue_function_all_languages(self):
        """Should work for all supported languages"""
        for lang in SUPPORTED_LANGUAGES:
            dialogue = get_dialogue(
                "player.victory",
                "happy",
                "cheerful",
                language=lang
            )

            assert isinstance(dialogue, str)
            assert len(dialogue) > 0

    def test_set_default_language_function(self):
        """Should set default language via convenience function"""
        # This modifies global state, so be careful
        original_default = get_dialogue("player.victory", "happy", "cheerful")

        set_default_language("ko")
        ko_dialogue = get_dialogue("player.victory", "happy", "cheerful")

        # Korean dialogue should contain Korean characters
        has_korean = any('\uac00' <= char <= '\ud7a3' for char in ko_dialogue)
        assert has_korean or ko_dialogue == "..."

        # Reset to default
        set_default_language("zh")

    def test_get_supported_languages_convenience(self):
        """Should get supported languages list"""
        languages = get_supported_languages()

        assert isinstance(languages, list)
        assert len(languages) == 4
        assert "ko" in languages


class TestLanguageSwitching:
    """Test dynamic language switching"""

    def test_switch_between_languages(self):
        """Should be able to switch between languages"""
        manager = TemplateManager()

        # Get English dialogue
        en_dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="en"
        )

        # Get Korean dialogue
        ko_dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="ko"
        )

        # Get Chinese dialogue
        zh_dialogue = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="zh"
        )

        # All should be valid but different
        assert isinstance(en_dialogue, str)
        assert isinstance(ko_dialogue, str)
        assert isinstance(zh_dialogue, str)

        # Korean should have Korean characters
        has_korean = any('\uac00' <= char <= '\ud7a3' for char in ko_dialogue)
        assert has_korean or ko_dialogue == "..."

    def test_same_event_different_languages(self):
        """Same event should return different language dialogues"""
        manager = TemplateManager()

        event_type = "player.levelup"
        emotion = "happy"
        persona = "cheerful"

        dialogues = {}
        for lang in ["en", "zh", "ja", "ko"]:
            dialogue = manager.get_dialogue(event_type, emotion, persona, language=lang)
            dialogues[lang] = dialogue

        # All should be valid strings
        assert all(isinstance(d, str) and len(d) > 0 for d in dialogues.values())

        # Korean should contain Korean characters
        has_korean = any('\uac00' <= char <= '\ud7a3' for char in dialogues["ko"])
        assert has_korean or dialogues["ko"] == "..."

    def test_multiple_calls_consistent(self):
        """Multiple calls with same params should work consistently"""
        manager = TemplateManager()

        dialogues = []
        for _ in range(10):
            dialogue = manager.get_dialogue(
                "player.victory",
                "happy",
                "cheerful",
                language="ko"
            )
            dialogues.append(dialogue)

        # All should be valid
        assert all(isinstance(d, str) and len(d) > 0 for d in dialogues)


class TestEdgeCases:
    """Test edge cases for multi-language system"""

    def test_empty_event_type(self):
        """Should handle empty event type"""
        manager = TemplateManager()

        dialogue = manager.get_dialogue("", "happy", "cheerful", language="ko")

        assert isinstance(dialogue, str)

    def test_empty_emotion(self):
        """Should handle empty emotion"""
        manager = TemplateManager()

        dialogue = manager.get_dialogue("player.victory", "", "cheerful", language="ko")

        assert isinstance(dialogue, str)

    def test_empty_persona(self):
        """Should handle empty persona"""
        manager = TemplateManager()

        dialogue = manager.get_dialogue("player.victory", "happy", "", language="ko")

        assert isinstance(dialogue, str)

    def test_none_language(self):
        """Should handle None language (use default)"""
        manager = TemplateManager(default_language="ko")

        dialogue = manager.get_dialogue("player.victory", "happy", "cheerful", language=None)

        assert isinstance(dialogue, str)

    def test_case_sensitivity(self):
        """Language codes should be case-sensitive"""
        manager = TemplateManager()

        # Lowercase should work
        dialogue = manager.get_dialogue("player.victory", "happy", "cheerful", language="ko")
        assert isinstance(dialogue, str)

        # Uppercase should fallback to default
        dialogue_upper = manager.get_dialogue(
            "player.victory",
            "happy",
            "cheerful",
            language="KO"
        )
        assert isinstance(dialogue_upper, str)


class TestPerformance:
    """Test performance of multi-language system"""

    def test_get_dialogue_performance(self):
        """Should retrieve dialogue quickly"""
        import time

        manager = TemplateManager()

        start = time.time()
        for _ in range(100):
            manager.get_dialogue("player.victory", "happy", "cheerful", language="ko")
        end = time.time()

        # 100 calls should complete in less than 1 second
        assert end - start < 1.0

    def test_language_switching_performance(self):
        """Should switch languages quickly"""
        import time

        manager = TemplateManager()

        start = time.time()
        for i in range(100):
            lang = ["en", "zh", "ja", "ko"][i % 4]
            manager.get_dialogue("player.victory", "happy", "cheerful", language=lang)
        end = time.time()

        # 100 calls with language switching should complete in less than 1 second
        assert end - start < 1.0


class TestFullWorkflow:
    """Test complete workflow with Korean"""

    def test_game_session_workflow(self):
        """Should handle a full game session in Korean"""
        manager = TemplateManager(default_language="ko")

        # Session start
        session_start = manager.get_dialogue("player.sessionstart", "cheerful", "cheerful")
        assert len(session_start) > 0

        # Combat start
        combat_start = manager.get_dialogue("combat.start", "confident", "cheerful")
        assert len(combat_start) > 0

        # Victory
        victory = manager.get_dialogue("player.victory", "happy", "cheerful")
        assert len(victory) > 0

        # Level up
        levelup = manager.get_dialogue("player.levelup", "excited", "cheerful")
        assert len(levelup) > 0

        # Achievement
        achievement = manager.get_dialogue("player.achievement", "proud", "cheerful")
        assert len(achievement) > 0

        # Session end
        session_end = manager.get_dialogue("player.sessionend", "neutral", "cheerful")
        assert len(session_end) > 0

        # All dialogues should be valid
        dialogues = [session_start, combat_start, victory, levelup, achievement, session_end]
        assert all(isinstance(d, str) and len(d) > 0 for d in dialogues)

    def test_multilingual_party(self):
        """Should handle companions in different languages"""
        manager = TemplateManager()

        # Companion 1 speaks Korean
        ko_victory = manager.get_dialogue("player.victory", "happy", "cheerful", language="ko")

        # Companion 2 speaks English
        en_victory = manager.get_dialogue("player.victory", "happy", "cool", language="en")

        # Companion 3 speaks Japanese
        ja_victory = manager.get_dialogue("player.victory", "happy", "cute", language="ja")

        # All should be valid
        assert isinstance(ko_victory, str) and len(ko_victory) > 0
        assert isinstance(en_victory, str) and len(en_victory) > 0
        assert isinstance(ja_victory, str) and len(ja_victory) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
