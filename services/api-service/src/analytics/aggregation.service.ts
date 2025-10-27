import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceType } from '@prisma/client';

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Aggregate hourly analytics - runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async aggregateHourlyAnalytics() {
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);

    const previousHour = new Date(currentHour);
    previousHour.setHours(previousHour.getHours() - 1);

    this.logger.log(`Aggregating hourly analytics for ${previousHour.toISOString()}`);

    try {
      // Get unique game IDs from the previous hour
      const games = await this.prisma.serviceMetric.findMany({
        where: {
          createdAt: {
            gte: previousHour,
            lt: currentHour,
          },
        },
        select: { gameId: true },
        distinct: ['gameId'],
      });

      // Aggregate for each game (including null for platform-wide)
      const gameIds = [...new Set(games.map(g => g.gameId))];

      for (const gameId of gameIds) {
        await this.aggregateHourlyData(previousHour, gameId);
      }

      this.logger.log('Hourly analytics aggregation completed');
    } catch (error) {
      this.logger.error(`Failed to aggregate hourly analytics: ${error.message}`);
    }
  }

  /**
   * Aggregate daily analytics - runs at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    this.logger.log(`Aggregating daily analytics for ${yesterday.toISOString()}`);

    try {
      // Get unique game IDs from yesterday
      const games = await this.prisma.serviceMetric.findMany({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today,
          },
        },
        select: { gameId: true },
        distinct: ['gameId'],
      });

      const gameIds = [...new Set(games.map(g => g.gameId))];

      for (const gameId of gameIds) {
        await this.aggregateDailyData(yesterday, gameId);
      }

      this.logger.log('Daily analytics aggregation completed');
    } catch (error) {
      this.logger.error(`Failed to aggregate daily analytics: ${error.message}`);
    }
  }

  /**
   * Aggregate hourly data for a specific hour and game
   */
  private async aggregateHourlyData(hour: Date, gameId: string | null) {
    const nextHour = new Date(hour);
    nextHour.setHours(nextHour.getHours() + 1);

    const where = {
      createdAt: { gte: hour, lt: nextHour },
      gameId,
    };

    // Count events by service
    const emotionMetrics = await this.prisma.serviceMetric.count({
      where: { ...where, service: ServiceType.EMOTION },
    });

    const dialogueMetrics = await this.prisma.serviceMetric.count({
      where: { ...where, service: ServiceType.DIALOGUE },
    });

    const memoryMetrics = await this.prisma.serviceMetric.count({
      where: { ...where, service: ServiceType.MEMORY },
    });

    // Calculate average latency
    const latencyStats = await this.prisma.serviceMetric.aggregate({
      where,
      _avg: { latencyMs: true },
    });

    // Count errors
    const errorCount = await this.prisma.serviceMetric.count({
      where: { ...where, statusCode: { gte: 400 } },
    });

    // Calculate total cost
    const costStats = await this.prisma.serviceMetric.aggregate({
      where,
      _sum: { cost: true },
    });

    // Count total events
    const totalEvents = await this.prisma.gameEvent.count({
      where: {
        createdAt: { gte: hour, lt: nextHour },
        ...(gameId ? { player: { gameId } } : {}),
      },
    });

    // Upsert hourly analytics
    await this.prisma.hourlyAnalytics.upsert({
      where: {
        hour_gameId: {
          hour,
          gameId,
        },
      },
      create: {
        hour,
        gameId,
        totalEvents,
        emotionRequests: emotionMetrics,
        dialogueRequests: dialogueMetrics,
        memoryOperations: memoryMetrics,
        avgLatency: latencyStats._avg.latencyMs || 0,
        errorCount,
        totalCost: costStats._sum.cost || 0,
      },
      update: {
        totalEvents,
        emotionRequests: emotionMetrics,
        dialogueRequests: dialogueMetrics,
        memoryOperations: memoryMetrics,
        avgLatency: latencyStats._avg.latencyMs || 0,
        errorCount,
        totalCost: costStats._sum.cost || 0,
      },
    });
  }

  /**
   * Aggregate daily data for a specific date and game
   */
  private async aggregateDailyData(date: Date, gameId: string | null) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const where = {
      createdAt: { gte: date, lt: nextDay },
      gameId,
    };

    // Emotion statistics
    const emotionStats = await this.getServiceStats(where, ServiceType.EMOTION);
    const dialogueStats = await this.getServiceStats(where, ServiceType.DIALOGUE);
    const memoryStats = await this.getServiceStats(where, ServiceType.MEMORY);

    // Count unique players
    const uniquePlayers = await this.prisma.gameEvent.findMany({
      where: {
        createdAt: { gte: date, lt: nextDay },
        ...(gameId ? { player: { gameId } } : {}),
      },
      select: { playerId: true },
      distinct: ['playerId'],
    });

    // Count total events
    const totalEvents = await this.prisma.gameEvent.count({
      where: {
        createdAt: { gte: date, lt: nextDay },
        ...(gameId ? { player: { gameId } } : {}),
      },
    });

    // Get emotion distribution
    const emotionDistribution = await this.getEmotionDistribution(date, nextDay, gameId);

    // Upsert daily analytics
    await this.prisma.dailyAnalytics.upsert({
      where: {
        date_gameId: {
          date,
          gameId,
        },
      },
      create: {
        date,
        gameId,
        totalEvents,
        uniquePlayers: uniquePlayers.length,

        // Emotion stats
        emotionRequests: emotionStats.total,
        emotionRuleCount: emotionStats.methodCounts.rule || 0,
        emotionMlCount: emotionStats.methodCounts.ml || 0,
        emotionCachedCount: emotionStats.methodCounts.cached || 0,
        emotionAvgLatency: emotionStats.avgLatency,
        emotionCost: emotionStats.totalCost,

        // Dialogue stats
        dialogueRequests: dialogueStats.total,
        dialogueTemplateCount: dialogueStats.methodCounts.template || 0,
        dialogueLlmCount: dialogueStats.methodCounts.llm || 0,
        dialogueCachedCount: dialogueStats.methodCounts.cached || 0,
        dialogueAvgLatency: dialogueStats.avgLatency,
        dialogueCost: dialogueStats.totalCost,

        // Memory stats
        memoryCreated: await this.countMemoriesCreated(date, nextDay, gameId),
        memorySearches: memoryStats.total,
        memoryAvgLatency: memoryStats.avgLatency,
        memoryCost: memoryStats.totalCost,

        emotionDistribution,
        totalCost: emotionStats.totalCost + dialogueStats.totalCost + memoryStats.totalCost,
      },
      update: {
        totalEvents,
        uniquePlayers: uniquePlayers.length,

        emotionRequests: emotionStats.total,
        emotionRuleCount: emotionStats.methodCounts.rule || 0,
        emotionMlCount: emotionStats.methodCounts.ml || 0,
        emotionCachedCount: emotionStats.methodCounts.cached || 0,
        emotionAvgLatency: emotionStats.avgLatency,
        emotionCost: emotionStats.totalCost,

        dialogueRequests: dialogueStats.total,
        dialogueTemplateCount: dialogueStats.methodCounts.template || 0,
        dialogueLlmCount: dialogueStats.methodCounts.llm || 0,
        dialogueCachedCount: dialogueStats.methodCounts.cached || 0,
        dialogueAvgLatency: dialogueStats.avgLatency,
        dialogueCost: dialogueStats.totalCost,

        memoryCreated: await this.countMemoriesCreated(date, nextDay, gameId),
        memorySearches: memoryStats.total,
        memoryAvgLatency: memoryStats.avgLatency,
        memoryCost: memoryStats.totalCost,

        emotionDistribution,
        totalCost: emotionStats.totalCost + dialogueStats.totalCost + memoryStats.totalCost,
      },
    });
  }

  /**
   * Get aggregated statistics for a service
   */
  private async getServiceStats(where: any, service: ServiceType) {
    const serviceWhere = { ...where, service };

    const total = await this.prisma.serviceMetric.count({ where: serviceWhere });

    const avgLatency = await this.prisma.serviceMetric.aggregate({
      where: serviceWhere,
      _avg: { latencyMs: true },
    });

    const totalCost = await this.prisma.serviceMetric.aggregate({
      where: serviceWhere,
      _sum: { cost: true },
    });

    // Count by method
    const methodCounts: Record<string, number> = {};
    const methods = await this.prisma.serviceMetric.groupBy({
      by: ['method'],
      where: serviceWhere,
      _count: true,
    });

    methods.forEach(m => {
      if (m.method) {
        methodCounts[m.method] = m._count;
      }
    });

    return {
      total,
      avgLatency: avgLatency._avg.latencyMs || 0,
      totalCost: totalCost._sum.cost || 0,
      methodCounts,
    };
  }

  /**
   * Get emotion distribution for a date range
   */
  private async getEmotionDistribution(startDate: Date, endDate: Date, gameId: string | null) {
    const events = await this.prisma.gameEvent.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        ...(gameId ? { player: { gameId } } : {}),
        emotion: { not: null },
      },
      select: { emotion: true },
    });

    const distribution: Record<string, number> = {};
    events.forEach(event => {
      if (event.emotion) {
        distribution[event.emotion] = (distribution[event.emotion] || 0) + 1;
      }
    });

    return distribution;
  }

  /**
   * Count memories created in a date range
   */
  private async countMemoriesCreated(startDate: Date, endDate: Date, gameId: string | null) {
    return await this.prisma.memory.count({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        ...(gameId ? { player: { gameId } } : {}),
      },
    });
  }

  /**
   * Manual trigger for aggregation (for testing or backfilling)
   */
  async manualAggregation(date: Date, type: 'hourly' | 'daily' = 'daily') {
    this.logger.log(`Manual ${type} aggregation triggered for ${date.toISOString()}`);

    if (type === 'hourly') {
      await this.aggregateHourlyData(date, null);
    } else {
      await this.aggregateDailyData(date, null);
    }

    this.logger.log('Manual aggregation completed');
  }
}
