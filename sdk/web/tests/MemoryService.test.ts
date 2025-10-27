/**
 * MemoryService Tests
 */

import axios from 'axios';
import { AGLClient } from '../src/index';
import type {
  CreateMemoryRequest,
  Memory,
  SearchMemoriesRequest,
  SearchResult,
  GetContextRequest,
} from '../src/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MemoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new memory', async () => {
      const mockRequest: CreateMemoryRequest = {
        type: 'achievement',
        content: 'Defeated final boss',
        emotion: 'proud',
        importance: 9,
      };

      const mockResponse: Memory = {
        id: 'mem-123',
        playerId: 'player-456',
        type: 'achievement',
        content: 'Defeated final boss',
        emotion: 'proud',
        importance: 9,
        createdAt: '2025-01-26T12:00:00Z',
      };

      const mockHttpClient = {
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        memoryServiceUrl: 'http://memory.test',
      });

      const result = await testClient.memory.create('player-456', mockRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://memory.test/players/player-456/memories',
        mockRequest
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('search', () => {
    it('should search memories semantically', async () => {
      const mockRequest: SearchMemoriesRequest = {
        query: 'boss battles',
        limit: 5,
      };

      const mockResponse: SearchResult[] = [
        {
          memory: {
            id: 'mem-1',
            playerId: 'player-1',
            type: 'dramatic',
            content: 'Epic boss fight',
            importance: 8,
            createdAt: '2025-01-26T10:00:00Z',
          },
          similarityScore: 0.95,
        },
        {
          memory: {
            id: 'mem-2',
            playerId: 'player-1',
            type: 'achievement',
            content: 'Defeated dragon boss',
            importance: 9,
            createdAt: '2025-01-25T15:00:00Z',
          },
          similarityScore: 0.87,
        },
      ];

      const mockHttpClient = {
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        memoryServiceUrl: 'http://memory.test',
      });

      const result = await testClient.memory.search('player-1', mockRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://memory.test/players/player-1/memories/search',
        mockRequest
      );
      expect(result).toHaveLength(2);
      expect(result[0].similarityScore).toBeGreaterThan(result[1].similarityScore);
    });
  });

  describe('getContext', () => {
    it('should retrieve relevant context memories', async () => {
      const mockRequest: GetContextRequest = {
        currentEvent: 'entering boss arena',
        limit: 3,
      };

      const mockResponse: Memory[] = [
        {
          id: 'mem-3',
          playerId: 'player-2',
          type: 'first_time',
          content: 'First time in boss arena',
          importance: 7,
          createdAt: '2025-01-20T12:00:00Z',
        },
      ];

      const mockHttpClient = {
        post: jest.fn().mockResolvedValue({ data: mockResponse }),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        memoryServiceUrl: 'http://memory.test',
      });

      const result = await testClient.memory.getContext('player-2', mockRequest);

      // Request should be converted to snake_case for backend
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://memory.test/players/player-2/context',
        {
          current_event: 'entering boss arena',
          limit: 3,
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('get', () => {
    it('should retrieve recent memories with default pagination', async () => {
      const mockResponse: Memory[] = [
        {
          id: 'mem-10',
          playerId: 'player-3',
          type: 'event',
          content: 'Recent game event',
          importance: 5,
          createdAt: '2025-01-26T11:00:00Z',
        },
      ];

      const mockHttpClient = {
        post: jest.fn(),
        get: jest.fn().mockResolvedValue({ data: mockResponse }),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        memoryServiceUrl: 'http://memory.test',
      });

      const result = await testClient.memory.get('player-3');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'http://memory.test/players/player-3/memories',
        { params: { limit: 10, offset: 0 } }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should support custom pagination', async () => {
      const mockHttpClient = {
        post: jest.fn(),
        get: jest.fn().mockResolvedValue({ data: [] }),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        memoryServiceUrl: 'http://memory.test',
      });

      await testClient.memory.get('player-4', 20, 10);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'http://memory.test/players/player-4/memories',
        { params: { limit: 20, offset: 10 } }
      );
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const mockHttpClient = {
        post: jest.fn().mockRejectedValue(new Error('Network error')),
        get: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockHttpClient as any);

      const testClient = new AGLClient({
        apiKey: 'test-key',
        memoryServiceUrl: 'http://memory.test',
      });

      await expect(
        testClient.memory.create('player-1', {
          type: 'event',
          content: 'test',
          importance: 5,
        })
      ).rejects.toThrow('Network error');
    });
  });
});
