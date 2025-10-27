/**
 * Core type definitions for AGL Avatar System
 * Engine-level types - game-agnostic
 */

/**
 * Emotion types supported by the avatar system
 * Matches the emotion service emotion types
 */
export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'disgusted'
  | 'surprised'
  | 'neutral'
  | 'excited'
  | 'proud'
  | 'confident'
  | 'disappointed'
  | 'frustrated';

/**
 * Animation variant intensity
 */
export type AnimationVariant = 'subtle' | 'normal' | 'intense';

/**
 * Avatar visibility modes
 */
export type VisibilityMode = 'always' | 'combat' | 'social' | 'custom' | 'hidden';

/**
 * 3D Model source configuration
 */
export interface ModelSource {
  /** Model type - built-in placeholder or custom GLTF */
  type: 'placeholder' | 'gltf' | 'glb' | 'custom';
  /** URL or path to model file (for GLTF/GLB) */
  url?: string;
  /** Custom model object (for pre-loaded models) */
  model?: any;
  /** Model scale */
  scale?: number;
}

/**
 * Avatar customization options
 * Minimal, game-agnostic configuration
 */
export interface AvatarCustomization {
  /** Model source */
  modelSource: ModelSource;
  /** Primary color (for placeholder or tinting) */
  primaryColor?: string;
  /** Secondary color (for placeholder or tinting) */
  secondaryColor?: string;
  /** Accent color (for placeholder or tinting) */
  accentColor?: string;
  /** Custom properties for game-specific use */
  customProperties?: Record<string, any>;
}

/**
 * Avatar state
 */
export interface AvatarState {
  /** Current emotion */
  emotion: EmotionType;
  /** Emotion intensity (0-1) */
  intensity: number;
  /** Is avatar speaking */
  isSpeaking: boolean;
  /** Is avatar idle */
  isIdle: boolean;
  /** Current animation name */
  currentAnimation?: string;
}

/**
 * Avatar configuration
 */
export interface AvatarConfig {
  /** Avatar customization */
  customization: AvatarCustomization;
  /** Initial emotion */
  initialEmotion?: EmotionType;
  /** Visibility mode */
  visibilityMode?: VisibilityMode;
  /** Enable animations */
  enableAnimations?: boolean;
  /** Enable interactions */
  enableInteractions?: boolean;
  /** Scale factor */
  scale?: number;
  /** Position offset */
  position?: { x: number; y: number; z: number };
  /** Rotation offset (degrees) */
  rotation?: { x: number; y: number; z: number };
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  /** Animation name */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Loop animation */
  loop?: boolean;
  /** Animation easing */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  /** Delay before starting */
  delay?: number;
}

/**
 * Animation clip (for GLTF models)
 */
export interface AnimationClip {
  /** Clip name */
  name: string;
  /** Three.js AnimationClip object */
  clip: any;
  /** Duration in seconds */
  duration: number;
}

/**
 * Interaction event
 */
export interface InteractionEvent {
  /** Event type */
  type: 'click' | 'hover' | 'longPress' | 'drag';
  /** Event target */
  target: 'avatar' | 'emotionWheel' | 'bubble';
  /** Additional data */
  data?: any;
}

/**
 * Avatar renderer options
 */
export interface RendererOptions {
  /** Enable shadows */
  shadows?: boolean;
  /** Anti-aliasing */
  antialias?: boolean;
  /** Enable alpha channel */
  alpha?: boolean;
  /** Pixel ratio */
  pixelRatio?: number;
  /** Background color */
  backgroundColor?: string;
  /** Enable auto-rotate */
  autoRotate?: boolean;
  /** Camera settings */
  camera?: {
    fov?: number;
    near?: number;
    far?: number;
    position?: { x: number; y: number; z: number };
  };
}

/**
 * LOD (Level of Detail) settings
 */
export interface LODSettings {
  /** Enable LOD system */
  enabled: boolean;
  /** Distance thresholds for each LOD level */
  distances: number[];
  /** Number of LOD levels */
  levels: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Frames per second */
  fps: number;
  /** Frame time in milliseconds */
  frameTime: number;
  /** Draw calls */
  drawCalls: number;
  /** Triangle count */
  triangles: number;
  /** Memory usage in MB */
  memory: number;
}

/**
 * Emotion wheel position
 */
export type EmotionWheelPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Bubble tooltip configuration
 */
export interface BubbleConfig {
  /** Enable bubble tooltips */
  enabled: boolean;
  /** Position relative to avatar */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Max width in pixels */
  maxWidth: number;
  /** Auto-hide delay in milliseconds */
  autoHideDelay?: number;
  /** Custom styling */
  style?: React.CSSProperties;
}

/**
 * Avatar event handlers
 */
export interface AvatarEventHandlers {
  /** Called when emotion changes */
  onEmotionChange?: (emotion: EmotionType, intensity: number) => void;
  /** Called when animation starts */
  onAnimationStart?: (animationName: string) => void;
  /** Called when animation ends */
  onAnimationEnd?: (animationName: string) => void;
  /** Called on interaction */
  onInteraction?: (event: InteractionEvent) => void;
  /** Called when avatar is clicked */
  onClick?: () => void;
  /** Called when avatar is hovered */
  onHover?: (isHovering: boolean) => void;
  /** Called when speaking state changes */
  onSpeakingChange?: (isSpeaking: boolean) => void;
  /** Called when model is loaded */
  onModelLoad?: (model: any) => void;
  /** Called on model load error */
  onModelError?: (error: Error) => void;
}

/**
 * Model loader configuration
 */
export interface ModelLoaderConfig {
  /** Enable loading progress */
  showProgress?: boolean;
  /** Loading timeout in milliseconds */
  timeout?: number;
  /** Enable caching */
  cache?: boolean;
  /** Crossorigin setting */
  crossOrigin?: string;
}
