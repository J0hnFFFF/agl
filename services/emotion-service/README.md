# Emotion Service

Enhanced emotion detection service with hybrid rule-based + ML classification.

## Features

- **Rule-Based Analysis** (Primary) - Fast, free, reliable emotion detection
- **ML Classification** (Fallback) - Claude API for uncertain cases
- **Hybrid Strategy** - Use ML when rule confidence < 0.8
- **Smart Caching** - Reduces latency and cost
- **Cost Control** - Budget management and tracking
- **14 Emotions** - Comprehensive emotion coverage
- **25+ Event Types** - Supports all major game events

## Quick Start

### 1. Install Dependencies

```bash
cd services/emotion-service
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example ../../.env
# Edit .env and add ANTHROPIC_API_KEY
```

### 3. Run Service

```bash
python app.py
```

Service runs on http://localhost:8000

## API Usage

### Analyze Emotion

**Rule-based (default)**:
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "type": "player.victory",
    "data": {"mvp": true},
    "context": {"playerHealth": 75}
  }'
```

**Response**:
```json
{
  "emotion": "happy",
  "intensity": 1.0,
  "action": "smile",
  "confidence": 0.95,
  "reasoning": "Player won the match (MVP!)",
  "method": "rule",
  "cost": 0.0,
  "cache_hit": false,
  "latency_ms": 2.5
}
```

### Health Check

```bash
curl http://localhost:8000/health
```

### View Statistics

```bash
curl http://localhost:8000/stats
```

## Hybrid Detection Strategy

The service automatically decides between rule-based and ML detection:

### Rule-Based (Primary)
- Fast (< 5ms)
- Free ($0)
- High confidence (≥0.8)
- Covers 25+ event types

### ML Classification (Fallback)
- Used when rule confidence < 0.8
- Claude API (Haiku model)
- Higher accuracy
- Cost: ~$0.0003 per request
- Latency: 300-800ms

### When ML is Used
- Rule confidence below threshold (0.8)
- Unusual event combinations
- Complex context scenarios
- Budget and rate limits enforced

## Configuration

See `.env.example` for all options.

Key settings:
- `ML_ENABLED` - Enable/disable ML classification
- `ML_CONFIDENCE_THRESHOLD` - Threshold for ML trigger (default: 0.8)
- `DAILY_ML_BUDGET` - Maximum daily spend on ML (default: $5)
- `ML_USAGE_RATE_TARGET` - Target ML usage percentage (default: 15%)
- `CACHE_TTL` - Cache duration in seconds (default: 1800 = 30min)

## Supported Emotions

- **Positive**: happy, excited, amazed, proud, satisfied, cheerful, grateful
- **Negative**: sad, disappointed, frustrated, angry, worried
- **Neutral**: tired, neutral

## Supported Event Types

### Combat
- player.victory, player.defeat
- player.kill, player.death, player.assist

### Achievements
- player.achievement (with rarity levels)

### Progression
- player.levelup

### Social
- player.teamvictory, player.teamdefeat
- player.revived, player.savedally
- player.betrayed

### Loot
- player.lootlegendary, player.lootepic, player.loot

### Quests
- player.questcomplete, player.questfailed

### Skills
- player.skillcombo

### Session
- player.sessionstart, player.sessionend

### Negative Events
- player.timeout, player.outofresources

## Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=src --cov-report=html

# Specific test file
pytest tests/test_rule_analyzer.py
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           Emotion Service                   │
├─────────────────────────────────────────────┤
│                                             │
│  Request → Cache Check                      │
│              ↓                              │
│         Rule Analysis                       │
│              ↓                              │
│    Confidence < 0.8?                        │
│         /        \                          │
│       No        Yes                         │
│        ↓          ↓                         │
│   Use Rule   Check Budget                   │
│                 ↓                           │
│            ML Classification                │
│                 ↓                           │
│          Response + Cache                   │
│                                             │
└─────────────────────────────────────────────┘
```

## Performance

- **Rule-based latency**: < 5ms
- **ML latency**: 300-800ms
- **Cache hit latency**: < 1ms
- **Average cost**: < $0.0001 per request
- **Daily budget**: $5.00 (supports ~16,000 ML requests)

## Documentation

- [Emotion System Guide](../../docs/emotion-system.md)
- [Integration Guide](../../docs/integration-guide.md)
- [API Reference](../../docs/api/README.md#emotion-service)

## Support

For issues or questions:
- GitHub Issues
- Documentation: `/docs`
- Email: support@agl.com
