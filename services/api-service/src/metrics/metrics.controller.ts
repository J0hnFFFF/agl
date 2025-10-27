import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { CostAnalyticsService } from './cost-analytics.service';
import { SlowQueryService } from './slow-query.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Metrics API controller
 * Provides endpoints for performance monitoring, cost analysis, and query optimization
 */
@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly costAnalyticsService: CostAnalyticsService,
    private readonly slowQueryService: SlowQueryService,
  ) {}

  /**
   * Get recent performance metrics (in-memory)
   */
  @Get('performance/recent')
  async getRecentPerformance(
    @Query('minutes', new DefaultValuePipe(5), ParseIntPipe) minutes: number,
  ) {
    return {
      timeWindow: `${minutes} minutes`,
      endpoints: this.metricsService.getRecentMetrics(minutes),
    };
  }

  /**
   * Get historical performance metrics (from database)
   */
  @Get('performance/historical')
  async getHistoricalPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return {
      startDate: start,
      endDate: end,
      endpoints: await this.metricsService.getHistoricalMetrics(start, end),
    };
  }

  /**
   * Get slow requests
   */
  @Get('performance/slow-requests')
  async getSlowRequests(
    @Query('threshold', new DefaultValuePipe(1000), ParseIntPipe) threshold: number,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return {
      threshold: `${threshold}ms`,
      requests: await this.metricsService.getSlowRequests(threshold, limit),
    };
  }

  /**
   * Get error rate
   */
  @Get('performance/error-rate')
  async getErrorRate(
    @Query('minutes', new DefaultValuePipe(5), ParseIntPipe) minutes: number,
  ) {
    return await this.metricsService.getErrorRate(minutes);
  }

  /**
   * Get cost summary
   */
  @Get('cost/summary')
  async getCostSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('gameId') gameId?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return {
      startDate: start,
      endDate: end,
      gameId,
      summary: await this.costAnalyticsService.getCostSummary(start, end, gameId),
    };
  }

  /**
   * Get cost trend
   */
  @Get('cost/trend')
  async getCostTrend(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('gameId') gameId?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return {
      startDate: start,
      endDate: end,
      gameId,
      trend: await this.costAnalyticsService.getCostTrend(start, end, gameId),
    };
  }

  /**
   * Get top cost contributors
   */
  @Get('cost/top-contributors')
  async getTopCostContributors(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'game' | 'player' = 'game',
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return {
      startDate: start,
      endDate: end,
      groupBy,
      contributors: await this.costAnalyticsService.getTopCostContributors(
        start,
        end,
        groupBy,
        limit,
      ),
    };
  }

  /**
   * Get cost anomalies
   */
  @Get('cost/anomalies')
  async getCostAnomalies(
    @Query('threshold', new DefaultValuePipe(3), ParseIntPipe) threshold: number = 3,
  ) {
    return {
      threshold: `${threshold}x standard deviation`,
      anomalies: await this.costAnalyticsService.getCostAnomalies(threshold),
    };
  }

  /**
   * Get cache savings
   */
  @Get('cost/cache-savings')
  async getCacheSavings(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return {
      startDate: start,
      endDate: end,
      savings: await this.costAnalyticsService.getCacheSavings(start, end),
    };
  }

  /**
   * Get slow database queries
   */
  @Get('database/slow-queries')
  getSlowQueries(
    @Query('threshold', new DefaultValuePipe(100), ParseIntPipe) threshold: number,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return {
      threshold: `${threshold}ms`,
      queries: this.slowQueryService.getSlowQueries(threshold, limit),
    };
  }

  /**
   * Get query summary
   */
  @Get('database/query-summary')
  getQuerySummary(
    @Query('minutes', new DefaultValuePipe(30), ParseIntPipe) minutes: number,
  ) {
    return {
      timeWindow: `${minutes} minutes`,
      summary: this.slowQueryService.getQuerySummary(minutes),
    };
  }

  /**
   * Get queries by model
   */
  @Get('database/queries-by-model')
  getQueriesByModel(
    @Query('model') model: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    if (!model) {
      return {
        error: 'Model parameter is required',
      };
    }

    return {
      model,
      queries: this.slowQueryService.getQueriesByModel(model, limit),
    };
  }

  /**
   * Get optimization suggestions
   */
  @Get('database/optimization-suggestions')
  getOptimizationSuggestions() {
    return {
      suggestions: this.slowQueryService.getOptimizationSuggestions(),
    };
  }

  /**
   * Get database query statistics
   */
  @Get('database/statistics')
  getDatabaseStatistics() {
    return this.slowQueryService.getStatistics();
  }

  /**
   * Health check endpoint (no auth required for monitoring)
   */
  @Get('health')
  getHealth() {
    const stats = this.slowQueryService.getStatistics();
    const errorRate = this.metricsService.getErrorRate(5);

    return {
      status: 'healthy',
      timestamp: new Date(),
      database: {
        totalQueries: stats.totalQueries,
        slowQueryRate: stats.slowQueryRate,
        averageDuration: stats.averageDuration,
      },
      api: errorRate,
    };
  }
}
