import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CostRecord {
  service: 'dialogue' | 'emotion' | 'memory';
  method: 'rule' | 'template' | 'ml' | 'llm' | 'cached';
  cost: number;
  gameId?: string;
  playerId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface CostSummary {
  totalCost: number;
  requestCount: number;
  averageCost: number;
  costByService: Record<string, number>;
  costByMethod: Record<string, number>;
  cacheHitRate: number;
  estimatedMonthlyCost: number;
}

interface CostTrend {
  date: string;
  cost: number;
  requests: number;
}

/**
 * Cost analytics service for tracking LLM and AI service costs
 */
@Injectable()
export class CostAnalyticsService {
  // Cost per 1K tokens (example rates, adjust based on actual pricing)
  private readonly COST_PER_1K_TOKENS = {
    'claude-3-5-sonnet': 0.003, // $3 per 1M input tokens
    'claude-3-haiku': 0.00025, // $0.25 per 1M input tokens
    'gpt-4': 0.03,
    'gpt-3.5-turbo': 0.0015,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a cost event
   */
  async recordCost(record: CostRecord): Promise<void> {
    try {
      await this.prisma.costMetric.create({
        data: {
          service: record.service,
          method: record.method,
          cost: record.cost,
          gameId: record.gameId,
          playerId: record.playerId,
          timestamp: record.timestamp,
          metadata: record.metadata as any,
        },
      });
    } catch (error) {
      console.error('Failed to record cost:', error);
    }
  }

  /**
   * Get cost summary for a time period
   */
  async getCostSummary(
    startDate: Date,
    endDate: Date,
    gameId?: string,
  ): Promise<CostSummary> {
    const whereClause: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (gameId) {
      whereClause.gameId = gameId;
    }

    const costs = await this.prisma.costMetric.findMany({
      where: whereClause,
    });

    const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);
    const requestCount = costs.length;

    // Cost by service
    const costByService: Record<string, number> = {};
    for (const cost of costs) {
      costByService[cost.service] =
        (costByService[cost.service] || 0) + cost.cost;
    }

    // Cost by method
    const costByMethod: Record<string, number> = {};
    for (const cost of costs) {
      costByMethod[cost.method] = (costByMethod[cost.method] || 0) + cost.cost;
    }

    // Cache hit rate
    const cachedRequests = costs.filter((c) => c.method === 'cached').length;
    const cacheHitRate = requestCount > 0 ? cachedRequests / requestCount : 0;

    // Estimated monthly cost (based on current rate)
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = durationMs / (1000 * 60 * 60 * 24);
    const estimatedMonthlyCost =
      durationDays > 0 ? (totalCost / durationDays) * 30 : 0;

    return {
      totalCost,
      requestCount,
      averageCost: requestCount > 0 ? totalCost / requestCount : 0,
      costByService,
      costByMethod,
      cacheHitRate,
      estimatedMonthlyCost,
    };
  }

  /**
   * Get daily cost trend
   */
  async getCostTrend(
    startDate: Date,
    endDate: Date,
    gameId?: string,
  ): Promise<CostTrend[]> {
    const whereClause: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (gameId) {
      whereClause.gameId = gameId;
    }

    const costs = await this.prisma.costMetric.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Group by date
    const dailyCosts = new Map<string, { cost: number; requests: number }>();

    for (const cost of costs) {
      const dateKey = cost.timestamp.toISOString().split('T')[0];
      if (!dailyCosts.has(dateKey)) {
        dailyCosts.set(dateKey, { cost: 0, requests: 0 });
      }
      const day = dailyCosts.get(dateKey)!;
      day.cost += cost.cost;
      day.requests += 1;
    }

    // Convert to array
    const trend: CostTrend[] = [];
    for (const [date, data] of dailyCosts.entries()) {
      trend.push({
        date,
        cost: data.cost,
        requests: data.requests,
      });
    }

    return trend;
  }

  /**
   * Get top cost contributors (games or players)
   */
  async getTopCostContributors(
    startDate: Date,
    endDate: Date,
    groupBy: 'game' | 'player' = 'game',
    limit: number = 10,
  ): Promise<Array<{ id: string; cost: number; requests: number }>> {
    const costs = await this.prisma.costMetric.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by selected field
    const grouped = new Map<string, { cost: number; requests: number }>();

    for (const cost of costs) {
      const key =
        groupBy === 'game'
          ? cost.gameId || 'unknown'
          : cost.playerId || 'unknown';

      if (!grouped.has(key)) {
        grouped.set(key, { cost: 0, requests: 0 });
      }

      const group = grouped.get(key)!;
      group.cost += cost.cost;
      group.requests += 1;
    }

    // Convert to array and sort
    const results = Array.from(grouped.entries())
      .map(([id, data]) => ({
        id,
        cost: data.cost,
        requests: data.requests,
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, limit);

    return results;
  }

  /**
   * Get cost anomalies (unusually high costs)
   */
  async getCostAnomalies(
    thresholdMultiplier: number = 3,
  ): Promise<CostRecord[]> {
    // Get costs from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const costs = await this.prisma.costMetric.findMany({
      where: {
        timestamp: {
          gte: sevenDaysAgo,
        },
      },
    });

    if (costs.length === 0) {
      return [];
    }

    // Calculate average and standard deviation
    const values = costs.map((c) => c.cost);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Find anomalies (costs above threshold)
    const threshold = avg + thresholdMultiplier * stdDev;

    const anomalies = costs.filter((c) => c.cost > threshold);

    return anomalies.map((a) => ({
      service: a.service as any,
      method: a.method as any,
      cost: a.cost,
      gameId: a.gameId || undefined,
      playerId: a.playerId || undefined,
      timestamp: a.timestamp,
      metadata: a.metadata as any,
    }));
  }

  /**
   * Calculate potential savings from caching
   */
  async getCacheSavings(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    actualCost: number;
    potentialCost: number;
    savings: number;
    savingsPercentage: number;
  }> {
    const costs = await this.prisma.costMetric.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const actualCost = costs.reduce((sum, c) => sum + c.cost, 0);

    // Calculate what cost would be without caching
    // Assume cached requests would have cost the same as average non-cached request
    const nonCachedCosts = costs.filter((c) => c.method !== 'cached');
    const cachedCount = costs.filter((c) => c.method === 'cached').length;

    const avgNonCachedCost =
      nonCachedCosts.length > 0
        ? nonCachedCosts.reduce((sum, c) => sum + c.cost, 0) /
          nonCachedCosts.length
        : 0;

    const potentialCost = actualCost + cachedCount * avgNonCachedCost;
    const savings = potentialCost - actualCost;
    const savingsPercentage =
      potentialCost > 0 ? (savings / potentialCost) * 100 : 0;

    return {
      actualCost,
      potentialCost,
      savings,
      savingsPercentage,
    };
  }
}
