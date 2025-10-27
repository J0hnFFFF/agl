/**
 * AGL Web SDK TypeScript Definitions
 */

// Configuration
export interface AGLConfig {
  apiKey: string;
  apiBaseUrl?: string;
  emotionServiceUrl?: string;
  dialogueServiceUrl?: string;
  memoryServiceUrl?: string;
  timeout?: number;
}

// Emotion types
export type EmotionType =
  | 'happy'
  | 'excited'
  | 'amazed'
  | 'proud'
  | 'satisfied'
  | 'cheerful'
  | 'grateful'
  | 'sad'
  | 'disappointed'
  | 'frustrated'
  | 'angry'
  | 'worried'
  | 'tired'
  | 'neutral';

export type EventType =
  | 'player.victory'
  | 'player.defeat'
  | 'player.kill'
  | 'player.death'
  | 'player.achievement'
  | 'player.levelup'
  | 'player.loot'
  | 'player.sessionstart'
  | 'player.sessionend';

export type Persona = 'cheerful' | 'cool' | 'cute';

export type MemoryType =
  | 'achievement'
  | 'milestone'
  | 'first_time'
  | 'dramatic'
  | 'conversation'
  | 'event'
  | 'observation';

// Request types
export interface EmotionRequest {
  type: EventType;
  data: Record<string, any>;
  context?: {
    playerHealth?: number;
    playerLevel?: number;
    inCombat?: boolean;
    [key: string]: any;
  };
  forceMl?: boolean;
}

export interface DialogueRequest {
  eventType: EventType;
  emotion: EmotionType;
  persona: Persona;
  playerId?: string;
  language?: string;
  context?: Record<string, any>;
  forceLlm?: boolean;
}

export interface CreateMemoryRequest {
  type: MemoryType;
  content: string;
  emotion?: string;
  context?: Record<string, any>;
  importance?: number;
}

export interface SearchMemoriesRequest {
  query: string;
  limit?: number;
}

export interface GetContextRequest {
  currentEvent: string;
  limit?: number;
}

// Response types
export interface EmotionResponse {
  emotion: EmotionType;
  intensity: number;
  action: string;
  confidence: number;
  reasoning: string;
  method: 'rule' | 'ml' | 'cached';
  cost: number;
  cacheHit: boolean;
  latencyMs: number;
}

export interface DialogueResponse {
  dialogue: string;
  method: 'template' | 'llm' | 'cached';
  cost: number;
  usedSpecialCase: boolean;
  specialCaseReasons: string[];
  memoryCount: number;
  cacheHit: boolean;
  latencyMs: number;
}

export interface Memory {
  id: string;
  playerId: string;
  type: MemoryType;
  content: string;
  emotion?: string;
  importance: number;
  context?: Record<string, any>;
  createdAt: string;
}

export interface SearchResult {
  memory: Memory;
  similarityScore: number;
}

// Error types
export interface AGLError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Service interfaces
export interface IEmotionService {
  analyze(request: EmotionRequest): Promise<EmotionResponse>;
}

export interface IDialogueService {
  generate(request: DialogueRequest): Promise<DialogueResponse>;
}

export interface IMemoryService {
  create(playerId: string, request: CreateMemoryRequest): Promise<Memory>;
  search(playerId: string, request: SearchMemoriesRequest): Promise<SearchResult[]>;
  getContext(playerId: string, request: GetContextRequest): Promise<Memory[]>;
  get(playerId: string, limit?: number, offset?: number): Promise<Memory[]>;
}

export interface IAGLClient {
  emotion: IEmotionService;
  dialogue: IDialogueService;
  memory: IMemoryService;

  setPlayerId(playerId: string): void;
  setGameId(gameId: string): void;
}
