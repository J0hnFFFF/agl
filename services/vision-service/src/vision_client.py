"""
Vision API clients for OpenAI GPT-4V and Anthropic Claude Vision
"""
import time
import logging
from typing import Dict, Any, Optional
import base64

from openai import OpenAI
from anthropic import Anthropic

from .config import settings
from .image_processor import image_processor

logger = logging.getLogger(__name__)


class VisionAPIClient:
    """Unified client for multiple vision API providers"""

    def __init__(self):
        """Initialize vision API clients"""
        self.openai_client: Optional[OpenAI] = None
        self.anthropic_client: Optional[Anthropic] = None

        # Initialize OpenAI if key available
        if settings.openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=settings.openai_api_key)
                logger.info("OpenAI GPT-4V client initialized")
            except Exception as e:
                logger.error(f"OpenAI client initialization failed: {e}")

        # Initialize Anthropic if key available
        if settings.anthropic_api_key:
            try:
                self.anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
                logger.info("Anthropic Claude Vision client initialized")
            except Exception as e:
                logger.error(f"Anthropic client initialization failed: {e}")

    async def analyze_image(
        self,
        image_data: bytes,
        prompt: str,
        provider: Optional[str] = None,
        detail: str = "auto"
    ) -> Dict[str, Any]:
        """
        Analyze image using vision API

        Args:
            image_data: Image bytes
            prompt: Analysis prompt
            provider: API provider ('openai' or 'anthropic', None for auto)
            detail: Detail level for OpenAI (low, high, auto)

        Returns:
            Analysis result with metadata
        """
        start_time = time.time()

        # Determine provider
        if provider is None:
            provider = self._select_provider()

        # Process image
        processed_image, image_metadata = image_processor.process_image(
            image_data,
            optimize=settings.enable_image_optimization
        )

        # Call appropriate API
        if provider == "openai":
            result = await self._analyze_with_openai(
                processed_image,
                prompt,
                detail
            )
        elif provider == "anthropic":
            result = await self._analyze_with_anthropic(
                processed_image,
                prompt
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")

        # Add metadata
        processing_time = (time.time() - start_time) * 1000
        result['processing_time_ms'] = processing_time
        result['provider'] = provider
        result['image_metadata'] = image_metadata

        logger.info(
            f"Vision analysis completed in {processing_time:.1f}ms "
            f"(provider: {provider}, cost: ${result['cost']:.4f})"
        )

        return result

    async def _analyze_with_openai(
        self,
        image_data: bytes,
        prompt: str,
        detail: str = "auto"
    ) -> Dict[str, Any]:
        """
        Analyze image using OpenAI GPT-4V

        Args:
            image_data: Processed image bytes
            prompt: Analysis prompt
            detail: Detail level (low, high, auto)

        Returns:
            Analysis result
        """
        if not self.openai_client:
            raise Exception("OpenAI client not initialized")

        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        image_url = f"data:image/jpeg;base64,{image_base64}"

        # Call GPT-4V
        response = self.openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_url,
                                "detail": detail
                            }
                        }
                    ]
                }
            ],
            max_tokens=settings.openai_max_tokens
        )

        # Extract result
        analysis_text = response.choices[0].message.content

        # Calculate cost
        cost = self._calculate_openai_cost(detail)

        return {
            'analysis_text': analysis_text,
            'model': settings.openai_model,
            'cost': cost,
            'raw_response': {
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                }
            }
        }

    async def _analyze_with_anthropic(
        self,
        image_data: bytes,
        prompt: str
    ) -> Dict[str, Any]:
        """
        Analyze image using Anthropic Claude Vision

        Args:
            image_data: Processed image bytes
            prompt: Analysis prompt

        Returns:
            Analysis result
        """
        if not self.anthropic_client:
            raise Exception("Anthropic client not initialized")

        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        # Call Claude Vision
        message = self.anthropic_client.messages.create(
            model=settings.anthropic_model,
            max_tokens=settings.anthropic_max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )

        # Extract result
        analysis_text = message.content[0].text

        # Calculate cost
        cost = settings.anthropic_cost_per_image

        return {
            'analysis_text': analysis_text,
            'model': settings.anthropic_model,
            'cost': cost,
            'raw_response': {
                'usage': {
                    'input_tokens': message.usage.input_tokens,
                    'output_tokens': message.usage.output_tokens
                }
            }
        }

    def _select_provider(self) -> str:
        """
        Select best available provider

        Returns:
            Provider name
        """
        if settings.vision_provider == "both":
            # Prefer OpenAI if available
            if self.openai_client:
                return "openai"
            elif self.anthropic_client:
                return "anthropic"
            else:
                raise Exception("No vision API providers available")
        elif settings.vision_provider == "openai":
            if not self.openai_client:
                raise Exception("OpenAI client not available")
            return "openai"
        elif settings.vision_provider == "anthropic":
            if not self.anthropic_client:
                raise Exception("Anthropic client not available")
            return "anthropic"
        else:
            raise ValueError(f"Unknown provider: {settings.vision_provider}")

    def _calculate_openai_cost(self, detail: str) -> float:
        """
        Calculate OpenAI API cost

        Args:
            detail: Detail level

        Returns:
            Cost in USD
        """
        if detail == "low":
            return settings.openai_cost_per_image["low"]
        else:
            # High or auto defaults to high cost
            return settings.openai_cost_per_image["high"]

    def is_available(self, provider: Optional[str] = None) -> bool:
        """
        Check if provider is available

        Args:
            provider: Provider name (None for any)

        Returns:
            True if available
        """
        if provider is None:
            return self.openai_client is not None or self.anthropic_client is not None
        elif provider == "openai":
            return self.openai_client is not None
        elif provider == "anthropic":
            return self.anthropic_client is not None
        else:
            return False


# Global instance
vision_client = VisionAPIClient()
