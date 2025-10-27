import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.game.findMany({
      where: {
        isActive: true,
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            tier: true,
          },
        },
        players: {
          select: {
            id: true,
            externalId: true,
            characterPersona: true,
            createdAt: true,
          },
          take: 10, // Show first 10 players
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!game || !game.isActive) {
      return null;
    }

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activePlayersToday = await this.prisma.player.count({
      where: {
        gameId: id,
        updatedAt: {
          gte: today,
        },
      },
    });

    const totalEvents = await this.prisma.gameEvent.count({
      where: {
        player: {
          gameId: id,
        },
      },
    });

    return {
      ...game,
      stats: {
        totalPlayers: game._count.players,
        activePlayersToday,
        totalEvents,
      },
    };
  }

  async create(data: { clientId: string; name: string; description?: string; config?: any }) {
    return this.prisma.game.create({
      data: {
        clientId: data.clientId,
        name: data.name,
        description: data.description,
        config: data.config,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string; config?: any }) {
    try {
      return await this.prisma.game.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          config: data.config,
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      return null;
    }
  }

  async remove(id: string) {
    try {
      // Soft delete - just set isActive to false
      await this.prisma.game.update({
        where: { id },
        data: {
          isActive: false,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
