/**
 * Game State Recognition System
 * Analyzes vision responses to detect game states
 */

import type {
  VisionResponse,
  GameState,
  GameStateCategory,
  UIElement,
  GameEntity,
  Screenshot,
} from '../types';
import { VisionAnalyzer } from './VisionAnalyzer';

/**
 * Prompt templates for game state detection
 */
const GAME_STATE_PROMPTS = {
  general: `Analyze this game screenshot and identify:
1. Current game state (menu, gameplay, combat, dialogue, inventory, map, cutscene, loading, paused, victory, defeat, or unknown)
2. Visible UI elements (buttons, menus, health bars, minimaps, text, icons)
3. Game entities (player, enemies, NPCs, items, objects)
4. Brief scene description

Format your response as JSON with this structure:
{
  "category": "gameplay|combat|menu|...",
  "confidence": 0.0-1.0,
  "uiElements": [{"type": "button|menu|...", "text": "...", "confidence": 0.0-1.0}],
  "entities": [{"type": "player|enemy|...", "description": "...", "confidence": 0.0-1.0}],
  "sceneDescription": "..."
}`,

  combat: `Is this a combat scene? Analyze for:
- Combat UI (health bars, ability icons, target indicators)
- Enemies or hostile entities
- Player character in combat stance
- Combat effects or animations

Respond with JSON: {"isCombat": true|false, "confidence": 0.0-1.0, "details": "..."}`,

  menu: `Is this a menu or UI screen? Look for:
- Menu buttons or navigation
- Settings or options
- Character selection
- Main menu elements

Respond with JSON: {"isMenu": true|false, "menuType": "main|pause|settings|...", "confidence": 0.0-1.0}`,

  dialogue: `Is this a dialogue or conversation scene? Check for:
- Dialogue boxes or text
- Character portraits
- Dialogue options
- NPC names

Respond with JSON: {"isDialogue": true|false, "speaker": "...", "confidence": 0.0-1.0}`,
};

/**
 * GameStateRecognizer - Detects game states from screenshots
 *
 * @example
 * ```ts
 * const recognizer = new GameStateRecognizer(visionAnalyzer);
 * const gameState = await recognizer.recognize(screenshot);
 * console.log(gameState.category); // "combat"
 * ```
 */
export class GameStateRecognizer {
  private analyzer: VisionAnalyzer;

  constructor(analyzer: VisionAnalyzer) {
    this.analyzer = analyzer;
  }

  /**
   * Recognize game state from screenshot
   */
  async recognize(screenshot: Screenshot): Promise<GameState> {
    const response = await this.analyzer.analyze({
      screenshot,
      prompt: GAME_STATE_PROMPTS.general,
    });

    return this.parseGameState(response);
  }

  /**
   * Quick check for specific game state
   */
  async isState(screenshot: Screenshot, state: GameStateCategory): Promise<boolean> {
    const prompt = this.getPromptForState(state);

    const response = await this.analyzer.analyze({
      screenshot,
      prompt,
    });

    return this.parseBooleanResponse(response, state);
  }

  /**
   * Detect multiple states in parallel
   */
  async detectStates(screenshot: Screenshot, states: GameStateCategory[]): Promise<GameState[]> {
    const promises = states.map((state) =>
      this.analyzer.analyze({
        screenshot,
        prompt: this.getPromptForState(state),
      })
    );

    const responses = await Promise.all(promises);

    return responses.map((response, index) => ({
      category: states[index],
      confidence: this.extractConfidence(response),
      sceneDescription: response.content,
    }));
  }

