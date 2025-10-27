# AGL Integration Guide

## Overview

This guide explains how to integrate all AGL services together to create a complete AI companion experience in your game.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Game Client                             │
│                      (Unity/Unreal/Web)                          │
└────────────┬──────────────────────────────────┬─────────────────┘
             │                                   │
             │ REST API                          │ WebSocket
             │                                   │
┌────────────▼──────────────┐      ┌───────────▼──────────────┐
│      API Service           │      │   Realtime Gateway       │
│    (Port 3000)             │      │     (Port 3001)          │
│  - Auth, Games, Players    │      │  - Socket.IO events      │
└────────────┬───────────────┘      └──────────┬───────────────┘
             │                                  │
             │                     ┌────────────▼───────────────┐
             │                     │      Redis PubSub          │
             │                     │   (Event Distribution)     │
             │                     └────────────┬───────────────┘
             │                                  │
    ┌────────┼──────────────────────────────────┼────────────┐
    │        │                                   │            │
┌───▼────────▼────┐  ┌──────────────────┐  ┌───▼────────────▼───┐
│  Memory Service  │  │ Emotion Service  │  │ Dialogue Service   │
│   (Port 3002)    │  │   (Port 8000)    │  │   (Port 8001)      │
│                  │  │                  │  │                    │
│ - Semantic mem.  │  │ - Rule-based     │  │ - Templates 90%    │
│ - Vector search  │  │ - Context-aware  │  │ - LLM 10%          │
│ - Importance     │  │ - 25+ events     │  │ - 3 personas       │
└─────────┬────────┘  └──────────────────┘  └────────────────────┘
          │
    ┌─────▼──────┐
    │  Qdrant    │
    │  (Vector)  │
    └────────────┘
```

## Complete Flow Example

### Scenario: Player defeats a legendary boss

#### 1. Game Event Submission

```typescript
// Game client sends event via WebSocket
socket.emit('game_event', {
  playerId: 'player-123',
  eventType: 'player.victory',
  data: {
    bossName: 'Ancient Dragon',
    difficulty: 'nightmare',
    killCount: 1,
    mvp: true,
    rarity: 'legendary'
  },
  context: {
    playerHealth: 25,
    playerLevel: 50,
    inCombat: false
  }
});
```

#### 2. Emotion Analysis

Realtime Gateway forwards to Emotion Service:

```python
# Emotion Service analyzes the event
POST http://localhost:8000/analyze
{
  "type": "player.victory",
  "data": {
    "bossName": "Ancient Dragon",
    "difficulty": "nightmare",
    "mvp": true,
    "rarity": "legendary"
  },
  "context": {
    "playerHealth": 25,
    "inCombat": false
  }
}

# Response
{
  "emotion": "amazed",
  "intensity": 1.0,
  "action": "surprised_jump",
  "confidence": 0.95,
  "reasoning": "Legendary victory (MVP!) (on nightmare difficulty) (but health is critical)"
}
```

#### 3. Memory Creation

Create a memory of this significant achievement:

```typescript
POST http://localhost:3002/players/player-123/memories
{
  "type": "achievement",
  "content": "Defeated Ancient Dragon on nightmare difficulty",
  "emotion": "amazed",
  "context": {
    "bossName": "Ancient Dragon",
    "difficulty": "nightmare",
    "mvp": true,
    "rarity": "legendary"
  }
}

// Memory Service calculates importance:
// Base: 0.5
// + Achievement type: 0.2
// + Strong emotion (amazed): 0.15
// + Rare event (legendary): 0.15
// = 1.0 (capped)
```

#### 4. Context Retrieval

Get relevant memories for dialogue:

```typescript
POST http://localhost:3002/players/player-123/context
{
  "currentEvent": "defeated legendary boss",
  "limit": 5
}

