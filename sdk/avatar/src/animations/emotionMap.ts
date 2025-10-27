/**
 * Emotion to animation mapping
 * Each emotion has 3 variants: subtle, normal, intense
 */

import type { EmotionType, AnimationVariant } from '../types';

/**
 * Animation definition
 */
export interface AnimationDefinition {
  /** Animation name */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Loop animation */
  loop?: boolean;
  /** Transition in time */
  transitionIn?: number;
  /** Transition out time */
  transitionOut?: number;
}

/**
 * Emotion animation map
 * Format: emotion_variant (e.g., happy_normal, sad_intense)
 */
export const EMOTION_ANIMATIONS: Record<string, AnimationDefinition> = {
  // Happy animations
  happy_subtle: {
    name: 'smile',
    duration: 1500,
    loop: false,
    transitionIn: 300,
    transitionOut: 300,
  },
  happy_normal: {
    name: 'laugh',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  happy_intense: {
    name: 'celebrate',
    duration: 3000,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },

  // Sad animations
  sad_subtle: {
    name: 'frown',
    duration: 2000,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },
  sad_normal: {
    name: 'sulk',
    duration: 3000,
    loop: false,
    transitionIn: 600,
    transitionOut: 600,
  },
  sad_intense: {
    name: 'cry',
    duration: 4000,
    loop: false,
    transitionIn: 700,
    transitionOut: 700,
  },

  // Angry animations
  angry_subtle: {
    name: 'scowl',
    duration: 1500,
    loop: false,
    transitionIn: 300,
    transitionOut: 300,
  },
  angry_normal: {
    name: 'angry_gesture',
    duration: 2500,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  angry_intense: {
    name: 'rage',
    duration: 3500,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },

  // Fearful animations
  fearful_subtle: {
    name: 'worry',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  fearful_normal: {
    name: 'scared',
    duration: 2500,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },
  fearful_intense: {
    name: 'panic',
    duration: 3000,
    loop: false,
    transitionIn: 600,
    transitionOut: 600,
  },

  // Disgusted animations
  disgusted_subtle: {
    name: 'grimace',
    duration: 1500,
    loop: false,
    transitionIn: 300,
    transitionOut: 300,
  },
  disgusted_normal: {
    name: 'disgust_gesture',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  disgusted_intense: {
    name: 'revulsion',
    duration: 2500,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },

  // Surprised animations
  surprised_subtle: {
    name: 'blink',
    duration: 1000,
    loop: false,
    transitionIn: 200,
    transitionOut: 200,
  },
  surprised_normal: {
    name: 'gasp',
    duration: 1500,
    loop: false,
    transitionIn: 300,
    transitionOut: 300,
  },
  surprised_intense: {
    name: 'shock',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },

  // Neutral animations
  neutral_subtle: {
    name: 'idle_subtle',
    duration: 3000,
    loop: true,
    transitionIn: 500,
    transitionOut: 500,
  },
  neutral_normal: {
    name: 'idle',
    duration: 4000,
    loop: true,
    transitionIn: 500,
    transitionOut: 500,
  },
  neutral_intense: {
    name: 'idle_active',
    duration: 3000,
    loop: true,
    transitionIn: 500,
    transitionOut: 500,
  },

  // Excited animations
  excited_subtle: {
    name: 'excited_smile',
    duration: 1500,
    loop: false,
    transitionIn: 300,
    transitionOut: 300,
  },
  excited_normal: {
    name: 'jump',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  excited_intense: {
    name: 'cheer',
    duration: 3000,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },

  // Proud animations
  proud_subtle: {
    name: 'confident_pose',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  proud_normal: {
    name: 'proud_stance',
    duration: 2500,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },
  proud_intense: {
    name: 'victory_pose',
    duration: 3000,
    loop: false,
    transitionIn: 600,
    transitionOut: 600,
  },

  // Confident animations
  confident_subtle: {
    name: 'nod',
    duration: 1500,
    loop: false,
    transitionIn: 300,
    transitionOut: 300,
  },
  confident_normal: {
    name: 'confident_gesture',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  confident_intense: {
    name: 'power_stance',
    duration: 2500,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },

  // Disappointed animations
  disappointed_subtle: {
    name: 'sigh',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  disappointed_normal: {
    name: 'disappointment_gesture',
    duration: 2500,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },
  disappointed_intense: {
    name: 'despair',
    duration: 3000,
    loop: false,
    transitionIn: 600,
    transitionOut: 600,
  },

  // Frustrated animations
  frustrated_subtle: {
    name: 'annoyed',
    duration: 1500,
    loop: false,
    transitionIn: 300,
    transitionOut: 300,
  },
  frustrated_normal: {
    name: 'frustrated_gesture',
    duration: 2000,
    loop: false,
    transitionIn: 400,
    transitionOut: 400,
  },
  frustrated_intense: {
    name: 'tantrum',
    duration: 3000,
    loop: false,
    transitionIn: 500,
    transitionOut: 500,
  },
};

/**
 * Get animation for emotion and variant
 */
export function getEmotionAnimation(
  emotion: EmotionType,
  variant: AnimationVariant = 'normal'
): AnimationDefinition {
  const key = `${emotion}_${variant}`;
  return EMOTION_ANIMATIONS[key] || EMOTION_ANIMATIONS.neutral_normal;
}

/**
 * Get animation variant based on intensity
 * @param intensity - Emotion intensity (0-1)
 */
export function getVariantFromIntensity(intensity: number): AnimationVariant {
  if (intensity < 0.33) return 'subtle';
  if (intensity < 0.67) return 'normal';
  return 'intense';
}

/**
 * Idle animations for different states
 */
export const IDLE_ANIMATIONS: Record<string, AnimationDefinition> = {
  idle: {
    name: 'idle',
    duration: 4000,
    loop: true,
  },
  idle_bored: {
    name: 'idle_bored',
    duration: 5000,
    loop: true,
  },
  idle_attentive: {
    name: 'idle_attentive',
    duration: 3000,
    loop: true,
  },
};

/**
 * Speaking animations (lip-sync variants)
 */
export const SPEAKING_ANIMATIONS: Record<string, AnimationDefinition> = {
  speaking_normal: {
    name: 'speak_normal',
    duration: 0, // Driven by audio
    loop: true,
  },
  speaking_excited: {
    name: 'speak_excited',
    duration: 0, // Driven by audio
    loop: true,
  },
  speaking_quiet: {
    name: 'speak_quiet',
    duration: 0, // Driven by audio
    loop: true,
  },
};
