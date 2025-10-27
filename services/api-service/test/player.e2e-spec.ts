import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Player API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testClientId: string;
  let testGameId: string;
  let testPlayerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test client and game
    const client = await prisma.client.create({
      data: {
        name: 'E2E Player Test Client',
        email: 'e2e-player@test.com',
        apiKey: 'test-api-key-player-' + Date.now(),
        tier: 'FREE',
      },
    });
    testClientId = client.id;

    const game = await prisma.game.create({
      data: {
        clientId: testClientId,
        name: 'E2E Player Test Game',
      },
    });
    testGameId = game.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.player.deleteMany({ where: { gameId: testGameId } });
    await prisma.game.delete({ where: { id: testGameId } });
    await prisma.client.delete({ where: { id: testClientId } });
    await app.close();
  });

  describe('POST /games/:gameId/players', () => {
    it('should create a new player', async () => {
      const response = await request(app.getHttpServer())
        .post(`/games/${testGameId}/players`)
        .send({
          externalId: 'player-e2e-001',
          characterPersona: 'cheerful',
          preferences: {
            language: 'zh-CN',
            voiceEnabled: true,
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.externalId).toBe('player-e2e-001');
      expect(response.body.characterPersona).toBe('cheerful');
      expect(response.body.preferences).toEqual({
        language: 'zh-CN',
        voiceEnabled: true,
      });

      testPlayerId = response.body.id;
    });

    it('should return existing player if externalId already exists', async () => {
      // Create player first
      const firstResponse = await request(app.getHttpServer())
        .post(`/games/${testGameId}/players`)
        .send({
          externalId: 'duplicate-player',
          characterPersona: 'cool',
        })
        .expect(201);

      const firstId = firstResponse.body.id;

      // Try to create again with same externalId
      const secondResponse = await request(app.getHttpServer())
        .post(`/games/${testGameId}/players`)
        .send({
          externalId: 'duplicate-player',
          characterPersona: 'cute', // Different persona
        })
        .expect(201);

      // Should return the same player
      expect(secondResponse.body.id).toBe(firstId);
      expect(secondResponse.body.characterPersona).toBe('cool'); // Original persona
    });

    it('should use default persona when not provided', async () => {
      const response = await request(app.getHttpServer())
        .post(`/games/${testGameId}/players`)
        .send({
          externalId: 'player-default-persona',
        })
        .expect(201);

      expect(response.body.characterPersona).toBe('cheerful'); // Default
    });

    it('should return 404 for non-existent game', async () => {
      await request(app.getHttpServer())
        .post('/games/non-existent-game/players')
        .send({
          externalId: 'player-test',
        })
        .expect(404);
    });
  });

  describe('GET /games/:gameId/players', () => {
    beforeAll(async () => {
      // Create multiple players for testing
      await prisma.player.createMany({
        data: [
          {
            gameId: testGameId,
            externalId: 'list-player-1',
            characterPersona: 'cheerful',
          },
          {
            gameId: testGameId,
            externalId: 'list-player-2',
            characterPersona: 'cool',
          },
          {
            gameId: testGameId,
            externalId: 'list-player-3',
            characterPersona: 'cute',
          },
        ],
      });
    });

    it('should return paginated list of players', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${testGameId}/players`)
        .expect(200);

      expect(response.body).toHaveProperty('players');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.players)).toBe(true);
      expect(response.body.players.length).toBeGreaterThan(0);

      // Check player structure
      const player = response.body.players[0];
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('externalId');
      expect(player).toHaveProperty('characterPersona');
      expect(player).toHaveProperty('createdAt');
      expect(player).toHaveProperty('stats');
      expect(player.stats).toHaveProperty('totalEvents');
      expect(player.stats).toHaveProperty('totalMemories');

      // Check pagination
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('offset');
      expect(response.body.pagination.limit).toBe(50); // Default
      expect(response.body.pagination.offset).toBe(0); // Default
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${testGameId}/players?limit=2`)
        .expect(200);

      expect(response.body.players.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should respect offset parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${testGameId}/players?offset=1`)
        .expect(200);

      expect(response.body.pagination.offset).toBe(1);
    });

    it('should cap limit at 100', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${testGameId}/players?limit=200`)
        .expect(200);

      expect(response.body.pagination.limit).toBe(100);
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${testGameId}/players?sortBy=externalId&order=asc`)
        .expect(200);

      const externalIds = response.body.players.map((p: any) => p.externalId);
      const sortedIds = [...externalIds].sort();
      expect(externalIds).toEqual(sortedIds);
    });

    it('should return 404 for non-existent game', async () => {
      await request(app.getHttpServer())
        .get('/games/non-existent-game/players')
        .expect(404);
    });
  });

  describe('GET /players/:playerId', () => {
    beforeAll(async () => {
      // Create some memories for testing
      const player = await prisma.player.findFirst({
        where: { gameId: testGameId },
      });

      if (player) {
        await prisma.memory.createMany({
          data: [
            {
              playerId: player.id,
              type: 'achievement',
              content: 'Test memory 1',
              emotion: 'happy',
              importance: 0.8,
            },
            {
              playerId: player.id,
              type: 'event',
              content: 'Test memory 2',
              emotion: 'excited',
              importance: 0.6,
            },
          ],
        });
      }
    });

    it('should return player details with recent memories', async () => {
      const response = await request(app.getHttpServer())
        .get(`/players/${testPlayerId}`)
        .expect(200);

      expect(response.body.id).toBe(testPlayerId);
      expect(response.body).toHaveProperty('externalId');
      expect(response.body).toHaveProperty('characterPersona');
      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('recentMemories');

      // Check stats
      expect(response.body.stats).toHaveProperty('totalEvents');
      expect(response.body.stats).toHaveProperty('totalMemories');
      expect(response.body.stats).toHaveProperty('lastActive');

      // Check memories
      expect(Array.isArray(response.body.recentMemories)).toBe(true);
      expect(response.body.recentMemories.length).toBeLessThanOrEqual(10);

      if (response.body.recentMemories.length > 0) {
        const memory = response.body.recentMemories[0];
        expect(memory).toHaveProperty('id');
        expect(memory).toHaveProperty('type');
        expect(memory).toHaveProperty('content');
        expect(memory).toHaveProperty('emotion');
        expect(memory).toHaveProperty('importance');
        expect(memory).toHaveProperty('createdAt');
      }
    });

    it('should return 404 for non-existent player', async () => {
      await request(app.getHttpServer())
        .get('/players/non-existent-player')
        .expect(404);
    });
  });

  describe('PATCH /players/:playerId', () => {
    it('should update player persona', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/players/${testPlayerId}`)
        .send({
          characterPersona: 'cool',
        })
        .expect(200);

      expect(response.body.id).toBe(testPlayerId);
      expect(response.body.characterPersona).toBe('cool');
    });

    it('should update player preferences', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/players/${testPlayerId}`)
        .send({
          preferences: {
            language: 'en',
            voiceEnabled: false,
            volume: 0.8,
          },
        })
        .expect(200);

      expect(response.body.preferences).toEqual({
        language: 'en',
        voiceEnabled: false,
        volume: 0.8,
      });
    });

    it('should update both persona and preferences', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/players/${testPlayerId}`)
        .send({
          characterPersona: 'cute',
          preferences: {
            newSetting: true,
          },
        })
        .expect(200);

      expect(response.body.characterPersona).toBe('cute');
      expect(response.body.preferences.newSetting).toBe(true);
    });

    it('should return 404 for non-existent player', async () => {
      await request(app.getHttpServer())
        .patch('/players/non-existent-player')
        .send({ characterPersona: 'cool' })
        .expect(404);
    });
  });

  describe('Player Statistics', () => {
    it('should show correct player count in stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${testGameId}/players`)
        .expect(200);

      expect(response.body.pagination.total).toBeGreaterThan(0);

      // Verify by counting directly
      const count = await prisma.player.count({
        where: { gameId: testGameId },
      });

      expect(response.body.pagination.total).toBe(count);
    });
  });

  describe('Cross-Game Player Isolation', () => {
    it('should not list players from other games', async () => {
      // Create another game
      const otherGame = await prisma.game.create({
        data: {
          clientId: testClientId,
          name: 'Other Game',
        },
      });

      // Create player in other game
      const otherPlayer = await prisma.player.create({
        data: {
          gameId: otherGame.id,
          externalId: 'other-game-player',
          characterPersona: 'cheerful',
        },
      });

      // List players from test game
      const response = await request(app.getHttpServer())
        .get(`/games/${testGameId}/players`)
        .expect(200);

      // Should not include player from other game
      const found = response.body.players.find(
        (p: any) => p.id === otherPlayer.id
      );
      expect(found).toBeUndefined();

      // Cleanup
      await prisma.player.delete({ where: { id: otherPlayer.id } });
      await prisma.game.delete({ where: { id: otherGame.id } });
    });
  });
});
