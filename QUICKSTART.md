# AGL Platform - Quick Start Guide

**Get started with AGL in under 5 minutes!**

Choose your preferred setup method based on your needs.

---

## 🚀 Option 1: Simplified Start (Recommended)

**Perfect for: Learning, Development, Small Projects**

### What You Need
- Node.js 20+
- That's it! No Docker, PostgreSQL, or Redis required.

### Start in 1 Minute

```bash
# 1. Clone repository
git clone <repository-url>
cd agl

# 2. Start everything with one command!
npm run dev:monolith
```

**Done!** The service is running at `http://localhost:3000`

#### What's Included
- ✅ Complete HTTP API
- ✅ WebSocket realtime communication
- ✅ SQLite database (single file)
- ✅ In-memory cache
- ✅ Emotion analysis
- ✅ Dialogue generation
- ✅ Memory management

#### Test It

```bash
# Analyze emotion
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.victory",
    "data": {"killCount": 15, "mvp": true}
  }'

# Generate dialogue
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "persona": "cheerful",
    "language": "zh"
  }'
```

**Next Steps:**
- See [Monolith Quick Start](./QUICKSTART-MONOLITH.md) for detailed guide
- Read [SQLite Development Guide](./docs/development-sqlite.md)

---

## 🏗️ Option 2: Full Microservices (Advanced)

**Perfect for: Production-like Development, Learning Architecture**

### What You Need
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### Start in 5 Minutes

#### 1. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd agl

# Create environment file
cp .env.example .env
```

#### 2. Choose Your Database

**Option A: SQLite (Simpler)**

Edit `.env`:
```bash
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
# No Docker needed!
```

**Option B: PostgreSQL (Production-like)**

```bash
# Start databases
npm run dev:stack

# Edit .env
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://agl_user:agl_password_dev@localhost:5432/agl_dev
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
```

#### 3. Initialize Database

```bash
cd services/api-service
npx prisma generate
npx prisma migrate dev --name init
cd ../..
```

#### 4. Start Services

**For SQLite:**
```bash
# Terminal 1 - API Service
npm run dev:api

# Terminal 2 - Realtime Gateway
npm run dev:realtime

# Terminal 3 - Emotion Service
npm run dev:emotion

# Terminal 4 - Dialogue Service
npm run dev:dialogue

# Terminal 5 - Memory Service
npm run dev:memory
```

**For PostgreSQL:**
Same as above, but Docker containers will provide databases.

#### Services Available
- API Service: `http://localhost:3000`
- Realtime Gateway: `ws://localhost:3001`
- Emotion Service: `http://localhost:8000`
- Dialogue Service: `http://localhost:8001`
- Memory Service: `http://localhost:3002`

---

## 📚 API Examples

### Create a Game

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client_123",
    "name": "My Awesome Game",
    "description": "An epic battle royale"
  }'
```

### Create a Player

```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "game_123",
    "externalId": "player_abc",
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
      "mvp": true
    }
  }'
```

**Response:**
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
    "context": {},
    "persona": "cheerful",
    "language": "zh"
  }'
```

**Response:**
```json
{
  "dialogue": "太棒了！你真厉害！",
  "emotion": "excited",
  "source": "template",
  "persona": "cheerful",
  "cached": false
}
```

### Store Memory

```bash
curl -X POST http://localhost:3000/api/memory/store \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "player_123",
    "type": "achievement",
    "content": "首次获得15连杀",
    "emotion": "excited",
    "importance": 0.9
  }'
```

### Search Memories

```bash
curl "http://localhost:3000/api/memory/search?playerId=player_123&limit=10"
```

---

## 🎮 SDK Integration

### Unity (C#)

```csharp
using AGL;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    private AGLClient aglClient;

    void Start()
    {
        aglClient = new AGLClient(new AGLConfig
        {
            ApiUrl = "http://localhost:3000",
            WebSocketUrl = "ws://localhost:3000"
        });

        // Listen for companion actions
        aglClient.OnCompanionAction += HandleCompanionAction;
    }

    void OnPlayerVictory(int killCount, bool isMVP)
    {
        aglClient.SendGameEvent("player.victory", new
        {
            killCount = killCount,
            mvp = isMVP
        });
    }

    void HandleCompanionAction(CompanionAction action)
    {
        Debug.Log($"Emotion: {action.Emotion}");
        Debug.Log($"Dialogue: {action.Dialogue}");

        // Update UI
        dialogueText.text = action.Dialogue;
        animator.SetTrigger(action.Action);
    }
}
```

