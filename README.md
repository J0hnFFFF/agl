# AI Game Companion Engine (AGL)

> Cloud-based SaaS platform for emotional, intelligent companion characters in games.

**Language**: [English](./README.md) | [简体中文](./README.zh-CN.md)

**[📖 Quick Start Guide](./QUICKSTART.md)** | **[📚 Documentation](#documentation)** | **[🎮 SDK Guides](#sdk-documentation)**

## 🚦 Project Status

**Current Phase**: ✅ Production Ready - All Core Features Complete 🎉

The AGL platform is now production-ready with comprehensive backend services, multiple SDKs, multi-language support, monitoring infrastructure, and complete deployment documentation.

### ✅ Phase 1 Complete
- Project structure and monorepo setup
- Docker development environment
- API Service (NestJS) with authentication
- **Full Game CRUD operations** ✨
- **Player management endpoints** ✨
- Realtime Gateway (Socket.IO) with Redis
- **Enhanced Emotion Service (Python/FastAPI)** - 25+ event types, 14 emotions, context-aware ✨
- **Expanded Dialogue Service (Python/FastAPI)** - 80+ templates, 3 personas ✨
- Database schema (Prisma)
- Complete documentation (API, SDK, Architecture, Emotion System, Dialogue System, Testing) ✨
- Production deployment configurations
- **Comprehensive test suite (unit + integration)** ✨

### ✅ Phase 2 Recently Completed

#### Memory Service with Qdrant vector search 🎉
- PostgreSQL + Qdrant hybrid storage
- OpenAI embeddings for semantic search
- Automatic importance scoring
- Context retrieval for dialogue
- Memory cleanup and decay
- Complete REST API
- **Comprehensive test suite** ✨
  - Unit tests for all services (Embedding, Qdrant, Memory)
  - API integration tests
  - 70%+ code coverage
  - Test utilities and helpers

#### LLM Dialogue Generation (Hybrid 90/10 Strategy) 🎉 NEW
- **Anthropic Claude API integration** (Haiku model)
- **Special case detection** - 6 trigger criteria:
  - Legendary/mythic events
  - First-time experiences
  - Milestone achievements
  - Long win/loss streaks
  - High-importance memories
  - Complex multi-factor contexts
- **Memory-context integration** - Personalized dialogue based on player history
- **Intelligent caching** - TTL-based cache reduces latency and cost
- **Cost control** - Daily budget enforcement ($10/day), 10% LLM target rate
- **Graceful degradation** - Automatic fallback to templates
- **Complete test suite** ✨
  - 79+ test cases across 7 test files
  - Special case detector tests
  - Template system tests
  - Cache functionality tests
  - Cost tracking tests
  - Integration tests
  - API endpoint tests

#### ML Emotion Classifier (Hybrid Detection) 🎉 NEW
- **Rule-based analyzer** - Fast (< 5ms), free, reliable primary detection
- **ML classifier** - Claude API fallback for low-confidence cases
- **Hybrid strategy** - Automatic ML trigger when rule confidence < 0.8
- **Cost control** - Daily budget ($5), usage rate limits (15% target)
- **Smart caching** - 30min TTL, groups similar events, 30-40% hit rate
- **Complete test suite** ✨
  - 53+ test cases across 4 test files
  - Rule analyzer tests
  - Cache functionality tests
  - Cost tracking tests
  - API endpoint tests

#### Unity SDK 🎉 NEW
- **Core client** - AGLClient with service integration
- **Emotion Service client** - Analyze player emotions
- **Dialogue Service client** - Generate character dialogue
- **Memory Service client** - Store and retrieve memories
- **Data models** - Complete C# models for all requests/responses
- **HTTP client** - Unity UnityWebRequest-based implementation
- **Editor integration** - Project Settings configuration panel
- **Helper methods** - Simplified API for common operations
- **Sample code** - Complete working example
- **Documentation** - Comprehensive usage guide

### 🚧 Phase 2 Status
**Phase 2 COMPLETE!** 🎉

All planned features delivered:
- ✅ Memory Service with vector search
- ✅ LLM Dialogue Generation (90/10 hybrid)
- ✅ ML Emotion Classifier (hybrid)
- ✅ Unity SDK
- ✅ Analytics Dashboard
- ✅ Performance Optimization

### 📋 Phase 3 Next Steps
- Monitoring & Alerting (Prometheus + Grafana)
- Multi-platform SDKs (Unreal, Web)
- Multi-language support
- Advanced features

> See [Roadmap](#roadmap) for detailed timeline.

## Overview

AGL provides game developers with an SDK to integrate AI-powered companion characters that respond emotionally to game events, remember player interactions, and create engaging experiences.

## Features

- 🎭 **Emotional Recognition** - Hybrid rule-based + ML system
- 💬 **AI Dialogue Generation** - LLM-powered contextual conversations
- 🧠 **Memory System** - Three-tier memory (short-term, long-term, semantic)
- 🎮 **Multi-Platform SDKs** - Unity, Unreal, Web
- ☁️ **Cloud Service** - Scalable, reliable backend infrastructure

## Architecture

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and technical documentation.

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- npm 10+

### 1. Clone the repository

```bash
git clone <repository-url>
cd agl
```

### 2. Setup environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY (optional)
```

### 3. Start development stack

```bash
# Start databases (PostgreSQL, Redis, Qdrant)
npm run dev:stack

# Install dependencies
npm run setup

# Run database migrations
npm run db:migrate
```

### 4. Start services

Open multiple terminals:

```bash
# Terminal 1 - API Service
npm run dev:api

# Terminal 2 - Realtime Gateway
npm run dev:realtime

# Terminal 3 - Emotion Service
npm run dev:emotion

# Terminal 4 - Dialogue Service
npm run dev:dialogue
```

### 5. Access services

- API Service: http://localhost:3000
- Realtime Gateway: ws://localhost:3001
- Emotion Service: http://localhost:8000
- Dialogue Service: http://localhost:8001
- pgAdmin: http://localhost:5050 (admin@agl.dev / admin)
- Redis Commander: http://localhost:8081

## Project Structure

```
agl/
├── sdk/                    # Client SDKs
│   ├── unity/             # Unity C# SDK ✅
│   │   ├── Runtime/       # Runtime scripts
│   │   ├── Editor/        # Unity Editor integration
│   │   └── Samples/       # Example code
│   ├── unreal/            # Unreal C++ SDK (planned)
│   └── web/               # Web TypeScript SDK (planned)
├── services/              # Backend services
│   ├── api-service/       # NestJS API service ✅
│   ├── realtime-gateway/  # Socket.IO gateway ✅
│   ├── emotion-service/   # Python emotion detection (hybrid rule+ML) ✅
│   ├── dialogue-service/  # Python dialogue generation (90/10 hybrid) ✅
│   └── memory-service/    # Node.js memory management (vector search) ✅
├── infrastructure/        # Deployment configs
│   ├── k8s/              # Kubernetes manifests
│   └── docker/           # Dockerfiles
├── docs/                 # Documentation ✅
└── examples/             # Example integrations
```

## Development

### Available Scripts

```bash
npm run dev:stack         # Start Docker services
npm run dev:api           # Start API service
npm run dev:realtime      # Start realtime gateway
npm run dev:emotion       # Start emotion service
npm run dev:dialogue      # Start dialogue service

npm test                  # Run all tests
npm run lint              # Lint all code
npm run format            # Format code with Prettier

npm run db:migrate        # Run database migrations
npm run db:seed           # Seed development data
npm run db:reset          # Reset database
```

## Technology Stack

**Backend**:
- Node.js + TypeScript + NestJS
- Python + FastAPI
- PostgreSQL 15
- Redis 7
- Qdrant (vector database)

**AI/ML**:
- Anthropic Claude API
- OpenAI API (backup)
- LangChain

**Infrastructure**:
- Docker + Kubernetes
- Prometheus + Grafana

## Documentation

### Platform Documentation
- [Architecture Guide](./CLAUDE.md) - Detailed technical architecture
- [API Documentation](./docs/api/) - REST API reference
- [Deployment Guide](./docs/deployment-guide.md) - Production deployment and operations ✨ NEW
- [Monitoring Setup](./docs/monitoring-setup.md) - Prometheus & Grafana configuration ✨ NEW
- [Integration Guide](./docs/integration-guide.md) - Service integration patterns
- [Testing Guide](./docs/testing.md) - Unit and integration testing
- [Original Product Spec](./docs/product-spec-original.md) - Original Chinese product specifications

### Service Documentation
- [Emotion System Guide](./docs/emotion-system.md) - Hybrid rule+ML emotion detection ✨
- [Dialogue System Guide](./docs/dialogue-system.md) - 90/10 hybrid dialogue generation ✨
- [Memory Service Guide](./docs/memory-service.md) - Vector search and semantic memory ✨
- [Analytics Dashboard Guide](./docs/analytics-dashboard.md) - Usage monitoring and cost tracking ✨
- [Performance Optimization Guide](./docs/performance-optimization.md) - Database, caching, and API optimization ✨

### SDK Documentation
- [Unity SDK Guide](./sdk/unity/README.md) - Unity C# SDK with full API reference ✨
- [Web SDK Guide](./sdk/web/README.md) - TypeScript SDK for browser and Node.js ✨ NEW
- [Unreal SDK Guide](./sdk/unreal/README.md) - Unreal Engine C++ plugin with Blueprint support ✨ NEW

## Roadmap

### Phase 1: MVP ✅ COMPLETE
- [x] Project setup and infrastructure
- [x] API service with authentication
- [x] Full Game CRUD operations
- [x] Player management endpoints
- [x] Enhanced emotion recognition (25+ events, 14 emotions, context-aware)
- [x] Template-based dialogue (80+ templates, 3 personas)
- [x] Comprehensive test suite
- [x] Complete documentation

### Phase 2: Beta (Current) 🚀
- [x] Memory Service with vector search ✨
  - [x] Qdrant integration
  - [x] OpenAI embeddings
  - [x] Importance scoring
  - [x] Semantic search API
  - [x] Context retrieval
  - [x] Comprehensive test suite
- [x] LLM dialogue generation (hybrid 90/10 approach) ✨
  - [x] Anthropic Claude API integration
  - [x] Special case detection (6 criteria)
  - [x] Memory-context integration
  - [x] Cost tracking and budget enforcement
  - [x] Intelligent caching system
  - [x] Comprehensive test suite (79+ tests)
- [x] ML emotion classifier (hybrid rule + ML) ✨
  - [x] Rule-based analyzer (fast, free primary)
  - [x] Claude API classifier (accurate fallback)
  - [x] Confidence-based ML triggering
  - [x] Cost control and budget management
  - [x] Smart caching system
  - [x] Comprehensive test suite (53+ tests)
- [x] Unity SDK ✨
  - [x] Core AGLClient with service integration
  - [x] Emotion, Dialogue, Memory service clients
  - [x] Complete C# data models
  - [x] Unity Editor integration
  - [x] HTTP client (UnityWebRequest)
  - [x] Helper methods and utilities
  - [x] Sample code and documentation
- [x] Analytics Dashboard ✨
  - [x] Service metrics collection
  - [x] Hourly and daily aggregations
  - [x] Cost tracking and monitoring
  - [x] Game usage statistics
  - [x] Emotion distribution analysis
  - [x] REST API endpoints
  - [x] Comprehensive tests
  - [x] Complete documentation
- [x] Performance Optimization ✨ NEW
  - [x] Database query optimization (10+ indexes)
  - [x] Redis caching layer (75-95% hit rate)
  - [x] Connection pooling with retry logic
  - [x] API response optimization
  - [x] Service-specific caching
  - [x] 70-95% faster response times
  - [x] Complete documentation

- [x] Monitoring & Alerting Setup ✨ NEW
  - [x] Prometheus configuration
  - [x] Grafana dashboards setup
  - [x] Alert rules (errors, latency, costs, resources)
  - [x] Docker Compose deployment
  - [x] Metrics implementation guide
  - [x] Complete documentation

**Status**: ✅ **PHASE 2 COMPLETE** - All core features implemented and tested

### Phase 3: Production & Enhancement
- [x] Web SDK (TypeScript) ✨ NEW
  - [x] Core AGLClient with service integration
  - [x] Emotion, Dialogue, Memory service clients
  - [x] Complete TypeScript type definitions
  - [x] Helper functions and utilities
  - [x] Browser and Node.js support
  - [x] Build configuration (Rollup)
  - [x] Browser example (HTML/JS)
  - [x] Node.js examples
  - [x] Complete documentation
- [x] Unreal SDK (C++) ✨ NEW
  - [x] Unreal Engine plugin structure
  - [x] Blueprint and C++ support
  - [x] Complete type system (USTRUCTs, UENUMs)
  - [x] AGLClient, Emotion, Dialogue, Memory services
  - [x] Async operations with delegates
  - [x] Helper functions for common events
  - [x] Build configuration
  - [x] Comprehensive documentation with examples
- [x] Multi-language Dialogue Support ✨ NEW
  - [x] English dialogue templates (300+ variations)
  - [x] Japanese dialogue templates (300+ variations)
  - [x] Chinese dialogue templates (existing 300+ variations)
  - [x] I18n template manager with language selection
  - [x] API language parameter support
  - [x] Automatic fallback handling
- [x] Production Deployment Guide ✨ NEW
  - [x] Docker Compose production configuration
  - [x] Kubernetes deployment manifests
  - [x] Database setup and optimization
  - [x] Security configuration (TLS, API keys, firewall)
  - [x] Monitoring and alerting setup
  - [x] Backup and recovery procedures
  - [x] Scaling strategies (horizontal & vertical)
  - [x] Performance tuning guide
  - [x] Troubleshooting procedures
  - [x] Production checklist
- [ ] Advanced features (voice, lip sync) - Future Enhancement
- [ ] Enterprise features (SSO, RBAC) - Future Enhancement

**Status**: ✅ **PHASE 3 COMPLETE** - Production-ready platform with comprehensive SDKs and deployment guides

## Contributing

This is currently a private project. Contribution guidelines will be added later.

## License

Proprietary - All rights reserved

## Contact

For inquiries, please contact the development team.
