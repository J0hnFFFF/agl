/**
 * Test utility functions and helpers
 */

/**
 * Create mock memory object
 */
export function createMockMemory(overrides: any = {}) {
  return {
    id: 'mem-test-' + Math.random().toString(36).substr(2, 9),
    playerId: 'player-test',
    type: 'event',
    content: 'Test memory content',
    emotion: undefined,
    importance: 0.5,
    context: {},
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock embedding vector
 */
export function createMockEmbedding(dimension: number = 1536): number[] {
  return new Array(dimension).fill(0).map(() => Math.random());
}

/**
 * Create mock Qdrant search result
 */
export function createMockSearchResult(overrides: any = {}) {
  return {
    id: 'mem-test-' + Math.random().toString(36).substr(2, 9),
    score: 0.95,
    payload: {
      playerId: 'player-test',
      memoryId: 'mem-test',
      content: 'Test content',
      type: 'event',
      importance: 0.5,
      createdAt: new Date().toISOString(),
      ...overrides.payload,
    },
    ...overrides,
  };
}

/**
 * Wait for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate deterministic embedding based on text
 * Useful for consistent test results
 */
export function deterministicEmbedding(text: string, dimension: number = 1536): number[] {
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = seededRandom(seed);
  return new Array(dimension).fill(0).map(() => random());
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number) {
  let value = seed;
  return function () {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Assert that two arrays are approximately equal
 */
export function assertArraysClose(
  actual: number[],
  expected: number[],
  tolerance: number = 0.001
) {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    expect(Math.abs(actual[i] - expected[i])).toBeLessThan(tolerance);
  }
}

/**
 * Mock Prisma client for tests
 */
export function createMockPrismaClient() {
  return {
    memory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}

/**
 * Mock Qdrant client for tests
 */
export function createMockQdrantClient() {
  return {
    getCollections: jest.fn().mockResolvedValue({ collections: [] }),
    createCollection: jest.fn(),
    createPayloadIndex: jest.fn(),
    upsert: jest.fn(),
    search: jest.fn(),
    delete: jest.fn(),
  };
}

/**
 * Mock OpenAI client for tests
 */
export function createMockOpenAIClient() {
  return {
    embeddings: {
      create: jest.fn(),
    },
  };
}

/**
 * Create test player ID
 */
export function createTestPlayerId(): string {
  return 'player-test-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Create test memory with calculated importance
 */
export function createMemoryWithImportance(
  type: string,
  emotion?: string,
  context?: any
): number {
  let importance = 0.5;

  const importantTypes = ['achievement', 'milestone', 'first_time', 'dramatic'];
  if (importantTypes.includes(type)) {
    importance += 0.2;
  }

  const strongEmotions = ['amazed', 'excited', 'angry', 'frustrated', 'grateful'];
  if (emotion && strongEmotions.includes(emotion)) {
    importance += 0.15;
  }

  if (context?.rarity === 'legendary' || context?.rarity === 'epic') {
    importance += 0.15;
  }

  if (context?.mvp || context?.isLegendary) {
    importance += 0.1;
  }

  const winStreak = context?.winStreak || 0;
  const lossStreak = context?.lossStreak || 0;
  if (winStreak >= 5 || lossStreak >= 5) {
    importance += 0.1;
  }

  return Math.min(importance, 1.0);
}
