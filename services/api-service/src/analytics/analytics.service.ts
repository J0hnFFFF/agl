import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceType } from '@prisma/client';
import { AnalyticsQueryDto, GameAnalyticsQueryDto, CostAnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Record a service metric
   */
  async recordMetric(data: {
    service: ServiceType;
    operation: string;
    playerId?: string;
    gameId?: string;
    latencyMs: number;
    statusCode: number;
    method?: string;
    cost?: number;
    metadata?: any;
  }) {
    try {
      await this.prisma.serviceMetric.create({
        data: {
          service: data.service,
          operation: data.operation,
          playerId: data.playerId,
          gameId: data.gameId,
          latencyMs: data.latencyMs,
          statusCode: data.statusCode,
          method: data.method,
          cost: data.cost || 0,
          metadata: data.metadata,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record metric: ${error.message}`);
      // Don't throw - metrics should not break the main flow
    }
  }

  /**
   * Get service metrics
   */
  async getServiceMetrics(query: AnalyticsQueryDto) {
    const where: any = {};

    if (query.startDate) {
      where.createdAt = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(query.endDate) };
    }
    if (query.gameId) {
      where.gameId = query.gameId;
    }
    if (query.service) {
      where.service = query.service;
    }

    const metrics = await this.prisma.serviceMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    });

    const total = await this.prisma.serviceMetric.count({ where });

    return {
      metrics,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
      },
    };
  }

  /**
   * Get daily analytics for a game
   */
  async getDailyAnalytics(gameId: string, query: GameAnalyticsQueryDto) {
    const where: any = { gameId };

    if (query.startDate) {
      where.date = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.date = { ...where.date, lte: new Date(query.endDate) };
    }

    const analytics = await this.prisma.dailyAnalytics.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return analytics;
  }

  /**
   * Get hourly analytics for real-time monitoring
   */
  async getHourlyAnalytics(gameId?: string, hours: number = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const where: any = {
      hour: { gte: startTime },
    };

    if (gameId) {
      where.gameId = gameId;
    }

    const analytics = await this.prisma.hourlyAnalytics.findMany({
      where,
      orderBy: { hour: 'asc' },
    });

    return analytics;
  }

  /**
   * Get cost analytics
   */
  async getCostAnalytics(query: CostAnalyticsQueryDto) {
    const where: any = {};

    if (query.startDate) {
      where.createdAt = { gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(query.endDate) };
    }
    if (query.gameId) {
      where.gameId = query.gameId;
    }
    if (query.service) {
      where.service = query.service;
    }

    // Aggregate cost by service
    const costByService = await this.prisma.serviceMetric.groupBy({
      by: ['service'],
      where,
      _sum: { cost: true },
      _count: true,
      _avg: { cost: true },
    });

    // Total cost
    const totalCost = await this.prisma.serviceMetric.aggregate({
      where,
      _sum: { cost: true },
      _count: true,
    });

    // Daily cost trend
    const dailyCost = await this.prisma.dailyAnalytics.findMany({
      where: {
        date: {
          gte: query.startDate ? new Date(query.startDate) : undefined,
          lte: query.endDate ? new Date(query.endDate) : undefined,
        },
        gameId: query.gameId,
      },
      select: {
        date: true,
        emotionCost: true,
        dialogueCost: true,
        memoryCost: true,
        totalCost: true,
      },
      orderBy: { date: 'desc' },
    });

    return {
      totalCost: totalCost._sum.cost || 0,
      totalRequests: totalCost._count,
      costByService: costByService.map(item => ({
        service: item.service,
        totalCost: item._sum.cost || 0,
        averageCost: item._avg.cost || 0,
        requestCount: item._count,
      })),
      dailyCost,
    };
  }

  /**
   * Get emotion distribution
   */
  async getEmotionDistribution(gameId?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (gameId) {
      where.gameId = gameId;
    }
    if (startDate) {
      where.date = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }

    const analytics = await this.prisma.dailyAnalytics.findMany({
      where,
      select: { emotionDistribution: true },
    });

    // Aggregate emotion counts
    const distribution: Record<string, number> = {};
    analytics.forEach(day => {
      if (day.emotionDistribution) {
        const dist = day.emotionDistribution as Record<string, number>;
        Object.entries(dist).forEach(([emotion, count]) => {
          distribution[emotion] = (distribution[emotion] || 0) + count;
        });
      }
    });

    return distribution;
  }

  /**
   * Get game usage statistics
   */
  async getGameUsageStats(gameId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.prisma.dailyAnalytics.findMany({
      where: {
        gameId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate summary
    const summary = {
      totalEvents: 0,
      totalPlayers: 0,
      emotionRequests: 0,
      dialogueRequests: 0,
      memoryOperations: 0,
      totalCost: 0,
      avgLatency: 0,
    };

    analytics.forEach(day => {
      summary.totalEvents += day.totalEvents;
      summary.totalPlayers += day.uniquePlayers;
      summary.emotionRequests += day.emotionRequests;
      summary.dialogueRequests += day.dialogueRequests;
      summary.memoryOperations += day.memoryCreated + day.memorySearches;
      summary.totalCost += day.totalCost;
    });

    // Calculate average latency (weighted by request count)
    let totalLatencyWeight = 0;
    let totalWeight = 0;
    analytics.forEach(day => {
      const totalRequests = day.emotionRequests + day.dialogueRequests + day.memorySearches;
      if (totalRequests > 0) {
        const avgLatency =
          (day.emotionAvgLatency * day.emotionRequests +
           day.dialogueAvgLatency * day.dialogueRequests +
           day.memoryAvgLatency * day.memorySearches) / totalRequests;
        totalLatencyWeight += avgLatency * totalRequests;
        totalWeight += totalRequests;
      }
    });
    summary.avgLatency = totalWeight > 0 ? totalLatencyWeight / totalWeight : 0;

    return {
      summary,
      dailyStats: analytics,
    };
  }

  /**
   * Get overall platform statistics
   */
  async getPlatformStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.prisma.dailyAnalytics.aggregate({
      where: {
        date: { gte: startDate },
      },
      _sum: {
        totalEvents: true,
        uniquePlayers: true,
        emotionRequests: true,
        dialogueRequests: true,
        memoryCreated: true,
        memorySearches: true,
        totalCost: true,
      },
    });

    // Get active games count
    const activeGames = await this.prisma.game.count({
      where: { isActive: true },
    });

    // Get LLM vs Template usage
    const llmVsTemplate = await this.prisma.dailyAnalytics.aggregate({
      where: {
        date: { gte: startDate },
      },
      _sum: {
        emotionRuleCount: true,
        emotionMlCount: true,
        emotionCachedCount: true,
        dialogueTemplateCount: true,
        dialogueLlmCount: true,
        dialogueCachedCount: true,
      },
    });

    return {
      activeGames,
      totalEvents: analytics._sum.totalEvents || 0,
      totalPlayers: analytics._sum.uniquePlayers || 0,
      emotionRequests: analytics._sum.emotionRequests || 0,
      dialogueRequests: analytics._sum.dialogueRequests || 0,
      memoryCreated: analytics._sum.memoryCreated || 0,
      memorySearches: analytics._sum.memorySearches || 0,
      totalCost: analytics._sum.totalCost || 0,
      usage: {
        emotionRule: llmVsTemplate._sum.emotionRuleCount || 0,
        emotionMl: llmVsTemplate._sum.emotionMlCount || 0,
        emotionCached: llmVsTemplate._sum.emotionCachedCount || 0,
        dialogueTemplate: llmVsTemplate._sum.dialogueTemplateCount || 0,
        dialogueLlm: llmVsTemplate._sum.dialogueLlmCount || 0,
        dialogueCached: llmVsTemplate._sum.dialogueCachedCount || 0,
      },
    };
  }
}
