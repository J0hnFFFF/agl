import { useState, useCallback, useEffect } from 'react';
import type { AvatarState, EmotionType, AnimationConfig } from '../types';
import { getEmotionAnimation, getVariantFromIntensity } from '../animations/emotionMap';

/**
 * Hook for managing avatar state
 *
 * @example
 * ```tsx
 * const {
 *   avatarState,
 *   setEmotion,
 *   setIntensity,
 *   setSpeaking,
 *   setIdle,
 *   playAnimation
 * } = useAvatarState('happy');
 * ```
 */
export function useAvatarState(initialEmotion: EmotionType = 'neutral') {
  const [avatarState, setAvatarState] = useState<AvatarState>({
    emotion: initialEmotion,
    intensity: 0.5,
    isSpeaking: false,
    isIdle: true,
    currentAnimation: undefined,
  });

  /**
   * Set emotion and intensity
   */
  const setEmotion = useCallback((emotion: EmotionType, intensity?: number) => {
    setAvatarState((prev) => ({
      ...prev,
      emotion,
      intensity: intensity ?? prev.intensity,
      isIdle: false,
    }));
  }, []);

  /**
   * Set intensity only
   */
  const setIntensity = useCallback((intensity: number) => {
    setAvatarState((prev) => ({
      ...prev,
      intensity: Math.max(0, Math.min(1, intensity)),
    }));
  }, []);

  /**
   * Set speaking state
   */
  const setSpeaking = useCallback((isSpeaking: boolean) => {
    setAvatarState((prev) => ({
      ...prev,
      isSpeaking,
      isIdle: !isSpeaking,
    }));
  }, []);

  /**
   * Set idle state
   */
  const setIdle = useCallback((isIdle: boolean) => {
    setAvatarState((prev) => ({
      ...prev,
      isIdle,
    }));
  }, []);

  /**
   * Play animation
   */
  const playAnimation = useCallback((animationName: string) => {
    setAvatarState((prev) => ({
      ...prev,
      currentAnimation: animationName,
      isIdle: false,
    }));
  }, []);

  /**
   * Get current animation config based on emotion
   */
  const getCurrentAnimationConfig = useCallback((): AnimationConfig | null => {
    if (!avatarState.currentAnimation) {
      const variant = getVariantFromIntensity(avatarState.intensity);
      const animDef = getEmotionAnimation(avatarState.emotion, variant);

      return {
        name: animDef.name,
        duration: animDef.duration,
        loop: animDef.loop,
        easing: 'easeInOut',
      };
    }

    return {
      name: avatarState.currentAnimation,
      duration: 2000,
      loop: false,
      easing: 'easeInOut',
    };
  }, [avatarState.emotion, avatarState.intensity, avatarState.currentAnimation]);

  /**
   * Reset to idle after animation completes
   */
  useEffect(() => {
    if (avatarState.currentAnimation && !avatarState.isSpeaking) {
      const animConfig = getCurrentAnimationConfig();

      if (animConfig && !animConfig.loop) {
        const timer = setTimeout(() => {
          setAvatarState((prev) => ({
            ...prev,
            currentAnimation: undefined,
            isIdle: true,
          }));
        }, animConfig.duration);

        return () => clearTimeout(timer);
      }
    }
  }, [avatarState.currentAnimation, avatarState.isSpeaking, getCurrentAnimationConfig]);

  return {
    avatarState,
    setEmotion,
    setIntensity,
    setSpeaking,
    setIdle,
    playAnimation,
    getCurrentAnimationConfig,
  };
}
