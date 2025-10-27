import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    requestMetric: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordRequest', () => {
    it('should record a request metric', async () => {
      const metric = {
        method: 'POST',
        path: '/api/v1/test',
        statusCode: 200,
        durationMs: 45.5,
        timestamp: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };

      mockPrismaService.requestMetric.create.mockResolvedValue({
        id: 1,
        ...metric,
      });

      await service.recordRequest(metric);

      expect(mockPrismaService.requestMetric.create).toHaveBeenCalledWith({
        data: metric,
      });
    });

    it('should handle database errors gracefully', async () => {
      const metric = {
        method: 'POST',
        path: '/api/v1/test',
        statusCode: 200,
        durationMs: 45.5,
        timestamp: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };

      mockPrismaService.requestMetric.create.mockRejectedValue(
        new Error('DB error'),
      );

      // Should not throw
      await expect(service.recordRequest(metric)).resolves.not.toThrow();
    });
  });

  describe('getRecentMetrics', () => {
    it('should return metrics from in-memory buffer', () => {
      // Add some metrics to buffer
      const now = new Date();
      const metrics = [
        {
          method: 'GET',
          path: '/api/v1/test',
          statusCode: 200,
          durationMs: 50,
          timestamp: now,
          userAgent: 'test',
          ip: '127.0.0.1',
        },
        {
          method: 'GET',
          path: '/api/v1/test',
          statusCode: 200,
          durationMs: 100,
          timestamp: now,
          userAgent: 'test',
          ip: '127.0.0.1',
        },
        {
          method: 'POST',
          path: '/api/v1/other',
          statusCode: 201,
          durationMs: 75,
          timestamp: now,
          userAgent: 'test',
          ip: '127.0.0.1',
        },
      ];

      metrics.forEach((m) => service.recordRequest(m));

      const results = service.getRecentMetrics(5);

      expect(results).toHaveLength(2); // Two unique endpoints
      expect(results[0].method).toBe('GET');
      expect(results[0].endpoint).toBe('/api/v1/test');
      expect(results[0].metrics.count).toBe(2);
      expect(results[0].metrics.p50).toBe(100); // Median of [50, 100]
    });

    it('should calculate percentiles correctly', () => {
      const now = new Date();
      const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

      durations.forEach((d) => {
        service.recordRequest({
          method: 'GET',
          path: '/api/v1/test',
          statusCode: 200,
          durationMs: d,
          timestamp: now,
          userAgent: 'test',
          ip: '127.0.0.1',
        });
      });

      const results = service.getRecentMetrics(5);
      const metrics = results[0].metrics;

      expect(metrics.count).toBe(10);
      expect(metrics.min).toBe(10);
      expect(metrics.max).toBe(100);
      expect(metrics.avg).toBe(55);
      expect(metrics.p50).toBe(50); // 50th percentile
      expect(metrics.p95).toBe(95); // 95th percentile
      expect(metrics.p99).toBe(99); // 99th percentile
    });

    it('should group metrics by endpoint and method', () => {
      const now = new Date();

      service.recordRequest({
        method: 'GET',
        path: '/api/v1/test',
        statusCode: 200,
        durationMs: 50,
        timestamp: now,
        userAgent: 'test',
        ip: '127.0.0.1',
      });

      service.recordRequest({
        method: 'POST',
        path: '/api/v1/test',
        statusCode: 201,
        durationMs: 60,
        timestamp: now,
        userAgent: 'test',
        ip: '127.0.0.1',
      });

      const results = service.getRecentMetrics(5);

      expect(results).toHaveLength(2);
      expect(results.find((r) => r.method === 'GET')).toBeDefined();
      expect(results.find((r) => r.method === 'POST')).toBeDefined();
    });
  });

  describe('getHistoricalMetrics', () => {
    it('should fetch metrics from database', async () => {
      const startDate = new Date('2025-01-20');
      const endDate = new Date('2025-01-26');

      mockPrismaService.requestMetric.findMany.mockResolvedValue([
        {
          id: 1,
          method: 'GET',
          path: '/api/v1/test',
          statusCode: 200,
          durationMs: 50,
          timestamp: new Date('2025-01-21'),
          userAgent: 'test',
          ip: '127.0.0.1',
        },
      ]);

      const results = await service.getHistoricalMetrics(startDate, endDate);

      expect(mockPrismaService.requestMetric.findMany).toHaveBeenCalledWith({
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

      expect(results).toHaveLength(1);
    });
  });

  describe('getSlowRequests', () => {
    it('should fetch requests above threshold', async () => {
      const threshold = 1000;

      mockPrismaService.requestMetric.findMany.mockResolvedValue([
        {
          id: 1,
          method: 'POST',
          path: '/api/v1/slow',
          statusCode: 200,
          durationMs: 1500,
          timestamp: new Date(),
          userAgent: 'test',
          ip: '127.0.0.1',
        },
      ]);

      const results = await service.getSlowRequests(threshold, 100);

      expect(mockPrismaService.requestMetric.findMany).toHaveBeenCalledWith({
        where: {
          durationMs: {
            gte: threshold,
          },
        },
        orderBy: {
          durationMs: 'desc',
        },
        take: 100,
      });

      expect(results).toHaveLength(1);
      expect(results[0].durationMs).toBeGreaterThanOrEqual(threshold);
    });
  });

  describe('getErrorRate', () => {
    it('should calculate error rate correctly', async () => {
      mockPrismaService.requestMetric.count.mockResolvedValue(1000);
      mockPrismaService.requestMetric.findMany.mockResolvedValue([
        {
          id: 1,
          method: 'GET',
          path: '/api/v1/test',
          statusCode: 500,
          durationMs: 50,
          timestamp: new Date(),
          userAgent: 'test',
          ip: '127.0.0.1',
        },
        {
          id: 2,
          method: 'GET',
          path: '/api/v1/test',
          statusCode: 404,
          durationMs: 50,
          timestamp: new Date(),
          userAgent: 'test',
          ip: '127.0.0.1',
        },
      ]);

      const result = await service.getErrorRate(5);

      expect(result.totalRequests).toBe(1000);
      expect(result.errorRequests).toBe(2);
      expect(result.errorRate).toBe(0.002); // 2/1000
      expect(result.errorsByStatus).toEqual({
        500: 1,
        404: 1,
      });
    });

    it('should handle zero requests', async () => {
      mockPrismaService.requestMetric.count.mockResolvedValue(0);
      mockPrismaService.requestMetric.findMany.mockResolvedValue([]);

      const result = await service.getErrorRate(5);

      expect(result.errorRate).toBe(0);
    });
  });

  describe('cleanOldMetrics', () => {
    it('should delete old metrics', async () => {
      mockPrismaService.requestMetric.deleteMany.mockResolvedValue({
        count: 500,
      });

      const count = await service.cleanOldMetrics(30);

      expect(count).toBe(500);
      expect(mockPrismaService.requestMetric.deleteMany).toHaveBeenCalled();
    });
  });
});
