import { Test, TestingModule } from '@nestjs/testing';
import { CostAnalyticsService } from './cost-analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CostAnalyticsService', () => {
  let service: CostAnalyticsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    costMetric: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostAnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CostAnalyticsService>(CostAnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordCost', () => {
    it('should record a cost event', async () => {
      const costRecord = {
        service: 'dialogue' as const,
        method: 'llm' as const,
        cost: 0.005,
        gameId: 'game-1',
        playerId: 'player-1',
        timestamp: new Date(),
        metadata: { tokens: 1000 },
      };

      mockPrismaService.costMetric.create.mockResolvedValue({
        id: 1,
        ...costRecord,
      });

      await service.recordCost(costRecord);

      expect(mockPrismaService.costMetric.create).toHaveBeenCalledWith({
        data: costRecord,
      });
    });

    it('should handle errors gracefully', async () => {
      const costRecord = {
        service: 'emotion' as const,
        method: 'ml' as const,
        cost: 0.002,
        timestamp: new Date(),
      };

      mockPrismaService.costMetric.create.mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.recordCost(costRecord)).resolves.not.toThrow();
    });
  });

  describe('getCostSummary', () => {
    it('should calculate cost summary correctly', async () => {
      const startDate = new Date('2025-01-20');
      const endDate = new Date('2025-01-26');

      const mockCosts = [
        {
          id: 1,
          service: 'dialogue',
          method: 'llm',
          cost: 0.01,
          gameId: 'game-1',
          playerId: null,
          timestamp: new Date('2025-01-21'),
          metadata: null,
        },
        {
          id: 2,
          service: 'emotion',
          method: 'ml',
          cost: 0.005,
          gameId: 'game-1',
          playerId: null,
          timestamp: new Date('2025-01-22'),
          metadata: null,
        },
        {
          id: 3,
          service: 'dialogue',
          method: 'cached',
          cost: 0,
          gameId: 'game-1',
          playerId: null,
          timestamp: new Date('2025-01-23'),
          metadata: null,
        },
      ];

      mockPrismaService.costMetric.findMany.mockResolvedValue(mockCosts);

      const summary = await service.getCostSummary(startDate, endDate);

      expect(summary.totalCost).toBe(0.015);
      expect(summary.requestCount).toBe(3);
      expect(summary.averageCost).toBe(0.005);
      expect(summary.cacheHitRate).toBe(1 / 3);
      expect(summary.costByService).toEqual({
        dialogue: 0.01,
        emotion: 0.005,
      });
      expect(summary.costByMethod).toEqual({
        llm: 0.01,
        ml: 0.005,
        cached: 0,
      });
    });

    it('should handle empty results', async () => {
      mockPrismaService.costMetric.findMany.mockResolvedValue([]);

      const summary = await service.getCostSummary(
        new Date(),
        new Date(),
      );

      expect(summary.totalCost).toBe(0);
      expect(summary.requestCount).toBe(0);
      expect(summary.averageCost).toBe(0);
      expect(summary.cacheHitRate).toBe(0);
    });
  });

  describe('getCostTrend', () => {
    it('should group costs by date', async () => {
      const mockCosts = [
        {
          id: 1,
          service: 'dialogue',
          method: 'llm',
          cost: 0.01,
          gameId: null,
          playerId: null,
          timestamp: new Date('2025-01-20T10:00:00Z'),
          metadata: null,
        },
        {
          id: 2,
          service: 'emotion',
          method: 'ml',
          cost: 0.005,
          gameId: null,
          playerId: null,
          timestamp: new Date('2025-01-20T15:00:00Z'),
          metadata: null,
        },
        {
          id: 3,
          service: 'dialogue',
          method: 'llm',
          cost: 0.02,
          gameId: null,
          playerId: null,
          timestamp: new Date('2025-01-21T10:00:00Z'),
          metadata: null,
        },
      ];

      mockPrismaService.costMetric.findMany.mockResolvedValue(mockCosts);

      const trend = await service.getCostTrend(
        new Date('2025-01-20'),
        new Date('2025-01-21'),
      );

      expect(trend).toHaveLength(2);
      expect(trend[0].date).toBe('2025-01-20');
      expect(trend[0].cost).toBe(0.015);
      expect(trend[0].requests).toBe(2);
      expect(trend[1].date).toBe('2025-01-21');
      expect(trend[1].cost).toBe(0.02);
      expect(trend[1].requests).toBe(1);
    });
  });

  describe('getTopCostContributors', () => {
    it('should return top contributors by game', async () => {
      const mockCosts = [
        {
          id: 1,
          service: 'dialogue',
          method: 'llm',
          cost: 0.05,
          gameId: 'game-1',
          playerId: 'player-1',
          timestamp: new Date(),
          metadata: null,
        },
        {
          id: 2,
          service: 'emotion',
          method: 'ml',
          cost: 0.03,
          gameId: 'game-1',
          playerId: 'player-2',
          timestamp: new Date(),
          metadata: null,
        },
        {
          id: 3,
          service: 'dialogue',
          method: 'llm',
          cost: 0.02,
          gameId: 'game-2',
          playerId: 'player-3',
          timestamp: new Date(),
          metadata: null,
        },
      ];

      mockPrismaService.costMetric.findMany.mockResolvedValue(mockCosts);

      const contributors = await service.getTopCostContributors(
        new Date('2025-01-20'),
        new Date('2025-01-26'),
        'game',
        10,
      );

      expect(contributors).toHaveLength(2);
      expect(contributors[0].id).toBe('game-1');
      expect(contributors[0].cost).toBe(0.08);
      expect(contributors[0].requests).toBe(2);
      expect(contributors[1].id).toBe('game-2');
      expect(contributors[1].cost).toBe(0.02);
    });

    it('should return top contributors by player', async () => {
      const mockCosts = [
        {
          id: 1,
          service: 'dialogue',
          method: 'llm',
          cost: 0.05,
          gameId: 'game-1',
          playerId: 'player-1',
          timestamp: new Date(),
          metadata: null,
        },
        {
          id: 2,
          service: 'emotion',
          method: 'ml',
          cost: 0.03,
          gameId: 'game-1',
          playerId: 'player-1',
          timestamp: new Date(),
          metadata: null,
        },
        {
          id: 3,
          service: 'dialogue',
          method: 'llm',
          cost: 0.02,
          gameId: 'game-1',
          playerId: 'player-2',
          timestamp: new Date(),
          metadata: null,
        },
      ];

      mockPrismaService.costMetric.findMany.mockResolvedValue(mockCosts);

      const contributors = await service.getTopCostContributors(
        new Date('2025-01-20'),
        new Date('2025-01-26'),
        'player',
        10,
      );

      expect(contributors).toHaveLength(2);
      expect(contributors[0].id).toBe('player-1');
      expect(contributors[0].cost).toBe(0.08);
    });
  });

  describe('getCostAnomalies', () => {
    it('should detect cost anomalies', async () => {
      // Create a dataset with one outlier
      const normalCosts = Array(50)
        .fill(0)
        .map((_, i) => ({
          id: i + 1,
          service: 'dialogue',
          method: 'llm',
          cost: 0.005, // Normal cost
          gameId: 'game-1',
          playerId: null,
          timestamp: new Date(Date.now() - i * 3600000),
          metadata: null,
        }));

      const anomaly = {
        id: 100,
        service: 'dialogue',
        method: 'llm',
        cost: 0.5, // Anomaly - much higher than normal
        gameId: 'game-1',
        playerId: null,
        timestamp: new Date(),
        metadata: null,
      };

      mockPrismaService.costMetric.findMany.mockResolvedValue([
        ...normalCosts,
        anomaly,
      ]);

      const anomalies = await service.getCostAnomalies(3);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].cost).toBe(0.5);
    });
  });

  describe('getCacheSavings', () => {
    it('should calculate potential savings from caching', async () => {
      const mockCosts = [
        {
          id: 1,
          service: 'dialogue',
          method: 'llm',
          cost: 0.01,
          gameId: null,
          playerId: null,
          timestamp: new Date(),
          metadata: null,
        },
        {
          id: 2,
          service: 'dialogue',
          method: 'cached',
          cost: 0,
          gameId: null,
          playerId: null,
          timestamp: new Date(),
          metadata: null,
        },
        {
          id: 3,
          service: 'dialogue',
          method: 'cached',
          cost: 0,
          gameId: null,
          playerId: null,
          timestamp: new Date(),
          metadata: null,
        },
      ];

      mockPrismaService.costMetric.findMany.mockResolvedValue(mockCosts);

      const savings = await service.getCacheSavings(
        new Date('2025-01-20'),
        new Date('2025-01-26'),
      );

      expect(savings.actualCost).toBe(0.01);
      // If 2 cached requests had cost $0.01 each like the non-cached one
      expect(savings.potentialCost).toBe(0.03); // 0.01 + 2*0.01
      expect(savings.savings).toBe(0.02);
      expect(savings.savingsPercentage).toBeCloseTo(66.67, 1);
    });
  });
});
