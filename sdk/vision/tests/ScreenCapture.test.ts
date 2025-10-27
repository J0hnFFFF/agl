/**
 * ScreenCapture Tests
 */

import { ScreenCapture } from '../src/capture/ScreenCapture';
import type { CaptureConfig } from '../src/types';

// Mock canvas and browser APIs
class MockHTMLCanvasElement {
  width: number = 800;
  height: number = 600;

  toDataURL(type: string, _quality: number): string {
    // Generate mock base64 data
    const mockData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return `data:${type};base64,${mockData}`;
  }

  getContext(contextId: string): any {
    if (contextId === '2d') {
      return new Mock2DContext();
    }
    return null;
  }
}

class Mock2DContext {
  drawImage(_image: any, _x: number, _y: number, _width?: number, _height?: number): void {
    // Mock implementation
  }
}

class MockHTMLVideoElement {
  videoWidth: number = 1920;
  videoHeight: number = 1080;
  srcObject: any = null;
  private _onloadedmetadata: (() => void) | null = null;

  get onloadedmetadata() {
    return this._onloadedmetadata;
  }

  set onloadedmetadata(callback: (() => void) | null) {
    this._onloadedmetadata = callback;
    // Trigger callback immediately when set
    if (callback) {
      setTimeout(() => callback(), 0);
    }
  }

  play(): Promise<void> {
    return Promise.resolve();
  }
}

// Set up global constructors
(global as any).HTMLCanvasElement = MockHTMLCanvasElement;
(global as any).HTMLVideoElement = MockHTMLVideoElement;

// Mock document
global.document = {
  querySelector: (selector: string): any => {
    if (selector.includes('canvas')) {
      return new MockHTMLCanvasElement();
    }
    if (selector.includes('video')) {
      return new MockHTMLVideoElement();
    }
    return null;
  },
  createElement: (tagName: string): any => {
    if (tagName === 'canvas') {
      return new MockHTMLCanvasElement();
    }
    if (tagName === 'video') {
      return new MockHTMLVideoElement();
    }
    return null;
  },
} as any;

// Mock window
global.window = {
  setInterval: jest.fn((_callback: () => void, _ms: number) => {
    return 123 as any;
  }),
  clearInterval: jest.fn(),
} as any;

// Mock navigator
global.navigator = {
  mediaDevices: {
    getDisplayMedia: jest.fn().mockImplementation(async () => {
      const mockVideo = new MockHTMLVideoElement();
      // Trigger onloadedmetadata immediately
      setTimeout(() => {
        if (mockVideo.onloadedmetadata) {
          mockVideo.onloadedmetadata();
        }
      }, 0);
      return {
        getTracks: () => [{ stop: jest.fn() }],
      };
    }),
  },
} as any;

