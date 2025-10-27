# Memory Service

## Overview

The Memory Service is a critical component of the AGL platform that manages player memories using a three-tier architecture combining PostgreSQL for structured storage, Redis for short-term caching, and Qdrant for semantic vector search.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Memory Service                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  PostgreSQL  │  │    Qdrant    │  │ OpenAI Embed│
│  │  (Persistent)│  │   (Vector)   │  │   (1536-dim)  │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **PostgreSQL** - Stores structured memory data
   - Memory metadata (type, emotion, importance)
   - Timestamps and relationships
   - Queryable by multiple criteria

2. **Qdrant** - Vector database for semantic search
   - Stores 1536-dimensional embeddings
   - Enables similarity-based memory retrieval
   - Filtered by player ID and importance

3. **OpenAI Embeddings** - Text-to-vector conversion
   - Uses `text-embedding-3-small` model
   - Generates semantic representations
   - Enables contextual memory matching

## Features

### 1. Memory Storage
- Automatic importance scoring
- Emotion and context tracking
- Vector embedding generation
- Dual storage (SQL + vector)

### 2. Memory Retrieval
- Chronological listing
- Type-based filtering
- Semantic similarity search
- Contextual dialogue support

### 3. Memory Management
- Importance decay over time
- Automatic cleanup
- Memory statistics
- Batch operations

### 4. Importance Scoring

Memories are assigned importance scores (0.0 - 1.0) based on:

**Base Score**: 0.5

**Boost Factors**:
- Memory type (+0.2 for achievement, milestone, first_time, dramatic)
- Strong emotions (+0.15 for amazed, excited, angry, frustrated, grateful)
- Rarity (+0.15 for legendary/epic events)
- Special achievements (+0.1 for MVP, legendary status)
- Streaks (+0.1 for win/loss streak ≥ 5)

**Maximum**: 1.0 (capped)

### 5. Memory Types

| Type | Description | Base Importance |
|------|-------------|-----------------|
| `achievement` | Major accomplishments | 0.7 |
| `milestone` | Level ups, unlocks | 0.7 |
| `first_time` | New experiences | 0.7 |
| `dramatic` | Intense moments | 0.7 |
| `conversation` | Dialogue exchanges | 0.5 |
| `event` | Regular game events | 0.5 |
| `observation` | Minor notes | 0.3 |

## API Endpoints

### GET /players/:playerId/memories

Get paginated list of memories.

**Query Parameters**:
- `limit` (default: 10) - Number of memories
- `offset` (default: 0) - Pagination offset
- `type` (optional) - Filter by memory type

**Response**:
```json
[
  {
    "id": "mem-uuid",
    "playerId": "player-uuid",
    "type": "achievement",
    "content": "Reached level 50",
    "emotion": "proud",
    "importance": 0.8,
    "context": {},
    "createdAt": "2025-10-25T12:00:00Z"
  }
]
```

### POST /players/:playerId/memories

Create a new memory.

**Request**:
```json
{
  "type": "achievement",
  "content": "Defeated legendary boss",
  "emotion": "excited",
  "context": {
    "rarity": "legendary",
    "difficulty": "nightmare"
  }
}
```

**Response**: Created memory object with calculated importance.

### POST /players/:playerId/memories/search

Search memories by semantic similarity.

**Request**:
```json
{
  "query": "boss fights I won",
  "limit": 5
}
```

**Response**: Array of memories sorted by similarity score.

### POST /players/:playerId/context

Get contextual memories for dialogue generation.

**Request**:
```json
{
  "currentEvent": "player just defeated raid boss",
  "limit": 5
}
```

**Response**: Array of relevant memories (recent + similar).

### PATCH /memories/:memoryId/importance

Update memory importance score.

**Request**:
```json
{
  "importance": 0.9
}
```

### DELETE /players/:playerId/memories/cleanup

Delete old or unimportant memories.

**Query Parameters**:
- `maxAge` (optional) - Max age in days
- `minImportance` (default: 0.3) - Delete below this threshold

**Response**:
```json
{
  "success": true,
  "deletedCount": 45
}
```

## Usage Examples

### Creating a Memory After Achievement

```typescript
const response = await fetch('http://localhost:3002/players/player-123/memories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'achievement',
    content: 'Completed 100 quests milestone',
    emotion: 'proud',
    context: {
      questCount: 100,
      rarity: 'epic'
    }
  })
});

const memory = await response.json();
// memory.importance will be ~0.85 (0.5 + 0.2 + 0.15)
```

### Searching for Related Memories

```typescript
const response = await fetch('http://localhost:3002/players/player-123/memories/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'boss battles and victories',
    limit: 5
  })
});

const memories = await response.json();
// Returns semantically similar memories about boss fights
```

### Getting Context for Dialogue

