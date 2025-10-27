# Memory Service

Vector-based memory management service with semantic search capabilities.

## Status: ✅ Complete (Phase 2)

The Memory Service manages player memories using PostgreSQL + Qdrant hybrid storage with OpenAI embeddings for semantic search.

## Features

### Three-Tier Memory System

1. **PostgreSQL** - Persistent structured storage
   - Memory metadata (type, emotion, importance)
   - Timestamps and relationships
   - Queryable by multiple criteria

2. **Qdrant** - Vector database for semantic search
   - 1536-dimensional embeddings
   - Similarity-based retrieval
   - Filtered by player ID and importance

3. **OpenAI Embeddings** - Semantic representation
   - Uses `text-embedding-3-small` model
   - Enables contextual memory matching
   - Automatic generation on memory creation

### Memory Types

- `achievement` - Major accomplishments (base importance: 0.7)
- `milestone` - Level ups, unlocks (0.7)
- `first_time` - New experiences (0.7)
- `dramatic` - Intense moments (0.7)
- `conversation` - Dialogue exchanges (0.5)
- `event` - Regular game events (0.5)
- `observation` - Minor notes (0.3)

### Automatic Importance Scoring

Memories are assigned importance scores (0.0 - 1.0) based on:

- **Base Score**: 0.5
- **Type Boost**: +0.2 for achievement/milestone/first_time/dramatic
- **Emotion Boost**: +0.15 for strong emotions (amazed, excited, angry, etc.)
- **Rarity Boost**: +0.15 for legendary/epic events
- **Special Context**: +0.1 for MVP, legendary status
- **Streak Boost**: +0.1 for win/loss streak ≥ 5

Maximum importance: 1.0 (capped)

## API Endpoints

### GET /players/:playerId/memories

Get paginated list of memories.

**Query Parameters**:
- `limit` (default: 10) - Number of memories
- `offset` (default: 0) - Pagination offset
- `type` (optional) - Filter by memory type

**Example**:
```bash
curl http://localhost:3002/players/player-123/memories?limit=10&type=achievement
```

### POST /players/:playerId/memories

Create a new memory.

**Example**:
```bash
curl -X POST http://localhost:3002/players/player-123/memories \
  -H "Content-Type: application/json" \
  -d '{
    "type": "achievement",
    "content": "Defeated legendary boss",
    "emotion": "excited",
    "context": {
      "rarity": "legendary",
      "difficulty": "nightmare"
    }
  }'
```

### POST /players/:playerId/memories/search

Search memories by semantic similarity.

**Example**:
```bash
curl -X POST http://localhost:3002/players/player-123/memories/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "boss fights I won",
    "limit": 5
  }'
```

### POST /players/:playerId/context

Get contextual memories for dialogue generation.

**Example**:
```bash
curl -X POST http://localhost:3002/players/player-123/context \
  -H "Content-Type: application/json" \
  -d '{
    "currentEvent": "player just defeated raid boss",
    "limit": 5
  }'
```

### PATCH /memories/:memoryId/importance

Update memory importance score.

**Example**:
```bash
curl -X PATCH http://localhost:3002/memories/mem-uuid/importance \
  -H "Content-Type: application/json" \
  -d '{"importance": 0.9}'
```

### DELETE /players/:playerId/memories/cleanup

Delete old or unimportant memories.

**Query Parameters**:
- `maxAge` (optional) - Max age in days
- `minImportance` (default: 0.3) - Delete below this threshold

**Example**:
```bash
curl -X DELETE "http://localhost:3002/players/player-123/memories/cleanup?minImportance=0.3"
```

### GET /health

Health check endpoint.

**Example**:
```bash
curl http://localhost:3002/health
```

## Quick Start

### 1. Install Dependencies

```bash
cd services/memory-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example ../../.env
# Edit .env and add:
# - DATABASE_URL
# - OPENAI_API_KEY
# - QDRANT_HOST
# - QDRANT_PORT
```

### 3. Start Dependencies

```bash
# Start PostgreSQL, Qdrant
npm run dev:stack
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. Run Service

```bash
npm run dev
```

Service runs on http://localhost:3002

## Integration with Other Services

### Dialogue Service Integration

```python
# Get memories for personalized dialogue
import requests

response = requests.post(
    'http://localhost:3002/players/player-123/context',
    json={
        'currentEvent': 'player.victory',
        'limit': 5
    }
)
memories = response.json()

# Use memories in LLM prompt
prompt = f"Player memories: {format_memories(memories)}"
```

### After Emotion Analysis

```typescript
// Store significant emotional moments
if (emotionResult.intensity > 0.7) {
  await memoryService.createMemory(playerId, {
    type: 'event',
    content: `${event.type}: ${emotionResult.reasoning}`,
    emotion: emotionResult.emotion,
    context: { intensity: emotionResult.intensity }
  });
}
```

## Performance

- **Vector Search**: ~50-100ms for 5 results
- **Memory Creation**: ~200ms (including embedding)
- **Throughput**: ~100 searches/second
- **Storage**: ~1KB/memory (PostgreSQL) + ~6KB/vector (Qdrant)
- **Embedding Cost**: $0.00002 per memory (OpenAI)

## Testing

### Run Tests

```bash
npm test
```

### Test Coverage

- Unit tests for all services (Embedding, Qdrant, Memory)
- API integration tests
- 70%+ code coverage
- Test utilities and helpers

## Configuration

### Environment Variables

```bash
# Service
MEMORY_SERVICE_PORT=3002

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agl

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

## Best Practices

### Memory Creation

**Do**:
- Create memories for significant events (achievements, milestones)
- Include rich context data
- Set appropriate emotion tags

**Don't**:
- Create memories for trivial events
- Store PII or sensitive data
- Create duplicate memories

### Memory Search

**Do**:
- Use specific, descriptive queries
- Limit results to 3-7 most relevant
- Filter by importance threshold (>0.3)

**Don't**:
- Search with very generic queries
- Request too many results (>20)
- Search every frame (cache results)

### Memory Cleanup

**Do**:
- Run cleanup weekly
- Keep memories above 0.3 importance
- Delete memories older than 90 days (except high importance)

**Don't**:
- Delete all memories at once
- Set minImportance too high (>0.5)
- Run cleanup during peak hours

## Troubleshooting

### Qdrant Connection Failed

**Solutions**:
1. Check Qdrant is running: `docker ps | grep qdrant`
2. Verify QDRANT_HOST and QDRANT_PORT
3. Check Qdrant logs: `docker logs agl-qdrant`

### Embedding Generation Slow

**Solutions**:
1. Check OpenAI API status
2. Implement request batching
3. Consider local embedding model
4. Add Redis caching layer

### Search Returns Irrelevant Results

**Solutions**:
1. Increase importance threshold
2. Refine search query
3. Check embedding quality
4. Verify Qdrant indexes are created

## Documentation

- [Memory Service Guide](../../docs/memory-service.md) - Detailed documentation
- [API Reference](../../docs/api/) - REST API reference
- [Integration Guide](../../docs/integration-guide.md) - Service integration patterns

## Architecture

See [Memory Service Guide](../../docs/memory-service.md) for detailed architecture documentation.

## Future Enhancements

### Phase 2.1
- Redis caching layer
- Batch embedding generation
- Memory consolidation (merge similar)
- Advanced importance decay

### Phase 3
- Multi-language embeddings
- Local embedding models
- Memory graph relationships
- Temporal memory clustering
