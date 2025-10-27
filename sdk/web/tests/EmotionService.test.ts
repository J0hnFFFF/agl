/**
 * EmotionService Tests
 */

import axios from 'axios';
import { AGLClient } from '../src/index';
import type { EmotionRequest } from '../src/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EmotionService', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock axios.create to return a mock instance
    mockedAxios.create = jest.fn().mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
    } as any);
  });

  describe('analyze', () => {
    it('should send emotion analysis request', async () => {
      const mockRequest: EmotionRequest = {
        type: 'player.victory',
        data: { mvp: true, winStreak: 5 },
      };

      // Backend returns snake_case
      const mockBackendResponse = {
        emotion: 'excited',
        intensity: 0.9,
        action: 'celebrate',
        confidence: 0.95,
        reasoning: 'Player won as MVP with a win streak',
        method: 'rule',
        cost: 0,
        cache_hit: false,
        latency_ms: 10,
      };

      const mockHttpClient = {
        post: jest.fn().mockResolvedValue({ data: mockBackendResponse }),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      // Create new client with mocked axios
      const testClient = new AGLClient({
        apiKey: 'test-key',
        emotionServiceUrl: 'http://emotion.test',
      });

      const result = await testClient.emotion.analyze(mockRequest);

      // Request should contain snake_case after conversion (including nested data)
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://emotion.test/analyze',
        expect.objectContaining({
          type: 'player.victory',
          data: { mvp: true, win_streak: 5 },
        })
      );

      // Response should be converted to camelCase
      expect(result.cacheHit).toBe(false);
      expect(result.latencyMs).toBe(10);
    });

    it('should handle API errors', async () => {
      const mockHttpClient = {
        post: jest.fn().mockRejectedValue(new Error('Network error')),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        emotionServiceUrl: 'http://emotion.test',
      });

      await expect(
        testClient.emotion.analyze({
          type: 'player.victory',
          data: {},
        })
      ).rejects.toThrow('Network error');
    });

    it('should send context data when provided', async () => {
      const mockRequest: EmotionRequest = {
        type: 'player.victory',
        data: { mvp: true },
        context: {
          playerHealth: 100,
          playerLevel: 10,
          inCombat: false,
        },
      };

      const mockHttpClient = {
        post: jest.fn().mockResolvedValue({
          data: {
            emotion: 'happy',
            intensity: 0.8,
            action: 'smile',
            confidence: 0.9,
            reasoning: 'Test',
            method: 'rule',
            cost: 0,
            cache_hit: false,
            latency_ms: 5,
          },
        }),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        emotionServiceUrl: 'http://emotion.test',
      });

      const result = await testClient.emotion.analyze(mockRequest);

      // Context should be converted to snake_case
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://emotion.test/analyze',
        expect.objectContaining({
          type: 'player.victory',
          data: { mvp: true },
          context: {
            player_health: 100,
            player_level: 10,
            in_combat: false,
          },
        })
      );

      // Result should be in camelCase
      expect(result.cacheHit).toBe(false);
      expect(result.latencyMs).toBe(5);
    });
  });
});
