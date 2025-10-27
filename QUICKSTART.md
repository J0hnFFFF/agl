# AGL Platform - Quick Start Guide

Get started with the AGL (AI Game Companion Engine) platform in 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development)
- API keys: Anthropic (Claude) and OpenAI

## 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/yourusername/agl.git
cd agl

# Create environment file
cp .env.example .env
```

## 2. Configure Environment

Edit `.env` file:

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here

# Database
DATABASE_URL=postgresql://agl_user:password@localhost:5432/agl_dev

# Service URLs (default for local development)
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
```

## 3. Start Services

```bash
# Start all services with Docker Compose
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

Services will be available at:
- API Service: http://localhost:3000
- Realtime Gateway: http://localhost:3001
- Emotion Service: http://localhost:8000
- Dialogue Service: http://localhost:8001
- Memory Service: http://localhost:3002
- Grafana: http://localhost:3003

## 4. Initialize Database

```bash
# Run migrations
docker-compose exec api-service npm run migrate:dev

# (Optional) Seed test data
docker-compose exec api-service npm run seed
```

## 5. Test the API

### Create a Game

```bash
curl -X POST http://localhost:3000/games \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key" \
  -d '{
    "name": "My Awesome Game",
    "description": "A great game"
  }'
```

### Create a Player

```bash
curl -X POST http://localhost:3000/players \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-api-key" \
  -d '{
    "externalId": "player-123",
    "displayName": "TestPlayer",
    "gameId": "your-game-id"
  }'
```

### Analyze Emotion

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "type": "player.victory",
    "data": {
      "mvp": true,
      "winStreak": 5
    }
  }'
```

Response:
```json
{
  "emotion": "excited",
  "intensity": 0.85,
  "action": "celebrate",
  "confidence": 0.95,
  "method": "rule",
  "cost": 0.0,
  "latency_ms": 5
}
```

### Generate Dialogue

```bash
curl -X POST http://localhost:8001/generate \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "player.victory",
    "emotion": "excited",
    "persona": "cheerful",
    "language": "en"
  }'
```

Response:
```json
{
  "dialogue": "That was AMAZING!! Total domination!",
  "method": "template",
  "cost": 0.0,
  "latency_ms": 3
}
```

### Create Memory

```bash
curl -X POST http://localhost:3002/players/player-123/memories \
  -H "Content-Type: application/json" \
  -d '{
    "type": "achievement",
    "content": "Won 5 matches in a row as MVP",
    "emotion": "excited",
    "importance": 9
  }'
```

## 6. Integrate with Your Game

Choose your SDK based on your game engine:

### Unity (C#)

```csharp
using AGL;

var client = new AGLClient(new AGLConfig {
    ApiKey = "your-api-key",
    ApiBaseUrl = "http://localhost:3000",
    EmotionServiceUrl = "http://localhost:8000",
    DialogueServiceUrl = "http://localhost:8001",
    MemoryServiceUrl = "http://localhost:3002"
});

client.SetPlayerId("player-123");

// Analyze emotion
var emotionResult = await client.Emotion.AnalyzeAsync(new EmotionRequest {
    Type = EventType.Victory,
    Data = new Dictionary<string, string> {
        { "mvp", "true" },
        { "winStreak", "5" }
    }
});

Debug.Log($"Emotion: {emotionResult.Emotion}, Intensity: {emotionResult.Intensity}");

// Generate dialogue (with English language support)
var dialogueResult = await client.Dialogue.GenerateAsync(
    new DialogueRequest(EventType.Victory, emotionResult.Emotion, Persona.Cheerful, "en")
);

Debug.Log($"Companion says: {dialogueResult.Dialogue}");
```

See [Unity SDK Guide](./sdk/unity/README.md) for details.

### Web / Node.js (TypeScript)

```typescript
import AGLClient from '@agl/web-sdk';

const agl = new AGLClient({
    apiKey: 'your-api-key',
    apiBaseUrl: 'http://localhost:3000',
    emotionServiceUrl: 'http://localhost:8000',
    dialogueServiceUrl: 'http://localhost:8001',
    memoryServiceUrl: 'http://localhost:3002'
});

agl.setPlayerId('player-123');

// Analyze emotion
const emotion = await agl.emotion.analyze({
    type: 'player.victory',
    data: { mvp: true, winStreak: 5 }
});

console.log(`Emotion: ${emotion.emotion}, Intensity: ${emotion.intensity}`);

// Generate dialogue
const dialogue = await agl.dialogue.generate({
    event_type: 'player.victory',
    emotion: emotion.emotion,
    persona: 'cheerful',
    language: 'en'
});

console.log(`Companion says: ${dialogue.dialogue}`);
```

