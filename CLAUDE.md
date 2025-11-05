# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AI Game Companion Engine** (AI游戏陪伴引擎) - a cloud-based SaaS platform that provides emotional, intelligent companion characters for games.

**Product Positioning**: Rather than real-time tactical analysis (high technical barrier, legal risks), we focus on **emotional companionship and player growth coaching** - helping players improve through post-game analysis, personalized training, and engaging interactions with AI companions.

### Core Value Proposition

1. **Virtual Companion Characters** - Emotionally responsive avatars that react to game events
2. **Intelligent Emotion Recognition** - Hybrid rule-based + ML system to detect player emotional states
3. **AI-Powered Dialogue** - LLM-generated conversations that feel personal and contextual
4. **Memory System** - Long-term memory that makes companions feel "alive"

### Target Customers

- Game developers (B2B SaaS)
- Mid-size game studios
- Independent developers
- Initially: single game deep integration, later: cross-game platform

## Cloud Service Architecture

**8-Microservice Cloud-Native Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│                  Game Client (Unity/Unreal/Web)          │
│                        SDK                               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/WSS
                     ↓
┌─────────────────────────────────────────────────────────┐
│              API Gateway + Load Balancer                 │
│                   (Kong / Nginx)                         │
└──────┬──────────────────────────────────┬───────────────┘
       │                                  │
       ↓ REST API                         ↓ WebSocket
┌──────────────────┐              ┌──────────────────┐
│   API Services   │              │  Realtime Gateway │
│ (NestJS, 3000)   │              │ (Socket.IO, 3001)│
│                  │              │                   │
│ - Auth           │              │ - WebSocket       │
│ - User Mgmt      │              │ - Push Messages   │
│ - Config         │              │ - Connection Mgmt │
└────────┬─────────┘              └─────────┬─────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        │
                ┌───────▼────────┐
                │ Message Queue  │
                │  (Redis)       │
                └───────┬────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Emotion Service│ │Dialogue Service│ │Memory Service│
│(FastAPI, 8000)│ │(FastAPI, 8001)│ │(NestJS, 3002)│
│               │ │                │ │              │
│ - Rule Engine │ │ - LLM Gen      │ │ - Short-term │
│ - ML Model    │ │ - Templates    │ │ - Long-term  │
│ - Progression │ │ - Cost Optim   │ │ - Semantic   │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Voice Service │ │  Dashboard   │ │Vision Service│
│(FastAPI,8003)│ │(Flask, 5000) │ │(FastAPI,8002)│
│              │ │              │ │              │
│ - OpenAI TTS │ │ - Analytics  │ │ - GPT-4V     │
│ - 7-day Cache│ │ - Cost Track │ │ - Screen AI  │
└──────────────┘ └──────────────┘ └──────────────┘
       │                │                  │
       └────────────────┴──────────────────┘
                        │
        ┌───────────────┼───────────────────┐
        ↓               ↓                   ↓
