import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EmotionType, AnimationVariant } from '../types';
import { getEmotionAnimation, getVariantFromIntensity } from '../animations/emotionMap';

/**
 * Props for AnimationPlayer
 */
export interface AnimationPlayerProps {
  /** Three.js model object */
  model: any;
  /** Available animation clips */
  animations?: THREE.AnimationClip[];
  /** Current emotion */
  emotion: EmotionType;
  /** Emotion intensity (0-1) */
  intensity: number;
  /** Is speaking */
  isSpeaking: boolean;
  /** Animation callbacks */
  onAnimationStart?: (name: string) => void;
  onAnimationEnd?: (name: string) => void;
}

/**
 * AnimationPlayer - Handles skeleton animation playback
 *
 * Automatically plays emotion-based animations using Three.js AnimationMixer
 *
 * @example
 * ```tsx
 * <AnimationPlayer
 *   model={gltfModel.scene}
 *   animations={gltfModel.animations}
 *   emotion="happy"
 *   intensity={0.8}
 *   isSpeaking={false}
 *   onAnimationStart={(name) => console.log('Started:', name)}
 * />
 * ```
 */
export const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  model,
  animations = [],
  emotion,
  intensity,
  isSpeaking,
  onAnimationStart,
  onAnimationEnd,
}) => {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const previousEmotionRef = useRef<string>('');

  // Initialize animation mixer
  useEffect(() => {
    if (!model) return;

    const mixer = new THREE.AnimationMixer(model);
    mixerRef.current = mixer;

    return () => {
      mixer.stopAllAction();
    };
  }, [model]);

  // Play emotion animation
  useEffect(() => {
    if (!mixerRef.current || animations.length === 0) return;

    // Get animation name based on emotion and intensity
    const variant = getVariantFromIntensity(intensity);
    const animConfig = getEmotionAnimation(emotion, variant);
    const emotionKey = `${emotion}_${variant}`;

    // Skip if same emotion
    if (emotionKey === previousEmotionRef.current) return;
    previousEmotionRef.current = emotionKey;

    // Find matching animation clip
    const clip = animations.find((clip) => {
      // Try exact match
      if (clip.name === animConfig.name) return true;
      // Try emotion name
      if (clip.name.toLowerCase().includes(emotion)) return true;
      // Try variant
      if (clip.name.toLowerCase().includes(variant)) return true;
      return false;
    });

    if (!clip) {
      // No matching animation found, use idle
      const idleClip = animations.find((c) =>
        c.name.toLowerCase().includes('idle')
      );
      if (idleClip) {
        playClip(idleClip, true);
      }
      return;
    }

    // Play the animation
    playClip(clip, animConfig.loop);
  }, [emotion, intensity, animations]);

  // Play animation clip
  const playClip = (clip: THREE.AnimationClip, loop: boolean = false) => {
    if (!mixerRef.current) return;

    const action = mixerRef.current.clipAction(clip);

    // Stop current action
    if (currentActionRef.current) {
      currentActionRef.current.fadeOut(0.5);
    }

    // Configure new action
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    action.clampWhenFinished = !loop;

    // Fade in
    action.fadeIn(0.5);
    action.play();

    currentActionRef.current = action;
    onAnimationStart?.(clip.name);

    // Handle animation end
    if (!loop) {
      const mixer = mixerRef.current;
      const onFinished = (event: any) => {
        if (event.action === action) {
          onAnimationEnd?.(clip.name);
          mixer.removeEventListener('finished', onFinished);

          // Play idle animation
          const idleClip = (animations || []).find((c) =>
            c.name.toLowerCase().includes('idle')
          );
          if (idleClip) {
            playClip(idleClip, true);
          }
        }
      };
      mixer.addEventListener('finished', onFinished);
    }
  };

  // Update mixer
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return null;
};

AnimationPlayer.displayName = 'AnimationPlayer';