See [Web SDK Guide](./sdk/web/README.md) for details.

### Unreal Engine (C++)

```cpp
// Initialize in GameMode or GameInstance
UAGLClient* AGLClient = NewObject<UAGLClient>();

FAGLConfig Config;
Config.ApiKey = TEXT("your-api-key");
Config.ApiBaseUrl = TEXT("http://localhost:3000");
Config.EmotionServiceUrl = TEXT("http://localhost:8000");
Config.DialogueServiceUrl = TEXT("http://localhost:8001");
Config.MemoryServiceUrl = TEXT("http://localhost:3002");

AGLClient->Initialize(Config);
AGLClient->SetPlayerId(TEXT("player-123"));

// Analyze emotion
FAGLEmotionRequest EmotionRequest = UAGLEmotionService::CreateVictoryRequest(true, 5);

FOnEmotionAnalysisComplete OnEmotionComplete;
OnEmotionComplete.BindLambda([this](bool bSuccess, const FAGLEmotionResponse& Response)
{
    if (bSuccess)
    {
        UE_LOG(LogTemp, Log, TEXT("Emotion: %s, Intensity: %f"),
            *UEnum::GetValueAsString(Response.Emotion),
            Response.Intensity);

        // Generate dialogue with English language
        FAGLDialogueRequest DialogueRequest;
        DialogueRequest.EventType = EAGLEventType::Victory;
        DialogueRequest.Emotion = Response.Emotion;
        DialogueRequest.Persona = EAGLPersona::Cheerful;
        DialogueRequest.Language = TEXT("en");

        FOnDialogueGenerationComplete OnDialogueComplete;
        OnDialogueComplete.BindLambda([](bool bSuccess, const FAGLDialogueResponse& DialogueResponse)
        {
            if (bSuccess)
            {
                UE_LOG(LogTemp, Log, TEXT("Companion says: %s"), *DialogueResponse.Dialogue);
            }
        });

        AGLClient->GetDialogueService()->GenerateDialogue(DialogueRequest, OnDialogueComplete);
    }
});

AGLClient->GetEmotionService()->AnalyzeEmotion(EmotionRequest, OnEmotionComplete);
```

See [Unreal SDK Guide](./sdk/unreal/README.md) for details.

## 7. Monitor Your System

Access Grafana dashboard:
- URL: http://localhost:3003
- Username: admin
- Password: admin (change on first login)

Key dashboards:
- **Overview**: Request rates, error rates, latency
- **Cost Monitoring**: Daily AI costs, budget tracking
- **Service Health**: Service status, performance metrics

## Common Commands

```bash
# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Run tests
docker-compose exec api-service npm test
docker-compose exec emotion-service pytest
docker-compose exec dialogue-service pytest

# Check database
docker-compose exec postgres psql -U agl_user -d agl_dev
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check if ports are already in use
netstat -an | grep LISTEN | grep -E '3000|3001|8000|8001|3002'
```

### Database connection issues
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database
docker-compose exec postgres psql -U agl_user -d agl_dev -c '\dt'
```

### High costs (exceeding budget)
- Check Grafana cost dashboard
- Review ML/LLM usage rates
- Adjust `DAILY_BUDGET_USD` in `.env`
- Increase cache TTL for more reuse

### Slow responses
- Check Redis cache hit rate in Grafana
- Verify database indexes are created
- Check service logs for errors
- Monitor resource usage: `docker stats`

## Next Steps

1. **Read Documentation**
   - [Architecture Guide](./CLAUDE.md)
   - [API Documentation](./docs/api/)
   - [Service Guides](./docs/)

2. **Explore SDKs**
   - [Unity SDK](./sdk/unity/README.md)
   - [Web SDK](./sdk/web/README.md)
   - [Unreal SDK](./sdk/unreal/README.md)

3. **Production Deployment**
   - [Deployment Guide](./docs/deployment-guide.md)
   - [Monitoring Setup](./docs/monitoring-setup.md)
   - [Performance Optimization](./docs/performance-optimization.md)

4. **Join Community**
   - GitHub Issues: Report bugs or request features
   - Discussions: Ask questions, share ideas
   - Documentation: Contribute improvements

## Support

- **Documentation**: See `docs/` directory
- **Issues**: https://github.com/yourusername/agl/issues
- **Email**: support@yourdomain.com

## License

Proprietary - All Rights Reserved

---

**Congratulations!** You're now ready to build amazing AI-powered game companions with AGL! 🎮✨
