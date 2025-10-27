import { PrismaClient } from '@prisma/client';
import { QdrantService } from './qdrant.service';
import { EmbeddingService } from './embedding.service';

interface Memory {
  id: string;
  playerId: string;
  type: string;
  content: string;
  emotion?: string | null;
  importance: number;
  context?: any;
  createdAt: Date;
}

interface CreateMemoryInput {
  type: string;
  content: string;
  emotion?: string;
  context?: any;
}

interface GetMemoriesOptions {
  limit?: number;
  offset?: number;
  type?: string;
}

interface CleanupOptions {
  maxAge?: number; // days
  minImportance: number;
}

interface MemoryWithScore extends Memory {
  similarityScore?: number;
}

export class MemoryService {
  constructor(
    private prisma: PrismaClient,
    private qdrant: QdrantService,
    private embedding: EmbeddingService
  ) {}

  /**
   * Get memories for a player
   */
  async getMemories(
    playerId: string,
    options: GetMemoriesOptions = {}
  ): Promise<Memory[]> {
    const { limit = 10, offset = 0, type } = options;

    const where: any = { playerId };
    if (type) {
      where.type = type;
    }

    return this.prisma.memory.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Create a new memory
   */
  async createMemory(
    playerId: string,
    data: CreateMemoryInput
  ): Promise<Memory> {
    // Calculate importance score
    const importance = await this.calculateImportance(data);

    // Create memory in database
    const memory = await this.prisma.memory.create({
      data: {
        playerId,
        type: data.type,
        content: data.content,
        emotion: data.emotion,
        importance,
        context: data.context,
      },
    });

    // Generate embedding and store in Qdrant
    try {
      const vector = await this.embedding.generateEmbedding(data.content);

      await this.qdrant.storeMemory({
        id: memory.id,
        vector,
        payload: {
          playerId,
          memoryId: memory.id,
          content: data.content,
          type: data.type,
          emotion: data.emotion,
          importance,
          createdAt: memory.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to store memory in Qdrant:', error);
      // Continue even if vector storage fails
    }

    return memory;
  }

  /**
   * Search memories by semantic similarity
   */
  async searchMemories(
    playerId: string,
    query: string,
    limit: number = 5
  ): Promise<MemoryWithScore[]> {
    try {
      // Generate query embedding
      const queryVector = await this.embedding.generateEmbedding(query);

      // Search in Qdrant
      const results = await this.qdrant.searchSimilar(
        playerId,
        queryVector,
        limit,
        0.3 // Min importance threshold
      );

      // Fetch full memory data from database
      const memoryIds = results.map((r) => r.payload.memoryId);
      const memories = await this.prisma.memory.findMany({
        where: { id: { in: memoryIds } },
      });

      // Add similarity scores
      const memoriesWithScores: MemoryWithScore[] = memories.map((memory: Memory) => {
        const result = results.find((r) => r.payload.memoryId === memory.id);
        return {
          ...memory,
          similarityScore: result?.score,
        };
      });

      // Sort by similarity score
      memoriesWithScores.sort((a, b) => {
        return (b.similarityScore || 0) - (a.similarityScore || 0);
      });

      return memoriesWithScores;
    } catch (error) {
      console.error('Error searching memories:', error);
      // Fallback to database search if vector search fails
      return this.getMemories(playerId, { limit });
    }
  }

  /**
   * Get contextual memories for dialogue generation
   * Combines recent memories with semantically similar memories
   */
  async getContextForDialogue(
    playerId: string,
    currentEvent: string,
    limit: number = 5
  ): Promise<MemoryWithScore[]> {
    // Get recent important memories (temporal context)
    const recentMemories = await this.prisma.memory.findMany({
      where: {
        playerId,
        importance: { gte: 0.5 },
      },
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' },
    });

    // Search for semantically similar memories
    const similarMemories = await this.searchMemories(
      playerId,
      currentEvent,
      Math.ceil(limit / 2)
    );

    // Combine and deduplicate
    const memoryMap = new Map<string, MemoryWithScore>();

    recentMemories.forEach((m: Memory) => {
      memoryMap.set(m.id, m);
    });

    similarMemories.forEach((m: MemoryWithScore) => {
      if (!memoryMap.has(m.id)) {
        memoryMap.set(m.id, m);
      }
    });

    // Convert to array and sort by importance and recency
    const context = Array.from(memoryMap.values()).sort((a: MemoryWithScore, b: MemoryWithScore) => {
      // Prioritize by importance first
      const importanceDiff = b.importance - a.importance;
      if (Math.abs(importanceDiff) > 0.2) {
        return importanceDiff;
      }
      // Then by recency
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return context.slice(0, limit);
  }

  /**
   * Update memory importance
   */
  async updateImportance(
    memoryId: string,
    importance: number
  ): Promise<Memory | null> {
    try {
      const memory = await this.prisma.memory.update({
        where: { id: memoryId },
        data: { importance },
      });

      return memory;
    } catch (error) {
      console.error('Error updating memory importance:', error);
      return null;
    }
  }

  /**
   * Clean up old or unimportant memories
   */
  async cleanupMemories(
    playerId: string,
    options: CleanupOptions
  ): Promise<{ count: number }> {
    const where: any = {
      playerId,
      importance: { lt: options.minImportance },
    };

    if (options.maxAge) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.maxAge);
      where.createdAt = { lt: cutoffDate };
    }

    // Get memories to delete
    const memoriesToDelete = await this.prisma.memory.findMany({
      where,
      select: { id: true },
    });

    const memoryIds = memoriesToDelete.map((m: { id: string }) => m.id);

    // Delete from database
    const result = await this.prisma.memory.deleteMany({ where });

    // Delete from Qdrant
    if (memoryIds.length > 0) {
      try {
        await this.qdrant.deleteMemories(memoryIds);
      } catch (error) {
        console.error('Failed to delete memories from Qdrant:', error);
      }
    }

    return { count: result.count };
  }

  /**
   * Calculate importance score for a memory
   * Based on emotion intensity, event type, and recency
   */
  private async calculateImportance(data: CreateMemoryInput): Promise<number> {
    let importance = 0.5; // Base importance

    // Boost importance for certain memory types
    const importantTypes = ['achievement', 'milestone', 'first_time', 'dramatic'];
    if (importantTypes.includes(data.type)) {
      importance += 0.2;
    }

    // Boost importance for strong emotions
    const strongEmotions = ['amazed', 'excited', 'angry', 'frustrated', 'grateful'];
    if (data.emotion && strongEmotions.includes(data.emotion)) {
      importance += 0.15;
    }

    // Boost importance for rare events
    if (data.context?.rarity === 'legendary' || data.context?.rarity === 'epic') {
      importance += 0.15;
    }

    // Boost for MVP or special achievements
    if (data.context?.mvp || data.context?.isLegendary) {
      importance += 0.1;
    }

    // Boost for long streaks
    const winStreak = data.context?.winStreak || 0;
    const lossStreak = data.context?.lossStreak || 0;
    if (winStreak >= 5 || lossStreak >= 5) {
      importance += 0.1;
    }

    // Cap importance at 1.0
    return Math.min(importance, 1.0);
  }

  /**
   * Decay old memories' importance over time
   * Called periodically to reduce importance of old memories
   */
  async decayOldMemories(playerId: string, daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldMemories = await this.prisma.memory.findMany({
      where: {
        playerId,
        createdAt: { lt: cutoffDate },
        importance: { gt: 0.3 }, // Only decay memories above minimum threshold
      },
    });

    // Decay importance by 20%
    for (const memory of oldMemories) {
      const newImportance = Math.max(memory.importance * 0.8, 0.3);
      await this.prisma.memory.update({
        where: { id: memory.id },
        data: { importance: newImportance },
      });
    }
  }

  /**
   * Get memory statistics for a player
   */
  async getMemoryStats(playerId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    averageImportance: number;
    oldestMemory: Date | null;
    newestMemory: Date | null;
  }> {
    const memories = await this.prisma.memory.findMany({
      where: { playerId },
      select: {
        type: true,
        importance: true,
        createdAt: true,
      },
    });

    const byType: Record<string, number> = {};
    let totalImportance = 0;

    memories.forEach((memory: { type: string; importance: number }) => {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
      totalImportance += memory.importance;
    });

    const sortedByDate = memories.sort(
      (a: { createdAt: Date }, b: { createdAt: Date }) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    return {
      total: memories.length,
      byType,
      averageImportance: memories.length > 0 ? totalImportance / memories.length : 0,
      oldestMemory: sortedByDate[0]?.createdAt || null,
      newestMemory: sortedByDate[sortedByDate.length - 1]?.createdAt || null,
    };
  }
}
