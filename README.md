<div align="center">

# 🎮 AGL - AI Game Companion Engine

**Emotional, intelligent AI companions that bring your games to life**

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-%3E%3D3.11-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.3.0-blue.svg)](https://www.typescriptlang.org/)

[Features](#-features) • [Quick Start](#-quick-start) • [SDKs](#-sdks) • [Documentation](#-documentation) • [Architecture](#-architecture)

</div>

---

## 🌟 What is AGL?

AGL (AI Game Companion Engine) is a cloud-based SaaS platform that provides game developers with **emotionally-aware AI companion characters**. Unlike traditional NPCs, AGL companions:

- 🎭 **React emotionally** to game events in real-time
- 💬 **Generate contextual dialogue** using hybrid template + LLM system
- 🧠 **Remember interactions** with semantic memory powered by vector search
- 🌍 **Support multiple languages** (English, Chinese, Japanese)
- 🎨 **Animate in 3D** with emotion-driven expressions and actions

**Perfect for**: Game studios, indie developers, and anyone building engaging game experiences.

---

## ✨ Features

### Core Capabilities

| Feature | Description | Technology |
|---------|-------------|------------|
| 🎭 **Emotion Recognition** | Hybrid rule-based + ML system for accurate emotion detection | Claude API + Rule Engine |
| 💬 **AI Dialogue** | 90/10 hybrid strategy (templates + LLM) for cost-effective generation | Anthropic Claude Haiku |
| 🧠 **Memory System** | Three-tier memory with semantic search | PostgreSQL + Qdrant + Redis |
| 🌐 **Multi-language** | English, Chinese, Japanese dialogue support | i18n Template System |
| 🎨 **3D Avatars** | Emotion-driven animations with GLTF/VRM/Live2D | Three.js + React |
| 👁️ **Vision AI** | Game screen understanding for context awareness | GPT-4V / Claude Vision |
| 📊 **Analytics** | Usage tracking, cost monitoring, emotion analytics | Built-in Dashboard |

### Developer Experience

- ✅ **Multiple SDKs**: Unity (C#), Unreal (C++), Web (TypeScript)
- ✅ **Easy Integration**: Simple API with comprehensive documentation
- ✅ **Flexible Deployment**: Monolith for dev, microservices for production
- ✅ **Cost Optimized**: Intelligent caching and template fallback
- ✅ **Production Ready**: Complete monitoring, testing, and deployment guides

---

## 🚀 Quick Start

### Option 1: Monolith Mode (Recommended for Getting Started)

**Start in 60 seconds - no Docker required!**

```bash
# Clone and run
git clone https://github.com/J0hnFFFF/agl.git
cd agl
npm run dev:monolith
```

Service runs at `http://localhost:3000` ✨

### Option 2: Microservices Mode (Production-like)

```bash
# 1. Clone repository
git clone https://github.com/J0hnFFFF/agl.git
cd agl

# 2. Setup environment
cp .env.example .env
# Edit .env and add your API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY)

# 3. Start infrastructure
npm run dev:stack

# 4. Install dependencies
npm install
cd services/api-service && npx prisma generate && npx prisma migrate dev

# 5. Start services (in separate terminals)
npm run dev:api       # API Service (port 3000)
npm run dev:realtime  # Realtime Gateway (port 3001)
npm run dev:emotion   # Emotion Service (port 8000)
npm run dev:dialogue  # Dialogue Service (port 8001)
npm run dev:memory    # Memory Service (port 3002)
```

### Try It Out

```bash
# Analyze player emotion
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.victory",
    "data": {"killCount": 15, "mvp": true}
  }'

# Generate companion dialogue
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "persona": "cheerful",
    "language": "en"
  }'
```

📚 **Full Guide**: See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

---

## 🎮 SDKs

### Unity (C#)

```csharp
using AGL;

// Initialize client
var client = new AGLClient(new AGLConfig {
    ApiUrl = "http://localhost:3000"
});

// Send game event
await client.SendGameEvent("player.victory", new {
    killCount = 15,
    mvp = true
});

// Listen for companion reactions
client.OnCompanionAction += (action) => {
    Debug.Log($"Emotion: {action.Emotion}");
    Debug.Log($"Dialogue: {action.Dialogue}");
    PlayAnimation(action.Action);
};
```

📖 [Unity SDK Documentation](./sdk/unity/README.md)

### Web / TypeScript

```typescript
import { AGLClient } from '@agl/web';

const client = new AGLClient({
  apiUrl: 'http://localhost:3000'
});

// Send event and get response
const response = await client.sendGameEvent('player.victory', {
  killCount: 15,
  mvp: true
});

console.log(response.emotion);   // "excited"
console.log(response.dialogue);  // "Incredible! You're unstoppable!"
```

📖 [Web SDK Documentation](./sdk/web/README.md)

### Unreal Engine (C++)

```cpp
// Initialize client
UAGLClient* Client = NewObject<UAGLClient>();
Client->Initialize(Config);

// Send game event
FAGLGameEvent Event;
Event.EventType = TEXT("player.victory");
Event.Data.Add(TEXT("killCount"), TEXT("15"));

Client->SendGameEvent(Event, [](bool Success, const FAGLCompanionAction& Action) {
    UE_LOG(LogTemp, Log, TEXT("Dialogue: %s"), *Action.Dialogue);
});
```

📖 [Unreal SDK Documentation](./sdk/unreal/README.md)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Game Client (Unity/Unreal/Web)             │
│                         SDK                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/WebSocket
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  API Gateway (NestJS)                    │
│           WebSocket + REST + Authentication              │
└──────┬─────────────────────────────────────────┬────────┘
       │                                         │
       ↓                                         ↓
┌──────────────────┐                   ┌──────────────────┐
│  Emotion Service │                   │ Dialogue Service │
│   (FastAPI)      │                   │   (FastAPI)      │
│                  │                   │                  │
│ • Rule Engine    │                   │ • Templates      │
│ • ML Classifier  │                   │ • LLM Generation │
│ • Caching        │                   │ • Multi-language │
└──────────────────┘                   └──────────────────┘
       │                                         │
       └────────────────┬────────────────────────┘
                        │
                        ↓
              ┌──────────────────┐
              │  Memory Service  │
              │    (Node.js)     │
              │                  │
              │ • Vector Search  │
              │ • Semantic Match │
              └──────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌──────────────┐ ┌──────────┐  ┌──────────┐
│ PostgreSQL   │ │  Redis   │  │  Qdrant  │
│  (Main DB)   │ │  (Cache) │  │ (Vector) │
└──────────────┘ └──────────┘  └──────────┘
```

### Key Design Decisions

1. **Hybrid Emotion Detection**: 85% rule-based (fast, free) + 15% ML (accurate)
2. **90/10 Dialogue Strategy**: 90% templates (cheap) + 10% LLM (quality)
3. **Three-tier Memory**: Short-term (Redis) + Long-term (PostgreSQL) + Semantic (Qdrant)
4. **Cost Optimization**: Intelligent caching, budget enforcement, graceful degradation

---

## 🛠 Technology Stack

**Backend Services**
- Node.js 20+ with TypeScript 5.x and NestJS 10.x
- Python 3.11+ with FastAPI 0.104+
- PostgreSQL 15+ (main database)
- Redis 7+ (cache + message queue)
- Qdrant (vector database for semantic memory)

**AI/ML**
- Anthropic Claude API (primary LLM)
- OpenAI API (embeddings + backup LLM)
- LangChain (LLM orchestration)

**Client SDKs**
- Unity: C# SDK with UnityWebRequest
- Unreal: C++ plugin with Blueprint support
- Web: TypeScript SDK for browser and Node.js

**Infrastructure**
- Docker + Docker Compose
- Kubernetes (production deployment)
- Prometheus + Grafana (monitoring)

---

## 📚 Documentation

### Getting Started
- [Quick Start Guide](./QUICKSTART.md) - Get up and running in 5 minutes
- [Monolith Mode Guide](./QUICKSTART-MONOLITH.md) - Simplified single-service deployment
- [Development with SQLite](./docs/development-sqlite.md) - Lightweight local development

### Platform Documentation
- [Architecture Guide](./CLAUDE.md) - Detailed technical architecture and design decisions
- [API Reference](./docs/api/README.md) - Complete REST API documentation
- [Deployment Guide](./docs/deployment-guide.md) - Production deployment and operations
- [Monitoring Setup](./docs/monitoring-setup.md) - Prometheus & Grafana configuration
- [Performance Optimization](./docs/performance-optimization.md) - Database tuning and caching

### Service Guides
- [Emotion System](./docs/emotion-system.md) - Hybrid rule + ML emotion detection
- [Dialogue System](./docs/dialogue-system.md) - Template + LLM dialogue generation
- [Memory Service](./docs/memory-service.md) - Vector search and semantic memory
- [Analytics Dashboard](./docs/analytics-dashboard.md) - Usage monitoring and cost tracking

### SDK Documentation
- [Unity SDK](./sdk/unity/README.md) - C# SDK with complete API reference
- [Web SDK](./sdk/web/README.md) - TypeScript SDK for browser and Node.js
- [Unreal SDK](./sdk/unreal/README.md) - C++ plugin with Blueprint support
- [Avatar SDK](./sdk/avatar/README.md) - 3D avatar rendering engine
- [Vision SDK](./sdk/vision/README.md) - AI-powered game screen analysis

---

## 🗺 Roadmap

### ✅ Phase 1: MVP (Complete)
- Core infrastructure and microservices
- API service with authentication and game/player management
- Basic emotion recognition and template-based dialogue
- Unity SDK and comprehensive testing

### ✅ Phase 2: Production Features (Complete)
- Memory Service with vector search (Qdrant + OpenAI embeddings)
- LLM dialogue generation (Anthropic Claude + 90/10 hybrid)
- ML emotion classifier (Claude API + rule-based hybrid)
- Analytics dashboard with cost tracking
- Performance optimization (caching, indexing, connection pooling)

### ✅ Phase 3: Multi-platform & Deployment (Complete)
- Web SDK (TypeScript) and Unreal SDK (C++)
- Multi-language support (English, Chinese, Japanese)
- 3D Avatar SDK (Three.js + emotion animations)
- Vision AI SDK (GPT-4V/Claude Vision for screen analysis)
- Production deployment guides (Docker Compose + Kubernetes)
- Monitoring setup (Prometheus + Grafana)

### 🚧 Phase 4: Future Enhancements
- [ ] Voice synthesis and lip sync
- [ ] Advanced emotion blending and transitions
- [ ] Marketplace for custom character personas
- [ ] Cross-game memory (experimental)
- [ ] Enterprise features (SSO, RBAC, audit logs)

---

## 💰 Cost Estimates

### Development (SQLite + Monolith)
- **Infrastructure**: $0/month (local development)
- **LLM API**: ~$10-30/month (testing)
- **Total**: ~$10-30/month

### Small Production (<1000 active players)
- **Infrastructure**: $200/month (DigitalOcean Kubernetes)
- **LLM API**: ~$300/month (optimized with caching)
- **CDN**: $20/month
- **Total**: ~$520/month

### Growth (10,000+ active players)
- **Infrastructure**: $800/month
- **LLM API**: ~$2,000/month (90/10 strategy)
- **CDN/Bandwidth**: $200/month
- **Total**: ~$3,000/month

**Target**: <$0.30 per Monthly Active User (MAU)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific service tests
npm run test:api          # API service tests
npm run test:emotion      # Emotion service tests
npm run test:dialogue     # Dialogue service tests
npm run test:memory       # Memory service tests

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

**Coverage**: 70%+ across all services with comprehensive unit and integration tests.

---

## 🤝 Contributing

This is currently a private project. Contribution guidelines will be added when the project becomes open source.

---

## 📄 License

Proprietary - All rights reserved.

This project is currently closed source. Contact the development team for licensing inquiries.

---

## 📞 Contact & Support

- **Documentation**: Browse the [docs/](./docs) directory
- **Issues**: Report bugs or request features via GitHub Issues
- **Email**: contact@agl-platform.com (placeholder)

---

<div align="center">

**Built with ❤️ for game developers who want to create unforgettable experiences**

[Get Started](#-quick-start) • [Read Docs](#-documentation) • [View Examples](./examples)

</div>
