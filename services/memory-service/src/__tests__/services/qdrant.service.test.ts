import { QdrantService } from '../../services/qdrant.service';
import { QdrantClient } from '@qdrant/js-client-rest';

// Mock Qdrant client
jest.mock('@qdrant/js-client-rest');

describe('QdrantService', () => {
  let service: QdrantService;
  let mockClient: jest.Mocked<QdrantClient>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create mock Qdrant client
    mockClient = {
      getCollections: jest.fn(),
      createCollection: jest.fn(),
      upsert: jest.fn(),
      search: jest.fn(),
      delete: jest.fn(),
    } as any;

    (QdrantClient as jest.MockedClass<typeof QdrantClient>).mockImplementation(() => mockClient);

    // Mock collection existence check
    mockClient.getCollections.mockResolvedValue({
      collections: [{ name: 'player_memories' }],
    } as any);
    mockClient.createPayloadIndex = jest.fn();

    service = new QdrantService();
    await service.initialize();
  });

  describe('initialize', () => {
    it('should create collection if not exists', async () => {
      mockClient.getCollections.mockResolvedValue({
        collections: [],
      } as any);

      const newService = new QdrantService();
      await newService.initialize();

      expect(mockClient.createCollection).toHaveBeenCalledWith('player_memories', {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });
    });

    it('should not create collection if already exists', async () => {
      mockClient.getCollections.mockResolvedValue({
        collections: [{ name: 'player_memories' }],
      } as any);

      const newService = new QdrantService();
      await newService.initialize();

      expect(mockClient.createCollection).not.toHaveBeenCalled();
    });

    it('should create payload indexes', async () => {
      mockClient.getCollections.mockResolvedValue({
        collections: [],
      } as any);

      const createPayloadIndexSpy = jest.fn();
      mockClient.createPayloadIndex = createPayloadIndexSpy;

      const newService = new QdrantService();
      await newService.initialize();

      expect(createPayloadIndexSpy).toHaveBeenCalledWith('player_memories', {
        field_name: 'playerId',
        field_schema: 'keyword',
      });
      expect(createPayloadIndexSpy).toHaveBeenCalledWith('player_memories', {
        field_name: 'type',
        field_schema: 'keyword',
      });
      expect(createPayloadIndexSpy).toHaveBeenCalledWith('player_memories', {
        field_name: 'importance',
        field_schema: 'float',
      });
    });
  });

  describe('storeMemory', () => {
    it('should store memory point in Qdrant', async () => {
      const memoryPoint = {
        id: 'mem-123',
        vector: new Array(1536).fill(0.5),
        payload: {
          playerId: 'player-456',
          memoryId: 'mem-123',
          content: 'Test memory',
          type: 'achievement',
          emotion: 'proud',
          importance: 0.8,
          createdAt: new Date().toISOString(),
        },
      };

      await service.storeMemory(memoryPoint);

      expect(mockClient.upsert).toHaveBeenCalledWith('player_memories', {
        wait: true,
        points: [
          {
            id: memoryPoint.id,
            vector: memoryPoint.vector,
            payload: memoryPoint.payload,
          },
        ],
      });
    });

    it('should handle storage errors', async () => {
      mockClient.upsert.mockRejectedValue(new Error('Storage error'));

      const memoryPoint = {
        id: 'mem-123',
        vector: new Array(1536).fill(0.5),
        payload: {
          playerId: 'player-456',
          memoryId: 'mem-123',
          content: 'Test',
          type: 'event',
          importance: 0.5,
          createdAt: new Date().toISOString(),
        },
      };

      await expect(service.storeMemory(memoryPoint)).rejects.toThrow('Storage error');
    });
  });

  describe('searchSimilar', () => {
    it('should search for similar memories', async () => {
      const mockResults = [
        {
          id: 'mem-1',
          score: 0.95,
          payload: {
            playerId: 'player-123',
            memoryId: 'mem-1',
            content: 'Boss victory',
            importance: 0.9,
          },
        },
        {
          id: 'mem-2',
          score: 0.85,
          payload: {
            playerId: 'player-123',
            memoryId: 'mem-2',
            content: 'Quest completion',
            importance: 0.7,
          },
        },
      ];

      mockClient.search.mockResolvedValue(mockResults as any);

      const queryVector = new Array(1536).fill(0.5);
      const results = await service.searchSimilar('player-123', queryVector, 5, 0.3);

      expect(mockClient.search).toHaveBeenCalledWith('player_memories', {
        vector: queryVector,
        filter: {
          must: [
            { key: 'playerId', match: { value: 'player-123' } },
            { key: 'importance', range: { gte: 0.3 } },
          ],
        },
        limit: 5,
        with_payload: true,
      });

      expect(results).toHaveLength(2);
      expect(results[0].score).toBe(0.95);
      expect(results[1].score).toBe(0.85);
    });

    it('should search without importance filter', async () => {
      mockClient.search.mockResolvedValue([]);

      const queryVector = new Array(1536).fill(0.5);
      await service.searchSimilar('player-123', queryVector, 5);

      expect(mockClient.search).toHaveBeenCalledWith('player_memories', {
        vector: queryVector,
        filter: {
          must: [{ key: 'playerId', match: { value: 'player-123' } }],
        },
        limit: 5,
        with_payload: true,
      });
    });

    it('should handle search errors', async () => {
      mockClient.search.mockRejectedValue(new Error('Search error'));

      const queryVector = new Array(1536).fill(0.5);

      await expect(
        service.searchSimilar('player-123', queryVector, 5)
      ).rejects.toThrow('Search error');
    });
  });

  describe('deleteMemories', () => {
    it('should delete multiple memories', async () => {
      const memoryIds = ['mem-1', 'mem-2', 'mem-3'];

      await service.deleteMemories(memoryIds);

      expect(mockClient.delete).toHaveBeenCalledWith('player_memories', {
        wait: true,
        points: memoryIds,
      });
    });

    it('should handle deletion errors', async () => {
      mockClient.delete.mockRejectedValue(new Error('Deletion error'));

      await expect(service.deleteMemories(['mem-1'])).rejects.toThrow('Deletion error');
    });

    it('should handle empty array', async () => {
      await service.deleteMemories([]);

      expect(mockClient.delete).toHaveBeenCalledWith('player_memories', {
        wait: true,
        points: [],
      });
    });
  });
});
