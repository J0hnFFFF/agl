# 🚀 Quick Start Guide

Get started with AGL in under 5 minutes! Choose the setup method that best fits your needs.

---

## 📋 Choose Your Path

| Method | Best For | Time | Requirements |
|--------|----------|------|--------------|
| [Monolith Mode](#-option-1-monolith-mode-recommended) | First-time users, quick testing | 1 min | Node.js only |
| [Microservices Mode](#-option-2-microservices-mode) | Production-like development | 5 min | Node.js, Python, Docker |

---

## 🎯 Option 1: Monolith Mode (Recommended)

**Perfect for**: Learning, prototyping, and small projects

### Prerequisites
- Node.js 20+
- That's it! No Docker, PostgreSQL, or Redis needed.

### Start in 60 Seconds

```bash
# 1. Clone repository
git clone https://github.com/J0hnFFFF/agl.git
cd agl

# 2. Start everything!
npm run dev:monolith
```

**Done!** 🎉 Service is now running at `http://localhost:3000`

### What You Get
- ✅ Complete HTTP REST API
- ✅ WebSocket real-time communication
- ✅ SQLite database (zero configuration)
- ✅ In-memory caching
- ✅ All core features (emotion, dialogue, memory)

### Quick Test

```bash
# Test emotion analysis
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{"eventType": "player.victory", "data": {"killCount": 15, "mvp": true}}'

# Test dialogue generation
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{"emotion": "excited", "persona": "cheerful", "language": "en"}'
```

**Next Steps**: See [Monolith Guide](./QUICKSTART-MONOLITH.md) for more details.

---

## 🏗️ Option 2: Microservices Mode

**Perfect for**: Production-like development, learning the architecture

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### Step 1: Clone and Configure

```bash
# Clone repository
git clone https://github.com/J0hnFFFF/agl.git
cd agl

# Create environment file
cp .env.example .env
```

### Step 2: Add API Keys

Edit `.env` and add your API keys:

```bash
# Required for LLM features
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Database (PostgreSQL recommended)
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://agl_user:agl_password_dev@localhost:5432/agl_dev
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
```

**💡 Tip**: You can also use SQLite for testing:
```bash
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
```

### Step 3: Start Infrastructure

```bash
# Start PostgreSQL, Redis, and Qdrant
npm run dev:stack

# Wait for services to be ready (~30 seconds)
docker-compose ps
```

### Step 4: Initialize Database

```bash
# Install dependencies
npm install

# Setup database
cd services/api-service
npx prisma generate
npx prisma migrate dev --name init
cd ../..
```

### Step 5: Start Services

**Core Services** - Open **5 separate terminals** and run:

```bash
# Terminal 1 - API Service (Port 3000)
npm run dev:api

# Terminal 2 - Realtime Gateway (Port 3001)
npm run dev:realtime

# Terminal 3 - Emotion Service (Port 8000)
npm run dev:emotion

# Terminal 4 - Dialogue Service (Port 8001)
npm run dev:dialogue

# Terminal 5 - Memory Service (Port 3002)
npm run dev:memory
```

**Optional Services** (Phase 4B + Phase 5) - Open additional terminals as needed:

```bash
# Terminal 6 - Voice Service (Port 8003) - Text-to-Speech
npm run dev:voice

# Terminal 7 - STT Service (Port 8004) - Speech Recognition
npm run dev:stt

# Terminal 8 - Voice Dialogue (Port 8005) - Voice Orchestration
npm run dev:voice-dialogue

# Terminal 9 - Lip Sync Service (Port 8006) - Animation
npm run dev:lipsync

# Terminal 10 - Vision Service (Port 8007) - Screenshot Analysis
npm run dev:vision

# Terminal 11 - Analytics Dashboard (Port 5000) - Monitoring
npm run dev:dashboard
```

### Services Available

| Service | URL | Purpose | Status |
|---------|-----|---------|--------|
| **API Service** | http://localhost:3000 | Main REST API | Required |
| **Realtime Gateway** | ws://localhost:3001 | WebSocket events | Required |
| **Emotion Service** | http://localhost:8000 | Emotion analysis | Required |
| **Dialogue Service** | http://localhost:8001 | Dialogue generation | Required |
| **Memory Service** | http://localhost:3002 | Memory management | Required |
| **Voice Service** | http://localhost:8003 | Text-to-speech synthesis | Optional |
| **STT Service** | http://localhost:8004 | Speech recognition | Optional |
| **Voice Dialogue** | http://localhost:8005 | Voice orchestration | Optional |
| **Lip Sync Service** | http://localhost:8006 | Lip sync animation | Optional |
| **Vision Service** | http://localhost:8007 | Screenshot analysis | Optional |
| **Dashboard** | http://localhost:5000 | Analytics & monitoring | Optional |

---

## 🎮 Your First Integration

### Create a Game

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "demo_client",
    "name": "My Awesome Game",
    "description": "An epic adventure"
  }'
```

Response:
```json
{
  "id": "game_abc123",
  "name": "My Awesome Game",
  "clientId": "demo_client"
}
```

### Create a Player

```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "game_abc123",
    "externalId": "player_001",
    "characterPersona": "cheerful"
  }'
