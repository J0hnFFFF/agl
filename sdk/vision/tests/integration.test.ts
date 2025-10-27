/**
 * Integration Tests
 * Tests the complete vision analysis pipeline
 */

import axios from 'axios';
import { ScreenCapture } from '../src/capture/ScreenCapture';
import { VisionAnalyzer } from '../src/analysis/VisionAnalyzer';
import { GameStateRecognizer } from '../src/analysis/GameStateRecognizer';
import type { Screenshot, GameState } from '../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock canvas and video
class MockHTMLCanvasElement {
  width: number = 1920;
  height: number = 1080;

  toDataURL(type: string, _quality: number): string {
    const mockData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return `data:${type};base64,${mockData}`;
  }

  getContext(contextId: string): any {
    if (contextId === '2d') {
      return {
        drawImage: jest.fn(),
      };
    }
    return null;
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

global.document = {
  querySelector: jest.fn().mockReturnValue(new MockHTMLCanvasElement()),
  createElement: jest.fn((tagName: string) => {
    if (tagName === 'canvas') return new MockHTMLCanvasElement();
    if (tagName === 'video') return new MockHTMLVideoElement();
    return null;
  }),
} as any;

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Analysis Pipeline', () => {
    it('should capture screenshot and analyze game state', async () => {
      // 1. Setup screen capture
      const capture = new ScreenCapture({
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
        format: 'jpeg',
        quality: 0.8,
      });

      // 2. Setup vision analyzer
      const analyzer = new VisionAnalyzer({
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      });

      // 3. Setup game state recognizer
      const recognizer = new GameStateRecognizer(analyzer);

      // Mock API response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  category: 'combat',
                  confidence: 0.95,
                  uiElements: [
                    { type: 'healthbar', text: 'HP: 80/100', confidence: 0.9 },
                  ],
                  entities: [
                    { type: 'player', description: 'Warrior', confidence: 0.92 },
                    { type: 'enemy', description: 'Dragon', confidence: 0.88 },
                  ],
                  sceneDescription: 'Epic battle with a dragon',
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 800,
            completion_tokens: 150,
          },
        },
      });

      // 4. Execute pipeline
      const screenshot = await capture.capture();
      const gameState = await recognizer.recognize(screenshot);

      // 5. Verify results
      expect(screenshot).toBeDefined();
      expect(screenshot.data).toBeTruthy();
      expect(gameState.category).toBe('combat');
      expect(gameState.confidence).toBe(0.95);
      expect(gameState.uiElements).toHaveLength(1);
      expect(gameState.entities).toHaveLength(2);
    });

    it('should handle continuous monitoring workflow', async () => {
      jest.useFakeTimers();

      const capture = new ScreenCapture({
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      });

      const analyzer = new VisionAnalyzer({
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
      });

      const recognizer = new GameStateRecognizer(analyzer);

      // Mock different game states over time
      mockedAxios.post
        .mockResolvedValueOnce({
          data: {
            content: [
              { text: JSON.stringify({ category: 'menu', confidence: 0.9 }) },
            ],
            usage: { input_tokens: 500, output_tokens: 50 },
          },
        })
        .mockResolvedValueOnce({
          data: {
            content: [
              { text: JSON.stringify({ category: 'gameplay', confidence: 0.85 }) },
            ],
            usage: { input_tokens: 500, output_tokens: 50 },
          },
        })
        .mockResolvedValueOnce({
          data: {
            content: [
              { text: JSON.stringify({ category: 'combat', confidence: 0.95 }) },
            ],
            usage: { input_tokens: 500, output_tokens: 50 },
          },
        });

      const captureCallback = () => capture.capture();
      const monitor = recognizer.monitorState(captureCallback, 1000);

      // Collect states
      const states: GameState[] = [];

      const promise1 = monitor.next();
      await jest.advanceTimersByTimeAsync(0);
      const result1 = await promise1;
      states.push(result1.value!);

      const promise2 = monitor.next();
      await jest.advanceTimersByTimeAsync(1000);
      const result2 = await promise2;
      states.push(result2.value!);

      const promise3 = monitor.next();
      await jest.advanceTimersByTimeAsync(1000);
      const result3 = await promise3;
      states.push(result3.value!);

      // Verify state transitions
      expect(states[0].category).toBe('menu');
      expect(states[1].category).toBe('gameplay');
      expect(states[2].category).toBe('combat');

      jest.useRealTimers();
    });
  });

  describe('Event Handler Integration', () => {
    it('should trigger all event handlers in pipeline', async () => {
      const captureHandlers = {
        onCapture: jest.fn(),
        onStart: jest.fn(),
        onError: jest.fn(),
      };

      const analysisHandlers = {
        onAnalysisComplete: jest.fn(),
        onAnalysisError: jest.fn(),
        onGameStateDetected: jest.fn(),
      };

      const capture = new ScreenCapture(
        {
          source: 'canvas',
          target: new MockHTMLCanvasElement() as any,
        },
        captureHandlers
      );

      const analyzer = new VisionAnalyzer(
        {
          provider: 'openai-gpt4v',
          apiKey: 'sk-test-key',
        },
        analysisHandlers
      );

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  category: 'victory',
                  confidence: 0.98,
                }),
              },
            },
          ],
          usage: { prompt_tokens: 500, completion_tokens: 50 },
        },
      });

      const screenshot = await capture.capture();
      await analyzer.analyze({
        screenshot,
        prompt: 'What is this?',
      });

      expect(captureHandlers.onStart).toHaveBeenCalled();
      expect(captureHandlers.onCapture).toHaveBeenCalled();
      expect(analysisHandlers.onAnalysisComplete).toHaveBeenCalled();
    });

    it('should handle errors through event handlers', async () => {
      const captureHandlers = {
        onError: jest.fn(),
      };

      const analysisHandlers = {
        onAnalysisError: jest.fn(),
      };

      const capture = new ScreenCapture(
        {
          source: 'canvas',
          target: undefined, // Will cause error
        },
        captureHandlers
      );

      const analyzer = new VisionAnalyzer(
        {
          provider: 'openai-gpt4v',
          apiKey: 'sk-test-key',
        },
        analysisHandlers
      );

      await expect(capture.capture()).rejects.toThrow();
      expect(captureHandlers.onError).toHaveBeenCalledWith(expect.any(Error));

      // Simulate API error
      mockedAxios.post.mockRejectedValueOnce(new Error('API error'));

      const mockScreenshot: Screenshot = {
        data: 'test',
        format: 'jpeg',
        width: 100,
        height: 100,
        timestamp: Date.now(),
        size: 100,
      };

      await expect(
        analyzer.analyze({
          screenshot: mockScreenshot,
          prompt: 'Test',
        })
      ).rejects.toThrow();

      expect(analysisHandlers.onAnalysisError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Multi-Provider Support', () => {
    it('should work with OpenAI provider', async () => {
      const analyzer = new VisionAnalyzer({
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      });

      const recognizer = new GameStateRecognizer(analyzer);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({ category: 'menu', confidence: 0.9 }),
              },
            },
          ],
          usage: { prompt_tokens: 500, completion_tokens: 50 },
        },
      });

      const mockScreenshot: Screenshot = {
        data: 'test',
        format: 'jpeg',
        width: 1920,
        height: 1080,
        timestamp: Date.now(),
        size: 1000,
      };

      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('menu');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test-key',
          }),
        })
      );
    });

    it('should work with Claude provider', async () => {
      const analyzer = new VisionAnalyzer({
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
      });

      const recognizer = new GameStateRecognizer(analyzer);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          content: [
            { text: JSON.stringify({ category: 'dialogue', confidence: 0.92 }) },
          ],
          usage: { input_tokens: 600, output_tokens: 100 },
        },
      });

      const mockScreenshot: Screenshot = {
        data: 'test',
        format: 'jpeg',
        width: 1920,
        height: 1080,
        timestamp: Date.now(),
        size: 1000,
      };

      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('dialogue');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });
  });

  describe('Performance and Optimization', () => {
    it('should measure end-to-end processing time', async () => {
      const capture = new ScreenCapture({
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      });

      const analyzer = new VisionAnalyzer({
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      });

      // Simulate realistic API delay
      mockedAxios.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    choices: [{ message: { content: '{"category":"combat","confidence":0.9}' } }],
                    usage: { prompt_tokens: 500, completion_tokens: 50 },
                  },
                }),
              100
            )
          )
      );

      const startTime = Date.now();
      const screenshot = await capture.capture();
      const response = await analyzer.analyze({
        screenshot,
        prompt: 'Analyze',
      });
      const endTime = Date.now();

      const totalTime = endTime - startTime;

      expect(response.processingTime).toBeGreaterThan(0);
      expect(totalTime).toBeGreaterThanOrEqual(100);
    });

    it('should handle image resizing in pipeline', async () => {
      const largeCanvas = new MockHTMLCanvasElement();
      largeCanvas.width = 3840;
      largeCanvas.height = 2160;

      const capture = new ScreenCapture({
        source: 'canvas',
        target: largeCanvas as any,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      const screenshot = await capture.capture();

      expect(screenshot.width).toBeLessThanOrEqual(1920);
      expect(screenshot.height).toBeLessThanOrEqual(1080);
    });
  });

  describe('Configuration Updates', () => {
    it('should allow runtime configuration changes', async () => {
      const capture = new ScreenCapture({
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
        quality: 0.8,
      });

      const analyzer = new VisionAnalyzer({
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key-1',
        maxTokens: 1000,
      });

      // Update configurations
      capture.updateConfig({ quality: 0.5 });
      analyzer.updateConfig({ apiKey: 'sk-test-key-2', maxTokens: 2000 });

      const captureConfig = capture.getConfig();
      const analyzerConfig = analyzer.getConfig();

      expect(captureConfig.quality).toBe(0.5);
      expect(analyzerConfig.apiKey).toBe('sk-test-key-2');
      expect(analyzerConfig.maxTokens).toBe(2000);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should detect state changes during gameplay', async () => {
      jest.useFakeTimers();

      const capture = new ScreenCapture({
        source: 'canvas',
        target: new MockHTMLCanvasElement() as any,
      });

      const analyzer = new VisionAnalyzer({
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      });

      const recognizer = new GameStateRecognizer(analyzer);

      // Simulate game progression: menu -> gameplay -> combat -> victory
      const gameProgression = [
        { category: 'menu', confidence: 0.95 },
        { category: 'gameplay', confidence: 0.85 },
        { category: 'combat', confidence: 0.92 },
        { category: 'victory', confidence: 0.98 },
      ];

      let callIndex = 0;
      mockedAxios.post.mockImplementation(() =>
        Promise.resolve({
          data: {
            choices: [
              {
                message: {
                  content: JSON.stringify(gameProgression[callIndex++ % gameProgression.length]),
                },
              },
            ],
            usage: { prompt_tokens: 500, completion_tokens: 50 },
          },
        })
      );

      const states: GameState[] = [];
      const monitor = recognizer.monitorState(() => capture.capture(), 500);

      for (let i = 0; i < 4; i++) {
        const promise = monitor.next();
        await jest.advanceTimersByTimeAsync(i === 0 ? 0 : 500);
        const result = await promise;
        states.push(result.value!);
      }

      expect(states.map((s) => s.category)).toEqual([
        'menu',
        'gameplay',
        'combat',
        'victory',
      ]);

      jest.useRealTimers();
    });

    it('should provide quick state checks for conditional logic', async () => {
      const analyzer = new VisionAnalyzer({
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      });

      const recognizer = new GameStateRecognizer(analyzer);

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({ isCombat: true, confidence: 0.94 }),
              },
            },
          ],
          usage: { prompt_tokens: 300, completion_tokens: 30 },
        },
      });

      const mockScreenshot: Screenshot = {
        data: 'test',
        format: 'jpeg',
        width: 1920,
        height: 1080,
        timestamp: Date.now(),
        size: 1000,
      };

      const isCombat = await recognizer.isState(mockScreenshot, 'combat');

      expect(isCombat).toBe(true);
    });
  });
});
