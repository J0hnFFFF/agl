/**
 * @agl/avatar - Virtual Avatar System for AGL
 *
 * Engine-level 3D avatar rendering and animation system.
 * Game-agnostic, extensible, production-ready.
 *
 * @packageDocumentation
 */

// Components
export { AvatarRenderer } from './components/AvatarRenderer';
export type { AvatarRendererProps } from './components/AvatarRenderer';

export { AvatarController } from './components/AvatarController';
export type { AvatarControllerProps } from './components/AvatarController';

export { AvatarModel, preloadModel } from './components/AvatarModel';
export type { AvatarModelProps } from './components/AvatarModel';

export { AnimationPlayer } from './components/AnimationPlayer';
export type { AnimationPlayerProps } from './components/AnimationPlayer';

export { EmotionWheel } from './components/EmotionWheel';
export type { EmotionWheelProps } from './components/EmotionWheel';

export { BubbleTooltip } from './components/BubbleTooltip';
export type { BubbleTooltipProps } from './components/BubbleTooltip';

// Hooks
export { useAvatarState } from './hooks/useAvatarState';

// Types
export type {
  EmotionType,
  AnimationVariant,
  VisibilityMode,
  ModelSource,
  AvatarCustomization,
  AvatarState,
  AvatarConfig,
  AnimationConfig,
  AnimationClip,
  InteractionEvent,
  RendererOptions,
  LODSettings,
  PerformanceMetrics,
  EmotionWheelPosition,
  BubbleConfig,
  AvatarEventHandlers,
  ModelLoaderConfig,
} from './types';

// Animation utilities
export {
  EMOTION_ANIMATIONS,
  IDLE_ANIMATIONS,
  SPEAKING_ANIMATIONS,
  getEmotionAnimation,
  getVariantFromIntensity,
} from './animations/emotionMap';
export type { AnimationDefinition } from './animations/emotionMap';

// Version
export const VERSION = '0.1.0';
