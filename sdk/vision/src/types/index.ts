/**
 * Core type definitions for AGL Vision Analysis System
 */

/**
 * Screen capture source types
 */
export type CaptureSource = 'canvas' | 'video' | 'display' | 'window';

/**
 * Image format for capture
 */
export type ImageFormat = 'png' | 'jpeg' | 'webp';

/**
 * Vision model providers
 */
export type VisionProvider = 'openai-gpt4v' | 'anthropic-claude' | 'custom';

/**
 * Game state categories
 */
export type GameStateCategory =
  | 'menu'
  | 'gameplay'
  | 'combat'
  | 'dialogue'
  | 'inventory'
  | 'map'
  | 'cutscene'
  | 'loading'
  | 'paused'
  | 'victory'
  | 'defeat'
  | 'unknown';

/**
 * Screen capture configuration
 */
export interface CaptureConfig {
  /** Capture source type */
  source: CaptureSource;
  /** Target element (for canvas/video source) */
  target?: HTMLCanvasElement | HTMLVideoElement | string;
  /** Image format */
  format?: ImageFormat;
  /** Image quality (0-1) */
  quality?: number;
  /** Max width (pixels) */
  maxWidth?: number;
  /** Max height (pixels) */
  maxHeight?: number;
  /** Capture interval (ms) */
  interval?: number;
  /** Enable auto-capture */
  autoCapture?: boolean;
}

/**
 * Captured screenshot data
 */
export interface Screenshot {
  /** Base64 encoded image data */
  data: string;
  /** Image format */
  format: ImageFormat;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Capture timestamp */
  timestamp: number;
  /** File size in bytes */
  size: number;
}

/**
 * Vision analysis configuration
 */
export interface VisionConfig {
  /** Vision model provider */
  provider: VisionProvider;
  /** API key */
  apiKey: string;
  /** Model name (provider-specific) */
  model?: string;
  /** Max tokens for response */
  maxTokens?: number;
  /** Temperature (0-1) */
  temperature?: number;
  /** Custom API endpoint */
  apiEndpoint?: string;
  /** Network timeout in milliseconds (default: 30000ms) */
  timeout?: number;
}

/**
 * Vision analysis request
 */
export interface VisionRequest {
  /** Screenshot to analyze */
  screenshot: Screenshot;
  /** Analysis prompt/question */
  prompt: string;
  /** Additional context */
  context?: string;
  /** Game-specific metadata */
  metadata?: Record<string, any>;
}

/**
 * Vision analysis response
 */
export interface VisionResponse {
  /** Analysis result text */
  content: string;
  /** Detected game state */
  gameState?: GameState;
  /** Confidence score (0-1) */
  confidence: number;
  /** Processing time (ms) */
  processingTime: number;
  /** Tokens used */
  tokensUsed?: number;
  /** Raw response from provider */
  raw?: any;
}

/**
 * Detected game state
 */
export interface GameState {
  /** State category */
  category: GameStateCategory;
  /** Confidence (0-1) */
  confidence: number;
  /** Detected UI elements */
  uiElements?: UIElement[];
  /** Detected entities */
  entities?: GameEntity[];
  /** Scene description */
  sceneDescription?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Detected UI element
 */
export interface UIElement {
  /** Element type */
  type: 'button' | 'menu' | 'healthbar' | 'minimap' | 'text' | 'icon' | 'other';
  /** Bounding box */
  boundingBox?: BoundingBox;
  /** Text content (if applicable) */
  text?: string;
  /** Confidence (0-1) */
  confidence: number;
}

/**
 * Detected game entity
 */
export interface GameEntity {
  /** Entity type */
  type: 'player' | 'enemy' | 'npc' | 'item' | 'object' | 'other';
  /** Bounding box */
  boundingBox?: BoundingBox;
  /** Entity description */
  description?: string;
  /** Confidence (0-1) */
  confidence: number;
}

/**
 * Bounding box coordinates
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Screen capture event handlers
 */
export interface CaptureEventHandlers {
  /** Called when capture succeeds */
  onCapture?: (screenshot: Screenshot) => void;
  /** Called when capture fails */
  onError?: (error: Error) => void;
  /** Called when capture starts */
  onStart?: () => void;
  /** Called when capture stops */
  onStop?: () => void;
}

/**
 * Vision analysis event handlers
 */
export interface VisionEventHandlers {
  /** Called when analysis completes */
  onAnalysisComplete?: (response: VisionResponse) => void;
  /** Called when analysis fails */
  onAnalysisError?: (error: Error) => void;
  /** Called when game state is detected */
  onGameStateDetected?: (gameState: GameState) => void;
}

// ============================================================================
// PLANNED FEATURES (NOT YET IMPLEMENTED)
// These types are defined for future implementation but not currently exported
// or implemented in the codebase. Do not use these types in application code.
// ============================================================================

/**
 * Analysis prompt templates
 * @internal - Planned feature, not yet implemented
 */
export interface PromptTemplate {
  /** Template name */
  name: string;
  /** Template content */
  template: string;
  /** Template variables */
  variables?: string[];
  /** Description */
  description?: string;
}

/**
 * Batch analysis request
 * @internal - Planned feature, not yet implemented
 */
export interface BatchAnalysisRequest {
  /** Screenshots to analyze */
  screenshots: Screenshot[];
  /** Shared prompt */
  prompt: string;
  /** Enable parallel processing */
  parallel?: boolean;
  /** Max concurrent requests */
  maxConcurrent?: number;
}

/**
 * Batch analysis response
 * @internal - Planned feature, not yet implemented
 */
export interface BatchAnalysisResponse {
  /** Individual responses */
  responses: VisionResponse[];
  /** Total processing time (ms) */
  totalTime: number;
  /** Success count */
  successCount: number;
  /** Failure count */
  failureCount: number;
}

/**
 * Vision cache configuration
 * @internal - Planned feature, not yet implemented
 */
export interface CacheConfig {
  /** Enable caching */
  enabled: boolean;
  /** Cache TTL (ms) */
  ttl?: number;
  /** Max cache size (entries) */
  maxSize?: number;
  /** Cache key strategy */
  keyStrategy?: 'screenshot-hash' | 'timestamp' | 'custom';
}

/**
 * Performance metrics
 * @internal - Planned feature, not yet implemented
 */
export interface PerformanceMetrics {
  /** Average capture time (ms) */
  avgCaptureTime: number;
  /** Average analysis time (ms) */
  avgAnalysisTime: number;
  /** Total captures */
  totalCaptures: number;
  /** Total analyses */
  totalAnalyses: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Total tokens used */
  totalTokens: number;
}