┌──────────────┐ ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │ │  Redis       │  │  Vector DB   │
│  (Main DB)   │ │  (Cache/MQ)  │  │  (Qdrant)    │
└──────────────┘ └──────────────┘  └──────────────┘
```

## Technology Stack (Confirmed)

### Client SDK
- **Unity**: C# plugin (.unitypackage)
- **Unreal**: C++ plugin
- **Web**: TypeScript SDK (WebGL games)
- **Avatar Rendering**: Three.js + React Three Fiber (3D engine), Live2D, VRM, Spine
- **Vision AI**: Screen capture + GPT-4V/Claude Vision integration
- **Communication**: Socket.IO client + HTTP client

### API Service Layer
- **Language**: Node.js 20 LTS + TypeScript 5.3
- **Framework**: NestJS 10.x
- **ORM**: Prisma
- **Auth**: JWT + API Key
- **Validation**: class-validator

### Realtime Service
- **Framework**: Socket.IO 4.x
- **Scaling**: socket.io-redis adapter
- **Protocol**: WebSocket (fallback to long polling)

### AI Service Layer
- **Language**: Python 3.11+
- **Framework**: FastAPI 0.109+
- **LLM**: Anthropic Claude Haiku/Sonnet (primary), OpenAI GPT-4 (backup)
- **Voice**: OpenAI TTS API (text-to-speech), OpenAI Whisper API (speech-to-text, planned)
- **Vision**: GPT-4V / Claude Vision (screen analysis, optional)
- **Orchestration**: LangChain
- **Embedding**: sentence-transformers (local) / OpenAI API

### Dashboard Service
- **Framework**: Flask 3.0+ (Python)
- **Frontend**: Vanilla JS + Chart.js
- **Purpose**: Real-time analytics, cost tracking, performance monitoring

### Data Storage
- **Main Database**: PostgreSQL 15+ (with partitioning for events)
- **Cache/Queue**: Redis 7+ (Streams for message queue)
- **Vector DB**: Qdrant (semantic memory search)
- **Object Storage**: S3-compatible (avatar assets, recordings)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (K8s)
- **Early Deployment**: DigitalOcean Kubernetes (~$200/month)
- **Growth Deployment**: AWS EKS / GCP GKE
- **Monitoring**: Prometheus + Grafana + Loki
- **Alerting**: Grafana Alerting

### CI/CD
- **Version Control**: Git
- **CI/CD**: GitHub Actions (recommended)
- **Registry**: Docker Hub / AWS ECR

## Project Structure

```
agl/
├── sdk/
│   ├── unity/                 # Unity SDK (C#) - 125+ tests
│   ├── unreal/                # Unreal SDK (C++) - 88+ tests
│   ├── web/                   # Web SDK (TypeScript) - 55+ tests
│   ├── avatar/                # 3D Avatar Rendering Engine (Three.js)
│   └── vision/                # Vision AI Analysis (Screen Capture + GPT-4V/Claude)
├── services/
│   ├── api-service/           # NestJS API service (Port 3000)
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── game/
│   │   │   ├── character/
│   │   │   └── analytics/
│   │   └── prisma/
│   ├── realtime-gateway/      # Socket.IO service (Port 3001)
│   ├── emotion-service/       # Python emotion detection (Port 8000) - 50+ tests
│   ├── dialogue-service/      # Python dialogue generation (Port 8001) - 80+ tests
│   ├── memory-service/        # Node.js memory management (Port 3002) - 60+ tests
│   ├── voice-service/         # Python TTS service (Port 8003) - 48+ tests
│   ├── dashboard/             # Flask analytics dashboard (Port 5000) - 30+ tests
│   └── vision-service-template/ # Vision AI architecture template (Port 8002)
├── tools/
│   └── agl-cli/               # CLI tool (init, dev, deploy, config, status) - 182+ tests
├── infrastructure/
│   ├── k8s/                   # Kubernetes manifests
│   ├── docker/                # Dockerfiles
│   └── terraform/             # Infrastructure as Code (optional)
├── docs/
│   ├── api/                   # API documentation (52 endpoints)
│   ├── sdk/                   # SDK guides
│   ├── architecture/          # Architecture diagrams
│   └── archive/               # Phase summaries (4A, 4B, Fixes)
├── examples/
│   └── demo-game/             # Demo Unity game
├── scripts/
│   ├── deploy.sh
│   └── setup-dev.sh
├── CLAUDE.md
├── README.md
└── DOCUMENTATION-INDEX.md     # Complete documentation index
```

## Core Technical Decisions

### 1. Hybrid Emotion Recognition
- **Local Rules** (85%+ confidence): Instant response (<50ms) using rule engine
- **Cloud ML** (uncertain cases): ML classifier for complex scenarios (~200ms)
- **Emotion Progression**: Track emotion history for context-aware responses

### 2. Cost-Optimized Dialogue Generation
- **90% Scenarios**: Pre-written template library (fast + cheap)
- **10% Special Cases**: LLM generation (Claude API) for unique moments
- **Caching**: Hash-based dialogue caching (1-hour TTL)
- **Target**: <$0.001 per dialogue average

### 3. Three-Tier Memory System
- **Short-term** (Redis): Session data, 1-hour TTL
- **Long-term** (PostgreSQL): Important moments, permanent
- **Semantic** (Qdrant): Vector embeddings for contextual recall

### 4. Graceful Degradation
- **Offline Mode**: SDK has pre-downloaded dialogue library
- **Network Failure**: Automatically switch to local rule engine
- **Service Degradation**: Template fallback if LLM service is down

## Development Workflow

### Commands

**Setup Development Environment**
```bash
# Install dependencies for all services
npm run setup

