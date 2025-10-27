# AGL Web SDK

TypeScript SDK for integrating AGL (AI Game Companion Engine) into browser-based games and WebGL applications.

## Features

- 🎮 **Emotion Analysis** - Analyze player events and get emotional responses
- 💬 **Dynamic Dialogue** - Generate context-aware NPC dialogue
- 🧠 **Memory System** - Store and retrieve player memories with semantic search
- 🔒 **Type-Safe** - Full TypeScript support with complete type definitions
- ⚡ **Lightweight** - Minimal dependencies (only axios)
- 🌐 **Browser & Node** - Works in both browser and Node.js environments

## Installation

```bash
npm install @agl/web-sdk
```

Or with yarn:

```bash
yarn add @agl/web-sdk
```

## Quick Start

```typescript
import AGLClient from '@agl/web-sdk';

// Initialize the client
const agl = new AGLClient({
  apiKey: 'your-api-key',
  apiBaseUrl: 'https://api.yourgame.com',
  emotionServiceUrl: 'https://emotion.yourgame.com',
  dialogueServiceUrl: 'https://dialogue.yourgame.com',
  memoryServiceUrl: 'https://memory.yourgame.com',
});

// Set player context
agl.setPlayerId('player-123');
agl.setGameId('game-456');

// Analyze emotion
const emotionResult = await agl.emotion.analyze({
  type: 'player.victory',
  data: {
    mvp: true,
    winStreak: 5,
  },
  context: {
    playerHealth: 100,
    playerLevel: 15,
    inCombat: false,
  },
});

console.log(emotionResult.emotion); // "excited"
console.log(emotionResult.intensity); // 0.85

// Generate dialogue
const dialogueResult = await agl.dialogue.generate({
  event_type: 'player.victory',
  emotion: emotionResult.emotion,
  persona: 'cheerful',
  player_id: 'player-123',
});

console.log(dialogueResult.dialogue); // "Awesome job! That's 5 wins in a row!"

// Create a memory
const memory = await agl.memory.create('player-123', {
  type: 'achievement',
  content: 'Won 5 matches in a row with 100% health',
  emotion: 'excited',
  importance: 8,
  context: {
    winStreak: 5,
    health: 100,
    level: 15,
  },
});
```

## API Reference

### AGLClient

The main client class for interacting with AGL services.

#### Constructor

```typescript
new AGLClient(config: AGLConfig)
```

**AGLConfig**:
- `apiKey` (string, required) - Your AGL API key
- `apiBaseUrl` (string, optional) - Base URL for API service (default: 'http://localhost:3000')
- `emotionServiceUrl` (string, optional) - Emotion service URL (default: 'http://localhost:8000')
- `dialogueServiceUrl` (string, optional) - Dialogue service URL (default: 'http://localhost:8001')
- `memoryServiceUrl` (string, optional) - Memory service URL (default: 'http://localhost:3002')
- `timeout` (number, optional) - Request timeout in milliseconds (default: 30000)

#### Methods

##### setPlayerId(playerId: string)
Set the current player ID for context.

##### setGameId(gameId: string)
Set the current game ID for context.

##### getPlayerId(): string | undefined
Get the current player ID.

##### getGameId(): string | undefined
Get the current game ID.

### Emotion Service

Access via `agl.emotion`.

#### analyze(request: EmotionRequest): Promise<EmotionResponse>

Analyze a player event and determine emotional response.

**EmotionRequest**:
- `type` (EventType, required) - Type of event (e.g., 'player.victory', 'player.defeat')
- `data` (object, required) - Event-specific data
- `context` (object, optional) - Additional context (playerHealth, playerLevel, inCombat, etc.)
- `force_ml` (boolean, optional) - Force ML-based analysis instead of rule-based

**EmotionResponse**:
- `emotion` (EmotionType) - Detected emotion (e.g., 'happy', 'excited', 'frustrated')
- `intensity` (number) - Intensity from 0.0 to 1.0
- `action` (string) - Suggested action or animation
- `confidence` (number) - Confidence score 0.0 to 1.0
- `reasoning` (string) - Explanation of the result
- `method` ('rule' | 'ml' | 'cached') - Method used for analysis
- `cost` (number) - Cost in USD
- `cache_hit` (boolean) - Whether result was cached
- `latency_ms` (number) - Processing latency

