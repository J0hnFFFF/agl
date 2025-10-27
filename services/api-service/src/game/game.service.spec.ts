import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { PrismaService } from '../prisma/prisma.service';

describe('GameService', () => {
  let service: GameService;
  let prisma: PrismaService;

  const mockPrismaService = {
    game: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    player: {
      count: jest.fn(),
    },
    gameEvent: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active games', async () => {
      const mockGames = [
        {
          id: 'game-1',
          name: 'Test Game 1',
          description: 'Test description',
          isActive: true,
          createdAt: new Date(),
          client: {
            name: 'Test Client',
            email: 'test@example.com',
          },
        },
        {
          id: 'game-2',
          name: 'Test Game 2',
          description: 'Test description 2',
          isActive: true,
          createdAt: new Date(),
          client: {
            name: 'Test Client',
            email: 'test@example.com',
          },
        },
      ];

      mockPrismaService.game.findMany.mockResolvedValue(mockGames);

      const result = await service.findAll();

      expect(result).toEqual(mockGames);
      expect(mockPrismaService.game.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return empty array when no games exist', async () => {
      mockPrismaService.game.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return game with stats when game exists and is active', async () => {
      const mockGame = {
        id: 'game-1',
        name: 'Test Game',
        description: 'Test description',
        isActive: true,
        createdAt: new Date(),
        client: {
          id: 'client-1',
          name: 'Test Client',
          email: 'test@example.com',
          tier: 'FREE',
        },
        players: [
          {
            id: 'player-1',
            externalId: 'ext-1',
            characterPersona: 'cheerful',
            createdAt: new Date(),
          },
        ],
        _count: {
          players: 10,
        },
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.player.count.mockResolvedValue(5); // activePlayersToday
      mockPrismaService.gameEvent.count.mockResolvedValue(100); // totalEvents

      const result = await service.findOne('game-1');

      expect(result).toEqual({
        ...mockGame,
        stats: {
          totalPlayers: 10,
          activePlayersToday: 5,
          totalEvents: 100,
        },
      });
      expect(mockPrismaService.game.findUnique).toHaveBeenCalledWith({
        where: { id: 'game-1' },
        include: expect.any(Object),
      });
    });

    it('should return null when game does not exist', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });

    it('should return null when game is inactive', async () => {
      const mockInactiveGame = {
        id: 'game-1',
        name: 'Inactive Game',
        isActive: false,
        createdAt: new Date(),
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockInactiveGame);

      const result = await service.findOne('game-1');

      expect(result).toBeNull();
    });

    it('should calculate stats correctly', async () => {
      const mockGame = {
        id: 'game-1',
        name: 'Test Game',
        isActive: true,
        createdAt: new Date(),
        client: { id: 'client-1', name: 'Test', email: 'test@test.com', tier: 'FREE' },
        players: [],
        _count: { players: 1500 },
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.player.count.mockResolvedValue(320);
      mockPrismaService.gameEvent.count.mockResolvedValue(45000);

      const result = await service.findOne('game-1');

      expect(result.stats).toEqual({
        totalPlayers: 1500,
        activePlayersToday: 320,
        totalEvents: 45000,
      });
    });
  });

  describe('create', () => {
    it('should create a new game', async () => {
      const createData = {
        clientId: 'client-1',
        name: 'New Game',
        description: 'New game description',
        config: { defaultPersona: 'cheerful' },
      };

      const mockCreatedGame = {
        id: 'game-1',
        ...createData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.game.create.mockResolvedValue(mockCreatedGame);

      const result = await service.create(createData);

      expect(result).toEqual(mockCreatedGame);
      expect(mockPrismaService.game.create).toHaveBeenCalledWith({
        data: {
          clientId: createData.clientId,
          name: createData.name,
          description: createData.description,
          config: createData.config,
        },
      });
    });

    it('should create game without optional fields', async () => {
      const createData = {
        clientId: 'client-1',
        name: 'Minimal Game',
      };

      const mockCreatedGame = {
        id: 'game-1',
        clientId: createData.clientId,
        name: createData.name,
        description: null,
        config: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.game.create.mockResolvedValue(mockCreatedGame);

      const result = await service.create(createData);

      expect(result).toEqual(mockCreatedGame);
    });
  });

  describe('update', () => {
    it('should update game successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        config: { defaultPersona: 'cool' },
      };

      const mockUpdatedGame = {
        id: 'game-1',
        ...updateData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: {
          name: 'Test Client',
          email: 'test@example.com',
        },
      };

      mockPrismaService.game.update.mockResolvedValue(mockUpdatedGame);

      const result = await service.update('game-1', updateData);

      expect(result).toEqual(mockUpdatedGame);
      expect(mockPrismaService.game.update).toHaveBeenCalledWith({
        where: { id: 'game-1' },
        data: {
          name: updateData.name,
          description: updateData.description,
          config: updateData.config,
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    it('should return null when game does not exist', async () => {
      mockPrismaService.game.update.mockRejectedValue(new Error('Not found'));

      const result = await service.update('non-existent-id', { name: 'Updated' });

      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const updateData = { name: 'Only Name Updated' };

      const mockUpdatedGame = {
        id: 'game-1',
        name: updateData.name,
        description: 'Original description',
        config: { original: 'config' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        client: {
          name: 'Test Client',
          email: 'test@example.com',
        },
      };

      mockPrismaService.game.update.mockResolvedValue(mockUpdatedGame);

      const result = await service.update('game-1', updateData);

      expect(result).toEqual(mockUpdatedGame);
      expect(mockPrismaService.game.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: updateData.name,
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete game successfully', async () => {
      mockPrismaService.game.update.mockResolvedValue({
        id: 'game-1',
        isActive: false,
      });

      const result = await service.remove('game-1');

      expect(result).toBe(true);
      expect(mockPrismaService.game.update).toHaveBeenCalledWith({
        where: { id: 'game-1' },
        data: {
          isActive: false,
        },
      });
    });

    it('should return false when game does not exist', async () => {
      mockPrismaService.game.update.mockRejectedValue(new Error('Not found'));

      const result = await service.remove('non-existent-id');

      expect(result).toBe(false);
    });

    it('should not delete game permanently (soft delete only)', async () => {
      mockPrismaService.game.update.mockResolvedValue({
        id: 'game-1',
        isActive: false,
      });

      await service.remove('game-1');

      // Ensure we're using update, not delete
      expect(mockPrismaService.game.update).toHaveBeenCalled();
      expect(mockPrismaService.game.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
    });
  });
});