// Returns mix of:
// - Recent important memories (temporal)
// - Semantically similar memories (vector search)
// Example: Previous boss fights, achievements, victories
```

#### 5. Dialogue Generation

The service automatically decides between template and LLM based on special case detection:

```python
# Single unified endpoint - handles both template and LLM
POST http://localhost:8001/generate
{
  "event_type": "player.victory",
  "emotion": "amazed",
  "persona": "cheerful",
  "player_id": "player-123",
  "context": {
    "bossName": "Ancient Dragon",
    "difficulty": "nightmare",
    "rarity": "legendary",
    "is_first_time": true
  }
}

# Response (LLM - auto-triggered by special case detection)
{
  "dialogue": "哇！你击败了传说中的远古龙！这可是你的第一次传奇boss战，而且是在噩梦难度下！真是太不可思议了！",
  "method": "llm",
  "cost": 0.0006,
  "used_special_case": true,
  "special_case_reasons": [
    "legendary_rarity",
    "first_time_event",
    "high_importance_memory"
  ],
  "memory_count": 3,
  "cache_hit": false,
  "latency_ms": 1250.8
}

# For common events - Template is used automatically
POST http://localhost:8001/generate
{
  "event_type": "player.victory",
  "emotion": "happy",
  "persona": "cheerful"
}

# Response (Template)
{
  "dialogue": "太棒了！你赢了！✨",
  "method": "template",
  "cost": 0.0,
  "used_special_case": false,
  "special_case_reasons": [],
  "memory_count": 0,
  "cache_hit": false,
  "latency_ms": 2.5
}

# Subsequent identical requests hit cache
# Response (Cached)
{
  "dialogue": "太棒了！你赢了！✨",
  "method": "cached",
  "cost": 0.0,
  "cache_hit": true,
  "latency_ms": 0.8
}
```

**Special Case Detection** (triggers LLM):
- Legendary/mythic rarity events
- First-time experiences (`is_first_time: true`)
- Milestone numbers (10, 50, 100, 500, 1000, etc.)
- Long streaks (≥5 wins/losses)
- High-importance memories (≥0.8)
- Complex context (≥3 significant factors)

**Cost Control**:
- Daily budget: $10.00
- Target LLM rate: 10%
- Automatic fallback to templates when budget exceeded

#### 6. Response to Game

Realtime Gateway sends complete response:

```typescript
// Client receives via WebSocket
socket.on('companion_response', (data) => {
  console.log(data);
  // {
  //   emotion: "amazed",
  //   intensity: 1.0,
  //   action: "surprised_jump",
  //   dialogue: "天啊！！！传奇boss！！你创造了历史！！",
  //   method: "template",
  //   memoryCreated: true
  // }

  // Display in game UI
  companionCharacter.playAnimation(data.action);
  companionCharacter.speak(data.dialogue);
});
```

## Integration Patterns

### Pattern 1: Real-time Event Processing

**Use Case**: Live gameplay with immediate companion reactions

```typescript
// 1. Connect to WebSocket
const socket = io('ws://localhost:3001');

// 2. Authenticate
socket.emit('authenticate', {
  playerId: 'player-123',
  gameId: 'game-456',
  apiKey: 'agl_xxx'
});

// 3. Send events as they happen
function onPlayerVictory() {
  socket.emit('game_event', {
    playerId: 'player-123',
    eventType: 'player.victory',
    data: { /* event data */ }
  });
}