**Available Event Types**:
- `player.victory` - Player won a match/game
- `player.defeat` - Player lost a match/game
- `player.kill` - Player eliminated an opponent
- `player.death` - Player was eliminated
- `player.achievement` - Player unlocked an achievement
- `player.levelup` - Player gained a level
- `player.loot` - Player obtained loot
- `player.sessionstart` - Player started a session
- `player.sessionend` - Player ended a session

**Available Emotions**:
- Positive: `happy`, `excited`, `amazed`, `proud`, `satisfied`, `cheerful`, `grateful`
- Negative: `sad`, `disappointed`, `frustrated`, `angry`, `worried`, `tired`
- Neutral: `neutral`

### Dialogue Service

Access via `agl.dialogue`.

#### generate(request: DialogueRequest): Promise<DialogueResponse>

Generate NPC dialogue based on event and emotion.

**DialogueRequest**:
- `event_type` (EventType, required) - Type of event
- `emotion` (EmotionType, required) - Current emotion
- `persona` (Persona, required) - NPC personality ('cheerful', 'cool', 'cute')
- `player_id` (string, optional) - Player ID for memory context
- `context` (object, optional) - Additional context data
- `force_llm` (boolean, optional) - Force LLM generation instead of templates

**DialogueResponse**:
- `dialogue` (string) - Generated dialogue text
- `method` ('template' | 'llm' | 'cached') - Generation method
- `cost` (number) - Cost in USD
- `used_special_case` (boolean) - Whether special case was applied
- `special_case_reasons` (string[]) - Reasons for special cases
- `memory_count` (number) - Number of memories used
- `cache_hit` (boolean) - Whether result was cached
- `latency_ms` (number) - Processing latency

**Available Personas**:
- `cheerful` - Enthusiastic, positive, energetic
- `cool` - Calm, collected, understated
- `cute` - Sweet, playful, endearing

### Memory Service

Access via `agl.memory`.

#### create(playerId: string, request: CreateMemoryRequest): Promise<Memory>

Create a new memory for a player.

**CreateMemoryRequest**:
- `type` (MemoryType, required) - Type of memory
- `content` (string, required) - Memory content/description
- `emotion` (string, optional) - Associated emotion
- `context` (object, optional) - Additional context data
- `importance` (number, optional) - Importance score 0-10 (default: 5)

**Memory Types**:
- `achievement` - Significant accomplishments
- `milestone` - Important progress markers
- `first_time` - First-time experiences
- `dramatic` - Dramatic moments
- `conversation` - Notable conversations
- `event` - General events
- `observation` - Observations about the player

**Memory Response**:
- `id` (string) - Memory ID
- `playerId` (string) - Player ID
- `type` (MemoryType) - Memory type
- `content` (string) - Memory content
- `emotion` (string) - Associated emotion
- `importance` (number) - Importance score
- `context` (object) - Context data
- `createdAt` (string) - Creation timestamp

#### search(playerId: string, request: SearchMemoriesRequest): Promise<SearchResult[]>

Search memories using semantic similarity.

**SearchMemoriesRequest**:
- `query` (string, required) - Search query
- `limit` (number, optional) - Maximum results (default: 10)

**SearchResult**:
- `memory` (Memory) - The memory object
- `similarityScore` (number) - Similarity score 0.0 to 1.0

#### getContext(playerId: string, request: GetContextRequest): Promise<Memory[]>

Get relevant memories for the current context.

**GetContextRequest**:
- `currentEvent` (string, required) - Description of current event
- `limit` (number, optional) - Maximum memories (default: 5)

#### get(playerId: string, limit?: number, offset?: number): Promise<Memory[]>

Get recent memories for a player.

**Parameters**:
- `playerId` (string, required) - Player ID
- `limit` (number, optional) - Maximum results (default: 10)
- `offset` (number, optional) - Pagination offset (default: 0)

## Helper Functions

The SDK provides helper functions for common operations via the `AGLHelpers` class.

```typescript
import { AGLHelpers } from '@agl/web-sdk';

// Create emotion requests
const victoryRequest = AGLHelpers.createVictoryRequest(true, 5);
const defeatRequest = AGLHelpers.createDefeatRequest(2);
const achievementRequest = AGLHelpers.createAchievementRequest('legendary');
const killRequest = AGLHelpers.createKillRequest(10, true);

// Use with emotion service
const result = await agl.emotion.analyze(victoryRequest);
```

### Available Helpers

#### createVictoryRequest(isMVP?: boolean, winStreak?: number): EmotionRequest
Create a victory emotion request.

#### createDefeatRequest(lossStreak?: number): EmotionRequest
Create a defeat emotion request.

