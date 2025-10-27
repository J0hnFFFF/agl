"""
LLM-based Dialogue Generation
Uses Anthropic Claude API for special cases
"""
import anthropic
from typing import List, Optional
from .models import DialogueRequest, Memory, Persona
from .config import settings
import logging
import time

logger = logging.getLogger(__name__)


class LLMGenerator:
    """Generates dialogue using Claude API"""

    def __init__(self):
        if settings.anthropic_api_key:
            self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        else:
            self.client = None
            logger.warning("Anthropic API key not configured, LLM generation disabled")

    async def generate(
        self,
        request: DialogueRequest,
        memories: Optional[List[Memory]] = None
    ) -> tuple[str, float, float]:
        """
        Generate dialogue using LLM

        Returns:
            (dialogue, cost, latency_ms)
        """
        if not self.client:
            raise RuntimeError("LLM client not initialized")

        start_time = time.time()

        try:
            # Build prompt
            prompt = self._build_prompt(request, memories)

            # Call Claude API
            message = self.client.messages.create(
                model=settings.llm_model,
                max_tokens=settings.llm_max_tokens,
                temperature=settings.llm_temperature,
                messages=[{"role": "user", "content": prompt}]
            )

            # Extract response
            dialogue = message.content[0].text.strip()

            # Ensure dialogue isn't too long
            if len(dialogue) > settings.dialogue_max_length:
                dialogue = dialogue[:settings.dialogue_max_length] + "..."

            # Calculate cost
            cost = self._calculate_cost(message)

            # Check cost limit
            if cost > settings.max_cost_per_request:
                logger.warning(f"Cost ${cost:.4f} exceeds limit ${settings.max_cost_per_request}")

            latency_ms = (time.time() - start_time) * 1000

            logger.info(
                f"LLM generation: {len(dialogue)} chars, ${cost:.4f}, {latency_ms:.1f}ms"
            )

            return dialogue, cost, latency_ms

        except anthropic.APITimeoutError:
            logger.error("Claude API timeout")
            raise
        except anthropic.APIError as e:
            logger.error(f"Claude API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in LLM generation: {e}")
            raise

    def _build_prompt(
        self,
        request: DialogueRequest,
        memories: Optional[List[Memory]] = None
    ) -> str:
        """Build prompt for Claude"""

        # Persona descriptions
        persona_descriptions = {
            Persona.CHEERFUL: "你是一个活泼开朗、充满正能量的游戏伙伴。说话热情洋溢，经常使用感叹号和emoji（✨🎉💕），喜欢鼓励玩家。",
            Persona.COOL: "你是一个冷静沉着、理性分析的游戏导师。说话简洁有力，少用标点符号，提供客观事实性的反馈。",
            Persona.CUTE: "你是一个可爱软萌、温柔体贴的游戏伙伴。说话带有"~"，使用"哇"、"呜"等语气词，关心玩家的感受。"
        }

        persona_desc = persona_descriptions.get(request.persona, persona_descriptions[Persona.CHEERFUL])

        # Event description
        event_desc = self._describe_event(request)

        # Memory context
        memory_context = ""
        if memories:
            memory_context = "\\n\\n玩家相关记忆：\\n"
            for i, mem in enumerate(memories[:3], 1):  # Top 3 memories
                memory_context += f"{i}. {mem.content} (重要性: {mem.importance:.2f})\\n"

        # Context details
        context_desc = ""
        context = request.context or {}
        if context:
            interesting_facts = []

            if context.get("rarity") in ["legendary", "mythic"]:
                interesting_facts.append(f"稀有度: {context['rarity']}")
            if context.get("win_streak", 0) >= 5:
                interesting_facts.append(f"连胜: {context['win_streak']}场")
            if context.get("loss_streak", 0) >= 5:
                interesting_facts.append(f"连败: {context['loss_streak']}场")
            if context.get("mvp"):
                interesting_facts.append("MVP表现")
            if context.get("is_first_time"):
                interesting_facts.append("首次达成")
            if context.get("clutch"):
                interesting_facts.append("关键时刻")

            if interesting_facts:
                context_desc = f"\\n\\n特殊情况: {', '.join(interesting_facts)}"

        # Player name
        player_name = request.player_name or "玩家"

        prompt = f"""{persona_desc}

当前情况:
- 事件类型: {event_desc}
- 玩家情绪: {request.emotion}
- 玩家: {player_name}{context_desc}{memory_context}

请生成一句简短自然的中文回应（最多{settings.dialogue_max_length}个字符），符合你的人设特点。
直接输出对话内容，不要加引号或解释。"""

        return prompt

    def _describe_event(self, request: DialogueRequest) -> str:
        """Convert event type to Chinese description"""
        event_map = {
            "player.victory": "玩家获得胜利",
            "player.defeat": "玩家失败",
            "player.kill": "玩家击杀敌人",
            "player.death": "玩家阵亡",
            "player.achievement": "玩家解锁成就",
            "player.levelup": "玩家升级",
            "player.lootlegendary": "获得传奇装备",
            "player.lootepic": "获得史诗装备",
            "player.loot": "获得战利品",
            "player.questcomplete": "完成任务",
            "player.questfailed": "任务失败",
            "player.teamvictory": "团队胜利",
            "player.revived": "玩家被复活",
            "player.savedally": "拯救队友",
            "player.betrayed": "被队友背叛",
            "player.skillcombo": "技能连招",
            "player.sessionstart": "游戏开始",
            "player.sessionend": "游戏结束",
            "player.timeout": "网络超时",
            "player.outofresources": "资源不足",
        }

        return event_map.get(request.event_type, request.event_type)

    def _calculate_cost(self, message: anthropic.types.Message) -> float:
        """
        Calculate cost based on Claude API pricing

        Claude 3 Haiku pricing:
        - Input: $0.25 / 1M tokens
        - Output: $1.25 / 1M tokens
        """
        input_tokens = message.usage.input_tokens
        output_tokens = message.usage.output_tokens

        input_cost = (input_tokens / 1_000_000) * 0.25
        output_cost = (output_tokens / 1_000_000) * 1.25

        return input_cost + output_cost
