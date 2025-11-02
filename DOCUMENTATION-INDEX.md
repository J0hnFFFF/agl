# 📚 Documentation Index

Quick navigation to all AGL documentation.

---

## 🚀 Getting Started

**New to AGL? Start here:**

| Document | Description | Time |
|----------|-------------|------|
| [README](./README.md) | Project overview and features | 5 min |
| **[Quick Start](./QUICKSTART.md)** | Get started in 5 minutes | 10 min |
| **[Monolith Mode](./QUICKSTART-MONOLITH.md)** | Fastest way to start (1 minute) | 5 min |
| [Deployment Guide](./DEPLOYMENT.md) | All deployment options | 15 min |

**Recommended Path**:
1. Read `README.md` for overview
2. Follow `QUICKSTART-MONOLITH.md` to start quickly
3. Check `DEPLOYMENT.md` for production deployment

---

## 🎮 SDKs & Integration

### Client SDKs

| SDK | Platform | Language | Documentation |
|-----|----------|----------|---------------|
| Unity | Unity 2021+ | C# | [Unity SDK](./sdk/unity/README.md) |
| Web | Browser/Node.js | TypeScript/JS | [Web SDK](./sdk/web/README.md) |
| Unreal | UE 5.0+ | C++ | [Unreal SDK](./sdk/unreal/README.md) |
| Avatar | Web (3D) | TypeScript | [Avatar SDK](./sdk/avatar/README.md) |
| Vision | Multi-platform | TypeScript | [Vision SDK](./sdk/vision/README.md) |

### Integration Guides

- [Integration Guide](./docs/integration-guide.md) - General integration patterns
- [Testing Guide](./docs/testing.md) - Testing strategies

---

## 🛠️ Development

### Local Development

| Guide | Description | Use Case |
|-------|-------------|----------|
| **[SQLite Development](./docs/development-sqlite.md)** | Lightweight local setup | Learning, development |
| [Database Comparison](./docs/database-comparison.md) | SQLite vs PostgreSQL | Choosing database |
| [Architecture Guide](./CLAUDE.md) | Complete technical architecture | Understanding system |

### API Documentation

- [REST API Reference](./docs/api/README.md) - Complete API documentation
- [WebSocket API](./docs/api/websocket.md) - Real-time communication

---

## 📡 Services

### Core Services

| Service | Documentation | Purpose |
|---------|---------------|---------|
| Emotion | [Emotion System](./docs/emotion-system.md) | Emotion detection (rule + ML hybrid) |
| Dialogue | [Dialogue System](./docs/dialogue-system.md) | Dialogue generation (template + LLM) |
| Memory | [Memory Service](./docs/memory-service.md) | Memory management with vector search |
| Analytics | [Analytics Dashboard](./docs/analytics-dashboard.md) | Usage tracking and cost monitoring |

---

## 🚀 Deployment

### Deployment Options

