"""
Main emotion service with hybrid detection (rule-based + ML)
"""
import time
from typing import Optional
from .models import EmotionRequest, EmotionResponse, DetectionMethod
from .rule_analyzer import RuleBasedAnalyzer
from .ml_classifier import MLEmotionClassifier
from .cache import emotion_cache
from .cost_tracker import cost_manager
from .config import settings


class EmotionService:
    """Main emotion detection service"""

    def __init__(self):
        """Initialize service with analyzers"""
        self.rule_analyzer = RuleBasedAnalyzer()

        # Initialize ML classifier if enabled
        self.ml_classifier: Optional[MLEmotionClassifier] = None
        if settings.ml_enabled and settings.anthropic_api_key:
            try:
                self.ml_classifier = MLEmotionClassifier()
            except Exception as e:
                print(f"Warning: ML classifier initialization failed: {e}")
                print("Falling back to rule-based only")

    async def analyze_emotion(self, request: EmotionRequest) -> EmotionResponse:
        """
        Analyze emotion using hybrid approach

        Flow:
        1. Check cache
        2. Try rule-based analysis
        3. If confidence < threshold, use ML (if enabled and budget allows)
        4. Cache result
        5. Track cost

        Args:
            request: EmotionRequest with event type, data, context

        Returns:
            EmotionResponse with emotion, intensity, confidence, etc.
        """
        start_time = time.time()

        # 1. Check cache
        if settings.cache_enabled:
            cached = emotion_cache.get(request.type, request.data, request.context)
            if cached:
                emotion, intensity, reasoning, confidence = cached
                action = self.rule_analyzer.get_action(emotion)

                latency_ms = (time.time() - start_time) * 1000

                response = EmotionResponse(
                    emotion=emotion,
                    intensity=intensity,
                    action=action,
                    confidence=confidence,
                    reasoning=reasoning,
                    method=DetectionMethod.CACHED,
                    cost=0.0,
                    cache_hit=True,
                    latency_ms=round(latency_ms, 2)
                )

                cost_manager.record_request(DetectionMethod.CACHED, 0.0, response.latency_ms)
                return response

        # 2. Rule-based analysis
        rule_result = self.rule_analyzer.analyze(request.type, request.data, request.context)

        # 3. Determine if ML should be used
        should_use_ml = False

        if request.force_ml:
            # Force ML for debugging
            should_use_ml = True
        elif self.ml_classifier and settings.ml_enabled:
            # Use ML if rule confidence is below threshold
            if rule_result.confidence < settings.ml_confidence_threshold:
                # Check budget
                can_use, reason = cost_manager.can_use_ml()
                if can_use:
                    should_use_ml = True
                else:
                    # Budget exceeded, stick with rule-based
                    print(f"ML skipped: {reason}")

        # 4. Generate result
        if should_use_ml:
            try:
                response = await self._analyze_with_ml(request, start_time)
            except Exception as e:
                print(f"ML analysis failed: {e}, falling back to rule-based")
                response = self._create_response_from_rule(rule_result, start_time)
        else:
            response = self._create_response_from_rule(rule_result, start_time)

        # 5. Cache result
        if settings.cache_enabled and response.method != DetectionMethod.CACHED:
            emotion_cache.set(
                request.type,
                request.data,
                request.context,
                response.emotion,
                response.intensity,
                response.reasoning,
                response.confidence,
                ttl=settings.cache_ttl
            )

        # 6. Track cost
        cost_manager.record_request(response.method, response.cost, response.latency_ms)

        return response

    async def _analyze_with_ml(self, request: EmotionRequest, start_time: float) -> EmotionResponse:
        """Analyze using ML classifier"""
        if not self.ml_classifier:
            raise Exception("ML classifier not initialized")

        ml_result = self.ml_classifier.classify(request.type, request.data, request.context)
        action = self.rule_analyzer.get_action(ml_result.emotion)

        latency_ms = (time.time() - start_time) * 1000

        return EmotionResponse(
            emotion=ml_result.emotion,
            intensity=ml_result.intensity,
            action=action,
            confidence=ml_result.confidence,
            reasoning=ml_result.reasoning,
            method=DetectionMethod.ML,
            cost=ml_result.cost,
            cache_hit=False,
            latency_ms=round(latency_ms, 2)
        )

    def _create_response_from_rule(self, rule_result, start_time: float) -> EmotionResponse:
        """Create response from rule-based result"""
        action = self.rule_analyzer.get_action(rule_result.emotion)
        latency_ms = (time.time() - start_time) * 1000

        return EmotionResponse(
            emotion=rule_result.emotion,
            intensity=rule_result.intensity,
            action=action,
            confidence=rule_result.confidence,
            reasoning=rule_result.reasoning,
            method=DetectionMethod.RULE,
            cost=0.0,
            cache_hit=False,
            latency_ms=round(latency_ms, 2)
        )

    async def health_check(self) -> dict:
        """Health check for service"""
        ml_status = "ok" if self.ml_classifier else "disabled"
        if self.ml_classifier:
            try:
                # Quick test of ML classifier availability
                pass
            except Exception as e:
                ml_status = f"error: {str(e)}"

        cache_stats = emotion_cache.get_stats() if settings.cache_enabled else None
        cost_stats = cost_manager.get_budget_status()

        return {
            "service": settings.service_name,
            "version": settings.service_version,
            "status": "ok",
            "ml_enabled": settings.ml_enabled,
            "ml_status": ml_status,
            "cache_enabled": settings.cache_enabled,
            "cache_stats": cache_stats,
            "cost_stats": cost_stats
        }
