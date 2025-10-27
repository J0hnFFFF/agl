import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
  userAgent: string;
  ip: string;
}

interface PercentileMetrics {
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
  count: number;
}

interface EndpointMetrics {
  endpoint: string;
  method: string;
  metrics: PercentileMetrics;
  statusCodeDistribution: Record<number, number>;
}

/**
 * Metrics collection and analysis service
 * Tracks API performance, calculates percentiles, and provides insights
 */
@Injectable()
export class MetricsService {
  // In-memory buffer for recent metrics (last 10000 requests)
  private metricsBuffer: RequestMetric[] = [];
  private readonly MAX_BUFFER_SIZE = 10000;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a request metric
   */
  async recordRequest(metric: RequestMetric): Promise<void> {
    // Add to in-memory buffer
    this.metricsBuffer.push(metric);

    // Trim buffer if too large
    if (this.metricsBuffer.length > this.MAX_BUFFER_SIZE) {
      this.metricsBuffer = this.metricsBuffer.slice(-this.MAX_BUFFER_SIZE);
    }

    // Persist to database (async, non-blocking)
    try {
      await this.prisma.requestMetric.create({
        data: {
          method: metric.method,
          path: metric.path,
          statusCode: metric.statusCode,
          durationMs: metric.durationMs,
          timestamp: metric.timestamp,
          userAgent: metric.userAgent,
          ip: metric.ip,
        },
      });
    } catch (error) {
      // Log error but don't throw - metrics shouldn't break the application
      console.error('Failed to persist metric:', error);
    }
  }

  /**
   * Calculate percentiles from an array of numbers
   */
  private calculatePercentiles(values: number[]): PercentileMetrics {
    if (values.length === 0) {
      return {
        p50: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        avg: 0,
        count: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;

    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * count) - 1;
      return sorted[Math.max(0, index)];
    };

    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      p50: getPercentile(50),
      p95: getPercentile(95),
      p99: getPercentile(99),
      min: sorted[0],
      max: sorted[count - 1],
      avg: sum / count,
      count,
    };
  }

  /**
   * Get metrics for a specific time window (from in-memory buffer)
   */
  getRecentMetrics(minutesAgo: number = 5): EndpointMetrics[] {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    const recentMetrics = this.metricsBuffer.filter(
      (m) => m.timestamp >= cutoffTime,
    );

    // Group by endpoint and method
    const grouped = new Map<string, RequestMetric[]>();

    for (const metric of recentMetrics) {
      const key = `${metric.method} ${metric.path}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    // Calculate metrics for each endpoint
    const results: EndpointMetrics[] = [];

    for (const [key, metrics] of grouped.entries()) {
      const [method, endpoint] = key.split(' ', 2);
      const durations = metrics.map((m) => m.durationMs);

      // Status code distribution
      const statusCodeDist: Record<number, number> = {};
      for (const metric of metrics) {
        statusCodeDist[metric.statusCode] =
          (statusCodeDist[metric.statusCode] || 0) + 1;
      }

      results.push({
        endpoint,
        method,
        metrics: this.calculatePercentiles(durations),
        statusCodeDistribution: statusCodeDist,
      });
    }

    // Sort by request count (descending)
    results.sort((a, b) => b.metrics.count - a.metrics.count);

    return results;
  }

  /**
   * Get historical metrics from database
   */
  async getHistoricalMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<EndpointMetrics[]> {
    const metrics = await this.prisma.requestMetric.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Group by endpoint and method
    const grouped = new Map<string, typeof metrics>();

    for (const metric of metrics) {
      const key = `${metric.method} ${metric.path}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    // Calculate metrics for each endpoint
    const results: EndpointMetrics[] = [];

    for (const [key, endpointMetrics] of grouped.entries()) {
      const [method, endpoint] = key.split(' ', 2);
      const durations = endpointMetrics.map((m) => m.durationMs);

      // Status code distribution
      const statusCodeDist: Record<number, number> = {};
      for (const metric of endpointMetrics) {
        statusCodeDist[metric.statusCode] =
          (statusCodeDist[metric.statusCode] || 0) + 1;
      }

      results.push({
        endpoint,
        method,
        metrics: this.calculatePercentiles(durations),
        statusCodeDistribution: statusCodeDist,
      });
    }

    // Sort by request count (descending)
    results.sort((a, b) => b.metrics.count - a.metrics.count);

    return results;
  }

  /**
   * Get slow requests (above threshold)
   */
  async getSlowRequests(
    thresholdMs: number = 1000,
    limit: number = 100,
  ): Promise<RequestMetric[]> {
    const slowRequests = await this.prisma.requestMetric.findMany({
      where: {
        durationMs: {
          gte: thresholdMs,
        },
      },
      orderBy: {
        durationMs: 'desc',
      },
      take: limit,
    });

    return slowRequests as RequestMetric[];
  }

  /**
   * Get error rate for a time period
   */
  async getErrorRate(minutesAgo: number = 5): Promise<{
    totalRequests: number;
    errorRequests: number;
    errorRate: number;
    errorsByStatus: Record<number, number>;
  }> {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);

    const [total, errors] = await Promise.all([
      this.prisma.requestMetric.count({
        where: {
          timestamp: {
            gte: cutoffTime,
          },
        },
      }),
      this.prisma.requestMetric.findMany({
        where: {
          timestamp: {
            gte: cutoffTime,
          },
          statusCode: {
            gte: 400,
          },
        },
      }),
    ]);

    const errorsByStatus: Record<number, number> = {};
    for (const error of errors) {
      errorsByStatus[error.statusCode] =
        (errorsByStatus[error.statusCode] || 0) + 1;
    }

    return {
      totalRequests: total,
      errorRequests: errors.length,
      errorRate: total > 0 ? errors.length / total : 0,
      errorsByStatus,
    };
  }

  /**
   * Clean old metrics (retention policy)
   */
  async cleanOldMetrics(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await this.prisma.requestMetric.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