// 4. Receive companion responses
socket.on('companion_response', (response) => {
  displayCompanionDialogue(response.dialogue);
  playCompanionAnimation(response.action);
});
```

### Pattern 2: Batch Memory Creation

**Use Case**: Post-game analysis, session summaries

```typescript
async function createSessionMemories(playerId: string, sessionData: SessionData) {
  const memories = [];

  // Create memories for significant events
  if (sessionData.achievementsUnlocked > 0) {
    memories.push({
      type: 'milestone',
      content: `Unlocked ${sessionData.achievementsUnlocked} achievements`,
      emotion: 'proud',
      context: { session: sessionData.sessionId }
    });
  }

  if (sessionData.bossesDefeated > 0) {
    memories.push({
      type: 'achievement',
      content: `Defeated ${sessionData.bossesDefeated} bosses`,
      emotion: 'satisfied',
      context: { bossList: sessionData.bossNames }
    });
  }

  // Batch create
  for (const memory of memories) {
    await fetch(`http://localhost:3002/players/${playerId}/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memory)
    });
  }
}
```

### Pattern 3: Contextual Dialogue with Memory

**Use Case**: NPC conversations, dialogue trees with player history

```typescript
async function generateContextualDialogue(
  playerId: string,
  eventType: string,
  emotion: string,
  persona: string,
  context?: object
) {
  // Generate dialogue - service automatically handles special case detection
  const dialogueResponse = await fetch(
    'http://localhost:8001/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        emotion: emotion,
        persona: persona,
        player_id: playerId,  // Service will fetch memories automatically
        context: context
      })
    }
  );

  const result = await dialogueResponse.json();

  // Log LLM usage for monitoring
  if (result.method === 'llm') {
    console.log(`LLM triggered: ${result.special_case_reasons.join(', ')}`);
    console.log(`Cost: $${result.cost.toFixed(4)}, Memories used: ${result.memory_count}`);
  }

  return result;
}

// Usage example
const dialogue = await generateContextualDialogue(
  'player-123',
  'player.victory',
  'amazed',
  'cheerful',
  { rarity: 'legendary', is_first_time: true }
);

// If it's a legendary first-time victory with high-importance memories,
// the service will automatically use LLM with memory context
console.log(dialogue.dialogue);
// "哇！你的第一次传奇胜利！还记得你之前在这里失败了3次吗？这次真的太棒了！"
```

### Pattern 4: Memory Search for UI

**Use Case**: Memory log, achievement showcase

```typescript
async function searchPlayerMemories(playerId: string, query: string) {
  const response = await fetch(
    `http://localhost:3002/players/${playerId}/memories/search`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        limit: 10
      })
    }
  );

  return await response.json();
}

// Usage
const bossMemories = await searchPlayerMemories(
  'player-123',
  'boss battles and victories'
);

// Display in UI
bossMemories.forEach(memory => {
  console.log(`${memory.content} (${memory.similarityScore.toFixed(2)})`);
});
```

## Best Practices

### 1. Event Submission

**Do:**
- Send events immediately as they happen
- Include rich context data
- Use appropriate event types
- Batch non-critical events

**Don't:**
- Send every frame update
- Send duplicate events
- Include PII in event data
- Send events for trivial actions

### 2. Memory Management

**Do:**
- Create memories for significant events
- Let importance scoring work automatically
- Run weekly cleanup (minImportance=0.3)
- Use semantic search for relevant context

**Don't:**
- Create memories for every event
- Manually set all importance scores
- Store large binary data
- Delete all memories frequently

### 3. Dialogue Generation

**Do:**
- Use templates for 90% of cases
- Reserve LLM for special moments
- Include memory context for LLM
- Cache common dialogues

**Don't:**
- Use LLM for every response
- Generate without context
- Ignore persona consistency
- Skip error handling

### 4. Performance Optimization

**Do:**
- Use WebSocket for real-time events
- Batch API calls when possible
- Cache frequently accessed data
- Monitor service health

**Don't:**
- Poll REST endpoints repeatedly
- Make synchronous blocking calls
- Ignore rate limits
- Skip error handling

## Error Handling

### Graceful Degradation

```typescript
async function getCompanionResponse(event: GameEvent) {
  try {
    // Try full flow with memories
    const memories = await getMemoryContext(event.playerId, event.type);
    const dialogue = await generateDialogue(event, memories);
    return dialogue;
  } catch (error) {
    console.error('Memory service unavailable:', error);

    try {
      // Fallback: Generate without memories
      const dialogue = await generateDialogue(event, []);
      return dialogue;
    } catch (error) {
      console.error('Dialogue service unavailable:', error);

      // Ultimate fallback: Use local template
      return getLocalFallbackDialogue(event.type);
    }
  }
}
```

### Retry Logic

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      if (i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

## Monitoring

### Key Metrics to Track

```typescript
interface ServiceMetrics {
  // Emotion Service
  emotionAnalysisLatency: number; // ms
  emotionConfidence: number; // 0-1

