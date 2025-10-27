import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceType } from '@prisma/client';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    serviceMetric: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    dailyAnalytics: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    hourlyAnalytics: {
      findMany: jest.fn(),
    },
    game: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordMetric', () => {
    it('should record a service metric', async () => {
      const metricData = {
        service: ServiceType.EMOTION,
        operation: 'analyze_emotion',
        playerId: 'player-123',
        gameId: 'game-123',
        latencyMs: 50,
        statusCode: 200,
        method: 'rule',
        cost: 0,
      };

      mockPrismaService.serviceMetric.create.mockResolvedValue(metricData);

      await service.recordMetric(metricData);

      expect(mockPrismaService.serviceMetric.create).toHaveBeenCalledWith({
        data: metricData,
      });
    });

    it('should not throw if recording fails', async () => {
      const metricData = {
        service: ServiceType.EMOTION,
        operation: 'analyze_emotion',
        latencyMs: 50,
        statusCode: 200,
      };

      mockPrismaService.serviceMetric.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.recordMetric(metricData)).resolves.not.toThrow();
    });
  });

  describe('getServiceMetrics', () => {
    it('should return paginated service metrics', async () => {
      const mockMetrics = [
        {
          id: 1,
          service: ServiceType.EMOTION,
          operation: 'analyze_emotion',
          latencyMs: 50,
          statusCode: 200,
        },
      ];

      mockPrismaService.serviceMetric.findMany.mockResolvedValue(mockMetrics);
      mockPrismaService.serviceMetric.count.mockResolvedValue(1);

      const result = await service.getServiceMetrics({
        limit: 10,
        offset: 0,
      });

      expect(result.metrics).toEqual(mockMetrics);
      expect(result.pagination).toEqual({
        total: 1,
        limit: 10,
        offset: 0,
      });
    });

    it('should filter by date range', async () => {
      mockPrismaService.serviceMetric.findMany.mockResolvedValue([]);
      mockPrismaService.serviceMetric.count.mockResolvedValue(0);

      await service.getServiceMetrics({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        limit: 10,
        offset: 0,
      });

      expect(mockPrismaService.serviceMetric.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('getDailyAnalytics', () => {
    it('should return daily analytics for a game', async () => {
      const mockAnalytics = [
        {
          date: new Date('2025-01-01'),
          gameId: 'game-123',
          totalEvents: 100,
          uniquePlayers: 50,
        },
      ];

      mockPrismaService.dailyAnalytics.findMany.mockResolvedValue(mockAnalytics);

      const result = await service.getDailyAnalytics('game-123', {});

      expect(result).toEqual(mockAnalytics);
      expect(mockPrismaService.dailyAnalytics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gameId: 'game-123' }),
        })
      );
    });
  });

  describe('getCostAnalytics', () => {
    it('should return cost analytics', async () => {
      mockPrismaService.serviceMetric.groupBy.mockResolvedValue([
        {
          service: ServiceType.EMOTION,
          _sum: { cost: 5.0 },
          _count: 100,
          _avg: { cost: 0.05 },
        },
      ]);

      mockPrismaService.serviceMetric.aggregate.mockResolvedValue({
        _sum: { cost: 10.0 },
        _count: 200,
      });

      mockPrismaService.dailyAnalytics.findMany.mockResolvedValue([
        {
          date: new Date('2025-01-01'),
          emotionCost: 2.0,
          dialogueCost: 3.0,
          memoryCost: 1.0,
          totalCost: 6.0,
        },
      ]);

      const result = await service.getCostAnalytics({});

      expect(result.totalCost).toBe(10.0);
      expect(result.totalRequests).toBe(200);
      expect(result.costByService).toHaveLength(1);
      expect(result.costByService[0].service).toBe(ServiceType.EMOTION);
    });
  });

  describe('getPlatformStats', () => {
    it('should return platform-wide statistics', async () => {
      mockPrismaService.dailyAnalytics.aggregate.mockResolvedValue({
        _sum: {
          totalEvents: 1000,
          uniquePlayers: 500,
          emotionRequests: 300,
          dialogueRequests: 400,
          memoryCreated: 100,
          memorySearches: 200,
          totalCost: 50.0,
          emotionRuleCount: 200,
          emotionMlCount: 50,
          emotionCachedCount: 50,
          dialogueTemplateCount: 300,
          dialogueLlmCount: 50,
          dialogueCachedCount: 50,
        },
      });

      mockPrismaService.game.count.mockResolvedValue(10);

      const result = await service.getPlatformStats(30);

      expect(result.activeGames).toBe(10);
      expect(result.totalEvents).toBe(1000);
      expect(result.totalCost).toBe(50.0);
      expect(result.usage.emotionRule).toBe(200);
      expect(result.usage.dialogueLlm).toBe(50);
    });
  });
});
