"""
Tests for RuleBasedAnalyzer
"""
import pytest
from src.rule_analyzer import RuleBasedAnalyzer


class TestRuleBasedAnalyzer:
    """Test rule-based emotion analysis"""

    def setup_method(self):
        """Setup for each test"""
        self.analyzer = RuleBasedAnalyzer()

    def test_victory_emotion(self):
        """Test victory event emotion"""
        result = self.analyzer.analyze("player.victory", {}, {})

        assert result.emotion == "happy"
        assert result.intensity == 0.9
        assert result.confidence >= 0.8
        assert "won" in result.reasoning.lower()

    def test_defeat_emotion(self):
        """Test defeat event emotion"""
        result = self.analyzer.analyze("player.defeat", {}, {})

        assert result.emotion == "sad"
        assert result.intensity == 0.7

    def test_multi_kill(self):
        """Test multi-kill emotion"""
        result = self.analyzer.analyze("player.kill", {"killCount": 3}, {})

        assert result.emotion == "excited"
        assert result.intensity == 0.95
        assert "Multi-kill" in result.reasoning

    def test_legendary_kill(self):
        """Test legendary kill emotion"""
        result = self.analyzer.analyze("player.kill", {"isLegendary": True}, {})

        assert result.emotion == "amazed"
        assert result.intensity == 1.0
        assert "Legendary" in result.reasoning

    def test_death_streak(self):
        """Test death streak emotion"""
        result = self.analyzer.analyze("player.death", {"deathStreak": 5}, {})

        assert result.emotion == "frustrated"
        assert result.intensity == 0.8
        assert "Death streak" in result.reasoning

    def test_legendary_achievement(self):
        """Test legendary achievement emotion"""
        result = self.analyzer.analyze("player.achievement", {"rarity": "legendary"}, {})

        assert result.emotion == "amazed"
        assert result.intensity == 1.0

    def test_context_low_health_reduces_positive(self):
        """Test low health reduces positive emotions"""
        result = self.analyzer.analyze(
            "player.victory",
            {},
            {"playerHealth": 15}
        )

        # Intensity should be reduced from base 0.9
        assert result.intensity < 0.9
        assert "health is critical" in result.reasoning

    def test_context_mvp_boosts_positive(self):
        """Test MVP status boosts positive emotions"""
        result = self.analyzer.analyze(
            "player.victory",
            {"mvp": True},
            {}
        )

        # MVP should boost intensity
        assert result.intensity > 0.9
        assert result.confidence == 0.95
        assert "MVP" in result.reasoning

    def test_context_win_streak(self):
        """Test win streak boosts emotion"""
        result = self.analyzer.analyze(
            "player.victory",
            {"winStreak": 5},
            {}
        )

        assert result.intensity > 0.9
        assert result.confidence == 0.95
        assert "win streak" in result.reasoning

    def test_context_stacking(self):
        """Test multiple context factors stack"""
        result = self.analyzer.analyze(
            "player.victory",
            {"winStreak": 5, "mvp": True, "difficulty": "nightmare"},
            {"inCombat": True}
        )

        # Multiple factors should stack, capped at 1.0
        assert result.intensity == 1.0
        assert result.confidence == 0.95
        assert "in combat" in result.reasoning
        assert "win streak" in result.reasoning
        assert "MVP" in result.reasoning

    def test_get_action_mapping(self):
        """Test emotion to action mapping"""
        assert self.analyzer.get_action("happy") == "smile"
        assert self.analyzer.get_action("excited") == "cheer"
        assert self.analyzer.get_action("amazed") == "surprised_jump"
        assert self.analyzer.get_action("proud") == "proud_pose"
        assert self.analyzer.get_action("frustrated") == "encourage"
        assert self.analyzer.get_action("unknown") == "idle"

    def test_unknown_event_type(self):
        """Test unknown event defaults to neutral"""
        result = self.analyzer.analyze("player.unknown", {}, {})

        assert result.emotion == "neutral"
        assert result.intensity == 0.5

    def test_all_event_types_covered(self):
        """Test all major event types"""
        event_types = [
            "player.victory", "player.defeat", "player.kill", "player.death",
            "player.achievement", "player.levelup", "player.teamvictory",
            "player.revived", "player.lootlegendary", "player.questcomplete",
            "player.skillcombo", "player.betrayed", "player.sessionstart"
        ]

        for event_type in event_types:
            result = self.analyzer.analyze(event_type, {}, {})
            assert result.emotion is not None
            assert 0.0 <= result.intensity <= 1.0
            assert result.confidence >= 0.5