```

### Analyze Emotion

```bash
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.victory",
    "data": {
      "killCount": 15,
      "mvp": true,
      "winStreak": 3
    }
  }'
```

Response:
```json
{
  "emotion": "excited",
  "intensity": 0.9,
  "confidence": 0.95,
  "action": "celebrate",
  "method": "rule",
  "cached": false
}
```

### Generate Dialogue

```bash
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "context": {
      "eventType": "player.victory",
      "killCount": 15
    },
    "persona": "cheerful",
    "language": "en"
  }'
```

Response:
```json
{
  "dialogue": "Incredible! You're unstoppable today!",
  "emotion": "excited",
  "source": "template",
  "persona": "cheerful",
  "language": "en",
  "cached": false
}
```

### Store a Memory

```bash
curl -X POST http://localhost:3000/api/memory/store \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player_001",
    "type": "achievement",
    "content": "First time getting 15 kills in a single match!",
    "emotion": "excited",
    "importance": 0.9
  }'
```

### Retrieve Memories

```bash
curl "http://localhost:3000/api/memory/search?playerId=player_001&limit=5"
```

### Synthesize Voice (Optional - Voice Service)

```bash
curl -X POST http://localhost:8003/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Incredible! You are unstoppable today!",
    "voice": "nova",
    "language": "en"
  }'
```

Response:
```json
{
  "audio_url": "http://localhost:8003/audio/abc123.mp3",
  "duration": 2.5,
  "cost_usd": 0.00075,
  "method": "tts",
  "cached": false
}
```

### View Analytics Dashboard (Optional)

Open your browser and navigate to:
```
http://localhost:5000
```

**Dashboard Features:**
- Real-time request monitoring (last 24 hours)
- Cost analytics and budget tracking
- Performance metrics (P50/P95/P99 latency)
- Service health status
- Cache hit rates

---

## 🎨 SDK Integration Examples

### Unity (C#)

```csharp
using AGL;
using UnityEngine;

public class CompanionManager : MonoBehaviour
{
    private AGLClient client;

    void Start()
    {
        // Initialize AGL client
        client = new AGLClient(new AGLConfig
        {
            ApiUrl = "http://localhost:3000",
            WebSocketUrl = "ws://localhost:3000"
        });

        // Listen for companion actions
        client.OnCompanionAction += HandleAction;
    }

    void OnPlayerVictory(int kills, bool isMVP)
    {
        // Send game event
        client.SendGameEvent("player.victory", new
        {
            killCount = kills,
            mvp = isMVP
        });
    }

    void HandleAction(CompanionAction action)
    {
        Debug.Log($"Emotion: {action.Emotion}");
        Debug.Log($"Dialogue: {action.Dialogue}");

        // Update UI
        dialogueText.text = action.Dialogue;
        animator.SetTrigger(action.Action);
    }
}
```

📖 [Unity SDK Documentation](./sdk/unity/README.md)

### Web / TypeScript

```typescript
import { io } from 'socket.io-client';

// Connect to AGL
const socket = io('http://localhost:3000');

// Join player room
socket.emit('join', { playerId: 'player_001' });

// Send game event
socket.emit('game_event', {
  playerId: 'player_001',
  eventType: 'player.victory',
  data: { killCount: 15, mvp: true }
});

// Listen for companion actions
socket.on('companion_action', (action) => {
  console.log('Emotion:', action.emotion);
  console.log('Dialogue:', action.dialogue);

  updateUI(action);
});
```

📖 [Web SDK Documentation](./sdk/web/README.md)

### Unreal Engine (C++)

```cpp
#include "AGLClient.h"

void AMyGameMode::BeginPlay()
{
    Super::BeginPlay();

    // Initialize AGL client
    AGLClient = NewObject<UAGLClient>();

    FAGLConfig Config;
    Config.ApiUrl = TEXT("http://localhost:3000");
    AGLClient->Initialize(Config);
}