describe('ScreenCapture', () => {
  describe('input validation', () => {
    it('should throw error for quality below 0', () => {
      expect(() => {
        new ScreenCapture({
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
          quality: -0.1
        });
      }).toThrow('CaptureConfig.quality must be between 0 and 1, got -0.1');
    });

    it('should throw error for quality above 1', () => {
      expect(() => {
        new ScreenCapture({
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
          quality: 1.5
        });
      }).toThrow('CaptureConfig.quality must be between 0 and 1, got 1.5');
    });

    it('should throw error for maxWidth below 1', () => {
      expect(() => {
        new ScreenCapture({
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
          maxWidth: 0
        });
      }).toThrow('CaptureConfig.maxWidth must be between 1 and 7680, got 0');
    });

    it('should throw error for maxWidth above 7680', () => {
      expect(() => {
        new ScreenCapture({
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
          maxWidth: 7681
        });
      }).toThrow('CaptureConfig.maxWidth must be between 1 and 7680, got 7681');
    });

    it('should throw error for maxHeight below 1', () => {
      expect(() => {
        new ScreenCapture({
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
          maxHeight: 0
        });
      }).toThrow('CaptureConfig.maxHeight must be between 1 and 4320, got 0');
    });

    it('should throw error for maxHeight above 4320', () => {
      expect(() => {
        new ScreenCapture({
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
          maxHeight: 4321
        });
      }).toThrow('CaptureConfig.maxHeight must be between 1 and 4320, got 4321');
    });

    it('should throw error for interval below 100ms', () => {
      expect(() => {
        new ScreenCapture({
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
          interval: 50
        });
      }).toThrow('CaptureConfig.interval must be at least 100ms, got 50ms');
    });

    it('should accept valid configuration', () => {
      expect(() => {
        new ScreenCapture({
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
          quality: 0.8,
          maxWidth: 1920,
          maxHeight: 1080,
          interval: 1000
        });
      }).not.toThrow();
    });
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: '#game-canvas',
        format: 'jpeg',
        quality: 0.8,
      };

      const capture = new ScreenCapture(config);
      expect(capture).toBeInstanceOf(ScreenCapture);
    });

    it('should apply default values', () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: '#game-canvas',
      };

      const capture = new ScreenCapture(config);
      const actualConfig = capture.getConfig();

      expect(actualConfig.format).toBe('jpeg');
      expect(actualConfig.quality).toBe(0.8);
      expect(actualConfig.maxWidth).toBe(1920);
      expect(actualConfig.maxHeight).toBe(1080);
      expect(actualConfig.interval).toBe(1000);
    });
  });

  describe('capture from canvas', () => {
    it('should capture screenshot from canvas element', async () => {
      const canvas = new MockHTMLCanvasElement();
      const config: CaptureConfig = {
        source: 'canvas',
        target: canvas as any,
        format: 'jpeg',
        quality: 0.8,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot).toBeDefined();
      expect(screenshot.format).toBe('jpeg');
      expect(screenshot.data).toBeTruthy();
      expect(screenshot.width).toBeGreaterThan(0);
      expect(screenshot.height).toBeGreaterThan(0);
      expect(screenshot.timestamp).toBeGreaterThan(0);
      expect(screenshot.size).toBeGreaterThan(0);
    });

    it('should capture from canvas selector', async () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: '#game-canvas',
        format: 'png',
        quality: 1.0,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot.format).toBe('png');
      expect(screenshot.data).toBeTruthy();
    });

    it('should throw error if canvas target not found', async () => {
      global.document.querySelector = jest.fn().mockReturnValue(null);

      const config: CaptureConfig = {
        source: 'canvas',
        target: '#non-existent',
      };

      const capture = new ScreenCapture(config);

      await expect(capture.capture()).rejects.toThrow('is not a canvas');
    });
  });

  describe('capture from video', () => {
    it('should capture screenshot from video element', async () => {
      const video = new MockHTMLVideoElement();
      const config: CaptureConfig = {
        source: 'video',
        target: video as any,
        format: 'jpeg',
        quality: 0.7,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot).toBeDefined();
      expect(screenshot.format).toBe('jpeg');
      expect(screenshot.data).toBeTruthy();
    });

    it('should throw error if video target not specified', async () => {
      const config: CaptureConfig = {
        source: 'video',
        target: undefined,
      };

      const capture = new ScreenCapture(config);

      await expect(capture.capture()).rejects.toThrow('Video target not specified');
    });
  });

  describe('unsupported capture sources', () => {
    it('should throw error for invalid capture source', async () => {
      const config: any = {
        source: 'unsupported-source',
        target: new MockHTMLCanvasElement() as any,
      };

      const capture = new ScreenCapture(config);

      await expect(capture.capture()).rejects.toThrow('Unsupported capture source: unsupported-source');
    });
  });

  describe('capture from display', () => {
    it('should capture screenshot from display', async () => {
      const config: CaptureConfig = {
        source: 'display',
        format: 'jpeg',
        quality: 0.8,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot).toBeDefined();
      expect(screenshot.format).toBe('jpeg');
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
    });

    it('should throw error if Screen Capture API not supported', async () => {
      const originalMediaDevices = global.navigator.mediaDevices;
      (global.navigator as any).mediaDevices = undefined;

      const config: CaptureConfig = {
        source: 'display',
      };

      const capture = new ScreenCapture(config);

      await expect(capture.capture()).rejects.toThrow('Screen Capture API not supported');

      // Restore
      (global.navigator as any).mediaDevices = originalMediaDevices;
    });
  });

  describe('image resizing', () => {
    it('should resize large images', async () => {
      const canvas = new MockHTMLCanvasElement();
      canvas.width = 3840;
      canvas.height = 2160;

      const config: CaptureConfig = {
        source: 'canvas',
        target: canvas as any,
        maxWidth: 1920,
        maxHeight: 1080,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      // Should be resized to fit within max dimensions
      expect(screenshot.width).toBeLessThanOrEqual(1920);
      expect(screenshot.height).toBeLessThanOrEqual(1080);
    });

    it('should maintain aspect ratio when resizing', async () => {
      const canvas = new MockHTMLCanvasElement();
      canvas.width = 1600;
      canvas.height = 900;

      const config: CaptureConfig = {
        source: 'canvas',
        target: canvas as any,
        maxWidth: 800,
        maxHeight: 600,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      const originalRatio = 1600 / 900;
      const newRatio = screenshot.width / screenshot.height;

      expect(Math.abs(originalRatio - newRatio)).toBeLessThan(0.01);
    });

    it('should not resize small images', async () => {
      const canvas = new MockHTMLCanvasElement();
      canvas.width = 800;
      canvas.height = 600;

      const config: CaptureConfig = {
        source: 'canvas',
        target: canvas as any,
        maxWidth: 1920,
        maxHeight: 1080,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot.width).toBe(800);
      expect(screenshot.height).toBe(600);
    });
  });

  describe('auto-capture', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should start auto-capture at intervals', () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
        interval: 2000,
      };

      const capture = new ScreenCapture(config);
      const callback = jest.fn();

      capture.startAutoCapture(callback);

      expect(global.window.setInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
      expect(capture.isAutoCapturing()).toBe(true);
    });

    it('should stop auto-capture', () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      };

      const capture = new ScreenCapture(config);
      capture.startAutoCapture(jest.fn());

      expect(capture.isAutoCapturing()).toBe(true);

      capture.stopAutoCapture();

      expect(capture.isAutoCapturing()).toBe(false);
    });

    it('should throw error if auto-capture already running', () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      };

      const capture = new ScreenCapture(config);
      capture.startAutoCapture(jest.fn());

      expect(() => capture.startAutoCapture(jest.fn())).toThrow('Auto-capture already running');
    });

    it('should call onError when capture fails during auto-capture', async () => {
      const onError = jest.fn();
      const config: CaptureConfig = {
        source: 'canvas',
        target: undefined, // Will cause error
        interval: 100,
      };

      const capture = new ScreenCapture(config, { onError });
      const callback = jest.fn();

      // Mock setInterval to execute callback immediately
      let intervalCallback: () => void;
      (global.window.setInterval as jest.Mock).mockImplementation((cb: () => void) => {
        intervalCallback = cb;
        return 123;
      });

      capture.startAutoCapture(callback);

      // Execute the interval callback to trigger the error
      await intervalCallback!();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError.mock.calls[0][0].message).toContain('Canvas target not specified');
    });

    it('should continue auto-capture after error', async () => {
      const onError = jest.fn();
      let shouldFail = true;

      // Create mock canvas that fails first time, succeeds second time
      const mockCanvas = new MockHTMLCanvasElement();
      const originalToDataURL = mockCanvas.toDataURL.bind(mockCanvas);
      mockCanvas.toDataURL = function(type: string, quality: number): string {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('Temporary failure');
        }
        return originalToDataURL(type, quality);
      };

      const config: CaptureConfig = {
        source: 'canvas',
        target: mockCanvas as any,
        interval: 100,
      };

      const capture = new ScreenCapture(config, { onError });
      const callback = jest.fn();

      // Mock setInterval to execute callback immediately
      let intervalCallback: () => void;
      (global.window.setInterval as jest.Mock).mockImplementation((cb: () => void) => {
        intervalCallback = cb;
        return 123;
      });

      capture.startAutoCapture(callback);

      // First call - should fail
      await intervalCallback!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();

      // Second call - should succeed
      await intervalCallback!();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(capture.isAutoCapturing()).toBe(true);
    });
  });

  describe('event handlers', () => {
    it('should call onCapture handler', async () => {
      const onCapture = jest.fn();
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      };

      const capture = new ScreenCapture(config, { onCapture });
      await capture.capture();

      expect(onCapture).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.any(String),
        format: expect.any(String),
        width: expect.any(Number),
        height: expect.any(Number),
      }));
    });

    it('should call onError handler on error', async () => {
      const onError = jest.fn();
      const config: CaptureConfig = {
        source: 'canvas',
        target: undefined,
      };

      const capture = new ScreenCapture(config, { onError });

      await expect(capture.capture()).rejects.toThrow();
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call onStart and onStop handlers', () => {
      const onStart = jest.fn();
      const onStop = jest.fn();
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      };

      const capture = new ScreenCapture(config, { onStart, onStop });

      capture.startAutoCapture(jest.fn());
      expect(onStart).toHaveBeenCalled();

      capture.stopAutoCapture();
      expect(onStop).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: '#canvas',
        quality: 0.8,
      };

      const capture = new ScreenCapture(config);

      capture.updateConfig({ quality: 0.5 });

      const updatedConfig = capture.getConfig();
      expect(updatedConfig.quality).toBe(0.5);
    });

    it('should get current configuration', () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: '#canvas',
        format: 'png',
        quality: 0.9,
      };

      const capture = new ScreenCapture(config);
      const retrievedConfig = capture.getConfig();

      expect(retrievedConfig.source).toBe('canvas');
      expect(retrievedConfig.format).toBe('png');
      expect(retrievedConfig.quality).toBe(0.9);
    });
  });

  describe('image formats', () => {
    it('should support JPEG format', async () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
        format: 'jpeg',
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot.format).toBe('jpeg');
    });

    it('should support PNG format', async () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
        format: 'png',
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot.format).toBe('png');
    });

    it('should support WebP format', async () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
        format: 'webp',
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot.format).toBe('webp');
    });
  });

  describe('screenshot metadata', () => {
    it('should include timestamp', async () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      };

      const beforeCapture = Date.now();
      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();
      const afterCapture = Date.now();

      expect(screenshot.timestamp).toBeGreaterThanOrEqual(beforeCapture);
      expect(screenshot.timestamp).toBeLessThanOrEqual(afterCapture);
    });

    it('should calculate file size', async () => {
      const config: CaptureConfig = {
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot.size).toBeGreaterThan(0);
      expect(typeof screenshot.size).toBe('number');
    });

    it('should include dimensions', async () => {
      const canvas = new MockHTMLCanvasElement();
      canvas.width = 1280;
      canvas.height = 720;

      const config: CaptureConfig = {
        source: 'canvas',
        target: canvas as any,
      };

      const capture = new ScreenCapture(config);
      const screenshot = await capture.capture();

      expect(screenshot.width).toBe(1280);
      expect(screenshot.height).toBe(720);
    });
  });
});
