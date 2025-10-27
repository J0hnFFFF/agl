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
│   (Node.js)      │              │   (Node.js)       │
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
│  (Python)     │ │  (Python)      │ │  (Node.js)   │
│               │ │                │ │              │
│ - Rule Engine │ │ - LLM Gen      │ │ - Short-term │
│ - ML Model    │ │ - Templates    │ │ - Long-term  │
│ - Progression │ │ - Cost Optim   │ │ - Semantic   │
└──────┬───────┘ └──────┬─────────┘ └──────┬───────┘
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
- **Avatar Rendering**: Live2D (primary), VRM, Spine
- **Communication**: Socket.IO client + HTTP client

### API Service Layer
- **Language**: Node.js 20 LTS + TypeScript 5.x
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
- **Framework**: FastAPI 0.104+
- **LLM**: Anthropic Claude (primary), OpenAI (backup)
- **Orchestration**: LangChain
- **Embedding**: sentence-transformers (local) / OpenAI API

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
│   ├── unity/                 # Unity SDK (C#)
│   ├── unreal/                # Unreal SDK (C++)
│   └── web/                   # Web SDK (TypeScript)
├── services/
│   ├── api-service/           # NestJS API service
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── game/
│   │   │   ├── character/
│   │   │   └── analytics/
│   │   └── prisma/
│   ├── realtime-gateway/      # Socket.IO service
│   ├── emotion-service/       # Python emotion detection
│   ├── dialogue-service/      # Python dialogue generation
│   └── memory-service/        # Node.js memory management
├── infrastructure/
│   ├── k8s/                   # Kubernetes manifests
│   ├── docker/                # Dockerfiles
│   └── terraform/             # Infrastructure as Code (optional)
├── docs/
│   ├── api/                   # API documentation
│   ├── sdk/                   # SDK guides
│   └── architecture/          # Architecture diagrams
├── examples/
│   └── demo-game/             # Demo Unity game
├── scripts/
│   ├── deploy.sh
│   └── setup-dev.sh
├── CLAUDE.md
└── README.md
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

# Start individual services
npm run dev:api       # API service (port 3000)
npm run dev:realtime  # Realtime gateway (port 3001)
npm run dev:emotion   # Emotion service (port 8000)
npm run dev:dialogue  # Dialogue service (port 8001)
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
- Dialogue generation: template vs LLM ratio

**Technical Metrics**:
- Service health (uptime, error rate)
- Database connection pool usage
- Redis cache hit rate
- Message queue lag
- Memory/CPU usage per service

**Alerts**:
- Service down (PagerDuty)
- Error rate >5% (Slack)
- LLM API cost spike (Email)
- Database connection exhaustion (PagerDuty)

## Security Considerations

1. **API Key Management**: SHA-256 hashed, rate-limited, scoped permissions
2. **Data Privacy**: Player data encrypted at rest (PostgreSQL encryption)
3. **DDoS Protection**: Cloudflare in front of API gateway
4. **Input Validation**: All inputs validated at API boundary
5. **Secret Management**: Use Kubernetes Secrets / AWS Secrets Manager

## Cost Estimates

### MVP Phase (<1000 active players)
- Infrastructure: $200/month (DigitalOcean K8s)
- LLM API (Claude): ~$300/month
- CDN/Domain: $20/month
- **Total**: ~$520/month

### Growth Phase (10,000 active players)
- Infrastructure: $800/month
- LLM API: ~$2,000/month (with optimization)
- CDN/Bandwidth: $200/month
- **Total**: ~$3,000/month

Target unit economics: <$0.30 per MAU (Monthly Active User)

## Roadmap

### Phase 1: MVP (Months 1-3)
- [ ] Basic infrastructure setup (K8s, databases)
- [ ] API service with auth and rate limiting
- [ ] WebSocket realtime gateway
- [ ] Emotion recognition (rule engine)
- [ ] Dialogue generation (template + LLM)
- [ ] Unity SDK (basic version)
- [ ] Demo game integration

### Phase 2: Beta (Months 4-6)
- [ ] ML emotion classifier
- [ ] Vector-based memory retrieval
- [ ] Multi-character support
- [ ] Analytics dashboard
- [ ] Billing system
- [ ] Documentation and SDK examples

### Phase 3: Production (Months 7-12)
- [ ] Unreal and Web SDKs
- [ ] Advanced features (voice, lip sync)
- [ ] Enterprise features (private deployment option)
- [ ] Marketplace for custom characters
- [ ] Cross-game memory (experimental)

## Project Status

Currently in **planning and architecture phase**. No code has been written yet. Ready to start implementation with confirmed technical stack and architecture.
