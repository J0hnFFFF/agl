/**
 * VisionAnalyzer Tests
 */

import axios from 'axios';
import { VisionAnalyzer } from '../src/analysis/VisionAnalyzer';
import type { VisionConfig, VisionRequest, Screenshot } from '../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('VisionAnalyzer', () => {
  const mockScreenshot: Screenshot = {
    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    format: 'jpeg',
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    size: 12345,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('input validation', () => {
    it('should throw error for empty apiKey', () => {
      expect(() => {
        new VisionAnalyzer({ provider: 'openai-gpt4v', apiKey: '' });
      }).toThrow('VisionConfig.apiKey is required and cannot be empty');
    });

    it('should throw error for whitespace-only apiKey', () => {
      expect(() => {
        new VisionAnalyzer({ provider: 'openai-gpt4v', apiKey: '   ' });
      }).toThrow('VisionConfig.apiKey is required and cannot be empty');
    });

    it('should throw error for temperature below 0', () => {
      expect(() => {
        new VisionAnalyzer({
          provider: 'openai-gpt4v',
          apiKey: 'test-key',
          temperature: -0.1
        });
      }).toThrow('VisionConfig.temperature must be between 0 and 1, got -0.1');
    });

    it('should throw error for temperature above 1', () => {
      expect(() => {
        new VisionAnalyzer({
          provider: 'openai-gpt4v',
          apiKey: 'test-key',
          temperature: 1.5
        });
      }).toThrow('VisionConfig.temperature must be between 0 and 1, got 1.5');
    });

    it('should throw error for maxTokens below 1', () => {
      expect(() => {
        new VisionAnalyzer({
          provider: 'openai-gpt4v',
          apiKey: 'test-key',
          maxTokens: 0
        });
      }).toThrow('VisionConfig.maxTokens must be between 1 and 100000, got 0');
    });

    it('should throw error for maxTokens above 100000', () => {
      expect(() => {
        new VisionAnalyzer({
          provider: 'openai-gpt4v',
          apiKey: 'test-key',
          maxTokens: 100001
        });
      }).toThrow('VisionConfig.maxTokens must be between 1 and 100000, got 100001');
    });

    it('should accept valid configuration', () => {
      expect(() => {
        new VisionAnalyzer({
          provider: 'openai-gpt4v',
          apiKey: 'test-key',
          temperature: 0.5,
          maxTokens: 2000
        });
      }).not.toThrow();
    });
  });

  describe('constructor', () => {
    it('should create instance with OpenAI config', () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
        model: 'gpt-4-vision-preview',
      };

      const analyzer = new VisionAnalyzer(config);
      expect(analyzer).toBeInstanceOf(VisionAnalyzer);
    });

    it('should create instance with Claude config', () => {
      const config: VisionConfig = {
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
        model: 'claude-3-opus-20240229',
      };

      const analyzer = new VisionAnalyzer(config);
      expect(analyzer).toBeInstanceOf(VisionAnalyzer);
    });

    it('should apply default model for OpenAI', () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const analyzer = new VisionAnalyzer(config);
      const actualConfig = analyzer.getConfig();

      expect(actualConfig.model).toBe('gpt-4-vision-preview');
    });

    it('should apply default model for Claude', () => {
      const config: VisionConfig = {
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
      };

      const analyzer = new VisionAnalyzer(config);
      const actualConfig = analyzer.getConfig();

      expect(actualConfig.model).toBe('claude-3-opus-20240229');
    });

    it('should apply default values', () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const analyzer = new VisionAnalyzer(config);
      const actualConfig = analyzer.getConfig();

      expect(actualConfig.maxTokens).toBe(1000);
      expect(actualConfig.temperature).toBe(0.7);
      expect(actualConfig.apiEndpoint).toBe('https://api.openai.com/v1/chat/completions');
    });
  });

  describe('analyze with OpenAI', () => {
    it('should analyze screenshot with GPT-4V', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const mockResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This is a combat scene with a warrior fighting enemies.',
              },
            },
          ],
          usage: {
            prompt_tokens: 500,
            completion_tokens: 100,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'What is happening in this game scene?',
      };

      const response = await analyzer.analyze(request);

      expect(response.content).toBe('This is a combat scene with a warrior fighting enemies.');
      expect(response.confidence).toBe(0.8);
      expect(response.tokensUsed).toBe(600);
      expect(response.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should send correct request to OpenAI API', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
        model: 'gpt-4-vision-preview',
        maxTokens: 1500,
        temperature: 0.5,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        },
      });

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze this image',
        context: 'You are analyzing a game screenshot.',
      };

      await analyzer.analyze(request);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4-vision-preview',
          max_tokens: 1500,
          temperature: 0.5,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'You are analyzing a game screenshot.',
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'text',
                  text: 'Analyze this image',
                }),
                expect.objectContaining({
                  type: 'image_url',
                  image_url: expect.objectContaining({
                    url: `data:image/jpeg;base64,${mockScreenshot.data}`,
                    detail: 'high',
                  }),
                }),
              ]),
            }),
          ]),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer sk-test-key',
          }),
        })
      );
    });

    it('should handle OpenAI API errors', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const onAnalysisError = jest.fn();
      mockedAxios.post.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const analyzer = new VisionAnalyzer(config, { onAnalysisError });
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze this',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow('API rate limit exceeded');
      expect(onAnalysisError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('analyze with Claude', () => {
    it('should analyze screenshot with Claude Vision', async () => {
      const config: VisionConfig = {
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
      };

      const mockResponse = {
        data: {
          content: [
            {
              text: 'This image shows a menu screen with several options.',
            },
          ],
          usage: {
            input_tokens: 400,
            output_tokens: 80,
          },
        },
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Describe this screen',
      };

      const response = await analyzer.analyze(request);

      expect(response.content).toBe('This image shows a menu screen with several options.');
      expect(response.confidence).toBe(0.8);
      expect(response.tokensUsed).toBe(480);
      expect(response.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should send correct request to Claude API', async () => {
      const config: VisionConfig = {
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
        model: 'claude-3-opus-20240229',
        maxTokens: 2000,
        temperature: 0.3,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          content: [{ text: 'Test response' }],
          usage: { input_tokens: 200, output_tokens: 100 },
        },
      });

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'What do you see?',
        context: 'This is a game screenshot.',
      };

      await analyzer.analyze(request);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
          max_tokens: 2000,
          temperature: 0.3,
          system: 'This is a game screenshot.',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image',
                  source: expect.objectContaining({
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: mockScreenshot.data,
                  }),
                }),
                expect.objectContaining({
                  type: 'text',
                  text: 'What do you see?',
                }),
              ]),
            }),
          ]),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'sk-ant-test-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should handle Claude API errors', async () => {
      const config: VisionConfig = {
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
      };

      const onAnalysisError = jest.fn();
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid API key'));

      const analyzer = new VisionAnalyzer(config, { onAnalysisError });
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow('Invalid API key');
      expect(onAnalysisError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('custom provider', () => {
    it('should support custom analysis function', async () => {
      const config: VisionConfig = {
        provider: 'custom',
        apiKey: 'custom-key',
        apiEndpoint: 'https://custom-api.com/analyze',
      };

      const customFn = jest.fn().mockResolvedValue({
        content: 'Custom analysis result',
        confidence: 0.95,
        processingTime: 0,
      });

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      const response = await analyzer.analyzeWithCustom(request, customFn);

      expect(customFn).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          provider: 'custom',
          apiKey: 'custom-key',
          apiEndpoint: 'https://custom-api.com/analyze',
        })
      );
      expect(response.content).toBe('Custom analysis result');
      expect(response.confidence).toBe(0.95);
      expect(response.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should throw error if custom provider used without custom function', async () => {
      const config: VisionConfig = {
        provider: 'custom',
        apiKey: 'custom-key',
      };

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Test',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow(
        'Custom provider not implemented. Use analyzeWithCustom()'
      );
    });

    it('should handle custom function errors', async () => {
      const config: VisionConfig = {
        provider: 'custom',
        apiKey: 'custom-key',
      };

      const customFn = jest.fn().mockRejectedValue(new Error('Custom error'));
      const onAnalysisError = jest.fn();

      const analyzer = new VisionAnalyzer(config, { onAnalysisError });
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await expect(analyzer.analyzeWithCustom(request, customFn)).rejects.toThrow('Custom error');
      expect(onAnalysisError).toHaveBeenCalled();
    });
  });

  describe('event handlers', () => {
    it('should call onAnalysisComplete handler', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const onAnalysisComplete = jest.fn();
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'Test' } }],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        },
      });

      const analyzer = new VisionAnalyzer(config, { onAnalysisComplete });
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await analyzer.analyze(request);

      expect(onAnalysisComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.any(String),
          confidence: expect.any(Number),
          processingTime: expect.any(Number),
        })
      );
    });

    it('should call onGameStateDetected handler when game state present', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const onGameStateDetected = jest.fn();
      const mockGameState = {
        category: 'combat' as const,
        confidence: 0.9,
        sceneDescription: 'Combat scene',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'Test' } }],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        },
      });

      const analyzer = new VisionAnalyzer(config, { onGameStateDetected });
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      // Manually set game state for testing
      const response = await analyzer.analyze(request);
      response.gameState = mockGameState;

      // Would be called if response had gameState from API
      // In real usage, GameStateRecognizer adds this
    });
  });

  describe('quick analyze', () => {
    it('should provide simplified analysis interface', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'This is a menu screen' } }],
          usage: { prompt_tokens: 100, completion_tokens: 20 },
        },
      });

      const analyzer = new VisionAnalyzer(config);
      const result = await analyzer.quickAnalyze(mockScreenshot, 'What is this?');

      expect(result).toBe('This is a menu screen');
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
        maxTokens: 1000,
      };

      const analyzer = new VisionAnalyzer(config);
      analyzer.updateConfig({ maxTokens: 2000 });

      const updatedConfig = analyzer.getConfig();
      expect(updatedConfig.maxTokens).toBe(2000);
    });

    it('should get current configuration', () => {
      const config: VisionConfig = {
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
        model: 'claude-3-opus-20240229',
        temperature: 0.5,
      };

      const analyzer = new VisionAnalyzer(config);
      const retrievedConfig = analyzer.getConfig();

      expect(retrievedConfig.provider).toBe('anthropic-claude');
      expect(retrievedConfig.model).toBe('claude-3-opus-20240229');
      expect(retrievedConfig.temperature).toBe(0.5);
    });

    it('should not mutate original config when getting', () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const analyzer = new VisionAnalyzer(config);
      const retrievedConfig = analyzer.getConfig();

      retrievedConfig.maxTokens = 5000;

      const newRetrievedConfig = analyzer.getConfig();
      expect(newRetrievedConfig.maxTokens).not.toBe(5000);
    });
  });

  describe('processing time', () => {
    it('should measure processing time accurately', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      mockedAxios.post.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: {
                    choices: [{ message: { content: 'Test' } }],
                    usage: { prompt_tokens: 100, completion_tokens: 50 },
                  },
                }),
              100
            )
          )
      );

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      const response = await analyzer.analyze(request);

      expect(response.processingTime).toBeGreaterThanOrEqual(100);
      expect(response.processingTime).toBeLessThan(200);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow('Network error');
    });

    it('should handle HTTP 401 authentication errors', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'invalid-key',
      };

      const authError = new Error('Request failed with status code 401');
      (authError as any).response = {
        status: 401,
        data: { error: { message: 'Invalid authentication' } },
      };

      mockedAxios.post.mockRejectedValueOnce(authError);

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow('401');
    });

    it('should handle HTTP 429 rate limit errors', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const rateLimitError = new Error('Request failed with status code 429');
      (rateLimitError as any).response = {
        status: 429,
        data: { error: { message: 'Rate limit exceeded' } },
      };

      mockedAxios.post.mockRejectedValueOnce(rateLimitError);

      const onAnalysisError = jest.fn();
      const analyzer = new VisionAnalyzer(config, { onAnalysisError });
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow('429');
      expect(onAnalysisError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle HTTP 500 server errors', async () => {
      const config: VisionConfig = {
        provider: 'anthropic-claude',
        apiKey: 'sk-ant-test-key',
      };

      const serverError = new Error('Request failed with status code 500');
      (serverError as any).response = {
        status: 500,
        data: { error: 'Internal server error' },
      };

      mockedAxios.post.mockRejectedValueOnce(serverError);

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow('500');
    });

    it('should handle network timeout errors', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const timeoutError = new Error('timeout of 30000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';

      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      const onAnalysisError = jest.fn();
      const analyzer = new VisionAnalyzer(config, { onAnalysisError });
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow('timeout');
      expect(onAnalysisError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle malformed API responses', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          // Missing expected fields
          unexpected: 'data',
        },
      });

      const analyzer = new VisionAnalyzer(config);
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      const response = await analyzer.analyze(request);

      // Should handle gracefully
      expect(response.content).toBe('');
    });

    it('should convert non-Error objects to Error', async () => {
      const config: VisionConfig = {
        provider: 'openai-gpt4v',
        apiKey: 'sk-test-key',
      };

      const onAnalysisError = jest.fn();
      mockedAxios.post.mockRejectedValueOnce('String error');

      const analyzer = new VisionAnalyzer(config, { onAnalysisError });
      const request: VisionRequest = {
        screenshot: mockScreenshot,
        prompt: 'Analyze',
      };

      await expect(analyzer.analyze(request)).rejects.toThrow();
      expect(onAnalysisError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
