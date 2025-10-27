/**
 * GameStateRecognizer Tests
 */

import { GameStateRecognizer } from '../src/analysis/GameStateRecognizer';
import { VisionAnalyzer } from '../src/analysis/VisionAnalyzer';
import type { Screenshot, VisionResponse, GameStateCategory } from '../src/types';

// Mock VisionAnalyzer
jest.mock('../src/analysis/VisionAnalyzer');

describe('GameStateRecognizer', () => {
  const mockScreenshot: Screenshot = {
    data: 'base64data',
    format: 'jpeg',
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    size: 12345,
  };

  let mockAnalyzer: jest.Mocked<VisionAnalyzer>;

  beforeEach(() => {
    mockAnalyzer = new VisionAnalyzer({
      provider: 'openai-gpt4v',
      apiKey: 'test-key',
    }) as jest.Mocked<VisionAnalyzer>;
  });

  describe('recognize', () => {
    it('should recognize game state from JSON response', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({
          category: 'combat',
          confidence: 0.95,
          uiElements: [
            { type: 'healthbar', text: 'HP: 75/100', confidence: 0.9 },
            { type: 'button', text: 'Attack', confidence: 0.85 },
          ],
          entities: [
            { type: 'player', description: 'Warrior character', confidence: 0.9 },
            { type: 'enemy', description: 'Orc enemy', confidence: 0.85 },
          ],
          sceneDescription: 'Player engaged in combat with an orc enemy',
        }),
        confidence: 0.8,
        processingTime: 2000,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('combat');
      expect(gameState.confidence).toBe(0.95);
      expect(gameState.uiElements).toHaveLength(2);
      expect(gameState.entities).toHaveLength(2);
      expect(gameState.sceneDescription).toContain('combat');
    });

    it('should filter low-confidence UI elements', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({
          category: 'menu',
          confidence: 0.9,
          uiElements: [
            { type: 'button', text: 'Start Game', confidence: 0.95 },
            { type: 'button', text: 'Options', confidence: 0.25 }, // Low confidence
            { type: 'button', text: 'Exit', confidence: 0.8 },
          ],
          entities: [],
          sceneDescription: 'Main menu screen',
        }),
        confidence: 0.8,
        processingTime: 1500,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      // Should filter out elements with confidence < 0.3
      expect(gameState.uiElements).toHaveLength(2);
      expect(gameState.uiElements?.map((el) => el.text)).toEqual(['Start Game', 'Exit']);
    });

    it('should filter low-confidence entities', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({
          category: 'gameplay',
          confidence: 0.85,
          uiElements: [],
          entities: [
            { type: 'player', description: 'Main character', confidence: 0.95 },
            { type: 'item', description: 'Unclear item', confidence: 0.2 }, // Low confidence
            { type: 'npc', description: 'Quest giver', confidence: 0.75 },
          ],
          sceneDescription: 'Player exploring the world',
        }),
        confidence: 0.8,
        processingTime: 1800,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      // Should filter out entities with confidence < 0.3
      expect(gameState.entities).toHaveLength(2);
      expect(gameState.entities?.map((e) => e.type)).toEqual(['player', 'npc']);
    });

    it('should handle partial JSON response', async () => {
      const mockVisionResponse: VisionResponse = {
        content: `Here's the analysis: ${JSON.stringify({
          category: 'dialogue',
          confidence: 0.88,
        })} That's what I see.`,
        confidence: 0.8,
        processingTime: 1600,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('dialogue');
      expect(gameState.confidence).toBe(0.88);
    });

    it('should fallback to text analysis when JSON parsing fails', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'This appears to be a combat scene with enemies and health bars visible.',
        confidence: 0.75,
        processingTime: 1400,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('combat');
      expect(gameState.confidence).toBeGreaterThan(0);
      expect(gameState.sceneDescription).toContain('combat');
    });

    it('should detect menu state from keywords', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'This is the main menu screen with settings and options available.',
        confidence: 0.8,
        processingTime: 1300,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('menu');
    });

    it('should detect dialogue state from keywords', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'The screen shows a dialogue conversation with an NPC character.',
        confidence: 0.8,
        processingTime: 1500,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('dialogue');
    });

    it('should detect victory state from keywords', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'Victory screen showing mission complete message.',
        confidence: 0.9,
        processingTime: 1200,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('victory');
    });

    it('should detect defeat state from keywords', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'Game over screen - you died in combat.',
        confidence: 0.85,
        processingTime: 1100,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('defeat');
    });

    it('should return unknown for ambiguous content', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'The image shows various visual elements.',
        confidence: 0.5,
        processingTime: 1000,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('unknown');
      expect(gameState.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should prefer state with most keyword matches', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'Combat battle scene with enemy health bar and attack buttons.',
        confidence: 0.8,
        processingTime: 1400,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.category).toBe('combat'); // 'combat', 'battle', 'enemy', 'health bar', 'attack' = 5 matches
    });
  });

  describe('isState', () => {
    it('should return true for combat state', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({ isCombat: true, confidence: 0.9, details: 'Combat detected' }),
        confidence: 0.9,
        processingTime: 1200,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const isCombat = await recognizer.isState(mockScreenshot, 'combat');

      expect(isCombat).toBe(true);
    });

    it('should return false for non-combat state', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({ isCombat: false, confidence: 0.85 }),
        confidence: 0.85,
        processingTime: 1100,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const isCombat = await recognizer.isState(mockScreenshot, 'combat');

      expect(isCombat).toBe(false);
    });

    it('should check menu state', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({ isMenu: true, menuType: 'main', confidence: 0.95 }),
        confidence: 0.95,
        processingTime: 1000,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const isMenu = await recognizer.isState(mockScreenshot, 'menu');

      expect(isMenu).toBe(true);
    });

    it('should check dialogue state', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({ isDialogue: true, speaker: 'NPC Guard', confidence: 0.88 }),
        confidence: 0.88,
        processingTime: 1300,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const isDialogue = await recognizer.isState(mockScreenshot, 'dialogue');

      expect(isDialogue).toBe(true);
    });

    it('should fallback to keyword search when JSON parsing fails', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'Yes, this is definitely a combat scene.',
        confidence: 0.8,
        processingTime: 1200,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const isCombat = await recognizer.isState(mockScreenshot, 'combat');

      expect(isCombat).toBe(true); // 'combat' keyword found
    });

    it('should return false when keyword not found', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'This is a peaceful exploration scene.',
        confidence: 0.75,
        processingTime: 1100,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const isCombat = await recognizer.isState(mockScreenshot, 'combat');

      expect(isCombat).toBe(false);
    });
  });

  describe('detectStates', () => {
    it('should detect multiple states in parallel', async () => {
      const states: GameStateCategory[] = ['combat', 'menu', 'dialogue'];

      mockAnalyzer.analyze = jest
        .fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({ isCombat: true, confidence: 0.9 }),
          confidence: 0.9,
          processingTime: 1200,
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ isMenu: false, confidence: 0.2 }),
          confidence: 0.2,
          processingTime: 1000,
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ isDialogue: false, confidence: 0.3 }),
          confidence: 0.3,
          processingTime: 1100,
        });

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const detectedStates = await recognizer.detectStates(mockScreenshot, states);

      expect(detectedStates).toHaveLength(3);
      expect(detectedStates[0].category).toBe('combat');
      expect(detectedStates[0].confidence).toBe(0.9);
      expect(detectedStates[1].category).toBe('menu');
      expect(detectedStates[2].category).toBe('dialogue');
    });

    it('should extract confidence from JSON responses', async () => {
      const states: GameStateCategory[] = ['combat', 'menu'];

      mockAnalyzer.analyze = jest
        .fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({ isCombat: true, confidence: 0.95 }),
          confidence: 0.8,
          processingTime: 1200,
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({ isMenu: false, confidence: 0.25 }),
          confidence: 0.7,
          processingTime: 1000,
        });

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const detectedStates = await recognizer.detectStates(mockScreenshot, states);

      expect(detectedStates[0].confidence).toBe(0.95);
      expect(detectedStates[1].confidence).toBe(0.25);
    });

    it('should use response confidence when JSON confidence missing', async () => {
      const states: GameStateCategory[] = ['combat'];

      mockAnalyzer.analyze = jest.fn().mockResolvedValueOnce({
        content: 'Combat scene detected',
        confidence: 0.85,
        processingTime: 1200,
      });

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const detectedStates = await recognizer.detectStates(mockScreenshot, states);

      expect(detectedStates[0].confidence).toBe(0.85);
    });
  });

  describe('monitorState', () => {
    it('should yield game states at intervals', async () => {
      jest.useFakeTimers();

      const captureCallback = jest.fn().mockResolvedValue(mockScreenshot);

      mockAnalyzer.analyze = jest.fn().mockResolvedValue({
        content: JSON.stringify({ category: 'gameplay', confidence: 0.8 }),
        confidence: 0.8,
        processingTime: 1000,
      });

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const monitor = recognizer.monitorState(captureCallback, 2000);

      // Get first state
      const promise1 = monitor.next();
      await jest.advanceTimersByTimeAsync(0);
      const result1 = await promise1;

      expect(result1.value?.category).toBe('gameplay');
      expect(captureCallback).toHaveBeenCalledTimes(1);

      // Get second state
      const promise2 = monitor.next();
      await jest.advanceTimersByTimeAsync(2000);
      const result2 = await promise2;

      expect(result2.value?.category).toBe('gameplay');
      expect(captureCallback).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should continue monitoring on errors', async () => {
      jest.useFakeTimers();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const captureCallback = jest
        .fn()
        .mockRejectedValueOnce(new Error('Capture failed'))
        .mockResolvedValue(mockScreenshot);

      mockAnalyzer.analyze = jest.fn().mockResolvedValue({
        content: JSON.stringify({ category: 'menu', confidence: 0.9 }),
        confidence: 0.9,
        processingTime: 1000,
      });

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const monitor = recognizer.monitorState(captureCallback, 1000);

      // First iteration should error
      const promise1 = monitor.next();
      await jest.advanceTimersByTimeAsync(1000);
      await promise1;

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'State monitoring error:',
        expect.any(Error)
      );

      // Second iteration should succeed
      const promise2 = monitor.next();
      await jest.advanceTimersByTimeAsync(1000);
      const result2 = await promise2;

      expect(result2.value?.category).toBe('menu');

      consoleErrorSpy.mockRestore();
      jest.useRealTimers();
    });

    it('should use default interval of 2000ms', async () => {
      jest.useFakeTimers();

      const captureCallback = jest.fn().mockResolvedValue(mockScreenshot);

      mockAnalyzer.analyze = jest.fn().mockResolvedValue({
        content: JSON.stringify({ category: 'combat', confidence: 0.85 }),
        confidence: 0.85,
        processingTime: 1000,
      });

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const monitor = recognizer.monitorState(captureCallback); // No interval specified

      const promise1 = monitor.next();
      await jest.advanceTimersByTimeAsync(0);
      await promise1;

      expect(captureCallback).toHaveBeenCalledTimes(1);

      const promise2 = monitor.next();
      await jest.advanceTimersByTimeAsync(2000); // Default interval
      await promise2;

      expect(captureCallback).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('confidence calculation', () => {
    it('should calculate confidence based on keyword matches', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'combat battle fight enemy', // 4 combat keywords
        confidence: 0.8,
        processingTime: 1200,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      // confidence = 0.3 + (4 * 0.15) = 0.9
      expect(gameState.confidence).toBeCloseTo(0.9, 1);
    });

    it('should cap confidence at 0.9', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'combat battle fight enemy health bar attack', // 6 combat keywords
        confidence: 0.8,
        processingTime: 1200,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      // Should be capped at 0.9
      expect(gameState.confidence).toBe(0.9);
    });

    it('should use minimum confidence of 0.3 for unknown states', async () => {
      const mockVisionResponse: VisionResponse = {
        content: 'No recognizable game state',
        confidence: 0.5,
        processingTime: 1000,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.confidence).toBe(0.3);
    });
  });

  describe('bounding box support', () => {
    it('should preserve bounding boxes for UI elements', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({
          category: 'combat',
          confidence: 0.9,
          uiElements: [
            {
              type: 'healthbar',
              text: 'HP: 100',
              confidence: 0.95,
              boundingBox: { x: 10, y: 20, width: 100, height: 20 },
            },
          ],
          entities: [],
        }),
        confidence: 0.8,
        processingTime: 1500,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.uiElements?.[0].boundingBox).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 20,
      });
    });

    it('should preserve bounding boxes for entities', async () => {
      const mockVisionResponse: VisionResponse = {
        content: JSON.stringify({
          category: 'combat',
          confidence: 0.9,
          uiElements: [],
          entities: [
            {
              type: 'enemy',
              description: 'Orc warrior',
              confidence: 0.88,
              boundingBox: { x: 400, y: 300, width: 150, height: 200 },
            },
          ],
        }),
        confidence: 0.8,
        processingTime: 1600,
      };

      mockAnalyzer.analyze = jest.fn().mockResolvedValue(mockVisionResponse);

      const recognizer = new GameStateRecognizer(mockAnalyzer);
      const gameState = await recognizer.recognize(mockScreenshot);

      expect(gameState.entities?.[0].boundingBox).toEqual({
        x: 400,
        y: 300,
        width: 150,
        height: 200,
      });
    });
  });
});
