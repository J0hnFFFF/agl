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
| **[One-Click Deployment](./ONE-CLICK-DEPLOY.md)** | Complete deployment guide with 3 options ⭐ | 10 min |
| [Deployment Guide](./DEPLOYMENT.md) | All deployment options | 15 min |

**Recommended Path**:
1. Read `README.md` for overview
2. Follow `QUICKSTART-MONOLITH.md` to start quickly
3. Check `DEPLOYMENT.md` for production deployment

---

## 🎮 SDKs & Integration

### Client SDKs

| SDK | Platform | Language | Documentation | Tests |
|-----|----------|----------|---------------|-------|
| Unity | Unity 2021+ | C# | [Unity SDK](./sdk/unity/README.md) | [125+ tests](./docs/UNITY-SDK-TEST-SUMMARY.md) |
| Web | Browser/Node.js | TypeScript/JS | [Web SDK](./sdk/web/README.md) | [55+ tests](./docs/WEB-SDK-TEST-SUMMARY.md) |
| Unreal | UE 5.0+ | C++ | [Unreal SDK](./sdk/unreal/README.md) | [88+ tests](./docs/UNREAL-SDK-TEST-SUMMARY.md) |
| Avatar | Web (3D) | TypeScript | [Avatar SDK](./sdk/avatar/README.md) | N/A |
| Vision | Multi-platform | TypeScript | [Vision SDK](./sdk/vision/README.md) | N/A |

### Integration Guides

- [Avatar Integration Guide](./sdk/avatar/INTEGRATION-GUIDE.md) - React Three Fiber (5,000+ words)
- [3D Model Setup Guide](./docs/3D-MODEL-SETUP-GUIDE.md) - CDN deployment, 37 animations (7,000+ words)

---

## 🛠️ Development

### Local Development

| Guide | Description | Use Case |
|-------|-------------|----------|
| **[SQLite Development](./docs/development-sqlite.md)** | Lightweight local setup | Learning, development |
| [Database Comparison](./docs/database-comparison.md) | SQLite vs PostgreSQL | Choosing database |
| **[Architecture Guide](./CLAUDE.md)** | Complete technical architecture | Understanding system |
| **[Implementation Patterns](./docs/IMPLEMENTATION-PATTERNS.md)** | Service implementation guide (35,000+ words) | Building services |

### Developer Tools

- **[CLI Tool Guide](./docs/CLI-GUIDE.md)** - 5 commands (init, dev, deploy, config, status) (10,000+ words)
- **[CLI Tests](./tools/agl-cli/tests/README.md)** - 182+ tests, 85%+ coverage (3,000+ words)

### API Documentation

- **[REST API Reference](./docs/api/README.md)** - Complete API documentation (52 endpoints)
- [WebSocket API](./docs/api/websocket.md) - Real-time communication

---

## 📡 Services

### Core Services

| Service | Documentation | Purpose | Tests |
|---------|---------------|---------|-------|
| **Emotion** | [Emotion System](./docs/emotion-system.md) | Emotion detection (rule + ML hybrid) | 50+ tests |
| **Dialogue** | [Dialogue System](./docs/dialogue-system.md) | Dialogue generation (template + LLM) | 80+ tests |
| **Memory** | [Memory Service](./docs/memory-service.md) | Memory with vector search | 60+ tests |
| **Voice** | [Voice Service](./services/voice-service/README.md) | Text-to-speech synthesis (5,000+ words) | 48+ tests |
| **Dashboard** | [Analytics Dashboard](./services/dashboard/README.md) | Monitoring & cost tracking | 30+ tests |
| **Vision** | [Vision Service](./services/vision-service-template/README.md) | Screen analysis (template) | N/A |

---

## 🚀 Deployment

### Deployment Options

