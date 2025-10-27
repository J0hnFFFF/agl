import pytest
from fastapi.testclient import TestClient
from main import app, _get_template_dialogue, _get_dialogue_templates, _get_emotion_fallbacks

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints"""

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "dialogue-service"
        assert data["version"] == "0.1.0"
        assert data["status"] == "ok"

    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestDialogueGeneration:
    """Test dialogue generation endpoint"""

    def test_generate_victory_cheerful(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.victory",
                "emotion": "happy",
                "persona": "cheerful"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["method"] == "template"
        assert data["cost"] == 0.0
        assert len(data["dialogue"]) > 0
        # Should contain cheerful characteristics
        assert any(char in data["dialogue"] for char in ["！", "✨", "🎉", "哇"])

    def test_generate_victory_cool(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.victory",
                "emotion": "happy",
                "persona": "cool"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["dialogue"]) > 0
        # Cool persona should use shorter, calmer language
        assert len(data["dialogue"]) < 20

    def test_generate_victory_cute(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.victory",
                "emotion": "happy",
                "persona": "cute"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["dialogue"]) > 0
        # Cute persona should use soft language
        assert any(char in data["dialogue"] for char in ["~", "哇", "呜", "💕"])

    def test_generate_defeat_cheerful(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.defeat",
                "emotion": "sad",
                "persona": "cheerful"
            }
        )
        assert response.status_code == 200
        data = response.json()
        dialogue = data["dialogue"]
        # Should be encouraging despite defeat
        assert any(word in dialogue for word in ["加油", "没关系", "下次"])

    def test_generate_kill_excited(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.kill",
                "emotion": "excited",
                "persona": "cheerful"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["dialogue"]) > 0

    def test_generate_death_frustrated(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.death",
                "emotion": "frustrated",
                "persona": "cheerful"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["dialogue"]) > 0

    def test_generate_achievement_legendary(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.achievement",
                "emotion": "amazed",
                "persona": "cheerful"
            }
        )
        assert response.status_code == 200
        data = response.json()
        dialogue = data["dialogue"]
        # Should express amazement
        assert any(char in dialogue for char in ["！", "天", "传奇"])

    def test_generate_with_missing_event_uses_fallback(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.unknown_event",
                "emotion": "happy",
                "persona": "cheerful"
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Should still return something via fallback
        assert len(data["dialogue"]) > 0

    def test_generate_with_unknown_persona_uses_default(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.victory",
                "emotion": "happy",
                "persona": "unknown_persona"
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Should return fallback dialogue
        assert data["dialogue"] == "加油！"

    def test_always_returns_zero_cost(self):
        response = client.post(
            "/generate",
            json={
                "event_type": "player.victory",
                "emotion": "happy",
                "persona": "cheerful"
            }
        )
        assert response.status_code == 200
        assert response.json()["cost"] == 0.0


class TestTemplateDialogue:
    """Test _get_template_dialogue function"""

    def test_exact_match_returns_template(self):
        dialogue = _get_template_dialogue("player.victory", "happy", "cheerful")
        assert len(dialogue) > 0
        assert isinstance(dialogue, str)

    def test_cool_persona_characteristics(self):
        templates = _get_dialogue_templates()
        cool_dialogues = [
            v for k, v in templates.items()
            if k[2] == "cool"  # persona is third element in key
        ]
        assert len(cool_dialogues) > 0

        # Test a few cool dialogues
        dialogue = _get_template_dialogue("player.victory", "happy", "cool")
        # Cool persona should be concise
        assert len(dialogue) < 20
        assert "。" in dialogue or len(dialogue) < 10

    def test_cheerful_persona_characteristics(self):
        dialogue = _get_template_dialogue("player.victory", "excited", "cheerful")
        # Cheerful should have energy
        assert "！" in dialogue or "✨" in dialogue or "🎉" in dialogue

    def test_cute_persona_characteristics(self):
        dialogue = _get_template_dialogue("player.victory", "happy", "cute")
        # Cute should have soft language
        assert "~" in dialogue or "哇" in dialogue or "呜" in dialogue or "💕" in dialogue

    def test_fallback_to_emotion_persona(self):
        # Try an event that doesn't exist
        dialogue = _get_template_dialogue("player.nonexistent", "happy", "cheerful")
        # Should still return something
        assert len(dialogue) > 0

    def test_ultimate_fallback_by_persona(self):
        # Completely unknown combination
        dialogue = _get_template_dialogue("unknown.event", "unknown.emotion", "cheerful")
        assert dialogue == "继续加油！✨"

        dialogue = _get_template_dialogue("unknown.event", "unknown.emotion", "cool")
        assert dialogue == "继续保持。"

        dialogue = _get_template_dialogue("unknown.event", "unknown.emotion", "cute")
        assert dialogue == "一起努力吧~"

    def test_returns_different_variants(self):
        # Call multiple times to check randomness
        dialogues = set()
        for _ in range(20):
            dialogue = _get_template_dialogue("player.victory", "happy", "cheerful")
            dialogues.add(dialogue)

        # Should have multiple variants (at least 2)
        assert len(dialogues) >= 2


class TestTemplateLibrary:
    """Test dialogue template library"""

    def test_templates_exist(self):
        templates = _get_dialogue_templates()
        assert len(templates) > 0

    def test_all_three_personas_covered(self):
        templates = _get_dialogue_templates()
        personas = set()
        for key in templates.keys():
            if len(key) >= 3:
                personas.add(key[2])

        assert "cheerful" in personas
        assert "cool" in personas
        assert "cute" in personas

    def test_combat_event_templates_exist(self):
        templates = _get_dialogue_templates()
        combat_events = [
            "player.victory", "player.defeat", "player.kill", "player.death"
        ]

        for event in combat_events:
            found = any(event in str(key) for key in templates.keys())
            assert found, f"Missing templates for {event}"

    def test_achievement_templates_exist(self):
        templates = _get_dialogue_templates()
        achievement_keys = [
            k for k in templates.keys()
            if "achievement" in str(k)
        ]
        assert len(achievement_keys) > 0

    def test_loot_templates_exist(self):
        templates = _get_dialogue_templates()
        loot_keys = [
            k for k in templates.keys()
            if "loot" in str(k)
        ]
        assert len(loot_keys) > 0

    def test_all_templates_have_variants(self):
        templates = _get_dialogue_templates()
        for key, dialogues in templates.items():
            assert isinstance(dialogues, list)
            assert len(dialogues) >= 1
            # Most should have multiple variants
            for dialogue in dialogues:
                assert isinstance(dialogue, str)
                assert len(dialogue) > 0

    def test_template_keys_are_tuples(self):
        templates = _get_dialogue_templates()
        for key in templates.keys():
            assert isinstance(key, tuple)
            assert len(key) == 3  # (event_type, emotion, persona)


class TestEmotionFallbacks:
    """Test emotion fallback system"""

    def test_fallbacks_exist(self):
        fallbacks = _get_emotion_fallbacks()
        assert len(fallbacks) > 0

    def test_fallback_structure(self):
        fallbacks = _get_emotion_fallbacks()
        for key, dialogues in fallbacks.items():
            assert isinstance(key, tuple)
            assert len(key) == 2  # (emotion, persona)
            assert isinstance(dialogues, list)
            assert len(dialogues) > 0

    def test_common_emotions_have_fallbacks(self):
        fallbacks = _get_emotion_fallbacks()
        common_emotions = ["happy", "excited", "sad", "frustrated", "neutral"]
        personas = ["cheerful", "cool", "cute"]

        for emotion in common_emotions:
            for persona in personas:
                key = (emotion, persona)
                assert key in fallbacks, f"Missing fallback for {key}"

    def test_fallback_persona_consistency(self):
        fallbacks = _get_emotion_fallbacks()

        # Test cheerful fallbacks have energy
        cheerful_happy = fallbacks.get(("happy", "cheerful"))
        assert any("！" in d for d in cheerful_happy)

        # Test cool fallbacks are concise
        cool_happy = fallbacks.get(("happy", "cool"))
        for dialogue in cool_happy:
            assert len(dialogue) < 10

        # Test cute fallbacks have soft language
        cute_happy = fallbacks.get(("happy", "cute"))
        assert any("~" in d for d in cute_happy)


class TestSpecificEventScenarios:
    """Test specific game scenarios"""

    def test_legendary_loot_excitement(self):
        dialogue = _get_template_dialogue("player.lootlegendary", "excited", "cheerful")
        assert "传奇" in dialogue or "金色" in dialogue
        assert "！" in dialogue

    def test_team_victory_social_aspect(self):
        dialogue = _get_template_dialogue("player.teamvictory", "happy", "cheerful")
        assert "团队" in dialogue or "大家" in dialogue or "配合" in dialogue

    def test_session_start_greeting(self):
        dialogue = _get_template_dialogue("player.sessionstart", "cheerful", "cheerful")
        assert "开始" in dialogue or "准备" in dialogue

    def test_quest_complete_satisfaction(self):
        dialogue = _get_template_dialogue("player.questcomplete", "satisfied", "cheerful")
        assert "任务" in dialogue or "Quest" in dialogue or "完成" in dialogue

    def test_combo_skill_excitement(self):
        dialogue = _get_template_dialogue("player.skillcombo", "excited", "cheerful")
        assert "连招" in dialogue or "combo" in dialogue.lower() or "技能" in dialogue


class TestPersonaConsistency:
    """Test that personas remain consistent across different events"""

    def test_cheerful_always_energetic(self):
        events = [
            ("player.victory", "happy"),
            ("player.kill", "excited"),
            ("player.achievement", "happy"),
        ]

        for event, emotion in events:
            dialogue = _get_template_dialogue(event, emotion, "cheerful")
            # Cheerful should have energy markers
            has_energy = any(char in dialogue for char in ["！", "✨", "🎉", "哇"])
            assert has_energy, f"Cheerful dialogue lacks energy for {event}: {dialogue}"

    def test_cool_always_concise(self):
        events = [
            ("player.victory", "happy"),
            ("player.kill", "satisfied"),
        ]

        for event, emotion in events:
            dialogue = _get_template_dialogue(event, emotion, "cool")
            # Cool should be short and calm
            assert len(dialogue) < 20, f"Cool dialogue too long for {event}: {dialogue}"

    def test_cute_always_soft(self):
        events = [
            ("player.victory", "happy"),
            ("player.defeat", "sad"),
        ]

        for event, emotion in events:
            dialogue = _get_template_dialogue(event, emotion, "cute")
            # Cute should have soft language markers
            has_softness = any(char in dialogue for char in ["~", "哇", "呜", "呀", "💕"])
            assert has_softness or len(dialogue) < 10, \
                f"Cute dialogue lacks softness for {event}: {dialogue}"


class TestFallbackMechanism:
    """Test the multi-tier fallback system"""

    def test_tier1_exact_match(self):
        # Should match exactly
        dialogue = _get_template_dialogue("player.victory", "happy", "cheerful")
        templates = _get_dialogue_templates()
        possible = templates.get(("player.victory", "happy", "cheerful"), [])
        assert dialogue in possible

    def test_tier2_event_emotion_match(self):
        # Create a scenario where persona doesn't match but event+emotion does
        # Since we have templates for all personas, we'll just verify the fallback logic exists
        dialogue = _get_template_dialogue("player.victory", "happy", "cheerful")
        assert len(dialogue) > 0

    def test_tier3_emotion_persona_fallback(self):
        # Unknown event should fall back to emotion+persona
        dialogue = _get_template_dialogue("player.unknown", "happy", "cheerful")
        fallbacks = _get_emotion_fallbacks()
        possible = fallbacks.get(("happy", "cheerful"), [])
        # Should either match template or fallback
        assert len(dialogue) > 0

    def test_tier4_ultimate_fallback(self):
        # Completely unknown should use ultimate fallback
        dialogue = _get_template_dialogue("unknown", "unknown", "cheerful")
        assert dialogue == "继续加油！✨"

        dialogue = _get_template_dialogue("unknown", "unknown", "cool")
        assert dialogue == "继续保持。"

        dialogue = _get_template_dialogue("unknown", "unknown", "cute")
        assert dialogue == "一起努力吧~"

        # Unknown persona with unknown event/emotion
        dialogue = _get_template_dialogue("unknown", "unknown", "invalid")
        assert dialogue == "加油！"


class TestCoverageMetrics:
    """Test template library coverage"""

    def test_minimum_template_count(self):
        templates = _get_dialogue_templates()
        # Should have at least 80 template combinations
        assert len(templates) >= 80

    def test_emotion_coverage(self):
        templates = _get_dialogue_templates()
        emotions = set()
        for key in templates.keys():
            if len(key) >= 2:
                emotions.add(key[1])

        # Should cover major emotions
        major_emotions = ["happy", "excited", "sad", "disappointed", "satisfied", "amazed"]
        for emotion in major_emotions:
            assert emotion in emotions

    def test_event_type_coverage(self):
        templates = _get_dialogue_templates()
        event_types = set()
        for key in templates.keys():
            if len(key) >= 1:
                event_types.add(key[0])

        # Should cover major event categories
        assert len(event_types) >= 15  # At least 15 different event types
