import { Test, TestingModule } from '@nestjs/testing';
import { PlayerService } from './player.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlayerService', () => {
  let service: PlayerService;
  let prisma: PrismaService;

  const mockPrismaService = {
    game: {
      findUnique: jest.fn(),
    },
    player: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated players with stats', async () => {
      const mockGame = {
        id: 'game-1',
        isActive: true,
      };

      const mockPlayers = [
        {
          id: 'player-1',
          externalId: 'ext-1',
          characterPersona: 'cheerful',
          createdAt: new Date(),
          _count: {
            events: 250,
            memories: 15,
          },
        },
        {
          id: 'player-2',
          externalId: 'ext-2',
          characterPersona: 'cool',
          createdAt: new Date(),
          _count: {
            events: 180,
            memories: 12,
          },
        },
      ];

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.player.findMany.mockResolvedValue(mockPlayers);
      mockPrismaService.player.count.mockResolvedValue(1500);

      const result = await service.findAll('game-1', {});

      expect(result).toEqual({
        players: [
          {
            id: 'player-1',
            externalId: 'ext-1',
            characterPersona: 'cheerful',
            createdAt: mockPlayers[0].createdAt,
            stats: {
              totalEvents: 250,
              totalMemories: 15,
            },
          },
          {
            id: 'player-2',
            externalId: 'ext-2',
            characterPersona: 'cool',
            createdAt: mockPlayers[1].createdAt,
            stats: {
              totalEvents: 180,
              totalMemories: 12,
            },
          },
        ],
        pagination: {
          total: 1500,
          limit: 50,
          offset: 0,
        },
      });
    });

    it('should return null when game does not exist', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue(null);

      const result = await service.findAll('non-existent-game', {});

      expect(result).toBeNull();
    });

    it('should return null when game is inactive', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue({
        id: 'game-1',
        isActive: false,
      });

      const result = await service.findAll('game-1', {});

      expect(result).toBeNull();
    });

    it('should respect pagination options', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue({ id: 'game-1', isActive: true });
      mockPrismaService.player.findMany.mockResolvedValue([]);
      mockPrismaService.player.count.mockResolvedValue(1500);

      await service.findAll('game-1', {
        limit: 20,
        offset: 100,
        sortBy: 'externalId',
        order: 'asc',
      });

      expect(mockPrismaService.player.findMany).toHaveBeenCalledWith({
        where: { gameId: 'game-1' },
        take: 20,
        skip: 100,
        orderBy: { externalId: 'asc' },
        select: expect.any(Object),
      });
    });

    it('should cap limit at 100', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue({ id: 'game-1', isActive: true });
      mockPrismaService.player.findMany.mockResolvedValue([]);
      mockPrismaService.player.count.mockResolvedValue(1500);

      await service.findAll('game-1', { limit: 200 });

      expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Capped at 100
        }),
      );
    });

    it('should use default pagination values', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue({ id: 'game-1', isActive: true });
      mockPrismaService.player.findMany.mockResolvedValue([]);
      mockPrismaService.player.count.mockResolvedValue(1500);

      await service.findAll('game-1', {});

      expect(mockPrismaService.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Default limit
          skip: 0, // Default offset
          orderBy: { createdAt: 'desc' }, // Default sort
        }),
      );
    });
  });

  describe('createOrGet', () => {
    it('should return existing player if found', async () => {
      const mockGame = {
        id: 'game-1',
        isActive: true,
      };

      const mockExistingPlayer = {
        id: 'player-1',
        gameId: 'game-1',
        externalId: 'ext-123',
        characterPersona: 'cheerful',
        preferences: {},
        createdAt: new Date(),
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.player.findFirst.mockResolvedValue(mockExistingPlayer);

      const result = await service.createOrGet('game-1', {
        externalId: 'ext-123',
      });

      expect(result).toEqual(mockExistingPlayer);
      expect(mockPrismaService.player.create).not.toHaveBeenCalled();
    });

    it('should create new player if not found', async () => {
      const mockGame = {
        id: 'game-1',
        isActive: true,
      };

      const createData = {
        externalId: 'ext-456',
        characterPersona: 'cool',
        preferences: { language: 'zh-CN' },
      };

      const mockNewPlayer = {
        id: 'player-2',
        gameId: 'game-1',
        ...createData,
        createdAt: new Date(),
      };

      mockPrismaService.game.findUnique.mockResolvedValue(mockGame);
      mockPrismaService.player.findFirst.mockResolvedValue(null);
      mockPrismaService.player.create.mockResolvedValue(mockNewPlayer);

      const result = await service.createOrGet('game-1', createData);

      expect(result).toEqual(mockNewPlayer);
      expect(mockPrismaService.player.create).toHaveBeenCalledWith({
        data: {
          gameId: 'game-1',
          externalId: createData.externalId,
          characterPersona: createData.characterPersona,
          preferences: createData.preferences,
        },
      });
    });

    it('should use default persona when not provided', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue({ id: 'game-1', isActive: true });
      mockPrismaService.player.findFirst.mockResolvedValue(null);
      mockPrismaService.player.create.mockResolvedValue({
        id: 'player-1',
        gameId: 'game-1',
        externalId: 'ext-789',
        characterPersona: 'cheerful',
        preferences: {},
        createdAt: new Date(),
      });

      await service.createOrGet('game-1', {
        externalId: 'ext-789',
      });

      expect(mockPrismaService.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          characterPersona: 'cheerful', // Default persona
        }),
      });
    });

    it('should use empty object for preferences when not provided', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue({ id: 'game-1', isActive: true });
      mockPrismaService.player.findFirst.mockResolvedValue(null);
      mockPrismaService.player.create.mockResolvedValue({
        id: 'player-1',
        gameId: 'game-1',
        externalId: 'ext-999',
        characterPersona: 'cheerful',
        preferences: {},
        createdAt: new Date(),
      });

      await service.createOrGet('game-1', {
        externalId: 'ext-999',
      });

      expect(mockPrismaService.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          preferences: {}, // Default preferences
        }),
      });
    });

    it('should return null when game does not exist', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue(null);

      const result = await service.createOrGet('non-existent-game', {
        externalId: 'ext-123',
      });

      expect(result).toBeNull();
    });

    it('should return null when game is inactive', async () => {
      mockPrismaService.game.findUnique.mockResolvedValue({
        id: 'game-1',
        isActive: false,
      });

      const result = await service.createOrGet('game-1', {
        externalId: 'ext-123',
      });

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return player with stats and recent memories', async () => {
      const mockPlayer = {
        id: 'player-1',
        externalId: 'ext-123',
        characterPersona: 'cheerful',
        preferences: { language: 'zh-CN' },
        updatedAt: new Date(),
        memories: [
          {
            id: 'memory-1',
            type: 'achievement',
            content: '达成五杀',
            emotion: 'excited',
            importance: 0.9,
            createdAt: new Date(),
          },
          {
            id: 'memory-2',
            type: 'event',
            content: '连续胜利',
            emotion: 'happy',
            importance: 0.7,
            createdAt: new Date(),
          },
        ],
        _count: {
          events: 250,
          memories: 15,
        },
      };

      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);

      const result = await service.findOne('player-1');

      expect(result).toEqual({
        id: mockPlayer.id,
        externalId: mockPlayer.externalId,
        characterPersona: mockPlayer.characterPersona,
        preferences: mockPlayer.preferences,
        stats: {
          totalEvents: 250,
          totalMemories: 15,
          lastActive: mockPlayer.updatedAt,
        },
        recentMemories: mockPlayer.memories,
      });
    });

    it('should return null when player does not exist', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent-player');

      expect(result).toBeNull();
    });

    it('should limit recent memories to 10', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue({
        id: 'player-1',
        externalId: 'ext-123',
        characterPersona: 'cheerful',
        preferences: {},
        updatedAt: new Date(),
        memories: [],
        _count: { events: 0, memories: 0 },
      });

      await service.findOne('player-1');

      expect(mockPrismaService.player.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            memories: expect.objectContaining({
              take: 10,
            }),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update player successfully', async () => {
      const updateData = {
        characterPersona: 'cool',
        preferences: { language: 'en' },
      };

      const mockUpdatedPlayer = {
        id: 'player-1',
        gameId: 'game-1',
        externalId: 'ext-123',
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.player.update.mockResolvedValue(mockUpdatedPlayer);

      const result = await service.update('player-1', updateData);

      expect(result).toEqual(mockUpdatedPlayer);
      expect(mockPrismaService.player.update).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        data: {
          characterPersona: updateData.characterPersona,
          preferences: updateData.preferences,
        },
      });
    });

    it('should handle partial updates', async () => {
      const updateData = {
        characterPersona: 'cute',
      };

      const mockUpdatedPlayer = {
        id: 'player-1',
        gameId: 'game-1',
        externalId: 'ext-123',
        characterPersona: 'cute',
        preferences: { existing: 'preferences' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.player.update.mockResolvedValue(mockUpdatedPlayer);

      const result = await service.update('player-1', updateData);

      expect(result).toEqual(mockUpdatedPlayer);
    });

    it('should return null when player does not exist', async () => {
      mockPrismaService.player.update.mockRejectedValue(new Error('Not found'));

      const result = await service.update('non-existent-player', {
        characterPersona: 'cool',
      });

      expect(result).toBeNull();
    });

    it('should handle preferences-only update', async () => {
      const updateData = {
        preferences: { voiceEnabled: false },
      };

      mockPrismaService.player.update.mockResolvedValue({
        id: 'player-1',
        preferences: updateData.preferences,
      });

      await service.update('player-1', updateData);

      expect(mockPrismaService.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            preferences: updateData.preferences,
          }),
        }),
      );
    });
  });
});
