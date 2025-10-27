"""
Tests for Dialogue Service (Integration)
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.dialogue_service import DialogueService
from src.models import DialogueRequest, Persona, GenerationMethod


class TestDialogueService:
    """Test main dialogue service"""

    @pytest.fixture
    def service(self):
        """Create service instance"""
        return DialogueService()

    @pytest.mark.asyncio
    async def test_generate_with_template(self, service):
        """Test template-based generation"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )

        response = await service.generate_dialogue(request)

        assert response is not None
        assert response.method == GenerationMethod.TEMPLATE
        assert response.cost == 0.0
        assert len(response.dialogue) > 0
        assert response.used_special_case is False
        assert response.latency_ms > 0

    @pytest.mark.asyncio
    async def test_generate_with_force_llm(self, service):
        """Test forced LLM generation"""
        with patch.object(service.llm_generator, 'generate', new=AsyncMock(
            return_value=("这是LLM生成的！", 0.0005, 450.0)
        )):
            request = DialogueRequest(
                event_type="player.victory",
                emotion="happy",
                persona=Persona.CHEERFUL,
                force_llm=True
            )

            response = await service.generate_dialogue(request)

            assert response.method == GenerationMethod.LLM
            assert response.cost > 0
            assert response.used_special_case is True
            assert "force_llm" in response.special_case_reasons

    @pytest.mark.asyncio
    async def test_generate_with_legendary_event(self, service):
        """Test LLM triggered by legendary event"""
        with patch.object(service.llm_generator, 'generate', new=AsyncMock(
            return_value=("传奇胜利！！", 0.0008, 500.0)
        )):
            request = DialogueRequest(
                event_type="player.victory",
                emotion="amazed",
                persona=Persona.CHEERFUL,
                context={"rarity": "legendary"}
            )

            response = await service.generate_dialogue(request)

            assert response.method == GenerationMethod.LLM
            assert response.used_special_case is True
            assert "legendary_rarity" in response.special_case_reasons

    @pytest.mark.asyncio
    async def test_generate_with_memories(self, service, sample_memories):
        """Test generation with player memories"""
        with patch.object(service.memory_client, 'get_context_memories', new=AsyncMock(
            return_value=sample_memories
        )), patch.object(service.llm_generator, 'generate', new=AsyncMock(
            return_value=("基于记忆的对话", 0.0006, 480.0)
        )):
            request = DialogueRequest(
                event_type="player.victory",
                emotion="amazed",
                persona=Persona.CHEERFUL,
                player_id="player-123",
                context={"rarity": "legendary"}
            )

            response = await service.generate_dialogue(request)

            assert response.method == GenerationMethod.LLM
            assert response.memory_count == 3

    @pytest.mark.asyncio
    async def test_generate_with_cache_hit(self, service):
        """Test cache hit"""
        request = DialogueRequest(
            event_type="player.victory",
            emotion="happy",
            persona=Persona.CHEERFUL
        )

        # First call - not cached
        response1 = await service.generate_dialogue(request)
        assert response1.cache_hit is False

        # Second call - should hit cache
        response2 = await service.generate_dialogue(request)
        assert response2.cache_hit is True
        assert response2.method == GenerationMethod.CACHED
        assert response2.dialogue == response1.dialogue

    @pytest.mark.asyncio
    async def test_llm_fallback_to_template_on_error(self, service):
        """Test fallback to template when LLM fails"""
        with patch.object(service.llm_generator, 'generate', side_effect=Exception("API Error")):
            request = DialogueRequest(
                event_type="player.victory",
                emotion="amazed",
                persona=Persona.CHEERFUL,
                force_llm=True
            )

            response = await service.generate_dialogue(request)

            # Should fallback to template
            assert response.method == GenerationMethod.TEMPLATE
            assert response.cost == 0.0

    @pytest.mark.asyncio
    async def test_budget_exceeded_fallback(self, service):
        """Test fallback when budget exceeded"""
        # Exhaust budget
        service.cost_manager.record_request(GenerationMethod.LLM, 15.0, 500.0)

        request = DialogueRequest(
            event_type="player.victory",
            emotion="amazed",
            persona=Persona.CHEERFUL,
            context={"rarity": "legendary"}
        )

        response = await service.generate_dialogue(request)

        # Should use template due to budget
        assert response.method == GenerationMethod.TEMPLATE

    @pytest.mark.asyncio
    async def test_memory_fetch_error_graceful(self, service):
        """Test graceful handling of memory fetch errors"""
        with patch.object(service.memory_client, 'get_context_memories', side_effect=Exception("Network error")):
            request = DialogueRequest(
                event_type="player.victory",
                emotion="happy",
                persona=Persona.CHEERFUL,
                player_id="player-123"
            )

            response = await service.generate_dialogue(request)

            # Should still generate dialogue
            assert response is not None
            assert len(response.dialogue) > 0

    @pytest.mark.asyncio
    async def test_health_check(self, service):
        """Test health check"""
        with patch.object(service.memory_client, 'check_health', new=AsyncMock(return_value=True)):
            health = await service.health_check()

            assert "service" in health
            assert "version" in health
            assert "llm_enabled" in health
            assert "cache_stats" in health
            assert "cost_stats" in health

    @pytest.mark.asyncio
    async def test_different_personas(self, service):
        """Test dialogue for different personas"""
        personas = [Persona.CHEERFUL, Persona.COOL, Persona.CUTE]

        for persona in personas:
            request = DialogueRequest(
                event_type="player.victory",
                emotion="happy",
                persona=persona
            )

            response = await service.generate_dialogue(request)

            assert response is not None
            assert len(response.dialogue) > 0

    @pytest.mark.asyncio
    async def test_emergency_fallback(self, service):
        """Test emergency fallback when everything fails"""
        with patch('src.templates.select_template', side_effect=Exception("Template error")):
            request = DialogueRequest(
                event_type="player.victory",
                emotion="happy",
                persona=Persona.CHEERFUL
            )

            response = await service.generate_dialogue(request)

            # Should return emergency fallback
            assert response is not None
            assert response.dialogue in ["加油！✨", "继续。", "一起努力吧~"]
