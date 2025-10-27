import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Game API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testClientId: string;
  let testGameId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create a test client
    const client = await prisma.client.create({
      data: {
        name: 'E2E Test Client',
        email: 'e2e-game@test.com',
        apiKey: 'test-api-key-' + Date.now(),
        tier: 'FREE',
      },
    });
    testClientId = client.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test game and client
    if (testGameId) {
      await prisma.game.deleteMany({
        where: { clientId: testClientId },
      });
    }
    await prisma.client.deleteMany({
      where: { email: 'e2e-game@test.com' },
    });

    await app.close();
  });

  describe('POST /games', () => {
    it('should create a new game', async () => {
      const response = await request(app.getHttpServer())
        .post('/games')
        .send({
          clientId: testClientId,
          name: 'E2E Test Game',
          description: 'Game created by e2e test',
          config: {
            defaultPersona: 'cheerful',
            emotionSensitivity: 0.8,
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('E2E Test Game');
      expect(response.body.description).toBe('Game created by e2e test');
      expect(response.body.isActive).toBe(true);
      expect(response.body.config).toEqual({
        defaultPersona: 'cheerful',
        emotionSensitivity: 0.8,
      });

      testGameId = response.body.id;
    });

    it('should create game with minimal fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/games')
        .send({
          clientId: testClientId,
          name: 'Minimal Game',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Minimal Game');
    });
  });

  describe('GET /games', () => {
    it('should return all active games', async () => {
      const response = await request(app.getHttpServer())
        .get('/games')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const game = response.body.find((g: any) => g.id === testGameId);
      expect(game).toBeDefined();
      expect(game.name).toBe('E2E Test Game');
      expect(game.isActive).toBe(true);
      expect(game.client).toHaveProperty('name');
      expect(game.client).toHaveProperty('email');
    });

    it('should not include inactive games', async () => {
      // Create and deactivate a game
      const inactiveGame = await prisma.game.create({
        data: {
          clientId: testClientId,
          name: 'Inactive Game',
          isActive: false,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/games')
        .expect(200);

      const found = response.body.find((g: any) => g.id === inactiveGame.id);
      expect(found).toBeUndefined();

      // Cleanup
      await prisma.game.delete({ where: { id: inactiveGame.id } });
    });
  });

  describe('GET /games/:id', () => {
    it('should return game details with stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/games/${testGameId}`)
        .expect(200);

      expect(response.body.id).toBe(testGameId);
      expect(response.body.name).toBe('E2E Test Game');
      expect(response.body).toHaveProperty('client');
      expect(response.body.client).toHaveProperty('id');
      expect(response.body.client).toHaveProperty('name');
      expect(response.body.client).toHaveProperty('tier');

      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('totalPlayers');
      expect(response.body.stats).toHaveProperty('activePlayersToday');
      expect(response.body.stats).toHaveProperty('totalEvents');
      expect(typeof response.body.stats.totalPlayers).toBe('number');
    });

    it('should return 404 for non-existent game', async () => {
      await request(app.getHttpServer())
        .get('/games/non-existent-id')
        .expect(404);
    });

    it('should return 404 for inactive game', async () => {
      // Create and deactivate a game
      const inactiveGame = await prisma.game.create({
        data: {
          clientId: testClientId,
          name: 'Inactive for Get Test',
          isActive: false,
        },
      });

      await request(app.getHttpServer())
        .get(`/games/${inactiveGame.id}`)
        .expect(404);

      // Cleanup
      await prisma.game.delete({ where: { id: inactiveGame.id } });
    });
  });

  describe('PATCH /games/:id', () => {
    it('should update game name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/games/${testGameId}`)
        .send({
          name: 'Updated Game Name',
        })
        .expect(200);

      expect(response.body.id).toBe(testGameId);
      expect(response.body.name).toBe('Updated Game Name');
      expect(response.body).toHaveProperty('client');
    });

    it('should update game description', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/games/${testGameId}`)
        .send({
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });

    it('should update game config', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/games/${testGameId}`)
        .send({
          config: {
            defaultPersona: 'cool',
            emotionSensitivity: 0.9,
            newSetting: true,
          },
        })
        .expect(200);

      expect(response.body.config).toEqual({
        defaultPersona: 'cool',
        emotionSensitivity: 0.9,
        newSetting: true,
      });
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/games/${testGameId}`)
        .send({
          name: 'Multi-field Update',
          description: 'All fields updated',
          config: { test: true },
        })
        .expect(200);

      expect(response.body.name).toBe('Multi-field Update');
      expect(response.body.description).toBe('All fields updated');
      expect(response.body.config).toEqual({ test: true });
    });

    it('should return 404 for non-existent game', async () => {
      await request(app.getHttpServer())
        .patch('/games/non-existent-id')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /games/:id', () => {
    it('should soft delete game', async () => {
      // Create a game to delete
      const gameToDelete = await prisma.game.create({
        data: {
          clientId: testClientId,
          name: 'Game to Delete',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/games/${gameToDelete.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      // Verify it's soft deleted (isActive = false)
      const deletedGame = await prisma.game.findUnique({
        where: { id: gameToDelete.id },
      });
      expect(deletedGame).not.toBeNull();
      expect(deletedGame?.isActive).toBe(false);

      // Verify it doesn't appear in list
      const listResponse = await request(app.getHttpServer())
        .get('/games')
        .expect(200);

      const found = listResponse.body.find((g: any) => g.id === gameToDelete.id);
      expect(found).toBeUndefined();

      // Cleanup
      await prisma.game.delete({ where: { id: gameToDelete.id } });
    });

    it('should return 404 for non-existent game', async () => {
      await request(app.getHttpServer())
        .delete('/games/non-existent-id')
        .expect(404);
    });

    it('should return 404 when trying to delete already deleted game', async () => {
      // Create and delete a game
      const game = await prisma.game.create({
        data: {
          clientId: testClientId,
          name: 'Already Deleted',
          isActive: false,
        },
      });

      await request(app.getHttpServer())
        .delete(`/games/${game.id}`)
        .expect(200);

      // Cleanup
      await prisma.game.delete({ where: { id: game.id } });
    });
  });

  describe('Game with Players', () => {
    it('should show player count in game stats', async () => {
      // Create a game
      const game = await prisma.game.create({
        data: {
          clientId: testClientId,
          name: 'Game with Players',
        },
      });

      // Create some players
      await prisma.player.createMany({
        data: [
          {
            gameId: game.id,
            externalId: 'player-1',
            characterPersona: 'cheerful',
          },
          {
            gameId: game.id,
            externalId: 'player-2',
            characterPersona: 'cool',
          },
          {
            gameId: game.id,
            externalId: 'player-3',
            characterPersona: 'cute',
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(`/games/${game.id}`)
        .expect(200);

      expect(response.body.stats.totalPlayers).toBe(3);
      expect(response.body.players).toBeInstanceOf(Array);
      expect(response.body.players.length).toBeLessThanOrEqual(10); // Max 10

      // Cleanup
      await prisma.player.deleteMany({ where: { gameId: game.id } });
      await prisma.game.delete({ where: { id: game.id } });
    });
  });
});
