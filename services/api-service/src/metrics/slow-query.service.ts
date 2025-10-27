import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface QueryMetric {
  query: string;
  model: string;
  action: string;
  durationMs: number;
  timestamp: Date;
  params?: any;
}

interface SlowQuerySummary {
  query: string;
  model: string;
  action: string;
  count: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  p95Duration: number;
}

/**
 * Slow query monitoring service
 * Tracks database query performance and identifies bottlenecks
 */
@Injectable()
export class SlowQueryService {
  private queryMetrics: QueryMetric[] = [];
  private readonly MAX_METRICS_SIZE = 5000;
  private readonly SLOW_QUERY_THRESHOLD_MS = 100; // Queries slower than 100ms

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize Prisma query logging middleware
   */
  initializePrismaMiddleware(): void {
    // Add Prisma middleware to track query performance
    this.prisma.$use(async (params, next) => {
      const startTime = Date.now();

      try {
        const result = await next(params);
        const durationMs = Date.now() - startTime;

        // Record the query metric
        this.recordQuery({
          query: this.formatQuery(params),
          model: params.model || 'unknown',
          action: params.action,
          durationMs,
          timestamp: new Date(startTime),
          params: this.sanitizeParams(params.args),
        });

        return result;
      } catch (error) {
        const durationMs = Date.now() - startTime;

        // Record failed query
        this.recordQuery({
          query: this.formatQuery(params) + ' [FAILED]',
          model: params.model || 'unknown',
          action: params.action,
          durationMs,
          timestamp: new Date(startTime),
          params: this.sanitizeParams(params.args),
        });

        throw error;
      }
    });
  }

  /**
   * Format Prisma query for logging
   */
  private formatQuery(params: any): string {
    if (!params.model) {
      return `${params.action}`;
    }
    return `${params.model}.${params.action}`;
  }

  /**
   * Sanitize query parameters (remove sensitive data)
   */
  private sanitizeParams(params: any): any {
    if (!params) return undefined;

    const sanitized = { ...params };

    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
      if (sanitized.data && sanitized.data[field]) {
        sanitized.data[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Record a query metric
   */
  private recordQuery(metric: QueryMetric): void {
    this.queryMetrics.push(metric);

    // Trim if buffer is too large
    if (this.queryMetrics.length > this.MAX_METRICS_SIZE) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS_SIZE);
    }

    // Log slow queries immediately
    if (metric.durationMs >= this.SLOW_QUERY_THRESHOLD_MS) {
      console.warn(
        `🐌 Slow query detected: ${metric.query} took ${metric.durationMs.toFixed(2)}ms`,
      );
    }
  }

  /**
   * Get slow queries above threshold
   */
  getSlowQueries(
    thresholdMs: number = this.SLOW_QUERY_THRESHOLD_MS,
    limit: number = 100,
  ): QueryMetric[] {
    return this.queryMetrics
      .filter((m) => m.durationMs >= thresholdMs)
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, limit);
  }

  /**
   * Get query summary grouped by query pattern
   */
  getQuerySummary(minutesAgo: number = 30): SlowQuerySummary[] {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    const recentQueries = this.queryMetrics.filter(
      (m) => m.timestamp >= cutoffTime,
    );

    // Group by query pattern
    const grouped = new Map<string, QueryMetric[]>();

    for (const metric of recentQueries) {
      const key = metric.query;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    // Calculate summary for each query pattern
    const summaries: SlowQuerySummary[] = [];

    for (const [query, metrics] of grouped.entries()) {
      const durations = metrics.map((m) => m.durationMs).sort((a, b) => a - b);
      const count = durations.length;
      const sum = durations.reduce((acc, d) => acc + d, 0);

      // Calculate P95
      const p95Index = Math.ceil(0.95 * count) - 1;
      const p95 = durations[Math.max(0, p95Index)];

      summaries.push({
        query,
        model: metrics[0].model,
        action: metrics[0].action,
        count,
        avgDuration: sum / count,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        p95Duration: p95,
      });
    }

    // Sort by total time spent (avg * count)
    summaries.sort((a, b) => {
      const aTotal = a.avgDuration * a.count;
      const bTotal = b.avgDuration * b.count;
      return bTotal - aTotal;
    });

    return summaries;
  }

  /**
   * Get queries by model
   */
  getQueriesByModel(model: string, limit: number = 50): QueryMetric[] {
    return this.queryMetrics
      .filter((m) => m.model === model)
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, limit);
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions(): Array<{
    query: string;
    suggestion: string;
    severity: 'high' | 'medium' | 'low';
  }> {
    const suggestions: Array<{
      query: string;
      suggestion: string;
      severity: 'high' | 'medium' | 'low';
    }> = [];

    const summary = this.getQuerySummary(60); // Last hour

    for (const query of summary) {
      // Very slow queries
      if (query.avgDuration > 500) {
        suggestions.push({
          query: query.query,
          suggestion: `Query is extremely slow (avg: ${query.avgDuration.toFixed(2)}ms). Consider adding indexes, optimizing the query, or implementing caching.`,
          severity: 'high',
        });
      }
      // Moderate slow queries
      else if (query.avgDuration > 200) {
        suggestions.push({
          query: query.query,
          suggestion: `Query is moderately slow (avg: ${query.avgDuration.toFixed(2)}ms). Review query structure and consider adding indexes.`,
          severity: 'medium',
        });
      }

      // High frequency queries
      if (query.count > 1000) {
        suggestions.push({
          query: query.query,
          suggestion: `Query is executed very frequently (${query.count} times). Consider caching the results.`,
          severity: query.avgDuration > 100 ? 'high' : 'medium',
        });
      }

      // High P95 variance
      if (query.p95Duration > query.avgDuration * 3) {
        suggestions.push({
          query: query.query,
          suggestion: `Query has high performance variance (P95: ${query.p95Duration.toFixed(2)}ms vs avg: ${query.avgDuration.toFixed(2)}ms). Investigate inconsistent performance.`,
          severity: 'medium',
        });
      }
    }

    return suggestions;
  }

  /**
   * Clear metrics buffer
   */
  clearMetrics(): void {
    this.queryMetrics = [];
  }

  /**
   * Get metrics statistics
   */
  getStatistics(): {
    totalQueries: number;
    slowQueries: number;
    averageDuration: number;
    slowQueryRate: number;
  } {
    const total = this.queryMetrics.length;
    const slow = this.queryMetrics.filter(
      (m) => m.durationMs >= this.SLOW_QUERY_THRESHOLD_MS,
    ).length;

    const avgDuration =
      total > 0
        ? this.queryMetrics.reduce((sum, m) => sum + m.durationMs, 0) / total
        : 0;

    return {
      totalQueries: total,
      slowQueries: slow,
      averageDuration: avgDuration,
      slowQueryRate: total > 0 ? slow / total : 0,
    };
  }
}