  /**
   * Parse game state from vision response
   */
  private parseGameState(response: VisionResponse): GameState {
    try {
      // Try to parse JSON response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          category: parsed.category || 'unknown',
          confidence: parsed.confidence || response.confidence,
          uiElements: this.parseUIElements(parsed.uiElements || []),
          entities: this.parseEntities(parsed.entities || []),
          sceneDescription: parsed.sceneDescription || response.content,
        };
      }
    } catch (error) {
      // JSON parsing failed, fall back to text analysis
    }

    // Fallback: analyze text content
    return this.analyzeTextContent(response);
  }

  /**
   * Parse UI elements from response
   */
  private parseUIElements(elements: any[]): UIElement[] {
    return elements
      .map((el) => ({
        type: el.type || 'other',
        text: el.text,
        confidence: el.confidence || 0.5,
        boundingBox: el.boundingBox,
      }))
      .filter((el) => el.confidence > 0.3);
  }

  /**
   * Parse game entities from response
   */
  private parseEntities(entities: any[]): GameEntity[] {
    return entities
      .map((entity) => ({
        type: entity.type || 'other',
        description: entity.description,
        confidence: entity.confidence || 0.5,
        boundingBox: entity.boundingBox,
      }))
      .filter((entity) => entity.confidence > 0.3);
  }

  /**
   * Analyze text content for game state
   */
  private analyzeTextContent(response: VisionResponse): GameState {
    const content = response.content.toLowerCase();

    // Keyword matching for game states
    const stateKeywords: Record<GameStateCategory, string[]> = {
      combat: ['combat', 'battle', 'fight', 'enemy', 'health bar', 'attack'],
      menu: ['menu', 'settings', 'options', 'select', 'main menu'],
      dialogue: ['dialogue', 'conversation', 'talking', 'speech', 'npc'],
      inventory: ['inventory', 'items', 'backpack', 'equipment'],
      map: ['map', 'minimap', 'navigation', 'location'],
      cutscene: ['cutscene', 'cinematic', 'movie', 'intro'],
      loading: ['loading', 'please wait', 'loading screen'],
      paused: ['paused', 'pause menu', 'resume'],
      victory: ['victory', 'win', 'success', 'mission complete'],
      defeat: ['defeat', 'game over', 'failed', 'you died'],
      gameplay: ['playing', 'exploration', 'walking', 'running'],
      unknown: [],
    };

    // Find best matching state
    let bestMatch: GameStateCategory = 'unknown';
    let maxMatches = 0;

    for (const [state, keywords] of Object.entries(stateKeywords)) {
      const matches = keywords.filter((keyword) => content.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = state as GameStateCategory;
      }
    }

    return {
      category: bestMatch,
      confidence: maxMatches > 0 ? Math.min(0.3 + maxMatches * 0.15, 0.9) : 0.3,
      sceneDescription: response.content,
    };
  }

  /**
   * Get prompt for specific state
   */
  private getPromptForState(state: GameStateCategory): string {
    switch (state) {
      case 'combat':
        return GAME_STATE_PROMPTS.combat;
      case 'menu':
        return GAME_STATE_PROMPTS.menu;
      case 'dialogue':
        return GAME_STATE_PROMPTS.dialogue;
      default:
        return GAME_STATE_PROMPTS.general;
    }
  }

  /**
   * Parse boolean response
   */
  private parseBooleanResponse(response: VisionResponse, state: GameStateCategory): boolean {
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        switch (state) {
          case 'combat':
            return parsed.isCombat === true;
          case 'menu':
            return parsed.isMenu === true;
          case 'dialogue':
            return parsed.isDialogue === true;
          default:
            return false;
        }
      }
    } catch (error) {
      // JSON parsing failed
    }

    // Fallback: check if state keyword appears in response
    return response.content.toLowerCase().includes(state);
  }

  /**
   * Extract confidence from response
   */
  private extractConfidence(response: VisionResponse): number {
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.confidence || response.confidence;
      }
    } catch (error) {
      // JSON parsing failed
    }

    return response.confidence;
  }

  /**
   * Continuous state monitoring
   */
  async* monitorState(
    captureCallback: () => Promise<Screenshot>,
    interval: number = 2000
  ): AsyncGenerator<GameState> {
    while (true) {
      try {
        const screenshot = await captureCallback();
        const gameState = await this.recognize(screenshot);
        yield gameState;

        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        console.error('State monitoring error:', error);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
  }
}
