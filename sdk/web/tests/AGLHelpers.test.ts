/**
 * AGLHelpers Tests
 */

import { AGLHelpers } from '../src/index';
import type { EmotionRequest } from '../src/types';

describe('AGLHelpers', () => {
  describe('createVictoryRequest', () => {
    it('should create basic victory request', () => {
      const request = AGLHelpers.createVictoryRequest();

      expect(request.type).toBe('player.victory');
      expect(request.data.mvp).toBe(false);
      expect(request.data.winStreak).toBe(0);
    });

    it('should create MVP victory request', () => {
      const request = AGLHelpers.createVictoryRequest(true, 3);

      expect(request.type).toBe('player.victory');
      expect(request.data.mvp).toBe(true);
      expect(request.data.winStreak).toBe(3);
    });

    it('should create victory request with win streak', () => {
      const request = AGLHelpers.createVictoryRequest(false, 5);

      expect(request.data.winStreak).toBe(5);
    });
  });

  describe('createDefeatRequest', () => {
    it('should create basic defeat request', () => {
      const request = AGLHelpers.createDefeatRequest();

      expect(request.type).toBe('player.defeat');
      expect(request.data.lossStreak).toBe(0);
    });

    it('should create defeat request with loss streak', () => {
      const request = AGLHelpers.createDefeatRequest(3);

      expect(request.type).toBe('player.defeat');
      expect(request.data.lossStreak).toBe(3);
    });
  });

  describe('createAchievementRequest', () => {
    it('should create common achievement request', () => {
      const request = AGLHelpers.createAchievementRequest('common');

      expect(request.type).toBe('player.achievement');
      expect(request.data.rarity).toBe('common');
    });

    it('should create epic achievement request', () => {
      const request = AGLHelpers.createAchievementRequest('epic');

      expect(request.type).toBe('player.achievement');
      expect(request.data.rarity).toBe('epic');
    });

    it('should create legendary achievement request', () => {
      const request = AGLHelpers.createAchievementRequest('legendary');

      expect(request.type).toBe('player.achievement');
      expect(request.data.rarity).toBe('legendary');
    });
  });

  describe('createKillRequest', () => {
    it('should create basic kill request', () => {
      const request = AGLHelpers.createKillRequest(1);

      expect(request.type).toBe('player.kill');
      expect(request.data.killCount).toBe(1);
      expect(request.data.isLegendary).toBe(false);
    });

    it('should create legendary kill request', () => {
      const request = AGLHelpers.createKillRequest(10, true);

      expect(request.type).toBe('player.kill');
      expect(request.data.killCount).toBe(10);
      expect(request.data.isLegendary).toBe(true);
    });

    it('should create multi-kill request', () => {
      const request = AGLHelpers.createKillRequest(5);

      expect(request.data.killCount).toBe(5);
    });
  });

  describe('helper consistency', () => {
    it('all helpers should return valid EmotionRequest objects', () => {
      const helpers = [
        AGLHelpers.createVictoryRequest(),
        AGLHelpers.createDefeatRequest(),
        AGLHelpers.createAchievementRequest('common'),
        AGLHelpers.createKillRequest(1),
      ];

      helpers.forEach((request: EmotionRequest) => {
        expect(request).toHaveProperty('type');
        expect(request).toHaveProperty('data');
        expect(typeof request.type).toBe('string');
        expect(typeof request.data).toBe('object');
      });
    });
  });
});
