"""
ML-based emotion classifier using Claude API
"""
import time
from typing import Dict, Any, Optional
from anthropic import Anthropic, APIError
from .config import settings
from .models import MLResult


class MLEmotionClassifier:
    """ML-based emotion classifier using Claude API"""

    def __init__(self):
        """Initialize classifier with API client"""
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY not configured")

        self.client = Anthropic(api_key=settings.anthropic_api_key)

        # Available emotions (same as rule-based system)
        self.emotions = [
            "happy", "excited", "amazed", "proud", "satisfied",
            "cheerful", "grateful", "sad", "disappointed", "frustrated",
            "angry", "worried", "tired", "neutral"
        ]

    def classify(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> MLResult:
        """
        Classify emotion using ML (Claude API)

        Args:
            event_type: Type of game event
            event_data: Event-specific data
            context: Player context

        Returns:
            MLResult with emotion, intensity, reasoning, confidence, cost, latency
        """
        start_time = time.time()

        try:
            prompt = self._build_prompt(event_type, event_data, context)

            message = self.client.messages.create(
                model=settings.ml_model,
                max_tokens=settings.ml_max_tokens,
                temperature=settings.ml_temperature,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Parse response
            response_text = message.content[0].text.strip()
            result = self._parse_response(response_text)

            # Calculate cost
            cost = self._calculate_cost(message)
            latency_ms = (time.time() - start_time) * 1000

            return MLResult(
                emotion=result["emotion"],
                intensity=result["intensity"],
                reasoning=result["reasoning"],
                confidence=result["confidence"],
                cost=cost,
                latency_ms=round(latency_ms, 2)
            )

        except APIError as e:
            raise Exception(f"Claude API error: {str(e)}")
        except Exception as e:
            raise Exception(f"ML classification error: {str(e)}")

    def _build_prompt(
        self,
        event_type: str,
        event_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> str:
        """Build prompt for emotion classification"""

        # Format event data
        event_info = f"Event Type: {event_type}\n"
        if event_data:
            event_info += "Event Data:\n"
            for key, value in event_data.items():
                event_info += f"  - {key}: {value}\n"

        # Format context
        context_info = ""
        if context:
            context_info = "Player Context:\n"
            for key, value in context.items():
                context_info += f"  - {key}: {value}\n"

        # Available emotions
        emotions_list = ", ".join(self.emotions)

        prompt = f"""你是一个游戏情感分析专家。请分析以下游戏事件，并判断玩家最可能的情绪反应。

{event_info}
{context_info}

可选情绪列表：
{emotions_list}

请以以下JSON格式回复（不要包含markdown代码块标记）：
{{
  "emotion": "选定的情绪",
  "intensity": 0.0-1.0之间的数值,
  "reasoning": "简短的中文解释",
  "confidence": 0.0-1.0之间的置信度
}}

要求：
1. emotion必须从可选情绪列表中选择
2. intensity表示情绪强度（0=无情绪，1=极强情绪）
3. reasoning用中文简要说明为什么选择这个情绪
4. confidence表示你对这个判断的置信度

只返回JSON对象，不要其他文字。"""

        return prompt

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """Parse Claude API response into structured format"""
        import json

        try:
            # Remove markdown code blocks if present
            response_text = response_text.strip()
            if response_text.startswith("```"):
                # Remove ```json and ``` markers
                lines = response_text.split("\n")
                response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text

            data = json.loads(response_text)

            # Validate emotion is in allowed list
            emotion = data.get("emotion", "neutral")
            if emotion not in self.emotions:
                # Find closest match or default to neutral
                emotion = "neutral"

            # Validate ranges
            intensity = max(0.0, min(1.0, float(data.get("intensity", 0.5))))
            confidence = max(0.0, min(1.0, float(data.get("confidence", 0.7))))

            return {
                "emotion": emotion,
                "intensity": round(intensity, 2),
                "reasoning": data.get("reasoning", "ML analysis"),
                "confidence": round(confidence, 2)
            }

        except json.JSONDecodeError:
            # Fallback parsing for non-JSON responses
            return {
                "emotion": "neutral",
                "intensity": 0.5,
                "reasoning": "Unable to parse ML response",
                "confidence": 0.5
            }
        except Exception as e:
            raise Exception(f"Response parsing error: {str(e)}")

    def _calculate_cost(self, message) -> float:
        """Calculate API call cost"""
        # Claude Haiku pricing (as of 2024)
        input_cost_per_token = 0.25 / 1_000_000  # $0.25 per 1M input tokens
        output_cost_per_token = 1.25 / 1_000_000  # $1.25 per 1M output tokens

        input_tokens = message.usage.input_tokens
        output_tokens = message.usage.output_tokens

        cost = (input_tokens * input_cost_per_token) + (output_tokens * output_cost_per_token)

        return round(cost, 6)