void AMyGameMode::OnPlayerVictory(int32 KillCount, bool bIsMVP)
{
    // Create game event
    FAGLGameEvent Event;
    Event.EventType = TEXT("player.victory");
    Event.Data.Add(TEXT("killCount"), FString::FromInt(KillCount));
    Event.Data.Add(TEXT("mvp"), bIsMVP ? TEXT("true") : TEXT("false"));

    // Send event
    FOnGameEventComplete Callback;
    Callback.BindLambda([](bool bSuccess, const FAGLCompanionAction& Action)
    {
        if (bSuccess)
        {
            UE_LOG(LogTemp, Log, TEXT("Dialogue: %s"), *Action.Dialogue);
        }
    });

    AGLClient->SendGameEvent(Event, Callback);
}
```

📖 [Unreal SDK Documentation](./sdk/unreal/README.md)

---

## 🛠️ Development Tools

### View Database

**Monolith / SQLite:**
```bash
cd services/api-service
npx prisma studio
# Opens browser at http://localhost:5555
```

**Microservices / PostgreSQL:**
- Prisma Studio: `npx prisma studio` (in api-service directory)
- pgAdmin: http://localhost:5050 (login: admin@agl.dev / admin)

### View Cache (Redis)

```bash
# Redis Commander (if using microservices)
open http://localhost:8081
```

### Monitor Logs

```bash
# Monolith
npm run dev:monolith

# Microservices - check individual terminals
# Or use Docker logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Kill the process or change port in .env
API_SERVICE_PORT=3001
```

### Database Connection Failed

**SQLite:**
```bash
# Check if database file exists
ls -la services/api-service/dev.db

# Reset database
cd services/api-service
rm dev.db
npx prisma migrate dev
```

**PostgreSQL:**
```bash
# Check Docker containers
docker-compose ps

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Python Service Won't Start

```bash
# Install Python dependencies
cd services/emotion-service
pip install -r requirements.txt

cd ../dialogue-service
pip install -r requirements.txt
```

### Missing API Keys

```bash
# Check .env file
cat .env | grep API_KEY

# Add missing keys
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
echo "OPENAI_API_KEY=sk-..." >> .env
```

### High Memory Usage

```bash
# Check memory usage
docker stats  # For Docker services

# Reduce memory by using SQLite
# Edit .env:
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
```

---

## 📊 Health Checks

**Core Services:**
```bash
# API Service
curl http://localhost:3000/health

# Emotion Service
curl http://localhost:8000/health

# Dialogue Service
curl http://localhost:8001/health

# Memory Service
curl http://localhost:3002/health
```

**Optional Services (Phase 4B + Phase 5):**
```bash
# Voice Service (TTS)
curl http://localhost:8003/health

# STT Service (Speech Recognition)
curl http://localhost:8004/health

# Voice Dialogue Service
curl http://localhost:8005/health

# Lip Sync Service
curl http://localhost:8006/health

# Vision Service
curl http://localhost:8007/health

# Analytics Dashboard
curl http://localhost:5000/health
```

---

## 🎯 Next Steps

### 1. Explore Features
- Try different event types: `player.death`, `player.achievement`, `game.start`
- Test different emotions: `excited`, `sad`, `frustrated`, `confident`
- Experiment with personas: `cheerful`, `serious`, `playful`
- Try different languages: `en`, `zh`, `ja`

### 2. Integrate with Your Game
- Choose your SDK (Unity / Web / Unreal)
- Follow the integration guide
- Test with real game events

### 3. Advanced Features
- [3D Avatar SDK](./sdk/avatar/README.md) - Add animated 3D companions
- [Vision AI SDK](./sdk/vision/README.md) - Analyze game screens
- [Memory System](./docs/memory-service.md) - Build long-term relationships

### 4. Deploy to Production
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment options
- [Monitoring Setup](./docs/monitoring-setup.md) - Set up alerts and dashboards
- [Performance Tuning](./docs/performance-optimization.md) - Optimize for scale

---

## 📚 Documentation

- [Main README](./README.md) - Project overview
- [Architecture Guide](./CLAUDE.md) - Technical architecture
- [API Reference](./docs/api/README.md) - Complete API documentation
- [Testing Guide](./docs/testing.md) - Testing strategies

---

## 💬 Need Help?

- **Issues**: [GitHub Issues](https://github.com/J0hnFFFF/agl/issues)
- **Discussions**: [GitHub Discussions](https://github.com/J0hnFFFF/agl/discussions)
- **Documentation**: Browse the [docs/](./docs) directory

---

**Happy building! 🎮✨**