| Option | Guide | Cost | Difficulty |
|--------|-------|------|-----------|
| Local (Monolith) | [Monolith Guide](./QUICKSTART-MONOLITH.md) | $0 | ⭐ |
| VPS | [Deployment Guide](./DEPLOYMENT.md#vps-deployment-simple) | $5-20/mo | ⭐⭐ |
| PaaS (Railway/Render) | [Deployment Guide](./DEPLOYMENT.md#platform-as-a-service-paas) | $20-50/mo | ⭐⭐ |
| Kubernetes | [K8s Guide](./docs/deployment-guide.md) | $200+/mo | ⭐⭐⭐⭐⭐ |

### Operations

- [Monitoring Setup](./docs/monitoring-setup.md) - Prometheus + Grafana
- [Performance Optimization](./docs/performance-optimization.md) - Tuning guide
- [Deployment Guide (Full)](./docs/deployment-guide.md) - Production deployment

---

## 🏗️ Architecture

| Document | Audience | Content |
|----------|----------|---------|
| [CLAUDE.md](./CLAUDE.md) | Architects, Backend Devs | Complete technical architecture |
| [Deployment Guide](./docs/deployment-guide.md) | DevOps | Production deployment & operations |

---

## 📖 By Role

### Game Developers

**Essential**:
1. [Quick Start](./QUICKSTART-MONOLITH.md)
2. [Unity SDK](./sdk/unity/README.md) / [Web SDK](./sdk/web/README.md) / [Unreal SDK](./sdk/unreal/README.md)
3. [API Reference](./docs/api/README.md)

**Optional**:
- [Avatar SDK](./sdk/avatar/README.md) - Add 3D companions
- [Vision SDK](./sdk/vision/README.md) - Screen analysis

### Backend Developers

**Essential**:
1. [Architecture Guide](./CLAUDE.md)
2. [SQLite Development](./docs/development-sqlite.md)
3. [API Reference](./docs/api/README.md)

**Deep Dive**:
- [Emotion System](./docs/emotion-system.md)
- [Dialogue System](./docs/dialogue-system.md)
- [Memory Service](./docs/memory-service.md)

### DevOps Engineers

**Essential**:
1. [Deployment Guide](./DEPLOYMENT.md)
2. [Kubernetes Guide](./docs/deployment-guide.md)
3. [Monitoring Setup](./docs/monitoring-setup.md)

**Optimization**:
- [Performance Tuning](./docs/performance-optimization.md)
- [Database Comparison](./docs/database-comparison.md)

---

## 🎯 By Use Case

### "I want to learn AGL"

1. [README](./README.md) - Understand the project
2. [Monolith Quick Start](./QUICKSTART-MONOLITH.md) - Start in 1 minute
3. [Emotion System](./docs/emotion-system.md) - How emotions work
4. [Dialogue System](./docs/dialogue-system.md) - How dialogue works

### "I want to integrate AGL"

1. Choose SDK: [Unity](./sdk/unity/) / [Web](./sdk/web/) / [Unreal](./sdk/unreal/)
2. [Integration Guide](./docs/integration-guide.md)
3. [API Reference](./docs/api/README.md)

### "I want to deploy to production"

1. [Deployment Options](./DEPLOYMENT.md) - Choose approach
2. [Deployment Guide](./docs/deployment-guide.md) - Full K8s guide
3. [Monitoring Setup](./docs/monitoring-setup.md) - Set up observability

### "I want to add 3D avatars"

1. [Avatar SDK](./sdk/avatar/README.md) - Main documentation
2. [SDK Guide](./docs/sdk/avatar.md) - Detailed guide

### "I want to optimize performance"

1. [Performance Guide](./docs/performance-optimization.md)
2. [Database Comparison](./docs/database-comparison.md)
3. [Monitoring Setup](./docs/monitoring-setup.md)

---

## 📁 Documentation Map

```
agl/
├── README.md                          # Project overview
├── QUICKSTART.md                      # Quick start guide
├── QUICKSTART-MONOLITH.md            # Fastest start (1 min)
├── DEPLOYMENT.md                      # Deployment options
├── CLAUDE.md                          # Technical architecture
│
├── docs/
│   ├── development-sqlite.md          # SQLite development
│   ├── database-comparison.md         # Database comparison
│   ├── deployment-guide.md            # Production deployment
│   ├── monitoring-setup.md            # Monitoring & alerts
│   ├── performance-optimization.md    # Performance tuning
│   ├── integration-guide.md           # Integration patterns
│   ├── testing.md                     # Testing strategies
│   │
│   ├── emotion-system.md              # Emotion detection
│   ├── dialogue-system.md             # Dialogue generation
│   ├── memory-service.md              # Memory management
│   ├── analytics-dashboard.md         # Analytics
│   │
│   ├── api/
│   │   ├── README.md                  # REST API
│   │   └── websocket.md               # WebSocket API
│   │
│   └── sdk/
│       ├── unity.md                   # Unity deep dive
│       ├── avatar.md                  # Avatar SDK guide
│       └── vision.md                  # Vision SDK guide
│
└── sdk/
    ├── unity/README.md                # Unity SDK
    ├── web/README.md                  # Web SDK
    ├── unreal/README.md               # Unreal SDK
    ├── avatar/README.md               # Avatar SDK
    └── vision/README.md               # Vision SDK
```

---

## 🔍 Search by Keyword

| Looking for... | Keyword | Document |
|----------------|---------|----------|
| Getting started | quickstart | [QUICKSTART-MONOLITH.md](./QUICKSTART-MONOLITH.md) |
| Local setup | sqlite, development | [development-sqlite.md](./docs/development-sqlite.md) |
| Deployment | deploy, production | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Unity | unity, c# | [sdk/unity/README.md](./sdk/unity/README.md) |
| 3D avatars | avatar, 3d | [sdk/avatar/README.md](./sdk/avatar/README.md) |
| Screen analysis | vision, ai | [sdk/vision/README.md](./sdk/vision/README.md) |
| Emotions | emotion, detect | [emotion-system.md](./docs/emotion-system.md) |
| Dialogue | dialogue, chat | [dialogue-system.md](./docs/dialogue-system.md) |
| API | api, rest | [docs/api/README.md](./docs/api/README.md) |
| Architecture | architecture, system | [CLAUDE.md](./CLAUDE.md) |

---

## 📚 Learning Path

### Beginner (Week 1)

- [ ] Read [README.md](./README.md)
- [ ] Follow [QUICKSTART-MONOLITH.md](./QUICKSTART-MONOLITH.md)
- [ ] Test API endpoints
- [ ] Read [Emotion System](./docs/emotion-system.md)
- [ ] Read [Dialogue System](./docs/dialogue-system.md)
- [ ] Integrate SDK for your platform

### Intermediate (Week 2-3)

- [ ] Read [Architecture Guide](./CLAUDE.md)
- [ ] Understand microservices
- [ ] Switch to PostgreSQL
- [ ] Read [Performance Guide](./docs/performance-optimization.md)
- [ ] Deploy to staging ([Deployment Guide](./DEPLOYMENT.md))

### Advanced (Month 1-2)

- [ ] Deploy to Kubernetes
- [ ] Set up monitoring ([Monitoring Guide](./docs/monitoring-setup.md))
- [ ] Optimize performance
- [ ] Deep dive into all services
- [ ] Production operations

---

## 🆘 Can't Find What You Need?

1. Check the [README.md](./README.md) for overview
2. Browse the [docs/](./docs) directory
3. Check SDK-specific [README files](./sdk/)
4. [Open an Issue](https://github.com/J0hnFFFF/agl/issues) on GitHub

---

**Quick Links**: [Home](./README.md) • [Get Started](./QUICKSTART.md) • [Deploy](./DEPLOYMENT.md) • [API Docs](./docs/api/README.md)
