# Dialogue Service

Enhanced dialogue generation service with hybrid 90% template + 10% LLM strategy.

## Features

- **90% Template-based** - Fast, cost-free responses for common events
- **10% LLM-powered** - Context-aware responses for special moments
- **Memory Integration** - Uses player memories for personalized dialogue
- **Smart Caching** - Reduces latency and cost
- **Cost Control** - Budget management and tracking
- **3 Personas** - Cheerful, Cool, Cute character styles
- **Special Case Detection** - Automatically identifies when to use LLM

## Quick Start

### 1. Install Dependencies

```bash
cd services/dialogue-service
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example ../../.env
# Edit .env with your API keys
```

### 3. Run Service

```bash
python app.py
```

Service runs on http://localhost:8001

## API Usage

### Generate Dialogue

**Template-based (default)**:
```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "player.victory",
    "emotion": "happy",
    "persona": "cheerful"
  }'
```

**LLM-based (special cases)**:
```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "player.achievement",
    "emotion": "amazed",
    "persona": "cheerful",
    "player_id": "player-123",
    "context": {
      "rarity": "legendary",
      "is_first_time": true,
      "win_streak": 10
    }
  }'
```

### Check Health

```bash
curl http://localhost:8001/health
```

### View Statistics

```bash
curl http://localhost:8001/stats
```

## Special Case Triggers

LLM is automatically used when:

1. **Legendary/Mythic Events** - Rare high-tier items or achievements
2. **First Time** - Player's first experience with something
3. **Milestones** - Round numbers (10, 50, 100, 500, 1000, etc.)
4. **Long Streaks** - 5+ win or loss streak
5. **High Importance Memories** - Memories with importance ≥ 0.8
6. **Complex Context** - Multiple interesting factors present

## Configuration

See `.env.example` for all configuration options.

Key settings:
- `LLM_ENABLED` - Enable/disable LLM generation
- `LLM_USAGE_RATE` - Target LLM usage percentage (default: 0.10 = 10%)
- `DAILY_LLM_BUDGET` - Maximum daily spend on LLM (default: $10)
- `CACHE_TTL` - Cache duration in seconds (default: 3600 = 1 hour)

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Specific test
pytest tests/test_special_case_detector.py
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           Dialogue Service                  │
├─────────────────────────────────────────────┤
│                                             │
│  Request → Cache Check                      │
│              ↓                              │
│           Memory Fetch (if player_id)       │
│              ↓                              │
│         Special Case Detection              │
│              ↓                              │
│         /        \                          │
│    Template     LLM + Memory                │
│    (90%)        (10%)                       │
│         \        /                          │
│              ↓                              │
│          Response + Cache                   │
│                                             │
└─────────────────────────────────────────────┘
```

## Performance

- **Template latency**: < 5ms
- **LLM latency**: 300-800ms
- **Cache hit latency**: < 1ms
- **Average cost**: < $0.001 per dialogue

## Documentation

- [API Reference](../../docs/api/README.md#dialogue-service)
- [Dialogue System Guide](../../docs/dialogue-system.md)
- [Integration Guide](../../docs/integration-guide.md)

## Support

For issues or questions:
- GitHub Issues
- Documentation: `/docs`
- Email: support@agl.com
