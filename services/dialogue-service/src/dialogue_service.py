"""
Main Dialogue Service
Hybrid dialogue generation with 90% template, 10% LLM
"""
import time
import logging
from typing import Optional, List
from .models import (
    DialogueRequest,
    DialogueResponse,
    GenerationMethod,
    Memory
)
from .special_case_detector import SpecialCaseDetector
from .memory_client import MemoryServiceClient
from .llm_generator import LLMGenerator
from .cache import dialogue_cache
from .cost_tracker import cost_manager
from .templates import select_template
from .templates_i18n import get_dialogue as get_i18n_dialogue
from .config import settings

logger = logging.getLogger(__name__)


class DialogueService:
    """
    Main dialogue generation service

    Implements 90/10 hybrid strategy:
    - 90% fast template-based generation
    - 10% LLM for special cases with memory context
    """

    def __init__(self):
        self.special_case_detector = SpecialCaseDetector()
        self.memory_client = MemoryServiceClient()
        self.llm_generator = LLMGenerator()

    async def generate_dialogue(self, request: DialogueRequest) -> DialogueResponse:
        """
        Generate dialogue response

        Flow:
        1. Check cache for existing response
        2. Fetch memories if player_id provided
        3. Detect if special case (LLM trigger)
        4. Generate using template or LLM
        5. Cache response
        6. Track costs

        Args:
            request: Dialogue generation request

        Returns:
            DialogueResponse with generated dialogue
        """
        start_time = time.time()

        try:
            # Check cache first
            cached = dialogue_cache.get(request)
            if cached:
                dialogue, cost = cached
                latency_ms = (time.time() - start_time) * 1000

                logger.info(f"Cache hit: {dialogue[:30]}...")
                cost_manager.record_request(GenerationMethod.CACHED, cost, latency_ms)

                return DialogueResponse(
                    dialogue=dialogue,
                    method=GenerationMethod.CACHED,
                    cost=cost,
                    cache_hit=True,
                    latency_ms=latency_ms
                )

            # Fetch memories if player provided
            memories: Optional[List[Memory]] = None
            if request.player_id:
                memories = await self._fetch_memories(request)
                logger.debug(f"Fetched {len(memories) if memories else 0} memories for player {request.player_id}")

            # Detect special case
            should_use_llm, reasons = self.special_case_detector.should_use_llm(
                request, memories
            )

            # Check budget if LLM needed
            if should_use_llm:
                can_use, budget_reason = cost_manager.can_use_llm()
                if not can_use:
                    logger.warning(f"LLM budget exceeded, falling back to template: {budget_reason}")
                    should_use_llm = False
                    reasons = []

            # Generate dialogue
            if should_use_llm:
                response = await self._generate_with_llm(request, memories, reasons, start_time)
            else:
                response = self._generate_with_template(request, start_time)

            # Cache the response
            if settings.cache_enabled and not request.force_llm:
                dialogue_cache.set(request, response.dialogue, response.cost)

            # Record cost
            cost_manager.record_request(response.method, response.cost, response.latency_ms)

            logger.info(
                f"Generated dialogue: method={response.method.value}, "
                f"cost=${response.cost:.4f}, latency={response.latency_ms:.1f}ms"
            )

            return response

        except Exception as e:
            logger.error(f"Error generating dialogue: {e}", exc_info=True)
            # Fallback to simple template
            return self._emergency_fallback(request, start_time)

    async def _fetch_memories(self, request: DialogueRequest) -> Optional[List[Memory]]:
        """Fetch relevant memories for context"""
        try:
            event_desc = f"{request.event_type} with {request.emotion}"
            memories = await self.memory_client.get_context_memories(
                request.player_id,
                event_desc
            )
            return memories
        except Exception as e:
            logger.error(f"Failed to fetch memories: {e}")
            return None

    async def _generate_with_llm(
        self,
        request: DialogueRequest,
        memories: Optional[List[Memory]],
        reasons: List[str],
        start_time: float
    ) -> DialogueResponse:
        """Generate dialogue using LLM"""
        try:
            dialogue, cost, llm_latency = await self.llm_generator.generate(
                request, memories
            )

            total_latency_ms = (time.time() - start_time) * 1000

            return DialogueResponse(
                dialogue=dialogue,
                method=GenerationMethod.LLM,
                cost=cost,
                used_special_case=True,
                special_case_reasons=reasons,
                memory_count=len(memories) if memories else 0,
                cache_hit=False,
                latency_ms=total_latency_ms
            )

        except Exception as e:
            logger.error(f"LLM generation failed, falling back to template: {e}")
            # Fallback to template on LLM failure
            return self._generate_with_template(request, start_time)

    def _generate_with_template(
        self,
        request: DialogueRequest,
        start_time: float
    ) -> DialogueResponse:
        """Generate dialogue using template"""
        # Use i18n template system if language specified
        if request.language and request.language != "zh":
            dialogue = get_i18n_dialogue(
                request.event_type,
                request.emotion,
                request.persona.value,
                request.language
            )
        else:
            # Default to Chinese (original system)
            dialogue = select_template(
                request.event_type,
                request.emotion,
                request.persona.value
            )

        latency_ms = (time.time() - start_time) * 1000

        return DialogueResponse(
            dialogue=dialogue,
            method=GenerationMethod.TEMPLATE,
            cost=0.0,
            used_special_case=False,
            special_case_reasons=[],
            memory_count=0,
            cache_hit=False,
            latency_ms=latency_ms
        )

    def _emergency_fallback(
        self,
        request: DialogueRequest,
        start_time: float
    ) -> DialogueResponse:
        """Emergency fallback when everything fails"""
        # Multi-language fallbacks
        fallbacks_by_lang = {
            "zh": {
                "cheerful": "加油！✨",
                "cool": "继续。",
                "cute": "一起努力吧~"
            },
            "en": {
                "cheerful": "Let's go! ✨",
                "cool": "Continue.",
                "cute": "Let's do our best~"
            },
            "ja": {
                "cheerful": "頑張って！✨",
                "cool": "続けよう。",
                "cute": "一緒に頑張ろうね~"
            }
        }

        lang = request.language or "zh"
        lang_fallbacks = fallbacks_by_lang.get(lang, fallbacks_by_lang["zh"])
        dialogue = lang_fallbacks.get(request.persona.value, lang_fallbacks["cheerful"])
        latency_ms = (time.time() - start_time) * 1000

        return DialogueResponse(
            dialogue=dialogue,
            method=GenerationMethod.TEMPLATE,
            cost=0.0,
            used_special_case=False,
            special_case_reasons=[],
            memory_count=0,
            cache_hit=False,
            latency_ms=latency_ms
        )

    async def health_check(self) -> dict:
        """Check service health"""
        memory_available = await self.memory_client.check_health()

        return {
            "service": settings.service_name,
            "version": settings.service_version,
            "llm_enabled": settings.llm_enabled,
            "cache_enabled": settings.cache_enabled,
            "memory_service_available": memory_available,
            "cache_stats": dialogue_cache.get_stats(),
            "cost_stats": cost_manager.get_budget_status(),
        }


# Global service instance
dialogue_service = DialogueService()