**See:** [Unity SDK Guide](./sdk/unity/README.md)

---

### Web / TypeScript

```typescript
import { io } from 'socket.io-client';

// Connect to WebSocket
const socket = io('http://localhost:3000');

// Join player room
socket.emit('join', { playerId: 'player_123' });

// Send game event
socket.emit('game_event', {
  playerId: 'player_123',
  eventType: 'player.victory',
  data: { killCount: 15, mvp: true },
  context: {}
});

// Listen for companion actions
socket.on('companion_action', (action) => {
  console.log('Emotion:', action.emotion);
  console.log('Dialogue:', action.dialogue);

  // Update UI
  updateDialogue(action.dialogue);
  playAnimation(action.action);
});
```

**See:** [Web SDK Guide](./sdk/web/README.md)

---

### Unreal Engine (C++)

```cpp
// Initialize in GameMode or GameInstance
UAGLClient* AGLClient = NewObject<UAGLClient>();

FAGLConfig Config;
Config.ApiUrl = TEXT("http://localhost:3000");
Config.WebSocketUrl = TEXT("ws://localhost:3000");

AGLClient->Initialize(Config);
AGLClient->SetPlayerId(TEXT("player_123"));

// Send game event
FAGLGameEvent Event;
Event.EventType = TEXT("player.victory");
Event.Data.Add(TEXT("killCount"), TEXT("15"));
Event.Data.Add(TEXT("mvp"), TEXT("true"));

FOnGameEventComplete OnComplete;
OnComplete.BindLambda([](bool bSuccess, const FAGLCompanionAction& Action)
{
    if (bSuccess)
    {
        UE_LOG(LogTemp, Log, TEXT("Emotion: %s"), *Action.Emotion);
        UE_LOG(LogTemp, Log, TEXT("Dialogue: %s"), *Action.Dialogue);
    }
});

AGLClient->SendGameEvent(Event, OnComplete);
```

**See:** [Unreal SDK Guide](./sdk/unreal/README.md)

---

## 🎨 3D Avatar Integration

### Use Avatar SDK

```tsx
import { AvatarController } from '@agl/avatar';
import { io } from 'socket.io-client';
import { useState, useEffect } from 'react';

function Companion() {
  const [emotion, setEmotion] = useState('neutral');
  const [dialogue, setDialogue] = useState('');

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('companion_action', (action) => {
      setEmotion(action.emotion);
      setDialogue(action.dialogue);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: {
            type: 'gltf',
            url: '/models/companion.gltf'
          }
        },
        initialEmotion: emotion,
        enableAnimations: true
      }}
      dialogueText={dialogue}
      bubbleConfig={{
        enabled: true,
        position: 'top',
        maxWidth: 300
      }}
    />
  );
}
```

**See:** [Avatar SDK Guide](./sdk/avatar/README.md)

---

## 👁️ Vision AI Integration

### Analyze Game Screen

```typescript
import { ScreenCapture, VisionAnalyzer, GameStateRecognizer } from '@agl/vision';

// Setup screen capture
const capture = new ScreenCapture({
  source: 'canvas',
  target: '#game-canvas',
  format: 'jpeg',
  quality: 0.8
});

// Setup vision analyzer
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: process.env.OPENAI_API_KEY
});

// Setup game state recognizer
const recognizer = new GameStateRecognizer(analyzer);

// Analyze periodically
setInterval(async () => {
  const screenshot = await capture.capture();
  const gameState = await recognizer.recognize(screenshot);

  if (gameState.category === 'combat') {
    // React to combat state
    emotionService.setEmotion('confident', 0.8);
  }
}, 3000);
```

**See:** [Vision SDK Guide](./sdk/vision/README.md)

---

## 🗄️ Database Management

### View Database

