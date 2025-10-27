/**
 * Type Definitions Tests
 */

import type {
  AGLConfig,
  EmotionType,
  EventType,
  Persona,
  MemoryType,
  EmotionRequest,
  EmotionResponse,
  DialogueRequest,
  DialogueResponse,
  CreateMemoryRequest,
  Memory,
  SearchResult,
} from '../src/types';

describe('Type Definitions', () => {
  describe('EmotionType', () => {
    it('should accept valid emotion types', () => {
      const emotions: EmotionType[] = [
        'happy',
        'excited',
        'amazed',
        'proud',
        'satisfied',
        'cheerful',
        'grateful',
        'sad',
        'disappointed',
        'frustrated',
        'angry',
        'worried',
        'tired',
        'neutral',
      ];

      emotions.forEach((emotion) => {
        expect(typeof emotion).toBe('string');
      });
    });
  });

  describe('EventType', () => {
    it('should accept valid event types', () => {
      const events: EventType[] = [
        'player.victory',
        'player.defeat',
        'player.kill',
        'player.death',
        'player.achievement',
        'player.levelup',
        'player.loot',
        'player.sessionstart',
        'player.sessionend',
      ];

      events.forEach((event) => {
        expect(typeof event).toBe('string');
      });
    });
  });

  describe('Persona', () => {
    it('should accept valid persona types', () => {
      const personas: Persona[] = ['cheerful', 'cool', 'cute'];

      personas.forEach((persona) => {
        expect(typeof persona).toBe('string');
      });
    });
  });

  describe('MemoryType', () => {
    it('should accept valid memory types', () => {
      const types: MemoryType[] = [
        'achievement',
        'milestone',
        'first_time',
        'dramatic',
        'conversation',
        'event',
        'observation',
      ];

      types.forEach((type) => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('AGLConfig', () => {
    it('should require apiKey', () => {
      const config: AGLConfig = {
        apiKey: 'test-key',
      };

      expect(config.apiKey).toBeDefined();
    });

    it('should accept all optional fields', () => {
      const config: AGLConfig = {
        apiKey: 'test-key',
        apiBaseUrl: 'http://api.test',
        emotionServiceUrl: 'http://emotion.test',
        dialogueServiceUrl: 'http://dialogue.test',
        memoryServiceUrl: 'http://memory.test',
        timeout: 10000,
      };

      expect(config).toBeDefined();
      expect(config.apiBaseUrl).toBe('http://api.test');
      expect(config.timeout).toBe(10000);
    });
  });

  describe('EmotionRequest', () => {
    it('should have required fields', () => {
      const request: EmotionRequest = {
        type: 'player.victory',
        data: { mvp: true },
      };

      expect(request.type).toBeDefined();
      expect(request.data).toBeDefined();
    });

    it('should accept optional context', () => {
      const request: EmotionRequest = {
        type: 'player.victory',
        data: { mvp: true },
        context: {
          playerHealth: 100,
          playerLevel: 10,
        },
        forceMl: false,
      };

      expect(request.context).toBeDefined();
      expect(request.forceMl).toBe(false);
    });
  });

  describe('EmotionResponse', () => {
    it('should have all required fields', () => {
      const response: EmotionResponse = {
        emotion: 'excited',
        intensity: 0.9,
        action: 'celebrate',
        confidence: 0.95,
        reasoning: 'Test',
        method: 'rule',
        cost: 0,
        cacheHit: false,
        latencyMs: 10,
      };

      expect(response.emotion).toBe('excited');
      expect(response.intensity).toBe(0.9);
      expect(response.method).toBe('rule');
    });
  });

  describe('DialogueRequest', () => {
    it('should have required fields', () => {
      const request: DialogueRequest = {
        eventType: 'player.victory',
        emotion: 'happy',
        persona: 'cheerful',
      };

      expect(request.eventType).toBeDefined();
      expect(request.emotion).toBeDefined();
      expect(request.persona).toBeDefined();
    });

    it('should accept optional fields including language', () => {
      const request: DialogueRequest = {
        eventType: 'player.victory',
        emotion: 'happy',
        persona: 'cheerful',
        playerId: 'player-123',
        language: 'en',
        context: { gameMode: 'ranked' },
        forceLlm: true,
      };

      expect(request.language).toBe('en');
      expect(request.forceLlm).toBe(true);
    });
  });

  describe('DialogueResponse', () => {
    it('should have all required fields', () => {
      const response: DialogueResponse = {
        dialogue: 'Great job!',
        method: 'template',
        cost: 0,
        usedSpecialCase: false,
        specialCaseReasons: [],
        memoryCount: 0,
        cacheHit: false,
        latencyMs: 5,
      };

      expect(response.dialogue).toBeDefined();
      expect(response.method).toBeDefined();
      expect(Array.isArray(response.specialCaseReasons)).toBe(true);
    });
  });

  describe('CreateMemoryRequest', () => {
    it('should have required fields', () => {
      const request: CreateMemoryRequest = {
        type: 'achievement',
        content: 'Test memory',
        importance: 8,
      };

      expect(request.type).toBeDefined();
      expect(request.content).toBeDefined();
    });

    it('should accept optional fields', () => {
      const request: CreateMemoryRequest = {
        type: 'achievement',
        content: 'Test memory',
        emotion: 'proud',
        context: { achievement: 'legendary' },
        importance: 9,
      };

      expect(request.emotion).toBe('proud');
      expect(request.context).toBeDefined();
    });
  });

  describe('Memory', () => {
    it('should have all required fields', () => {
      const memory: Memory = {
        id: 'mem-123',
        playerId: 'player-456',
        type: 'achievement',
        content: 'Test memory',
        importance: 8,
        createdAt: '2025-01-26T12:00:00Z',
      };

      expect(memory.id).toBeDefined();
      expect(memory.playerId).toBeDefined();
      expect(memory.type).toBeDefined();
      expect(memory.content).toBeDefined();
      expect(memory.createdAt).toBeDefined();
    });

    it('should accept optional fields', () => {
      const memory: Memory = {
        id: 'mem-123',
        playerId: 'player-456',
        type: 'achievement',
        content: 'Test memory',
        emotion: 'proud',
        importance: 9,
        context: { level: 'hard' },
        createdAt: '2025-01-26T12:00:00Z',
      };

      expect(memory.emotion).toBe('proud');
      expect(memory.context).toBeDefined();
    });
  });

  describe('SearchResult', () => {
    it('should have memory and similarity score', () => {
      const result: SearchResult = {
        memory: {
          id: 'mem-1',
          playerId: 'player-1',
          type: 'event',
          content: 'Test',
          importance: 5,
          createdAt: '2025-01-26T10:00:00Z',
        },
        similarityScore: 0.95,
      };

      expect(result.memory).toBeDefined();
      expect(result.similarityScore).toBe(0.95);
    });
  });
});
