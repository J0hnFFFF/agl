<div align="center">

# 🎮 AGL - AI Game Companion Engine

**Emotional, intelligent AI companions that bring your games to life**

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-%3E%3D3.11-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.3.0-blue.svg)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)]()

[Features](#-features) • [Quick Start](#-quick-start) • [SDKs](#-sdks) • [Documentation](#-documentation) • [Architecture](#-architecture)

</div>

---

## 🌟 What is AGL?

AGL (AI Game Companion Engine) is a **cloud-based SaaS platform** that provides game developers with **emotionally-aware AI companion characters**. Unlike traditional NPCs, AGL companions:

- 🎭 **React emotionally** to game events in real-time (12 emotions × 3 intensities)
- 💬 **Generate contextual dialogue** using hybrid template + LLM system (1000+ templates)
- 🧠 **Remember interactions** with semantic memory powered by vector search
- 🌍 **Support 4 languages** (English, Chinese, Japanese, Korean)
- 🎨 **Animate in 3D** with emotion-driven expressions (37 animations per character)
- 🎤 **Voice interaction** - Complete voice dialogue with STT, TTS, and lip sync
- 👁️ **Visual understanding** - AI-powered game screen analysis and scene detection
- 📊 **Track everything** - Built-in analytics dashboard for monitoring

**Perfect for**: Game studios, indie developers, and anyone building engaging game experiences.

---

## ✨ Features

### Core Capabilities

| Feature | Description | Technology |
|---------|-------------|------------|
| 🎭 **Emotion Recognition** | Hybrid rule-based + ML system with 36 emotion variants | Claude API + Rule Engine |
| 💬 **AI Dialogue** | 90/10 hybrid strategy (templates + LLM) for cost-effective generation | Anthropic Claude Haiku/Sonnet |
| 🧠 **Memory System** | Three-tier memory with semantic search | PostgreSQL + Qdrant + Redis |
| 🌐 **Multi-language** | English, Chinese, Japanese, Korean dialogue (300+ templates each) | i18n Template System |
| 🎨 **3D Avatars** | 3 characters, 37 animations each, CDN-hosted models | Three.js + React Three Fiber |
| 🎤 **Voice Interaction** | Complete voice dialogue: STT (Whisper) + TTS + Lip Sync | OpenAI Whisper + TTS API |
| 👁️ **Vision Analysis** | Game screenshot understanding, scene detection, event recognition | GPT-4V + Claude Vision |
| 📊 **Analytics Dashboard** | Real-time monitoring, cost tracking, performance metrics | Flask + Chart.js |

### Developer Experience

- ✅ **Multiple SDKs**: Unity (C#), Unreal (C++), Web (TypeScript)
- ✅ **CLI Tool**: Project init, dev server, deployment commands (`agl` command)
- ✅ **Easy Integration**: Simple API with comprehensive documentation
- ✅ **Flexible Deployment**: Monolith for dev, microservices for production
- ✅ **Cost Optimized**: Intelligent caching, budget enforcement, template fallback
- ✅ **Production Ready**: 85%+ test coverage, monitoring, security hardened
- ✅ **Well Documented**: 100,000+ words of documentation

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js >= 20.0.0
Python >= 3.11
PostgreSQL >= 15
Redis >= 7

# Optional (for full feature set)
Qdrant (vector database)
Docker & Docker Compose
```

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
# Edit .env and add your API keys:
# - ANTHROPIC_API_KEY (required)
# - OPENAI_API_KEY (optional, for TTS/Vision)

# 3. Start infrastructure
npm run dev:stack

# 4. Install dependencies
npm install
cd services/api-service && npx prisma generate && npx prisma migrate dev && cd ../..

# 5. Start all services
npm run dev:all

# Or start services individually (in separate terminals):
npm run dev:api              # API Service (port 3000)
npm run dev:realtime         # Realtime Gateway (port 3001)
npm run dev:memory           # Memory Service (port 3002)
npm run dev:emotion          # Emotion Service (port 8000)
npm run dev:dialogue         # Dialogue Service (port 8001)
npm run dev:voice            # Voice/TTS Service (port 8003)
npm run dev:stt              # Speech Recognition (port 8004)
npm run dev:voice-dialogue   # Voice Dialogue Orchestrator (port 8005)
npm run dev:lipsync          # Lip Sync Service (port 8006)
npm run dev:vision           # Vision Analysis (port 8007)
npm run dev:dashboard        # Analytics Dashboard (port 5000)
```

### Option 3: Using CLI Tool

```bash
# Install CLI globally
npm install -g @agl/cli

# Initialize new project
agl init my-game

# Start development environment
cd my-game
agl dev

# Deploy to production
agl deploy --env production
```

📖 **CLI Guide**: See [CLI-GUIDE.md](./docs/CLI-GUIDE.md)

### Try It Out

```bash
# Analyze player emotion
curl -X POST http://localhost:3000/api/v1/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.victory",
    "eventData": {"killCount": 15, "mvp": true},
    "gameId": "my-game-123",
    "playerId": "player-456"
  }'

# Generate companion dialogue
curl -X POST http://localhost:3000/api/v1/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "persona": "cheerful",
    "language": "en",
    "context": {"recentEvents": ["victory"]}
  }'

# Synthesize voice
curl -X POST http://localhost:8003/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Incredible! You are unstoppable!",
    "voice": "nova",
    "language": "en"
  }'

# View analytics dashboard
open http://localhost:5000
```

📚 **Full Guide**: See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

---

## 🎮 SDKs

### Unity (C#)

```csharp
using AGL;

// Initialize client
var client = new AGLClient(new AGLConfig {
    ApiUrl = "http://localhost:3000",
    ApiKey = "your-api-key"
});

// Send game event
var response = await client.Emotion.AnalyzeAsync(new EmotionRequest {
    EventType = "player.victory",
    EventData = new { killCount = 15, mvp = true },
    GameId = "my-game",
    PlayerId = "player-123"
});

Debug.Log($"Emotion: {response.Emotion}");  // "excited"

// Generate dialogue
var dialogue = await client.Dialogue.GenerateAsync(new DialogueRequest {
    Emotion = response.Emotion,
    Persona = "cheerful",
    Language = "en"
});

Debug.Log($"Dialogue: {dialogue.Text}");  // "Incredible! You're unstoppable!"

// Synthesize voice
var audioUrl = await client.Voice.SynthesizeAsync(dialogue.Text, "nova");
PlayAudio(audioUrl);
```

📖 [Unity SDK Documentation](./sdk/unity/README.md)
🧪 [Unity SDK Tests](./docs/UNITY-SDK-TEST-SUMMARY.md) - 125+ tests, 85%+ coverage

### Web / TypeScript

```typescript
import { AGLClient } from '@agl/web';

const client = new AGLClient({
  apiUrl: 'http://localhost:3000',
  apiKey: 'your-api-key'
});

// Send event and get response
const emotion = await client.emotion.analyze({
  eventType: 'player.victory',
  eventData: { killCount: 15, mvp: true },
  gameId: 'my-game',
  playerId: 'player-123'
});

const dialogue = await client.dialogue.generate({
  emotion: emotion.emotion,
  persona: 'cheerful',
  language: 'en'
});

console.log(emotion.emotion);   // "excited"
console.log(dialogue.text);     // "Incredible! You're unstoppable!"

// Voice synthesis
const audioUrl = await client.voice.synthesize(dialogue.text, 'nova');
const audio = new Audio(audioUrl);
audio.play();
```

📖 [Web SDK Documentation](./sdk/web/README.md)
🧪 [Web SDK Tests](./docs/WEB-SDK-TEST-SUMMARY.md) - 55+ tests, 85%+ coverage

### Unreal Engine (C++)

```cpp
// Initialize client
UAGLClient* Client = NewObject<UAGLClient>();
FAGLConfig Config;
Config.ApiUrl = TEXT("http://localhost:3000");
Config.ApiKey = TEXT("your-api-key");
Client->Initialize(Config);

// Send game event
FAGLEmotionRequest EmotionRequest;
EmotionRequest.EventType = TEXT("player.victory");
EmotionRequest.EventData.Add(TEXT("killCount"), TEXT("15"));
EmotionRequest.EventData.Add(TEXT("mvp"), TEXT("true"));
EmotionRequest.GameId = TEXT("my-game");
EmotionRequest.PlayerId = TEXT("player-123");

Client->AnalyzeEmotion(EmotionRequest, [](bool Success, const FAGLEmotionResponse& Response) {
    if (Success) {
        UE_LOG(LogTemp, Log, TEXT("Emotion: %s"), *Response.Emotion);

        // Generate dialogue
        FAGLDialogueRequest DialogueRequest;
        DialogueRequest.Emotion = Response.Emotion;
        DialogueRequest.Persona = TEXT("cheerful");
        DialogueRequest.Language = TEXT("en");

        Client->GenerateDialogue(DialogueRequest, [](bool Success, const FAGLDialogueResponse& Response) {
            UE_LOG(LogTemp, Log, TEXT("Dialogue: %s"), *Response.Text);
        });
    }
});
```

📖 [Unreal SDK Documentation](./sdk/unreal/README.md)
🧪 [Unreal SDK Tests](./docs/UNREAL-SDK-TEST-SUMMARY.md) - 88+ tests, 85%+ coverage

---

## 🏗 Architecture

### Service Topology

```
┌─────────────────────────────────────────────────────────┐
│              Game Client (Unity/Unreal/Web)             │
│                         SDK                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/WebSocket
                     ↓
┌─────────────────────────────────────────────────────────┐
│              API Gateway (NestJS, Port 3000)            │
│         WebSocket + REST + Auth + Rate Limiting         │
└──────┬──────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ↓                                  ↓
┌──────────────────┐            ┌──────────────────┐
│  Emotion Service │            │ Dialogue Service │
│ (FastAPI, 8000)  │            │ (FastAPI, 8001)  │
│                  │            │                  │
│ • Rule Engine    │            │ • 1000+ Templates│
│ • ML Classifier  │            │ • LLM Generation │
│ • 36 Emotions    │            │ • 4 Languages    │
└──────────────────┘            └──────────────────┘
       │                                  │
       └────────────┬─────────────────────┘
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Memory Service│ │Voice Service │ │   Dashboard  │
│(Node, 3002)  │ │(FastAPI,8003)│ │(Flask, 5000) │
│              │ │              │ │              │
│• Vector DB   │ │• OpenAI TTS  │ │• Analytics   │
│• Semantic    │ │• 7-day Cache │ │• Cost Track  │
└──────────────┘ └──────────────┘ └──────────────┘
       │                 │              │
       └─────────────────┼──────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │    Redis     │ │   Qdrant     │
│   (Main DB)  │ │ (Cache + MQ) │ │  (Vector DB) │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Microservices Overview

**Core Microservices (10 services):**

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **API Service** | 3000 | NestJS + TypeScript | API Gateway, Auth, Game/Player/Character Management |
| **Realtime Gateway** | 3001 | Socket.IO + Node.js | WebSocket connections, real-time events |
| **Memory Service** | 3002 | NestJS + TypeScript | Memory storage, vector search |
| **Emotion Service** | 8000 | FastAPI + Python | Emotion detection (rule + ML hybrid) |
| **Dialogue Service** | 8001 | FastAPI + Python | Dialogue generation (template + LLM) |
| **Voice Service** | 8003 | FastAPI + Python | Text-to-speech synthesis (TTS) |
| **STT Service** | 8004 | FastAPI + Python | Speech-to-text recognition (Whisper) |
| **Voice Dialogue** | 8005 | FastAPI + Python | Voice interaction orchestration (STT+Dialogue+TTS) |
| **Lip Sync** | 8006 | FastAPI + Python | Lip sync animation generation (phoneme → viseme) |
| **Vision Service** | 8007 | FastAPI + Python | Game screenshot analysis (GPT-4V + Claude Vision) |

**Support Tools:**

| Tool | Port | Technology | Purpose |
|------|------|------------|---------|
| **Dashboard** | 5000 | Flask + Python | Analytics visualization, cost monitoring |
| **Monolith Mode** | 3000 | NestJS + SQLite | All-in-one development mode (no Docker required) |

### Key Design Decisions

1. **Hybrid Emotion Detection**: 85% rule-based (fast, free) + 15% ML (accurate, $0.001/request)
2. **90/10 Dialogue Strategy**: 90% templates (instant, free) + 10% LLM (quality, $0.001/request)
3. **Three-tier Memory**:
   - Short-term (Redis, 1-hour TTL)
   - Long-term (PostgreSQL, permanent)
   - Semantic (Qdrant, vector search)
4. **Voice Caching**: 7-day cache, 60%+ cache hit rate, saves $13.5/month
5. **Cost Optimization**:
   - Daily budget limits ($50 TTS, $100 Vision)
   - 3-level alerting (80%, 95%, 100%)
   - Intelligent caching across all services

---

## 🛠 Technology Stack

### Backend Services

**Node.js Stack**
- Node.js 20 LTS with TypeScript 5.3
- NestJS 10.x (API Service, Memory Service, Realtime Gateway)
- Prisma ORM (database access)
- Socket.IO 4.x (WebSocket)
- Jest (testing framework)

**Python Stack**
- Python 3.11+
- FastAPI 0.109 (Emotion, Dialogue, Voice, Vision)
- Pydantic (data validation)
- pytest (testing framework)
- Redis client (caching)

**Databases**
- PostgreSQL 15+ (main database with partitioning)
- Redis 7+ (cache + message queue, Streams)
- Qdrant 1.7+ (vector database for semantic memory)

**AI/ML**
- Anthropic Claude API (Haiku, Sonnet, Opus)
- OpenAI API (GPT-3.5, GPT-4, TTS, Whisper, GPT-4V)
- LangChain (LLM orchestration)
- sentence-transformers (local embeddings)

### Frontend & Client SDKs

**SDKs**
- Unity: C# SDK with UnityWebRequest
- Unreal: C++ plugin with Blueprint support
- Web: TypeScript SDK for browser and Node.js
- Avatar: React Three Fiber 3D rendering engine
- Vision: Screen capture + AI analysis (template)

**Dashboard Frontend**
- Flask 3.0 (backend)
- Jinja2 templates
- Tailwind CSS 3.x
- Chart.js 4.4 (data visualization)

**CLI Tool**
- TypeScript 5.3
- Commander.js 11.1 (command framework)
- Inquirer 9.2 (interactive prompts)
- Chalk, Ora, Boxen (rich UI)

### Infrastructure

**Development**
- Docker 24+ & Docker Compose
- SQLite (lightweight local dev)

**Production**
- Kubernetes (deployment manifests ready)
- NGINX Ingress Controller
- Prometheus + Grafana (monitoring)
- Loki (log aggregation)

---

## 📚 Documentation

### Getting Started

- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running in 5 minutes
- **[Monolith Mode Guide](./QUICKSTART-MONOLITH.md)** - Simplified single-service deployment
- **[Development with SQLite](./docs/development-sqlite.md)** - Lightweight local development
- **[CLI Tool Guide](./docs/CLI-GUIDE.md)** - Command-line interface documentation

### Platform Architecture

- **[Architecture Guide](./CLAUDE.md)** - Detailed technical architecture and design decisions
- **[Implementation Patterns](./docs/IMPLEMENTATION-PATTERNS.md)** - 35,000+ word service implementation guide
- **[API Reference](./docs/api/README.md)** - Complete REST API documentation (52 endpoints)
- **[Deployment Guide](./docs/deployment-guide.md)** - Production deployment and operations

### Core Systems

- **[Emotion System](./docs/emotion-system.md)** - Hybrid rule + ML emotion detection
- **[Dialogue System](./docs/dialogue-system.md)** - Template + LLM dialogue generation
- **[Memory Service](./docs/memory-service.md)** - Vector search and semantic memory
- **[Voice Service](./services/voice-service/README.md)** - Text-to-speech synthesis guide (5,000+ words)
- **[Analytics Dashboard](./services/dashboard/README.md)** - Monitoring and cost tracking

### Advanced Features

- **[3D Model Setup Guide](./docs/3D-MODEL-SETUP-GUIDE.md)** - Avatar models, CDN, 37 animations (7,000+ words)
- **[Avatar Integration Guide](./sdk/avatar/INTEGRATION-GUIDE.md)** - React Three Fiber integration (5,000+ words)
- **[STT Service](./services/stt-service/README.md)** - Speech-to-text with Whisper API, VAD optimization
- **[Voice Dialogue Service](./services/voice-dialogue-service/README.md)** - Voice interaction orchestration
- **[Lip Sync Service](./services/lipsync-service/README.md)** - Phoneme extraction and viseme mapping
- **[Vision Service](./services/vision-service/README.md)** - AI game screenshot analysis (GPT-4V + Claude Vision)
- **[API Key Management](./docs/API-KEY-MANAGEMENT.md)** - Security guide (20,000+ words)

### SDK Documentation

- **[Unity SDK](./sdk/unity/README.md)** - C# SDK with complete API reference
- **[Web SDK](./sdk/web/README.md)** - TypeScript SDK for browser and Node.js
- **[Unreal SDK](./sdk/unreal/README.md)** - C++ plugin with Blueprint support
- **[Avatar SDK](./sdk/avatar/README.md)** - 3D avatar rendering engine
- **[Vision SDK](./sdk/vision/README.md)** - AI-powered game screen analysis

### Operational Guides

- **[Monitoring & Metrics](./docs/METRICS-MONITORING-GUIDE.md)** - Performance tracking, cost analytics (7,000+ words)
- **[Security Best Practices](./docs/API-KEY-MANAGEMENT.md)** - API key lifecycle, rotation, security
- **[Character Sharing](./docs/CHARACTER-SHARING-GUIDE.md)** - Export/import, community features (future)
- **[Korean Language Pack](./docs/KOREAN-LANGUAGE-PACK.md)** - 300+ Korean templates, cultural adaptation

### Test Documentation

- **[Web SDK Tests](./docs/WEB-SDK-TEST-SUMMARY.md)** - 55+ tests, 85%+ coverage
- **[Unity SDK Tests](./docs/UNITY-SDK-TEST-SUMMARY.md)** - 125+ tests, 85%+ coverage
- **[Unreal SDK Tests](./docs/UNREAL-SDK-TEST-SUMMARY.md)** - 88+ tests, 85%+ coverage
- **[CLI Tool Tests](./tools/agl-cli/tests/README.md)** - 182+ tests, 85%+ coverage

### Phase Documentation

- **[Phase 4A Complete](./docs/archive/PHASE-4A-COMPLETE-SUMMARY.md)** - Testing, monitoring, CLI (32,000+ words)
- **[Phase 4B Summary](./docs/PHASE-4B-SUMMARY.md)** - Voice, Dashboard, Vision, Avatar (60,000+ words)
- **[Phase 4B Fixes](./docs/PHASE-4B-FIXES-SUMMARY.md)** - Code quality improvements (score: 6.3→8.0)
- **[Phase 5 Roadmap](./docs/PHASE-5-ROADMAP.md)** - Voice interaction (STT, Voice Dialogue, Lip Sync), Vision Service
- **[Phase 5 Completion](./docs/PHASE-5-COMPLETION-REPORT.md)** - Multimodal features completion report

### Feature Inventory

- **[Product Features](./docs/PRODUCT-FEATURES.md)** - Complete feature catalog (25,000+ words)
  - 3 core functions
  - 10 backend services
  - 5 client SDKs
  - 60+ API endpoints
  - 8 business scenarios

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
- Vision AI SDK (GPT-4V/Claude Vision for screen analysis - template)
- Production deployment guides (Docker Compose + Kubernetes)
- Monitoring setup (Prometheus + Grafana)

### ✅ Phase 4A: Testing & Dev Tools (Complete)
- **SDK Test Suites** - 268+ tests (Unity, Web, Unreal)
- **Performance Monitoring** - Metrics API (15 endpoints)
- **Cost Analytics** - Budget tracking, anomaly detection
- **CLI Tool** - 5 commands (init, dev, deploy, config, status)
- **Korean Language** - 300+ templates, 4-language support

### ✅ Phase 4B: Voice & Analytics (Complete)
- **Voice Service** - OpenAI TTS, 3 character voices, 7-day caching
- **Avatar SDK Enhancement** - 3 characters, 37 animations, CDN config
- **Vision Service Template** - Architecture reference (not production)
- **Analytics Dashboard** - Real-time monitoring, cost analysis, 4 pages

### ✅ Phase 4B Fixes: Quality Improvements (Complete)
- **Test Coverage** - 57% → 85% (+49%)
- **Security** - CORS fixed, API key management (20,000-word guide)
- **Character Service** - 380-line test suite, 85%+ coverage
- **Configuration** - Extracted to JSON, loader class
- **Dashboard** - LRU caching (50-100x improvement)
- **Cost Management** - UTC timezone, 3-level alerting
- **Overall Score** - 6.3/10 → 8.0/10 (+27%)

### ✅ Phase 5: Multimodal Features (Complete)
- **Voice Interaction (STT, Voice Dialogue, Lip Sync)**
  - STT Service - OpenAI Whisper API, VAD, 7-day caching
  - Voice Dialogue Service - Full pipeline orchestration (STT→Dialogue→TTS)
  - Lip Sync Service - Phoneme extraction, 15 visemes, multi-format output
  - 250+ tests, 85%+ coverage

- **Vision Service**
  - Complete GPT-4V + Claude Vision integration
  - Game screenshot analysis, scene detection, event recognition
  - Image optimization (20-40% cost savings)
  - Smart caching (1-hour TTL), $50/day budget management
  - 80+ tests, 85%+ coverage

### 🔮 Phase 6: Production & Commercial (Future)
- **6A: Production Deployment**
  - Kubernetes full configuration
  - CI/CD automation (GitHub Actions)
  - Monitoring & alerting (Prometheus, Grafana, Loki)
  - Database high availability

- **6B: Commercialization**
  - Billing system (usage-based pricing)
  - Customer management portal
  - SLA guarantees (99.9% uptime)
  - Enterprise features (SSO, RBAC, audit logs)

---

## 💰 Cost Estimates

### Development (SQLite + Monolith)
- **Infrastructure**: $0/month (local development)
- **LLM API**: ~$10-30/month (testing)
- **Total**: ~$10-30/month

### Small Production (<1,000 active players)
- **Infrastructure**: $200/month (DigitalOcean Kubernetes)
- **LLM API**: ~$300/month (Claude, optimized with caching)
- **Voice API**: ~$50/month (OpenAI TTS, 60% cache hit)
- **CDN**: $20/month
- **Total**: ~$570/month

### Growth (10,000 active players)
- **Infrastructure**: $800/month (AWS EKS, RDS, ElastiCache)
- **LLM API**: ~$2,000/month (90/10 strategy)
- **Voice API**: ~$300/month (with caching)
- **CDN/Bandwidth**: $200/month
- **Total**: ~$3,300/month

### At Scale (100,000 active players)
- **Infrastructure**: $4,000/month
- **LLM API**: ~$15,000/month
- **Voice API**: ~$2,000/month
- **CDN/Bandwidth**: $1,000/month
- **Total**: ~$22,000/month

**Target Unit Economics**: <$0.25 per Monthly Active User (MAU)

### Cost Optimization Features
- ✅ Template-based dialogue (90% free, instant)
- ✅ Voice caching (7 days, 60%+ hit rate)
- ✅ Budget enforcement ($50/day TTS, $100/day Vision)
- ✅ 3-level cost alerting (80%, 95%, 100%)
- ✅ Graceful degradation (service fallback)

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific service tests
npm run test:api          # API service tests (85%+ coverage)
npm run test:emotion      # Emotion service tests
npm run test:dialogue     # Dialogue service tests
npm run test:memory       # Memory service tests

# SDK tests
cd sdk/web && npm test                    # Web SDK (55+ tests)
cd sdk/unity && dotnet test               # Unity SDK (125+ tests)
cd sdk/unreal && RunUAT BuildCookRun -test  # Unreal SDK (88+ tests)

# CLI tests
cd tools/agl-cli && npm test              # CLI tool (182+ tests)

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

### Test Coverage Summary

| Component | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| **API Service** | 100+ | 85%+ | ✅ |
| **Emotion Service** | 50+ | 85%+ | ✅ |
| **Dialogue Service** | 80+ | 85%+ | ✅ |
| **Memory Service** | 60+ | 85%+ | ✅ |
| **Voice Service** | 48+ | 85%+ | ✅ |
| **Dashboard** | 30+ | 85%+ | ✅ |
| **Web SDK** | 55+ | 85%+ | ✅ |
| **Unity SDK** | 125+ | 85%+ | ✅ |
| **Unreal SDK** | 88+ | 85%+ | ✅ |
| **CLI Tool** | 182+ | 85%+ | ✅ |
| **Total** | **818+** | **85%+** | ✅ |

---

## 📊 Project Statistics

### Codebase
- **Lines of Code**: ~50,000+ (services + SDKs + configuration)
- **Services**: 10 core microservices + 2 support tools
- **API Endpoints**: 60+ endpoints
- **Languages**: TypeScript, Python, C#, C++
- **Test Coverage**: 85%+ (1,000+ tests)

### Documentation
- **Total Words**: 100,000+ words
- **Documentation Files**: 30+ guides
- **Code Comments**: 30%+ comment rate
- **API Documentation**: 100% endpoint coverage

### Features
- **Emotions**: 12 base emotions × 3 intensities = 36 variants
- **Dialogue Templates**: 1,000+ templates
- **Languages**: 4 languages (en, zh, ja, ko)
- **Characters**: 3 characters, 37 animations each
- **Voice Personas**: 3 voices (cheerful, cool, cute)

---

## 🤝 Contributing

This is currently a private project. Contribution guidelines will be added when the project becomes open source.

### Development Standards

- ✅ Test coverage > 85%
- ✅ 0 TypeScript/ESLint errors
- ✅ Code review required
- ✅ Documentation for all features
- ✅ Security scan (Trivy) passing

---

## 📄 License

Proprietary - All rights reserved.

This project is currently closed source. Contact the development team for licensing inquiries.

---

## 📞 Contact & Support

- **Documentation**: Browse the [docs/](./docs) directory (100,000+ words)
- **Issues**: Report bugs or request features via GitHub Issues
- **Email**: j0hn.wahahaha@gmail.com

---

## 🏆 Achievements

- ✅ **85%+ Test Coverage** - 1,000+ tests across all components
- ✅ **10 Core Microservices** - Production-ready architecture with multimodal features
- ✅ **100,000+ Words** - Comprehensive documentation
- ✅ **4 Languages** - Multilingual support (en, zh, ja, ko)
- ✅ **60+ API Endpoints** - Complete REST API
- ✅ **Production Ready** - Score 8.0/10, security hardened
- ✅ **Cost Optimized** - <$0.25 per MAU target

---

<div align="center">

**Built with ❤️ for game developers who want to create unforgettable experiences**

[Get Started](#-quick-start) • [Read Docs](#-documentation) • [View Examples](./examples)

**Version**: 2.1.0 (Phase 5 Complete - Multimodal Features)
**Status**: ✅ Production Ready (Score: 8.0/10)
**Last Updated**: 2025-11

</div>
