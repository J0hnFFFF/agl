import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Performance monitoring middleware
 * Tracks request duration, status codes, and other metrics
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const startHrTime = process.hrtime();

    // Capture original end function
    const originalEnd = res.end;

    // Override end function to capture metrics
    res.end = function (this: Response, ...args: any[]): Response {
      // Calculate duration
      const hrDuration = process.hrtime(startHrTime);
      const durationMs = hrDuration[0] * 1000 + hrDuration[1] / 1000000;

      // Record metrics
      const metricData = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        timestamp: new Date(startTime),
        userAgent: req.get('user-agent') || 'unknown',
        ip: req.ip || 'unknown',
      };

      // Send to metrics service (non-blocking)
      setImmediate(() => {
        this.metricsService.recordRequest(metricData).catch((err) => {
          console.error('Failed to record metrics:', err);
        });
      });

      // Call original end function
      return originalEnd.apply(this, args);
    }.bind(res, this);

    next();
  }
}
