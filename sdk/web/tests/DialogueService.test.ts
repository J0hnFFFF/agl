/**
 * DialogueService Tests
 */

import axios from 'axios';
import { AGLClient } from '../src/index';
import type { DialogueRequest } from '../src/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DialogueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedAxios.create = jest.fn().mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
    } as any);
  });

  describe('generate', () => {
    it('should send dialogue generation request', async () => {
      const mockRequest: DialogueRequest = {
        eventType: 'player.victory',
        emotion: 'excited',
        persona: 'cheerful',
        language: 'en',
      };

      // Backend returns snake_case
      const mockBackendResponse = {
        dialogue: 'Amazing victory! You were unstoppable!',
        method: 'template',
        cost: 0,
        used_special_case: false,
        special_case_reasons: [],
        memory_count: 0,
        cache_hit: false,
        latency_ms: 5,
      };

      const mockHttpClient = {
        post: jest.fn().mockResolvedValue({ data: mockBackendResponse }),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        dialogueServiceUrl: 'http://dialogue.test',
      });

      const result = await testClient.dialogue.generate(mockRequest);

      // Request should be converted to snake_case
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://dialogue.test/generate',
        expect.objectContaining({
          event_type: 'player.victory',
          emotion: 'excited',
        })
      );

      // Response should be converted to camelCase
      expect(result.usedSpecialCase).toBe(false);
      expect(result.specialCaseReasons).toEqual([]);
      expect(result.memoryCount).toBe(0);
      expect(result.cacheHit).toBe(false);
      expect(result.latencyMs).toBe(5);
    });

    it('should handle LLM-generated dialogue', async () => {
      const mockRequest: DialogueRequest = {
        eventType: 'player.achievement',
        emotion: 'proud',
        persona: 'cool',
        playerId: 'player-123',
        forceLlm: true,
      };

      // Backend returns snake_case
      const mockBackendResponse = {
        dialogue: 'Legendary achievement unlocked. Your skills are remarkable.',
        method: 'llm',
        cost: 0.0015,
        used_special_case: true,
        special_case_reasons: ['legendary_event'],
        memory_count: 3,
        cache_hit: false,
        latency_ms: 1200,
      };

      const mockHttpClient = {
        post: jest.fn().mockResolvedValue({ data: mockBackendResponse }),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        dialogueServiceUrl: 'http://dialogue.test',
      });

      const result = await testClient.dialogue.generate(mockRequest);

      expect(result.method).toBe('llm');
      expect(result.usedSpecialCase).toBe(true);
      expect(result.specialCaseReasons).toContain('legendary_event');
      expect(result.memoryCount).toBe(3);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should support multi-language requests', async () => {
      const languages = ['zh', 'en', 'ja'];

      for (const lang of languages) {
        const mockHttpClient = {
          post: jest.fn().mockResolvedValue({
            data: {
              dialogue: `Test dialogue in ${lang}`,
              method: 'template',
              cost: 0,
              used_special_case: false,
              special_case_reasons: [],
              memory_count: 0,
              cache_hit: false,
              latency_ms: 3,
            },
          }),
          get: jest.fn(),
        };

        mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

        const testClient = new AGLClient({
          apiKey: 'test-key',
          dialogueServiceUrl: 'http://dialogue.test',
        });

        await testClient.dialogue.generate({
          eventType: 'player.victory',
          emotion: 'happy',
          persona: 'cheerful',
          language: lang,
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
          'http://dialogue.test/generate',
          expect.objectContaining({ language: lang })
        );
      }
    });

    it('should handle API errors gracefully', async () => {
      const mockHttpClient = {
        post: jest.fn().mockRejectedValue(new Error('Service unavailable')),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        dialogueServiceUrl: 'http://dialogue.test',
      });

      await expect(
        testClient.dialogue.generate({
          eventType: 'player.victory',
          emotion: 'happy',
          persona: 'cheerful',
        })
      ).rejects.toThrow('Service unavailable');
    });
  });
});