# Start local development stack (uses Docker Compose)
npm run dev:stack

# Option 1: Start monolith mode (recommended for beginners)
npm run dev:monolith  # Single process, port 3000, SQLite

# Option 2: Start individual microservices (production-like)
npm run dev:api       # API service (port 3000)
npm run dev:realtime  # Realtime gateway (port 3001)
npm run dev:emotion   # Emotion service (port 8000)
npm run dev:dialogue  # Dialogue service (port 8001)
npm run dev:memory    # Memory service (port 3002)

# Optional services (Phase 4B)
npm run dev:voice     # Voice service (port 8003) - TTS
npm run dev:dashboard # Analytics dashboard (port 5000) - Monitoring
```

**Database**
```bash
# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Reset database
npm run db:reset
```

**Testing**
```bash
# Run all tests
npm test

# Run specific service tests
npm run test:api
npm run test:emotion

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

**Deployment**
```bash
# Build all Docker images
npm run build:docker

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### Development Principles

1. **API-First Design**: Define API contracts before implementation
2. **Type Safety**: Use TypeScript/Pydantic for type safety across services
3. **Observability**: Every service must emit metrics and structured logs
4. **Graceful Failures**: Never crash the client game due to backend issues
5. **Cost Awareness**: Track LLM API costs per request, optimize aggressively

## Key Architectural Patterns

### 1. Event-Driven Architecture
Game events flow through Redis Streams, allowing async processing and replay.

### 2. CQRS (Command Query Responsibility Segregation)
- Write path: Game events → Message Queue → Event processors
- Read path: Client queries → API → Cached data

### 3. Circuit Breaker
If LLM API fails repeatedly, automatically switch to template-based generation.

### 4. Rate Limiting
- Per API key quota enforcement (Redis-based token bucket)
- Graceful degradation when quota exceeded (return cached responses)

## Monitoring & Observability

### Key Metrics to Track

**Business Metrics**:
- API calls per client (billing)
- Active WebSocket connections
- Event processing latency (P50, P95, P99)
- LLM API cost per request
- Voice API cost per request (TTS/STT)
- Dialogue generation: template vs LLM ratio
- Voice synthesis: cached vs TTS ratio

**Technical Metrics**:
- Service health (uptime, error rate) - all 8 services
- Database connection pool usage
- Redis cache hit rate (dialogue + voice)
- Message queue lag
- Memory/CPU usage per service
- Voice service cache hit rate (7-day TTL)
- Dashboard page load times

**Alerts**:
- Service down (PagerDuty)
- Error rate >5% (Slack)
- LLM API cost spike (Email)
- Voice API cost spike (Email)
- Daily budget exceeded (Email + Slack)
- Database connection exhaustion (PagerDuty)

## Security Considerations

1. **API Key Management**: SHA-256 hashed, rate-limited, scoped permissions
2. **Data Privacy**: Player data encrypted at rest (PostgreSQL encryption)
3. **DDoS Protection**: Cloudflare in front of API gateway
4. **Input Validation**: All inputs validated at API boundary
5. **Secret Management**: Use Kubernetes Secrets / AWS Secrets Manager

## Cost Estimates

### Development Phase (Local SQLite + Monolith)
- Infrastructure: $0/month (local development)
- LLM API: ~$10-30/month (testing)
- Voice API: ~$5/month (testing)
- **Total**: ~$15-35/month

### MVP Phase (<1000 active players)
- Infrastructure: $200/month (DigitalOcean K8s)
- LLM API (Claude): ~$300/month (with caching)
- Voice API (TTS): ~$50/month (with 7-day cache)
- CDN/Domain: $20/month
- **Total**: ~$570/month

### Growth Phase (10,000 active players)
- Infrastructure: $800/month
- LLM API: ~$2,000/month (90/10 strategy)
- Voice API: ~$300/month (TTS + STT, high cache hit rate)
- CDN/Bandwidth: $200/month
- **Total**: ~$3,300/month

Target unit economics: <$0.35 per MAU (Monthly Active User)

**Cost Optimization Strategies:**
- 90/10 dialogue strategy (template priority)
- 7-day voice caching (reduces TTS calls by 80%+)
- Rule engine priority (avoids ML API calls)
- CDN caching for 3D assets

## Roadmap

### ✅ Phase 1: MVP (Complete)
- ✅ Basic infrastructure setup (Docker Compose, databases)
- ✅ API service with auth and rate limiting (JWT + API Key)
- ✅ WebSocket realtime gateway (Socket.IO)
- ✅ Emotion recognition (rule engine with 36 variants)
- ✅ Dialogue generation (template + LLM hybrid)
- ✅ Unity SDK (C# plugin)
- ✅ Demo game integration

### ✅ Phase 2: Production Features (Complete)
- ✅ ML emotion classifier (Claude API + rule-based hybrid)
- ✅ Vector-based memory retrieval (Qdrant + OpenAI embeddings)
- ✅ Multi-character support (3 characters, 37 animations each)
- ✅ Analytics dashboard (Flask + Chart.js, 4 pages)
- ✅ Performance optimization (caching, indexing, connection pooling)
- ✅ Cost tracking and budget management

### ✅ Phase 3: Multi-Platform (Complete)
- ✅ Unreal SDK (C++ plugin with Blueprint support) - 88+ tests
- ✅ Web SDK (TypeScript, browser + Node.js) - 55+ tests
- ✅ 3D Avatar SDK (Three.js + React Three Fiber, CDN-hosted)
- ✅ Vision AI SDK (GPT-4V/Claude Vision integration)
- ✅ Multi-language support (English, Chinese, Japanese)
- ✅ Production deployment guides (Docker Compose + Kubernetes)
- ✅ Monitoring setup (Prometheus + Grafana)

### ✅ Phase 4A: Testing & Tooling (Complete)
- ✅ **818+ test cases** with 85%+ coverage across all components
- ✅ CLI tool with 5 commands (init, dev, deploy, config, status) - 182+ tests
- ✅ Korean language support (4th language, 300+ templates)
- ✅ Enhanced monitoring (metrics collection, cost tracking)

### ✅ Phase 4B: Advanced Features (Complete)
- ✅ Voice Service (OpenAI TTS, 3 character voices, 7-day caching) - 48+ tests
- ✅ Analytics Dashboard (real-time monitoring, cost analytics, 4 pages) - 30+ tests
- ✅ Vision Service Template (architecture reference for GPT-4V/Claude Vision)
- ✅ 3D Avatar SDK enhancements (3 characters, 37 animations, CDN deployment)

### ✅ Phase 4 Fixes: Code Quality (Complete)
- ✅ **Production-ready score: 6.3/10 → 8.0/10**
- ✅ Code cleanup (fixed TypeScript/Python errors, standardized code style)
- ✅ Test improvements (fixed failing tests, increased coverage)
- ✅ Documentation completion (100,000+ words across 30+ guides)

### 🚧 Phase 5: Advanced Features Completion (Planned)
- [ ] **STT Service**: Whisper API integration for speech recognition
- [ ] **Voice Dialogue Integration**: Complete voice interaction flow + lip sync system
- [ ] **Vision Service Complete**: From template to production-ready implementation
- [ ] **Social Features**: Character export/import, community library

### 📋 Phase 6: Infrastructure & Commercial (Future)
- [ ] Kubernetes production deployment (auto-scaling, multi-region)
- [ ] CI/CD automation (GitHub Actions, automated testing)
- [ ] Advanced monitoring (Prometheus + Grafana + Loki + PagerDuty)
- [ ] Billing system (usage tracking, subscription management)
- [ ] Customer management (multi-tenant, SSO, RBAC)
- [ ] Enterprise features (private deployment, audit logs)

## Project Status

**Current Status**: ✅ **Phase 4B Complete** (Production Ready: 8.0/10)

**Completed:**
- 8 microservices deployed and tested
- 818+ tests with 85%+ coverage
- 100,000+ words of documentation
- 52 API endpoints
- 5 client SDKs (Unity, Unreal, Web, Avatar, Vision)
- CLI tool with 5 commands
- 4 languages supported (English, Chinese, Japanese, Korean)
- Real-time analytics dashboard
- Voice synthesis with 3 character personas

**Next Steps**: Phase 5 focuses on completing advanced features (STT, Voice Dialogue, Vision Complete, Social Features) to reach 9.0/10 production readiness.
