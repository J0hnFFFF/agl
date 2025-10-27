/**
 * Screen Capture System
 * Captures screenshots from various sources (Canvas, Video, Display)
 */

import type {
  CaptureConfig,
  Screenshot,
  ImageFormat,
  CaptureEventHandlers,
} from '../types';

/**
 * ScreenCapture - Main screen capture class
 *
 * @example
 * ```ts
 * const capture = new ScreenCapture({
 *   source: 'canvas',
 *   target: document.getElementById('game-canvas'),
 *   format: 'jpeg',
 *   quality: 0.8
 * });
 *
 * const screenshot = await capture.capture();
 * ```
 */
export class ScreenCapture {
  private config: CaptureConfig & {
    format: ImageFormat;
    quality: number;
    maxWidth: number;
    maxHeight: number;
    interval: number;
    autoCapture: boolean;
  };
  private handlers: CaptureEventHandlers;
  private intervalId?: number;
  private isCapturing: boolean = false;

  constructor(config: CaptureConfig, handlers: CaptureEventHandlers = {}) {
    this.config = this.normalizeConfig(config);
    this.handlers = handlers;
  }

  /**
   * Normalize configuration with defaults
   */
  private normalizeConfig(
    config: CaptureConfig
  ): CaptureConfig & {
    format: ImageFormat;
    quality: number;
    maxWidth: number;
    maxHeight: number;
    interval: number;
    autoCapture: boolean;
  } {
    // Validate and set quality
    const quality = config.quality !== undefined ? config.quality : 0.8;
    if (quality < 0 || quality > 1) {
      throw new Error(`CaptureConfig.quality must be between 0 and 1, got ${quality}`);
    }

    // Validate and set maxWidth
    const maxWidth = config.maxWidth !== undefined ? config.maxWidth : 1920;
    if (maxWidth < 1 || maxWidth > 7680) {
      throw new Error(`CaptureConfig.maxWidth must be between 1 and 7680, got ${maxWidth}`);
    }

    // Validate and set maxHeight
    const maxHeight = config.maxHeight !== undefined ? config.maxHeight : 1080;
    if (maxHeight < 1 || maxHeight > 4320) {
      throw new Error(`CaptureConfig.maxHeight must be between 1 and 4320, got ${maxHeight}`);
    }

    // Validate and set interval
    const interval = config.interval !== undefined ? config.interval : 1000;
    if (interval < 100) {
      throw new Error(`CaptureConfig.interval must be at least 100ms, got ${interval}ms`);
    }

    return {
      source: config.source,
      target: config.target,
      format: config.format || 'jpeg',
      quality,
      maxWidth,
      maxHeight,
      interval,
      autoCapture: config.autoCapture || false,
    };
  }

  /**
   * Capture a single screenshot
   */
  async capture(): Promise<Screenshot> {
    try {
      this.handlers.onStart?.();

      const screenshot = await this.captureFromSource();

      this.handlers.onCapture?.(screenshot);

      return screenshot;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handlers.onError?.(err);
      throw err;
    }
  }

  /**
   * Start auto-capture at intervals
   */
  startAutoCapture(callback: (screenshot: Screenshot) => void): void {
    if (this.isCapturing) {
      throw new Error('Auto-capture already running');
    }

    this.isCapturing = true;
    this.handlers.onStart?.();

    this.intervalId = window.setInterval(async () => {
      try {
        const screenshot = await this.captureFromSource();
        callback(screenshot);
        this.handlers.onCapture?.(screenshot);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.handlers.onError?.(err);
      }
    }, this.config.interval);
  }

  /**
   * Stop auto-capture
   */
  stopAutoCapture(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isCapturing = false;
    this.handlers.onStop?.();
  }

  /**
   * Capture from configured source
   */
  private async captureFromSource(): Promise<Screenshot> {
    switch (this.config.source) {
      case 'canvas':
        return this.captureFromCanvas();
      case 'video':
        return this.captureFromVideo();
      case 'display':
        return this.captureFromDisplay();
      case 'window':
        return this.captureFromWindow();
      default:
        throw new Error(`Unsupported capture source: ${this.config.source}`);
    }
  }