**SQLite (Monolith/SQLite mode):**
```bash
# Using Prisma Studio
cd services/api-service
npx prisma studio

# Using sqlite3 CLI
sqlite3 services/api-service/dev.db
.tables
SELECT * FROM players;
```

**PostgreSQL (Full stack):**
```bash
# Using Prisma Studio
cd services/api-service
npx prisma studio

# Using psql
docker-compose exec postgres psql -U agl_user -d agl_dev
\dt
SELECT * FROM players;
```

### Backup Database

**SQLite:**
```bash
cp services/api-service/dev.db backup/dev.db.$(date +%Y%m%d)
```

**PostgreSQL:**
```bash
docker-compose exec postgres pg_dump -U agl_user agl_dev > backup/agl.sql
```

---

## 🐛 Troubleshooting

### Monolith won't start

```bash
# Check if port is in use
netstat -an | grep 3000

# Check logs
cd services/monolith
npm run dev  # Watch for errors
```

### Database connection issues

**SQLite:**
```bash
# Check if file exists
ls -la services/api-service/dev.db

# Recreate database
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

### High memory usage

```bash
# Check process memory
npm run dev:monolith &
ps aux | grep node

# For Docker
docker stats
```

### Slow responses

- Check cache hit rate: `curl http://localhost:3000/api/emotion/stats`
- Enable debug logging: `LOG_LEVEL=debug npm run dev:monolith`
- Monitor database: `npx prisma studio`

---

## 📊 Deployment Options

Ready to deploy? Choose your deployment strategy:

| Deployment | Best For | Cost | Setup Time |
|-----------|----------|------|-----------|
| [Monolith on VPS](./docs/simplified-deployment.md) | Small apps | $5/mo | 10 min |
| [Railway](./docs/simplified-deployment.md) | Quick deploy | $20/mo | 5 min |
| [Serverless](./docs/simplified-deployment.md) | Auto-scale | $50/mo | 15 min |
| [Kubernetes](./docs/architecture/deployment.md) | Enterprise | $200/mo | 1 hour |

**See:** [Deployment Options Guide](./DEPLOYMENT-OPTIONS.md)

---

## 📚 Documentation

### Getting Started
- [Monolith Quick Start](./QUICKSTART-MONOLITH.md) - Fastest way to start
- [SQLite Development](./docs/development-sqlite.md) - Local development guide
- [Database Comparison](./docs/database-comparison.md) - SQLite vs PostgreSQL

### Platform Docs
- [Architecture Overview](./CLAUDE.md) - System design
- [API Documentation](./docs/api/README.md) - REST API reference
- [Deployment Guide](./docs/architecture/deployment.md) - Production deployment
- [Monitoring Setup](./docs/monitoring-setup.md) - Metrics & alerts

### SDK Guides
- [Unity SDK](./sdk/unity/README.md) - C# integration
- [Web SDK](./sdk/web/README.md) - TypeScript/JavaScript
- [Unreal SDK](./sdk/unreal/README.md) - C++ integration
- [Avatar SDK](./sdk/avatar/README.md) - 3D rendering engine
- [Vision SDK](./sdk/vision/README.md) - AI screen analysis

### Service Guides
- [Emotion System](./docs/emotion-system.md) - Emotion detection
- [Dialogue System](./docs/dialogue-system.md) - Dialogue generation
- [Memory Service](./docs/memory-service.md) - Memory management
- [Analytics Dashboard](./docs/analytics-dashboard.md) - Usage tracking

---

## 🎯 Next Steps

### 1. Learn the Basics
- Try the API examples above
- Explore emotion analysis and dialogue generation
- Understand memory storage

### 2. Integrate with Your Game
- Choose your SDK (Unity/Web/Unreal)
- Follow the integration guide
- Test with your game events

### 3. Add Advanced Features
- Integrate Avatar SDK for 3D companions
- Add Vision SDK for screen analysis
- Customize dialogue templates

### 4. Deploy to Production
- Choose deployment option
- Configure production environment
- Set up monitoring

---

## 💬 Support

- **Documentation**: Browse `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/yourusername/agl/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/agl/discussions)

---

**You're all set! Start building amazing AI game companions! 🎮✨**
