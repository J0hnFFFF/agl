import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { CostAnalyticsService } from './cost-analytics.service';
import { SlowQueryService } from './slow-query.service';
import { MetricsController } from './metrics.controller';
import { PerformanceMiddleware } from './performance.middleware';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Metrics Module
 * Provides comprehensive monitoring for performance, cost, and database queries
 */
@Module({
  imports: [PrismaModule],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    CostAnalyticsService,
    SlowQueryService,
    PerformanceMiddleware,
  ],
  exports: [MetricsService, CostAnalyticsService, SlowQueryService],
})
export class MetricsModule implements NestModule {
  constructor(private readonly slowQueryService: SlowQueryService) {
    // Initialize Prisma query monitoring
    this.slowQueryService.initializePrismaMiddleware();
  }

  configure(consumer: MiddlewareConsumer) {
    // Apply performance middleware to all routes
    consumer.apply(PerformanceMiddleware).forRoutes('*');
  }
}