  // Memory Service
  memoryCreationRate: number; // per minute
  memorySearchLatency: number; // ms
  vectorDbSize: number; // MB

  // Dialogue Service
  dialogueGenerationLatency: number; // ms
  llmUsageRate: number; // percentage (actual vs target 10%)
  averageCost: number; // USD per dialogue
  cacheHitRate: number; // percentage
  templateUsageRate: number; // percentage
  specialCaseDetectionRate: number; // percentage

  // Cost Tracking
  dailyLlmCost: number; // USD spent today
  budgetRemaining: number; // USD remaining
  costPerRequest: number; // average USD
  totalLlmRequests: number; // count
  totalTemplateRequests: number; // count
  totalCachedRequests: number; // count

  // Overall
  endToEndLatency: number; // ms (event to response)
  errorRate: number; // percentage
  successRate: number; // percentage
}
```

### Monitoring LLM Usage

```typescript
// Fetch dialogue service stats
async function getDialogueStats() {
  const response = await fetch('http://localhost:8001/stats');
  const stats = await response.json();

  return {
    llmRate: stats.cost.llm_rate,
    targetLlmRate: stats.cost.target_llm_rate,
    dailyCost: stats.cost.total_cost,
    budgetRemaining: stats.cost.budget_remaining,
    cacheHitRate: stats.cache.hit_rate,
    avgLatency: stats.cost.average_latency_ms
  };
}

// Alert if LLM usage is too high
const stats = await getDialogueStats();
if (stats.llmRate > stats.targetLlmRate * 1.5) {
  console.warn(`LLM usage rate ${stats.llmRate}% exceeds target ${stats.targetLlmRate}%`);
}

// Alert if budget is running low
if (stats.budgetRemaining < 2.0) {
  console.warn(`Daily LLM budget running low: $${stats.budgetRemaining} remaining`);
}
```

### Health Checks

```typescript
async function checkServicesHealth() {
  const services = [
    { name: 'API', url: 'http://localhost:3000/health' },
    { name: 'Realtime', url: 'http://localhost:3001/health' },
    { name: 'Emotion', url: 'http://localhost:8000/health' },
    { name: 'Dialogue', url: 'http://localhost:8001/health' },
    { name: 'Memory', url: 'http://localhost:3002/health' },
  ];

  const results = await Promise.all(
    services.map(async (service) => {
      try {
        const response = await fetch(service.url);
        const data = await response.json();
        return {
          name: service.name,
          status: data.status,
          healthy: response.ok
        };
      } catch (error) {
        return {
          name: service.name,
          status: 'error',
          healthy: false
        };
      }
    })
  );

  return results;
}
```

## Deployment

### Docker Compose

```yaml
version: '3.8'

services:
  # Data stores
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: agl
      POSTGRES_USER: agl
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"

  # Services
  api-service:
    build: ./services/api-service
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  realtime-gateway:
    build: ./services/realtime-gateway
    ports:
      - "3001:3001"
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis

  emotion-service:
    build: ./services/emotion-service
    ports:
      - "8000:8000"

  dialogue-service:
    build: ./services/dialogue-service
    ports:
      - "8001:8001"
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}

  memory-service:
    build: ./services/memory-service
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      QDRANT_HOST: qdrant
    depends_on:
      - postgres
      - qdrant
```

## Support

For integration support:
- Documentation: `/docs`
- Examples: `/examples`
- Issues: GitHub Issues
- Contact: support@agl.com
