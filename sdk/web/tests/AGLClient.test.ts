/**
 * AGLClient Tests
 */

import { AGLClient } from '../src/index';
import type { AGLConfig } from '../src/types';

describe('AGLClient', () => {
  let client: AGLClient;
  const mockConfig: AGLConfig = {
    apiKey: 'test-api-key',
    apiBaseUrl: 'http://test-api.example.com',
    emotionServiceUrl: 'http://test-emotion.example.com',
    dialogueServiceUrl: 'http://test-dialogue.example.com',
    memoryServiceUrl: 'http://test-memory.example.com',
    timeout: 5000,
  };

  beforeEach(() => {
    client = new AGLClient(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(client).toBeInstanceOf(AGLClient);
      expect(client.emotion).toBeDefined();
      expect(client.dialogue).toBeDefined();
      expect(client.memory).toBeDefined();
    });

    it('should use default values for missing config', () => {
      const minimalConfig: AGLConfig = {
        apiKey: 'test-key',
      };
      const minimalClient = new AGLClient(minimalConfig);

      expect(minimalClient).toBeInstanceOf(AGLClient);
      expect(minimalClient.emotion).toBeDefined();
    });
  });

  describe('setPlayerId', () => {
    it('should set player ID', () => {
      client.setPlayerId('player-123');
      expect(client.getPlayerId()).toBe('player-123');
    });

    it('should update player ID', () => {
      client.setPlayerId('player-123');
      client.setPlayerId('player-456');
      expect(client.getPlayerId()).toBe('player-456');
    });
  });

  describe('setGameId', () => {
    it('should set game ID', () => {
      client.setGameId('game-abc');
      expect(client.getGameId()).toBe('game-abc');
    });

    it('should update game ID', () => {
      client.setGameId('game-abc');
      client.setGameId('game-xyz');
      expect(client.getGameId()).toBe('game-xyz');
    });
  });

  describe('getPlayerId', () => {
    it('should return undefined when not set', () => {
      expect(client.getPlayerId()).toBeUndefined();
    });

    it('should return player ID when set', () => {
      client.setPlayerId('player-123');
      expect(client.getPlayerId()).toBe('player-123');
    });
  });

  describe('getGameId', () => {
    it('should return undefined when not set', () => {
      expect(client.getGameId()).toBeUndefined();
    });

    it('should return game ID when set', () => {
      client.setGameId('game-abc');
      expect(client.getGameId()).toBe('game-abc');
    });
  });

  describe('services integration', () => {
    it('should have emotion service', () => {
      expect(client.emotion).toBeDefined();
      expect(typeof client.emotion.analyze).toBe('function');
    });

    it('should have dialogue service', () => {
      expect(client.dialogue).toBeDefined();
      expect(typeof client.dialogue.generate).toBe('function');
    });

    it('should have memory service', () => {
      expect(client.memory).toBeDefined();
      expect(typeof client.memory.create).toBe('function');
      expect(typeof client.memory.search).toBe('function');
      expect(typeof client.memory.getContext).toBe('function');
      expect(typeof client.memory.get).toBe('function');
    });
  });
});