```typescript
const response = await fetch('http://localhost:3002/players/player-123/context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    currentEvent: 'player just won a difficult pvp match',
    limit: 5
  })
});

const context = await response.json();
// Returns mix of recent and relevant memories for LLM
```

## Integration with Other Services

### Dialogue Service Integration

```python
# In dialogue-service, get memories for context
async def generate_dialogue_with_context(player_id: str, event: dict):
    # Get relevant memories
    context_response = requests.post(
        f'http://memory-service:3002/players/{player_id}/context',
        json={'currentEvent': event['type'], 'limit': 5}
    )
    memories = context_response.json()

    # Use memories to enhance dialogue
    llm_prompt = f"""
    Player memories:
    {format_memories(memories)}

    Current event: {event['type']}
    Generate personalized response...
    """

    return generate_llm_response(llm_prompt)
```

### Emotion Service Integration

```typescript
// After emotion analysis, create memory
const emotionResult = await analyzeEmotion(event);

if (emotionResult.intensity > 0.7) {
  // Store significant emotional moments
  await memoryService.createMemory(playerId, {
    type: 'event',
    content: `${event.type}: ${emotionResult.reasoning}`,
    emotion: emotionResult.emotion,
    context: {
      intensity: emotionResult.intensity,
      eventData: event.data
    }
  });
}
```

## Performance Considerations

### Vector Search Performance
- **Latency**: ~50-100ms for 5 results
- **Throughput**: ~100 searches/second
- **Scalability**: Horizontal scaling via Qdrant sharding

### Storage Costs
- **PostgreSQL**: ~1KB per memory
- **Qdrant**: ~6KB per vector (1536 floats)
- **Embeddings**: $0.00002 per memory (OpenAI)

### Optimization Strategies
1. **Batch Embedding Generation** - Reduce API calls
2. **Caching** - Cache recent memories in Redis
3. **Index Optimization** - Proper Qdrant indexing
4. **Memory Cleanup** - Regular pruning of low-importance memories

## Configuration

### Environment Variables

```bash
# Memory Service
MEMORY_SERVICE_PORT=3002

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agl
```

### Docker Compose

```yaml
memory-service:
  build: ./services/memory-service
  ports:
    - "3002:3002"
  environment:
    - OPENAI_API_KEY=${OPENAI_API_KEY}
    - QDRANT_HOST=qdrant
    - DATABASE_URL=${DATABASE_URL}
  depends_on:
    - qdrant
    - postgres
```

## Best Practices

### 1. Memory Creation

**Do**:
- Create memories for significant events (achievements, milestones)
- Include rich context data
- Set appropriate emotion tags

**Don't**:
- Create memories for trivial events (every button click)
- Store PII or sensitive data
- Create duplicate memories

### 2. Memory Search

**Do**:
- Use specific, descriptive queries
- Limit results to 3-7 most relevant
- Filter by importance threshold (>0.3)

**Don't**:
- Search with very generic queries
- Request too many results (>20)
- Search every frame (cache results)

### 3. Memory Cleanup

**Do**:
- Run cleanup weekly
- Keep memories above 0.3 importance
- Delete memories older than 90 days (except high importance)

**Don't**:
- Delete all memories at once
- Set minImportance too high (>0.5)
- Run cleanup during peak hours

## Troubleshooting

### Issue: Qdrant Connection Failed

**Symptoms**: Service fails to start, "Failed to initialize Qdrant"

**Solutions**:
1. Check Qdrant is running: `docker ps | grep qdrant`
2. Verify QDRANT_HOST and QDRANT_PORT
3. Check Qdrant logs: `docker logs agl-qdrant`

### Issue: Embedding Generation Slow

**Symptoms**: Memory creation takes >2 seconds

**Solutions**:
1. Check OpenAI API status
2. Implement request batching
3. Consider local embedding model
4. Add Redis caching layer

### Issue: Search Returns Irrelevant Results

**Symptoms**: Semantic search not finding related memories

**Solutions**:
1. Increase importance threshold
2. Refine search query
3. Check embedding quality
4. Verify Qdrant indexes are created

## Future Enhancements

### Phase 2.1
- [ ] Redis caching layer
- [ ] Batch embedding generation
- [ ] Memory consolidation (merge similar)
- [ ] Advanced importance decay

### Phase 3
- [ ] Multi-language embeddings
- [ ] Local embedding models
- [ ] Memory graph relationships
- [ ] Temporal memory clustering

## Monitoring

### Key Metrics

- Memory creation rate
- Search latency (p50, p95, p99)
- Embedding API usage
- Storage growth rate
- Cleanup frequency

### Health Checks

```bash
# Service health
curl http://localhost:3002/health

# Qdrant health
curl http://localhost:6333/health

# Memory count
curl http://localhost:3002/players/player-123/memories?limit=1
```

## Support

For questions about the Memory Service:
- Technical documentation: `services/memory-service/src/`
- API reference: This document
- Contact: memory-team@agl.com