#### createAchievementRequest(rarity: 'common' | 'epic' | 'legendary'): EmotionRequest
Create an achievement emotion request.

#### createKillRequest(killCount: number, isLegendary?: boolean): EmotionRequest
Create a kill emotion request.

## Usage Examples

### Unity WebGL Integration

```typescript
// Initialize SDK when game loads
const agl = new AGLClient({
  apiKey: 'your-api-key',
  apiBaseUrl: 'https://api.yourgame.com',
  emotionServiceUrl: 'https://emotion.yourgame.com',
  dialogueServiceUrl: 'https://dialogue.yourgame.com',
  memoryServiceUrl: 'https://memory.yourgame.com',
});

// Handle player login
async function onPlayerLogin(playerId: string) {
  agl.setPlayerId(playerId);
  agl.setGameId('my-awesome-game');
}

// Handle match victory
async function onMatchVictory(mvp: boolean, streak: number) {
  try {
    // Analyze emotion
    const emotion = await agl.emotion.analyze({
      type: 'player.victory',
      data: { mvp, winStreak: streak },
    });

    // Generate companion dialogue
    const dialogue = await agl.dialogue.generate({
      event_type: 'player.victory',
      emotion: emotion.emotion,
      persona: 'cheerful',
      player_id: agl.getPlayerId(),
    });

    // Show dialogue in game UI
    showCompanionDialogue(dialogue.dialogue);

    // Create memory if significant
    if (streak >= 5 || mvp) {
      await agl.memory.create(agl.getPlayerId()!, {
        type: 'achievement',
        content: `${mvp ? 'MVP victory' : 'Victory'} with ${streak} win streak`,
        emotion: emotion.emotion,
        importance: mvp ? 8 : 6,
      });
    }
  } catch (error) {
    console.error('AGL error:', error);
  }
}
```

### Phaser Game Integration

```typescript
class GameScene extends Phaser.Scene {
  private agl: AGLClient;

  create() {
    this.agl = new AGLClient({
      apiKey: 'your-api-key',
      // ... other config
    });

    this.agl.setPlayerId(this.game.registry.get('playerId'));
    this.agl.setGameId('phaser-game');
  }

  async onPlayerAchievement(achievementId: string, rarity: string) {
    const emotion = await this.agl.emotion.analyze({
      type: 'player.achievement',
      data: { achievementId, rarity },
    });

    const dialogue = await this.agl.dialogue.generate({
      event_type: 'player.achievement',
      emotion: emotion.emotion,
      persona: 'cute',
      player_id: this.agl.getPlayerId(),
    });

    this.showCompanionMessage(dialogue.dialogue, emotion.emotion);
  }

  showCompanionMessage(text: string, emotion: string) {
    // Display message with appropriate emotion animation
    const sprite = this.add.sprite(100, 100, `companion_${emotion}`);
    const message = this.add.text(150, 100, text, { fontSize: '16px' });
    // ... animation code
  }
}
```

### Three.js / WebGL Game

```typescript
import * as THREE from 'three';
import AGLClient, { AGLHelpers } from '@agl/web-sdk';

class Game {
  private agl: AGLClient;
  private scene: THREE.Scene;
  private companion: THREE.Mesh;

  constructor() {
    this.agl = new AGLClient({
      apiKey: 'your-api-key',
      apiBaseUrl: 'https://api.yourgame.com',
    });

    this.scene = new THREE.Scene();
    // ... setup code
  }

  async onPlayerKill(killCount: number) {
    const request = AGLHelpers.createKillRequest(killCount, killCount >= 10);
    const emotion = await this.agl.emotion.analyze(request);

    // Update companion animation based on emotion
    this.updateCompanionAnimation(emotion.emotion, emotion.intensity);

    // Generate and display dialogue
    const dialogue = await this.agl.dialogue.generate({
      event_type: 'player.kill',
      emotion: emotion.emotion,
      persona: 'cool',
      player_id: this.agl.getPlayerId(),
    });

    this.displayDialogue(dialogue.dialogue);
  }

  updateCompanionAnimation(emotion: string, intensity: number) {
    // Update companion 3D model animation
    switch (emotion) {
      case 'excited':
        this.companion.rotation.y += 0.1 * intensity;
        break;
      case 'happy':
        this.companion.position.y += Math.sin(Date.now() * 0.01) * intensity;
        break;
      // ... other emotions
    }
  }
}
```

### Memory-Based Personalization