  /**
   * Capture from HTML Canvas element
   */
  private async captureFromCanvas(): Promise<Screenshot> {
    const canvas = this.getCanvasElement();
    return this.canvasToScreenshot(canvas);
  }

  /**
   * Capture from HTML Video element
   */
  private async captureFromVideo(): Promise<Screenshot> {
    const video = this.getVideoElement();

    // Create temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    return this.canvasToScreenshot(canvas);
  }

  /**
   * Capture from display using Screen Capture API
   */
  private async captureFromDisplay(): Promise<Screenshot> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen Capture API not supported');
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { max: this.config.maxWidth },
        height: { max: this.config.maxHeight },
      },
    });

    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context');
      }

      ctx.drawImage(video, 0, 0);

      return this.canvasToScreenshot(canvas);
    } finally {
      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  /**
   * Capture from window (alias for display)
   */
  private async captureFromWindow(): Promise<Screenshot> {
    return this.captureFromDisplay();
  }

  /**
   * Convert canvas to Screenshot object
   */
  private canvasToScreenshot(canvas: HTMLCanvasElement): Screenshot {
    // Resize if needed
    const resized = this.resizeCanvas(canvas);

    // Convert to data URL
    const mimeType = this.getMimeType(this.config.format);
    const dataUrl = resized.toDataURL(mimeType, this.config.quality);

    // Extract base64 data
    const base64Data = dataUrl.split(',')[1];

    // Calculate file size (approximate)
    const size = Math.ceil((base64Data.length * 3) / 4);

    return {
      data: base64Data,
      format: this.config.format,
      width: resized.width,
      height: resized.height,
      timestamp: Date.now(),
      size,
    };
  }

  /**
   * Resize canvas if it exceeds max dimensions
   */
  private resizeCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const { width, height } = canvas;
    const { maxWidth, maxHeight } = this.config;

    // Check if resize needed
    if (width <= maxWidth && height <= maxHeight) {
      return canvas;
    }

    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = width / height;
    let newWidth = width;
    let newHeight = height;

    if (width > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    // Create resized canvas
    const resized = document.createElement('canvas');
    resized.width = Math.floor(newWidth);
    resized.height = Math.floor(newHeight);

    const ctx = resized.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);

    return resized;
  }

  /**
   * Get canvas element from target
   */
  private getCanvasElement(): HTMLCanvasElement {
    const { target } = this.config;

    if (!target) {
      throw new Error('Canvas target not specified');
    }

    if (typeof target === 'string') {
      const element = document.querySelector(target);
      if (!(element instanceof HTMLCanvasElement)) {
        throw new Error(`Element "${target}" is not a canvas`);
      }
      return element;
    }

    if (target instanceof HTMLCanvasElement) {
      return target;
    }

    throw new Error('Invalid canvas target');
  }

  /**
   * Get video element from target
   */
  private getVideoElement(): HTMLVideoElement {
    const { target } = this.config;

    if (!target) {
      throw new Error('Video target not specified');
    }

    if (typeof target === 'string') {
      const element = document.querySelector(target);
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error(`Element "${target}" is not a video`);
      }
      return element;
    }

    if (target instanceof HTMLVideoElement) {
      return target;
    }

    throw new Error('Invalid video target');
  }

  /**
   * Get MIME type for image format
   */
  private getMimeType(format: ImageFormat): string {
    const mimeTypes: Record<ImageFormat, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };
    return mimeTypes[format];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CaptureConfig>): void {
    this.config = this.normalizeConfig({ ...this.config, ...config });
  }

  /**
   * Get current configuration
   */
  getConfig(): CaptureConfig {
    return { ...this.config };
  }

  /**
   * Check if auto-capture is running
   */
  isAutoCapturing(): boolean {
    return this.isCapturing;
  }
}
