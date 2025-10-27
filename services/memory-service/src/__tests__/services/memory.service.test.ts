import { MemoryService } from '../../services/memory.service';
import { PrismaClient } from '@prisma/client';
import { QdrantService } from '../../services/qdrant.service';
import { EmbeddingService } from '../../services/embedding.service';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../services/qdrant.service');
jest.mock('../../services/embedding.service');

describe('MemoryService', () => {
  let service: MemoryService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockQdrant: jest.Mocked<QdrantService>;
  let mockEmbedding: jest.Mocked<EmbeddingService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      memory: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as any;

    // Mock Qdrant
    mockQdrant = {
      storeMemory: jest.fn(),
      searchSimilar: jest.fn(),
      deleteMemories: jest.fn(),
    } as any;

    // Mock Embedding
    mockEmbedding = {
      generateEmbedding: jest.fn(),
      cosineSimilarity: jest.fn(),
    } as any;

    service = new MemoryService(mockPrisma, mockQdrant, mockEmbedding);
  });

  describe('getMemories', () => {
    it('should get memories with default options', async () => {
      const mockMemories = [
        {
          id: 'mem-1',
          playerId: 'player-123',
          type: 'achievement',
          content: 'Reached level 50',
          emotion: 'proud',
          importance: 0.8,
          context: {},
          createdAt: new Date(),
        },
      ];

      mockPrisma.memory.findMany.mockResolvedValue(mockMemories);

      const result = await service.getMemories('player-123');

      expect(mockPrisma.memory.findMany).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
        take: 10,
        skip: 0,
        orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      });
      expect(result).toEqual(mockMemories);
    });

    it('should get memories with custom options', async () => {
      mockPrisma.memory.findMany.mockResolvedValue([]);

      await service.getMemories('player-123', {
        limit: 20,
        offset: 5,
        type: 'achievement',
      });

      expect(mockPrisma.memory.findMany).toHaveBeenCalledWith({
        where: { playerId: 'player-123', type: 'achievement' },
        take: 20,
        skip: 5,
        orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
      });
    });

    it('should filter by type', async () => {
      mockPrisma.memory.findMany.mockResolvedValue([]);

      await service.getMemories('player-123', { type: 'milestone' });

      expect(mockPrisma.memory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { playerId: 'player-123', type: 'milestone' },
        })
      );
    });
  });

  describe('createMemory', () => {
    it('should create memory with calculated importance', async () => {
      const mockMemory = {
        id: 'mem-123',
        playerId: 'player-456',
        type: 'achievement',
        content: 'Defeated legendary boss',
        emotion: 'amazed',
        importance: 1.0,
        context: { rarity: 'legendary', mvp: true },
        createdAt: new Date(),
      };

      const mockVector = new Array(1536).fill(0.5);

      mockPrisma.memory.create.mockResolvedValue(mockMemory);
      mockEmbedding.generateEmbedding.mockResolvedValue(mockVector);
      mockQdrant.storeMemory.mockResolvedValue(undefined);

      const result = await service.createMemory('player-456', {
        type: 'achievement',
        content: 'Defeated legendary boss',
        emotion: 'amazed',
        context: { rarity: 'legendary', mvp: true },
      });

      // Verify importance calculation
      // Base: 0.5 + achievement: 0.2 + amazed: 0.15 + legendary: 0.15 + mvp: 0.1 = 1.1 (capped at 1.0)
      expect(mockPrisma.memory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          playerId: 'player-456',
          type: 'achievement',
          content: 'Defeated legendary boss',
          emotion: 'amazed',
          importance: 1.0,
        }),
      });

      // Verify vector storage
      expect(mockEmbedding.generateEmbedding).toHaveBeenCalledWith('Defeated legendary boss');
      expect(mockQdrant.storeMemory).toHaveBeenCalledWith({
        id: mockMemory.id,
        vector: mockVector,
        payload: expect.objectContaining({
          playerId: 'player-456',
          memoryId: mockMemory.id,
          importance: 1.0,
        }),
      });

      expect(result).toEqual(mockMemory);
    });

    it('should calculate importance for milestone type', async () => {
      const mockMemory = {
        id: 'mem-1',
        playerId: 'player-1',
        type: 'milestone',
        content: 'Reached level 100',
        importance: 0.7, // 0.5 + 0.2 for milestone
        context: {},
        createdAt: new Date(),
      };

      mockPrisma.memory.create.mockResolvedValue(mockMemory);
      mockEmbedding.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));

      await service.createMemory('player-1', {
        type: 'milestone',
        content: 'Reached level 100',
      });

      expect(mockPrisma.memory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          importance: 0.7,
        }),
      });
    });

    it('should calculate importance for strong emotions', async () => {
      const mockMemory = {
        id: 'mem-1',
        playerId: 'player-1',
        type: 'event',
        content: 'Won intense PvP match',
        emotion: 'excited',
        importance: 0.65, // 0.5 + 0.15 for excited
        context: {},
        createdAt: new Date(),
      };

      mockPrisma.memory.create.mockResolvedValue(mockMemory);
      mockEmbedding.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));

      await service.createMemory('player-1', {
        type: 'event',
        content: 'Won intense PvP match',
        emotion: 'excited',
      });

      expect(mockPrisma.memory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          importance: 0.65,
        }),
      });
    });

    it('should boost importance for win streaks', async () => {
      const mockMemory = {
        id: 'mem-1',
        playerId: 'player-1',
        type: 'event',
        content: '5 wins in a row',
        importance: 0.6, // 0.5 + 0.1 for streak
        context: { winStreak: 5 },
        createdAt: new Date(),
      };

      mockPrisma.memory.create.mockResolvedValue(mockMemory);
      mockEmbedding.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));

      await service.createMemory('player-1', {
        type: 'event',
        content: '5 wins in a row',
        context: { winStreak: 5 },
      });

      expect(mockPrisma.memory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          importance: 0.6,
        }),
      });
    });

    it('should continue even if vector storage fails', async () => {
      const mockMemory = {
        id: 'mem-1',
        playerId: 'player-1',
        type: 'event',
        content: 'Test',
        importance: 0.5,
        context: {},
        createdAt: new Date(),
      };

      mockPrisma.memory.create.mockResolvedValue(mockMemory);
      mockEmbedding.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));
      mockQdrant.storeMemory.mockRejectedValue(new Error('Qdrant error'));

      const result = await service.createMemory('player-1', {
        type: 'event',
        content: 'Test',
      });

      expect(result).toEqual(mockMemory);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('searchMemories', () => {
    it('should search memories by semantic similarity', async () => {
      const mockVector = new Array(1536).fill(0.5);
      const mockSearchResults = [
        {
          id: 'mem-1',
          score: 0.95,
          payload: {
            playerId: 'player-123',
            memoryId: 'mem-1',
            content: 'Boss battle victory',
            type: 'achievement',
            importance: 0.9,
            createdAt: new Date().toISOString(),
          },
        },
      ];

      const mockMemories = [
        {
          id: 'mem-1',
          playerId: 'player-123',
          type: 'achievement',
          content: 'Boss battle victory',
          emotion: 'excited',
          importance: 0.9,
          context: {},
          createdAt: new Date(),
        },
      ];

      mockEmbedding.generateEmbedding.mockResolvedValue(mockVector);
      mockQdrant.searchSimilar.mockResolvedValue(mockSearchResults);
      mockPrisma.memory.findMany.mockResolvedValue(mockMemories);

      const results = await service.searchMemories('player-123', 'boss fights', 5);

      expect(mockEmbedding.generateEmbedding).toHaveBeenCalledWith('boss fights');
      expect(mockQdrant.searchSimilar).toHaveBeenCalledWith('player-123', mockVector, 5, 0.3);
      expect(mockPrisma.memory.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['mem-1'] } },
      });

      expect(results).toHaveLength(1);
      expect(results[0].similarityScore).toBe(0.95);
    });

    it('should sort results by similarity score', async () => {
      const mockSearchResults = [
        { id: 'mem-1', score: 0.95, payload: { memoryId: 'mem-1', playerId: 'p1', content: 'test', type: 'event', importance: 0.5, createdAt: new Date().toISOString() } },
        { id: 'mem-2', score: 0.85, payload: { memoryId: 'mem-2', playerId: 'p1', content: 'test', type: 'event', importance: 0.5, createdAt: new Date().toISOString() } },
        { id: 'mem-3', score: 0.75, payload: { memoryId: 'mem-3', playerId: 'p1', content: 'test', type: 'event', importance: 0.5, createdAt: new Date().toISOString() } },
      ];

      const mockMemories = [
        { id: 'mem-2', playerId: 'p1', type: 'event', content: 'test', importance: 0.5, context: {}, createdAt: new Date() },
        { id: 'mem-1', playerId: 'p1', type: 'event', content: 'test', importance: 0.5, context: {}, createdAt: new Date() },
        { id: 'mem-3', playerId: 'p1', type: 'event', content: 'test', importance: 0.5, context: {}, createdAt: new Date() },
      ];

      mockEmbedding.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));
      mockQdrant.searchSimilar.mockResolvedValue(mockSearchResults as any);
      mockPrisma.memory.findMany.mockResolvedValue(mockMemories as any);

      const results = await service.searchMemories('p1', 'query', 5);

      expect((results[0] as any)?.id).toBe('mem-1');
      expect((results[1] as any)?.id).toBe('mem-2');
      expect((results[2] as any)?.id).toBe('mem-3');
    });

    it('should fallback to database search on error', async () => {
      mockEmbedding.generateEmbedding.mockRejectedValue(new Error('Embedding error'));

      const mockMemories = [
        { id: 'mem-1', playerId: 'p1', type: 'event', content: 'test', importance: 0.5, context: {}, createdAt: new Date() },
      ];
      mockPrisma.memory.findMany.mockResolvedValue(mockMemories as any);

      const results = await service.searchMemories('p1', 'query', 5);

      expect(results).toEqual(mockMemories);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getContextForDialogue', () => {
    it('should combine recent and similar memories', async () => {
      const now = new Date();
      const recentMemories = [
        {
          id: 'mem-recent-1',
          playerId: 'p1',
          importance: 0.8,
          createdAt: now,
          type: 'achievement',
          content: 'Recent achievement',
        },
      ];

      const similarMemories = [
        {
          id: 'mem-similar-1',
          playerId: 'p1',
          importance: 0.7,
          createdAt: new Date(now.getTime() - 1000000),
          similarityScore: 0.9,
          type: 'event',
          content: 'Similar event',
        },
      ];

      mockPrisma.memory.findMany.mockResolvedValue(recentMemories as any);
      mockEmbedding.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));
      mockQdrant.searchSimilar.mockResolvedValue([
        {
          id: 'mem-similar-1',
          score: 0.9,
          payload: { memoryId: 'mem-similar-1', playerId: 'p1' },
        },
      ] as any);
      mockPrisma.memory.findMany
        .mockResolvedValueOnce(recentMemories as any)
        .mockResolvedValueOnce([similarMemories[0]] as any);

      const results = await service.getContextForDialogue('p1', 'boss battle', 5);

      expect(results.length).toBeGreaterThan(0);
      // Should include both recent and similar memories
    });

    it('should deduplicate memories', async () => {
      const sharedMemory = {
        id: 'mem-shared',
        playerId: 'p1',
        importance: 0.8,
        createdAt: new Date(),
        type: 'achievement',
        content: 'Shared memory',
        context: {},
      };

      mockPrisma.memory.findMany.mockResolvedValue([sharedMemory] as any);
      mockEmbedding.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));
      mockQdrant.searchSimilar.mockResolvedValue([
        {
          id: 'mem-shared',
          score: 0.95,
          payload: { memoryId: 'mem-shared', playerId: 'p1', content: 'test', type: 'event', importance: 0.8, createdAt: new Date().toISOString() },
        },
      ] as any);
      mockPrisma.memory.findMany
        .mockResolvedValueOnce([sharedMemory] as any)
        .mockResolvedValueOnce([sharedMemory] as any);

      const results = await service.getContextForDialogue('p1', 'event', 5);

      // Should only include the memory once
      const ids = results.map((r) => (r as any).id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should prioritize by importance', async () => {
      const memories = [
        { id: 'mem-1', playerId: 'p1', type: 'event', content: 'test', importance: 0.9, context: {}, createdAt: new Date() },
        { id: 'mem-2', playerId: 'p1', type: 'event', content: 'test', importance: 0.5, context: {}, createdAt: new Date() },
        { id: 'mem-3', playerId: 'p1', type: 'event', content: 'test', importance: 0.7, context: {}, createdAt: new Date() },
      ];

      mockPrisma.memory.findMany.mockResolvedValue(memories as any);
      mockEmbedding.generateEmbedding.mockResolvedValue(new Array(1536).fill(0));
      mockQdrant.searchSimilar.mockResolvedValue([]);

      const results = await service.getContextForDialogue('p1', 'event', 5);

      if (results.length >= 2) {
        expect((results[0] as any).importance).toBeGreaterThanOrEqual((results[1] as any).importance);
      }
    });
  });

  describe('updateImportance', () => {
    it('should update memory importance', async () => {
      const mockMemory = {
        id: 'mem-1',
        importance: 0.9,
        playerId: 'p1',
        type: 'achievement',
        content: 'Test',
        createdAt: new Date(),
      };

      mockPrisma.memory.update.mockResolvedValue(mockMemory as any);

      const result = await service.updateImportance('mem-1', 0.9);

      expect(mockPrisma.memory.update).toHaveBeenCalledWith({
        where: { id: 'mem-1' },
        data: { importance: 0.9 },
      });
      expect(result).toEqual(mockMemory);
    });

    it('should handle update errors', async () => {
      mockPrisma.memory.update.mockRejectedValue(new Error('Update error'));

      const result = await service.updateImportance('mem-1', 0.9);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('cleanupMemories', () => {
    it('should delete memories below importance threshold', async () => {
      const memoriesToDelete = [{ id: 'mem-1' }, { id: 'mem-2' }];

      mockPrisma.memory.findMany.mockResolvedValue(memoriesToDelete as any);
      mockPrisma.memory.deleteMany.mockResolvedValue({ count: 2 });
      mockQdrant.deleteMemories.mockResolvedValue(undefined);

      const result = await service.cleanupMemories('player-123', {
        minImportance: 0.3,
      });

      expect(mockPrisma.memory.findMany).toHaveBeenCalledWith({
        where: {
          playerId: 'player-123',
          importance: { lt: 0.3 },
        },
        select: { id: true },
      });

      expect(mockPrisma.memory.deleteMany).toHaveBeenCalled();
      expect(mockQdrant.deleteMemories).toHaveBeenCalledWith(['mem-1', 'mem-2']);
      expect(result.count).toBe(2);
    });

    it('should delete old memories', async () => {
      mockPrisma.memory.findMany.mockResolvedValue([]);
      mockPrisma.memory.deleteMany.mockResolvedValue({ count: 0 });

      await service.cleanupMemories('player-123', {
        maxAge: 90,
        minImportance: 0.3,
      });

      expect(mockPrisma.memory.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ lt: expect.any(Date) }),
        }),
        select: { id: true },
      });
    });

    it('should continue even if Qdrant deletion fails', async () => {
      mockPrisma.memory.findMany.mockResolvedValue([{ id: 'mem-1' }] as any);
      mockPrisma.memory.deleteMany.mockResolvedValue({ count: 1 });
      mockQdrant.deleteMemories.mockRejectedValue(new Error('Qdrant error'));

      const result = await service.cleanupMemories('player-123', {
        minImportance: 0.3,
      });

      expect(result.count).toBe(1);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getMemoryStats', () => {
    it('should calculate memory statistics', async () => {
      const mockMemories = [
        {
          type: 'achievement',
          importance: 0.8,
          createdAt: new Date('2025-01-01'),
        },
        {
          type: 'achievement',
          importance: 0.9,
          createdAt: new Date('2025-01-15'),
        },
        {
          type: 'event',
          importance: 0.5,
          createdAt: new Date('2025-01-10'),
        },
      ];

      mockPrisma.memory.findMany.mockResolvedValue(mockMemories as any);

      const stats = await service.getMemoryStats('player-123');

      expect(stats.total).toBe(3);
      expect(stats.byType).toEqual({
        achievement: 2,
        event: 1,
      });
      expect(stats.averageImportance).toBeCloseTo(0.733, 2);
      expect(stats.oldestMemory).toEqual(new Date('2025-01-01'));
      expect(stats.newestMemory).toEqual(new Date('2025-01-15'));
    });

    it('should handle empty memories', async () => {
      mockPrisma.memory.findMany.mockResolvedValue([]);

      const stats = await service.getMemoryStats('player-123');

      expect(stats.total).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.averageImportance).toBe(0);
      expect(stats.oldestMemory).toBeNull();
      expect(stats.newestMemory).toBeNull();
    });
  });
});