```typescript
async function generatePersonalizedGreeting(playerId: string) {
  // Search for recent significant memories
  const recentMemories = await agl.memory.search(playerId, {
    query: 'achievement victory milestone',
    limit: 3,
  });

  let context = {};
  if (recentMemories.length > 0) {
    context = {
      recentAchievements: recentMemories.map(r => r.memory.content),
      lastEmotion: recentMemories[0].memory.emotion,
    };
  }

  // Generate personalized dialogue
  const dialogue = await agl.dialogue.generate({
    event_type: 'player.sessionstart',
    emotion: 'cheerful',
    persona: 'cheerful',
    player_id: playerId,
    context,
  });

  return dialogue.dialogue;
}
```

## Error Handling

The SDK uses axios for HTTP requests. All methods may throw errors that should be handled:

```typescript
import AGLClient from '@agl/web-sdk';
import { AxiosError } from 'axios';

const agl = new AGLClient({ apiKey: 'your-api-key' });

try {
  const result = await agl.emotion.analyze({
    type: 'player.victory',
    data: {},
  });
} catch (error) {
  if (error instanceof AxiosError) {
    if (error.response) {
      // Server responded with error
      console.error('Server error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network error:', error.message);
    } else {
      // Request setup error
      console.error('Request error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Common Error Scenarios

**Authentication Error (401)**:
```typescript
// Invalid or missing API key
{
  code: 'UNAUTHORIZED',
  message: 'Invalid API key'
}
```

**Rate Limit Error (429)**:
```typescript
// Too many requests
{
  code: 'RATE_LIMIT_EXCEEDED',
  message: 'Rate limit exceeded. Please retry after 60 seconds.'
}
```

**Validation Error (400)**:
```typescript
// Invalid request parameters
{
  code: 'VALIDATION_ERROR',
  message: 'Invalid event type',
  details: { /* validation details */ }
}
```

**Service Unavailable (503)**:
```typescript
// Service temporarily unavailable
{
  code: 'SERVICE_UNAVAILABLE',
  message: 'Emotion service is temporarily unavailable'
}
```

## TypeScript Support

The SDK is written in TypeScript and provides complete type definitions:

```typescript
import AGLClient, {
  AGLConfig,
  EmotionRequest,
  EmotionResponse,
  DialogueRequest,
  DialogueResponse,
  CreateMemoryRequest,
  Memory,
  SearchMemoriesRequest,
  SearchResult,
  EmotionType,
  EventType,
  Persona,
  MemoryType,
} from '@agl/web-sdk';

// Full type safety and IntelliSense support
const config: AGLConfig = {
  apiKey: 'your-api-key',
};

const agl = new AGLClient(config);

const request: EmotionRequest = {
  type: 'player.victory', // TypeScript validates this is a valid EventType
  data: {
    mvp: true,
    winStreak: 5,
  },
};

const response: EmotionResponse = await agl.emotion.analyze(request);
const emotion: EmotionType = response.emotion; // Type-safe
```

## Performance Considerations

### Caching
The AGL services implement intelligent caching:
- Similar requests may return cached results (indicated by `cache_hit: true`)
- Cache hit responses have zero cost and minimal latency
- Cache is automatically managed by the backend

### Cost Optimization
- Rule-based emotion analysis (when applicable) costs $0
- Template-based dialogue generation costs $0
- ML/LLM methods are used only when necessary
- Use `force_ml: false` and `force_llm: false` to prefer cheaper methods

### Timeouts
Configure request timeout based on your needs:
```typescript
const agl = new AGLClient({
  apiKey: 'your-api-key',
  timeout: 5000, // 5 seconds (default: 30000)
});
```

### Parallel Requests
Make independent requests in parallel for better performance:
```typescript
const [emotion, memories] = await Promise.all([
  agl.emotion.analyze(emotionRequest),
  agl.memory.search(playerId, searchRequest),
]);
```

## Browser Compatibility

The SDK works in all modern browsers that support ES2020:
- Chrome 80+
- Firefox 72+
- Safari 13.1+
- Edge 80+

For older browsers, transpile the SDK using your bundler's configuration.

## Bundle Sizes

- CommonJS: ~15KB (minified + gzipped)
- ES Module: ~14KB (minified + gzipped)
- UMD (browser): ~16KB (minified + gzipped)

Dependencies: axios (~14KB gzipped)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (watch)
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## License

Proprietary - AGL Team

## Support

For issues, questions, or feature requests, contact the AGL team or visit the project repository.
