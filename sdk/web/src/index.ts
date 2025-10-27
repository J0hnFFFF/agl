/**
 * AGL Web SDK - Main Entry Point
 *
 * TypeScript SDK for browser-based games and WebGL applications
 */

import axios, { type AxiosInstance } from 'axios';
import type {
  AGLConfig,
  IAGLClient,
  IEmotionService,
  IDialogueService,
  IMemoryService,
  EmotionRequest,
  EmotionResponse,
  DialogueRequest,
  DialogueResponse,
  CreateMemoryRequest,
  Memory,
  SearchMemoriesRequest,
  SearchResult,
  GetContextRequest,
} from './types';
import { keysToSnakeCase, keysToCamelCase } from './utils/caseConverter';

export * from './types';

/**
 * Main AGL Client
 */
export class AGLClient implements IAGLClient {
  private config: Required<AGLConfig>;
  private httpClient: AxiosInstance;
  private playerId?: string;
  private gameId?: string;

  public readonly emotion: IEmotionService;
  public readonly dialogue: IDialogueService;
  public readonly memory: IMemoryService;

  constructor(config: AGLConfig) {
    // Set defaults
    this.config = {
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl || 'http://localhost:3000',
      emotionServiceUrl: config.emotionServiceUrl || 'http://localhost:8000',
      dialogueServiceUrl: config.dialogueServiceUrl || 'http://localhost:8001',
      memoryServiceUrl: config.memoryServiceUrl || 'http://localhost:3002',
      timeout: config.timeout || 30000,
    };

    // Create HTTP client
    this.httpClient = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
    });

    // Initialize services
    this.emotion = new EmotionService(this.config, this.httpClient);
    this.dialogue = new DialogueService(this.config, this.httpClient);
    this.memory = new MemoryService(this.config, this.httpClient);
  }

  /**
   * Set the current player ID
   */
  setPlayerId(playerId: string): void {
    this.playerId = playerId;
  }

  /**
   * Set the current game ID
   */
  setGameId(gameId: string): void {
    this.gameId = gameId;
  }

  /**
   * Get current player ID
   */
  getPlayerId(): string | undefined {
    return this.playerId;
  }

  /**
   * Get current game ID
   */
  getGameId(): string | undefined {
    return this.gameId;
  }
}

/**
 * Emotion Service Implementation
 */
class EmotionService implements IEmotionService {
  constructor(
    private config: Required<AGLConfig>,
    private httpClient: AxiosInstance,
  ) {}

  async analyze(request: EmotionRequest): Promise<EmotionResponse> {
    // Convert request to snake_case for Python backend
    const snakeCaseRequest = keysToSnakeCase(request);

    const response = await this.httpClient.post(
      `${this.config.emotionServiceUrl}/analyze`,
      snakeCaseRequest,
    );

    // Convert response to camelCase for TypeScript
    return keysToCamelCase<EmotionResponse>(response.data);
  }
}

/**
 * Dialogue Service Implementation
 */
class DialogueService implements IDialogueService {
  constructor(
    private config: Required<AGLConfig>,
    private httpClient: AxiosInstance,
  ) {}

  async generate(request: DialogueRequest): Promise<DialogueResponse> {
    // Convert request to snake_case for Python backend
    const snakeCaseRequest = keysToSnakeCase(request);

    const response = await this.httpClient.post(
      `${this.config.dialogueServiceUrl}/generate`,
      snakeCaseRequest,
    );

    // Convert response to camelCase for TypeScript
    return keysToCamelCase<DialogueResponse>(response.data);
  }
}

/**
 * Memory Service Implementation
 */
class MemoryService implements IMemoryService {
  constructor(
    private config: Required<AGLConfig>,
    private httpClient: AxiosInstance,
  ) {}

  async create(playerId: string, request: CreateMemoryRequest): Promise<Memory> {
    // Convert request to snake_case for Python backend
    const snakeCaseRequest = keysToSnakeCase(request);

    const response = await this.httpClient.post(
      `${this.config.memoryServiceUrl}/players/${playerId}/memories`,
      snakeCaseRequest,
    );

    // Convert response to camelCase for TypeScript
    return keysToCamelCase<Memory>(response.data);
  }

  async search(playerId: string, request: SearchMemoriesRequest): Promise<SearchResult[]> {
    // Convert request to snake_case for Python backend
    const snakeCaseRequest = keysToSnakeCase(request);

    const response = await this.httpClient.post(
      `${this.config.memoryServiceUrl}/players/${playerId}/memories/search`,
      snakeCaseRequest,
    );

    // Convert response to camelCase for TypeScript
    return keysToCamelCase<SearchResult[]>(response.data);
  }

  async getContext(playerId: string, request: GetContextRequest): Promise<Memory[]> {
    // Convert request to snake_case for Python backend
    const snakeCaseRequest = keysToSnakeCase(request);

    const response = await this.httpClient.post(
      `${this.config.memoryServiceUrl}/players/${playerId}/context`,
      snakeCaseRequest,
    );

    // Convert response to camelCase for TypeScript
    return keysToCamelCase<Memory[]>(response.data);
  }

  async get(playerId: string, limit = 10, offset = 0): Promise<Memory[]> {
    const response = await this.httpClient.get(
      `${this.config.memoryServiceUrl}/players/${playerId}/memories`,
      { params: { limit, offset } },
    );

    // Convert response to camelCase for TypeScript
    return keysToCamelCase<Memory[]>(response.data);
  }
}

/**
 * Helper functions for common operations
 */
export class AGLHelpers {
  /**
   * Create a victory emotion request
   */
  static createVictoryRequest(isMVP: boolean = false, winStreak: number = 0): EmotionRequest {
    return {
      type: 'player.victory',
      data: {
        mvp: isMVP,
        winStreak,
      },
    };
  }

  /**
   * Create a defeat emotion request
   */
  static createDefeatRequest(lossStreak: number = 0): EmotionRequest {
    return {
      type: 'player.defeat',
      data: {
        lossStreak,
      },
    };
  }

  /**
   * Create an achievement emotion request
   */
  static createAchievementRequest(rarity: 'common' | 'epic' | 'legendary'): EmotionRequest {
    return {
      type: 'player.achievement',
      data: {
        rarity,
      },
    };
  }

  /**
   * Create a kill emotion request
   */
  static createKillRequest(killCount: number, isLegendary: boolean = false): EmotionRequest {
    return {
      type: 'player.kill',
      data: {
        killCount,
        isLegendary,
      },
    };
  }
}

// Default export
export default AGLClient;
