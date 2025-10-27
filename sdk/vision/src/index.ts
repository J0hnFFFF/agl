/**
 * @agl/vision - Game Screen Analysis System
 *
 * Engine-level vision analysis with LLM integration.
 * Captures game screenshots and analyzes them with GPT-4V/Claude Vision.
 *
 * @packageDocumentation
 */

// Screen Capture
export { ScreenCapture } from './capture/ScreenCapture';

// Vision Analysis
export { VisionAnalyzer } from './analysis/VisionAnalyzer';
export { GameStateRecognizer } from './analysis/GameStateRecognizer';

// Types
export type {
  // Capture types
  CaptureSource,
  ImageFormat,
  CaptureConfig,
  Screenshot,
  CaptureEventHandlers,

  // Vision types
  VisionProvider,
  VisionConfig,
  VisionRequest,
  VisionResponse,
  VisionEventHandlers,

  // Game state types
  GameStateCategory,
  GameState,
  UIElement,
  GameEntity,
  BoundingBox,
} from './types';

// Version
export const VERSION = '0.1.0';
