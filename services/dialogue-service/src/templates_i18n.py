"""
Multi-language Template Manager
Handles template selection based on language preference
"""
from typing import Dict, List, Optional
from .templates import get_template_dialogue as get_template_dialogue_zh
from .templates_en import get_template_dialogue_en
from .templates_ja import get_template_dialogue_ja
from .templates_ko import get_random_ko_dialogue as get_template_dialogue_ko


# Supported languages
SUPPORTED_LANGUAGES = ["zh", "en", "ja", "ko"]
DEFAULT_LANGUAGE = "zh"


class TemplateManager:
    """
    Manages multi-language dialogue templates
    """

    def __init__(self, default_language: str = DEFAULT_LANGUAGE):
        """
        Initialize the template manager

        Args:
            default_language: Default language code (zh, en, ja)
        """
        if default_language not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Unsupported language: {default_language}. "
                f"Supported languages: {SUPPORTED_LANGUAGES}"
            )
        self.default_language = default_language

        # Language-specific template getters
        self.language_templates = {
            "zh": get_template_dialogue_zh,
            "en": get_template_dialogue_en,
            "ja": get_template_dialogue_ja,
            "ko": get_template_dialogue_ko,
        }

    def get_dialogue(
        self,
        event_type: str,
        emotion: str,
        persona: str,
        language: Optional[str] = None,
    ) -> str:
        """
        Get dialogue template in the specified language

        Args:
            event_type: Type of event (e.g., "player.victory")
            emotion: Emotion type (e.g., "happy")
            persona: Persona type (e.g., "cheerful")
            language: Language code (zh, en, ja). Uses default if not specified.

        Returns:
            Dialogue string in the requested language
        """
        # Use default language if not specified
        lang = language or self.default_language

        # Validate language
        if lang not in SUPPORTED_LANGUAGES:
            # Fallback to default language if invalid
            lang = self.default_language

        # Get template function for the language
        get_template_fn = self.language_templates[lang]

        # Get dialogue
        return get_template_fn(event_type, emotion, persona)

    def is_language_supported(self, language: str) -> bool:
        """
        Check if a language is supported

        Args:
            language: Language code to check

        Returns:
            True if language is supported
        """
        return language in SUPPORTED_LANGUAGES

    def get_supported_languages(self) -> List[str]:
        """
        Get list of supported language codes

        Returns:
            List of supported language codes
        """
        return SUPPORTED_LANGUAGES.copy()

    def set_default_language(self, language: str):
        """
        Set the default language

        Args:
            language: Language code to set as default

        Raises:
            ValueError: If language is not supported
        """
        if language not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Unsupported language: {language}. "
                f"Supported languages: {SUPPORTED_LANGUAGES}"
            )
        self.default_language = language


# Global template manager instance
_template_manager = TemplateManager()


def get_dialogue(
    event_type: str,
    emotion: str,
    persona: str,
    language: Optional[str] = None,
) -> str:
    """
    Get dialogue template (convenience function)

    Args:
        event_type: Type of event
        emotion: Emotion type
        persona: Persona type
        language: Language code (optional)

    Returns:
        Dialogue string
    """
    return _template_manager.get_dialogue(event_type, emotion, persona, language)


def set_default_language(language: str):
    """
    Set the default language (convenience function)

    Args:
        language: Language code
    """
    _template_manager.set_default_language(language)


def get_supported_languages() -> List[str]:
    """
    Get supported languages (convenience function)

    Returns:
        List of supported language codes
    """
    return _template_manager.get_supported_languages()
