import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class PlayerService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'player:';

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(gameId: string, options: { limit?: number; offset?: number; sortBy?: string; order?: 'asc' | 'desc' }) {
    const { limit = 50, offset = 0, sortBy = 'createdAt', order = 'desc' } = options;

    // Verify game exists and is active
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || !game.isActive) {
      return null;
    }

    // Get players with pagination
    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where: { gameId },
        take: Math.min(limit, 100), // Cap at 100
        skip: offset,
        orderBy: { [sortBy]: order },
        select: {
          id: true,
          externalId: true,
          characterPersona: true,
          createdAt: true,
          _count: {
            select: {
              events: true,
              memories: true,
            },
          },
        },
      }),
      this.prisma.player.count({
        where: { gameId },
      }),
    ]);

    // Format response
    const formattedPlayers = players.map((player) => ({
      id: player.id,
      externalId: player.externalId,
      characterPersona: player.characterPersona,
      createdAt: player.createdAt,
      stats: {
        totalEvents: player._count.events,
        totalMemories: player._count.memories,
      },
    }));

    return {
      players: formattedPlayers,
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }

  async createOrGet(gameId: string, data: { externalId: string; characterPersona?: string; preferences?: any }) {
    // Verify game exists and is active
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || !game.isActive) {
      return null;
    }

    // Try to find existing player
    const existingPlayer = await this.prisma.player.findFirst({
      where: {
        gameId,
        externalId: data.externalId,
      },
    });

    if (existingPlayer) {
      return existingPlayer;
    }

    // Create new player
    return this.prisma.player.create({
      data: {
        gameId,
        externalId: data.externalId,
        characterPersona: data.characterPersona || 'cheerful',
        preferences: data.preferences || {},
      },
    });
  }

  async findOne(playerId: string) {
    // Try cache first
    const cacheKey = `${this.CACHE_PREFIX}${playerId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: {
        memories: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            content: true,
            emotion: true,
            importance: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            events: true,
            memories: true,
          },
        },
      },
    });

    if (!player) {
      return null;
    }

    const result = {
      id: player.id,
      externalId: player.externalId,
      characterPersona: player.characterPersona,
      preferences: player.preferences,
      stats: {
        totalEvents: player._count.events,
        totalMemories: player._count.memories,
        lastActive: player.updatedAt,
      },
      recentMemories: player.memories,
    };

    // Cache the result
    await this.cache.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async update(playerId: string, data: { characterPersona?: string; preferences?: any }) {
    try {
      const result = await this.prisma.player.update({
        where: { id: playerId },
        data: {
          characterPersona: data.characterPersona,
          preferences: data.preferences,
        },
      });

      // Invalidate cache
      const cacheKey = `${this.CACHE_PREFIX}${playerId}`;
      await this.cache.del(cacheKey);

      return result;
    } catch (error) {
      return null;
    }
  }
}