| Option | Guide | Cost | Difficulty |
|--------|-------|------|-----------|
| **One-Click Deploy** | **[One-Click Guide](./ONE-CLICK-DEPLOY.md)** ⭐ | **$0-200/mo** | **⭐** |
| Local (Monolith) | [Monolith Guide](./QUICKSTART-MONOLITH.md) | $0 | ⭐ |
| VPS | [Deployment Guide](./DEPLOYMENT.md#vps-deployment-simple) | $5-20/mo | ⭐⭐ |
| PaaS (Railway/Render) | [Deployment Guide](./DEPLOYMENT.md#platform-as-a-service-paas) | $20-50/mo | ⭐⭐ |
| Kubernetes | [K8s Guide](./docs/deployment-guide.md) | $200+/mo | ⭐⭐⭐⭐⭐ |

### Operations

- **[Monitoring & Metrics](./docs/METRICS-MONITORING-GUIDE.md)** - Performance tracking, cost analytics (7,000+ words)
- **[API Key Management](./docs/API-KEY-MANAGEMENT.md)** - Security guide (20,000+ words)
- [Monitoring Setup](./docs/monitoring-setup.md) - Prometheus + Grafana
- [Performance Optimization](./docs/performance-optimization.md) - Tuning guide
- [Deployment Guide (Full)](./docs/deployment-guide.md) - Production deployment

---

## 🏗️ Architecture

| Document | Audience | Content | Words |
|----------|----------|---------|-------|
| **[CLAUDE.md](./CLAUDE.md)** | Architects, Backend Devs | Complete technical architecture | 5,000+ |
| **[Implementation Patterns](./docs/IMPLEMENTATION-PATTERNS.md)** | Backend Developers | Service patterns, best practices | 35,000+ |
| [Deployment Guide](./docs/deployment-guide.md) | DevOps | Production deployment & operations | 10,000+ |

---

## 📖 Phase Documentation

### Phase Summaries

| Phase | Status | Summary | Documentation |
|-------|--------|---------|---------------|
| **Phase 1-3** | ✅ Complete | MVP, Production Features, Multi-platform | See README |
| **Phase 4A** | ✅ Complete | Testing, Monitoring, CLI Tools, Korean | [Phase 4A Summary](./docs/archive/PHASE-4A-COMPLETE-SUMMARY.md) (32,000+ words) |
| **Phase 4B** | ✅ Complete | Voice, Dashboard, Vision Template, Avatar | [Phase 4B Summary](./docs/PHASE-4B-SUMMARY.md) (60,000+ words) |
| **Phase 4B Fixes** | ✅ Complete | Code quality improvements (6.3→8.0) | [Fixes Summary](./docs/PHASE-4B-FIXES-SUMMARY.md) (10,000+ words) |
| **Phase 5** | ✅ Complete | STT, Voice Dialogue, Lip Sync, Vision | [Phase 5 Completion](./docs/PHASE-5-COMPLETION-REPORT.md) (20,000+ words) |

### Quality Assurance

- **[Verification Report](./docs/VERIFICATION-REPORT.md)** - Left-right game verification (doc ↔ code consistency)
- **[Corrections Applied](./docs/CORRECTIONS-APPLIED.md)** - Phase 5 corrections execution report

### Feature Documentation

- **[Product Features](./docs/PRODUCT-FEATURES.md)** - Complete feature catalog (25,000+ words)
  - 4 core functions
  - 8 backend services
  - 5 client SDKs
  - 52 API endpoints
  - 8 business scenarios

---

## 🌐 Localization

### Language Support

| Language | Status | Templates | Documentation |
|----------|--------|-----------|---------------|
| **English** | ✅ Complete | 1,000+ | All docs |
| **Chinese (中文)** | ✅ Complete | 1,000+ | [README.zh-CN.md](./README.zh-CN.md) |
| **Japanese (日本語)** | ✅ Complete | 1,000+ | Template files |
| **Korean (한국어)** | ✅ Complete | 300+ | [Korean Language Pack](./docs/KOREAN-LANGUAGE-PACK.md) (5,000+ words) |

---

## 🧪 Testing

### Test Documentation

| Component | Tests | Coverage | Documentation |
|-----------|-------|----------|---------------|
| **Web SDK** | 55+ | 85%+ | [Web SDK Tests](./docs/WEB-SDK-TEST-SUMMARY.md) (2,000+ words) |
| **Unity SDK** | 125+ | 85%+ | [Unity SDK Tests](./docs/UNITY-SDK-TEST-SUMMARY.md) (2,500+ words) |
| **Unreal SDK** | 88+ | 85%+ | [Unreal SDK Tests](./docs/UNREAL-SDK-TEST-SUMMARY.md) (2,500+ words) |
| **CLI Tool** | 182+ | 85%+ | [CLI Tests](./tools/agl-cli/tests/README.md) (3,000+ words) |
| **Services** | 318+ | 85%+ | Service-specific test files |
| **Total** | **818+** | **85%+** | N/A |

### Testing Guides

- [Testing Quickstart](./TESTING-QUICKSTART.md) - Quick testing guide
- [Testing Advanced](./TESTING-ADVANCED.md) - Advanced testing strategies
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

---

## 📊 Statistics & Metrics

### Project Statistics

- **Lines of Code**: ~50,000+ (services + SDKs + configuration)
- **Services**: 10 core microservices + 2 support tools
- **API Endpoints**: 52 endpoints
- **Test Cases**: 1,000+ tests
- **Documentation**: 120,000+ words
- **Languages**: 4 (en, zh, ja, ko)
- **Test Coverage**: 85%+

### Feature Metrics

- **Emotions**: 12 base × 3 intensities = 36 variants
- **Dialogue Templates**: 1,000+ templates
- **Characters**: 3 characters, 37 animations each
- **Voice Personas**: 3 voices (cheerful, cool, cute)

---

## 🔧 Troubleshooting

- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Common issues and solutions
- [FAQ](#) - Frequently asked questions (coming soon)
- [GitHub Issues](https://github.com/J0hnFFFF/agl/issues) - Report bugs

---

## 📝 Contributing

- [Contributing Guidelines](#) - How to contribute (coming soon)
- [Code of Conduct](#) - Community guidelines (coming soon)
- [Development Standards](#) - Code quality standards (coming soon)

**Development Standards:**
- ✅ Test coverage > 85%
- ✅ 0 TypeScript/ESLint errors
- ✅ Code review required
- ✅ Documentation for all features
- ✅ Security scan (Trivy) passing

---

## 📞 Support

- **Documentation**: Browse this index or [docs/](./docs) directory
- **Issues**: [GitHub Issues](https://github.com/J0hnFFFF/agl/issues)
- **Discussions**: [GitHub Discussions](https://github.com/J0hnFFFF/agl/discussions)
- **Email**: j0hn.wahahaha@gmail.com

---

## 📈 Quick Links

### Most Popular

1. [Quick Start Guide](./QUICKSTART.md) - Start in 5 minutes
2. [Unity SDK](./sdk/unity/README.md) - Unity integration
3. [Architecture Guide](./CLAUDE.md) - Technical architecture
4. [API Reference](./docs/api/README.md) - 52 endpoints
5. [Phase 4B Summary](./docs/PHASE-4B-SUMMARY.md) - Latest features

### For Developers

- [Implementation Patterns](./docs/IMPLEMENTATION-PATTERNS.md) - 35,000+ words
- [CLI Tool Guide](./docs/CLI-GUIDE.md) - Dev tools
- [Monitoring Guide](./docs/METRICS-MONITORING-GUIDE.md) - Metrics & costs

### For DevOps

- [Deployment Guide](./docs/deployment-guide.md) - Production deployment
- [API Key Management](./docs/API-KEY-MANAGEMENT.md) - Security
- [Monitoring Setup](./docs/monitoring-setup.md) - Prometheus + Grafana

---

**Total Documentation**: 100,000+ words across 30+ guides

**Last Updated**: 2025-11 (Phase 4B Complete)

**Version**: 2.0.0
