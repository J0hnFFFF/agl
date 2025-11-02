# AGL平台文档索引

**快速找到你需要的文档**

---

## 📖 开始使用

### 新手入门

| 文档 | 描述 | 阅读时间 |
|------|------|---------|
| [README.md](./README.md) | 项目总览和特性介绍 | 5分钟 |
| [QUICKSTART.md](./QUICKSTART.md) | 快速开始指南 | 10分钟 |
| **[QUICKSTART-MONOLITH.md](./QUICKSTART-MONOLITH.md)** | 🌟 最简单的5分钟开始 | 5分钟 |
| [DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md) | 所有部署方案对比 | 10分钟 |

**推荐路径**：
1. 先读 `README.md` 了解项目
2. 再读 `QUICKSTART-MONOLITH.md` 快速开始
3. 然后读 `DEPLOYMENT-OPTIONS.md` 选择部署方案

---

## 🔧 开发指南

### 本地开发

| 文档 | 内容 | 适用场景 |
|------|------|---------|
| **[docs/development-sqlite.md](./docs/development-sqlite.md)** | 🌟 SQLite开发模式 | 本地开发、学习 |
| [docs/database-comparison.md](./docs/database-comparison.md) | 数据库选择指南 | 选择数据库 |
| [services/monolith/README.md](./services/monolith/README.md) | Monolith服务文档 | 单体服务 |
| [CLAUDE.md](./CLAUDE.md) | 完整架构文档 | 理解架构 |

**快速决策**：
- 想要最简单？ → `development-sqlite.md`
- 想要接近生产？ → `CLAUDE.md`
- 想要对比？ → `database-comparison.md`

---

## 🚀 部署指南

### 部署选项

| 文档 | 方案 | 成本 | 难度 |
|------|------|------|------|
| **[docs/simplified-deployment.md](./docs/simplified-deployment.md)** | 简化部署 | $0-20/月 | ⭐ |
| [docs/architecture/deployment.md](./docs/architecture/deployment.md) | K8s生产部署 | $200+/月 | ⭐⭐⭐⭐⭐ |
| [docs/monitoring-setup.md](./docs/monitoring-setup.md) | 监控配置 | - | ⭐⭐⭐ |
| [docs/performance-optimization.md](./docs/performance-optimization.md) | 性能优化 | - | ⭐⭐⭐⭐ |

**部署路径**：
1. **开发**: Monolith + SQLite ($0)
2. **测试**: Railway ($5-20/月)
3. **生产**: K8s ($200/月)

---

## 🎮 SDK文档

### 客户端集成

| SDK | 文档 | 语言 | 状态 |
|-----|------|------|------|
| Unity | [sdk/unity/README.md](./sdk/unity/README.md) | C# | ✅ 完整 |
| Web | [sdk/web/README.md](./sdk/web/README.md) | TypeScript | ✅ 完整 |
| Unreal | [sdk/unreal/README.md](./sdk/unreal/README.md) | C++ | ✅ 完整 |
| **Avatar** | **[sdk/avatar/README.md](./sdk/avatar/README.md)** | TypeScript | ✅ 完整 |
| **Vision** | **[sdk/vision/README.md](./sdk/vision/README.md)** | TypeScript | ✅ 完整 |

### SDK指南文档

| 文档 | 内容 |
|------|------|
| [docs/sdk/unity.md](./docs/sdk/unity.md) | Unity深度指南 |
| [docs/sdk/avatar.md](./docs/sdk/avatar.md) | Avatar SDK指南 |
| [docs/sdk/vision.md](./docs/sdk/vision.md) | Vision SDK指南 |

**选择SDK**：
- Unity游戏 → `sdk/unity/`
- Web游戏 → `sdk/web/`
- Unreal游戏 → `sdk/unreal/`
- 需要3D形象 → `sdk/avatar/`
- 需要画面分析 → `sdk/vision/`

---

## 📡 服务文档

### 核心服务

| 服务 | 文档 | 功能 |
|------|------|------|
| Emotion Service | [docs/emotion-system.md](./docs/emotion-system.md) | 情绪识别 |
| Dialogue Service | [docs/dialogue-system.md](./docs/dialogue-system.md) | 对话生成 |
| Memory Service | [docs/memory-service.md](./docs/memory-service.md) | 记忆管理 |
| Analytics | [docs/analytics-dashboard.md](./docs/analytics-dashboard.md) | 数据分析 |

### API参考

| 文档 | 内容 |
|------|------|
| [docs/api/README.md](./docs/api/README.md) | REST API文档 |
| [docs/api/websocket.md](./docs/api/websocket.md) | WebSocket API |

---

## 🏗️ 架构文档

### 系统设计

| 文档 | 内容 | 适合人群 |
|------|------|---------|
| [CLAUDE.md](./CLAUDE.md) | 完整技术架构 | 架构师、后端开发 |
| [docs/architecture/system-overview.md](./docs/architecture/system-overview.md) | 系统概览 | 所有人 |
| [docs/architecture/development.md](./docs/architecture/development.md) | 开发环境配置 | 开发者 |
| [docs/architecture/deployment.md](./docs/architecture/deployment.md) | 生产部署 | 运维人员 |

---

## 🎯 按场景查找

### 我想要...

#### 学习AGL

1. [README.md](./README.md) - 了解项目
2. [QUICKSTART-MONOLITH.md](./QUICKSTART-MONOLITH.md) - 5分钟开始
3. [docs/emotion-system.md](./docs/emotion-system.md) - 理解情绪系统
4. [docs/dialogue-system.md](./docs/dialogue-system.md) - 理解对话系统

#### 快速开发

1. [QUICKSTART-MONOLITH.md](./QUICKSTART-MONOLITH.md) - 最快启动
2. [docs/development-sqlite.md](./docs/development-sqlite.md) - 开发模式
3. [sdk/unity/README.md](./sdk/unity/README.md) 或你的平台SDK

#### 集成到游戏

1. 选择SDK：[sdk/unity/](./sdk/unity/) 或 [sdk/web/](./sdk/web/) 或 [sdk/unreal/](./sdk/unreal/)
2. [docs/integration-guide.md](./docs/integration-guide.md) - 集成指南
3. [docs/api/README.md](./docs/api/README.md) - API参考

#### 添加3D形象

1. [sdk/avatar/README.md](./sdk/avatar/README.md) - Avatar SDK
2. [docs/sdk/avatar.md](./docs/sdk/avatar.md) - 详细指南

#### 添加视觉AI

1. [sdk/vision/README.md](./sdk/vision/README.md) - Vision SDK
2. [docs/sdk/vision.md](./docs/sdk/vision.md) - 详细指南

#### 部署到生产

1. [DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md) - 选择方案
2. [docs/simplified-deployment.md](./docs/simplified-deployment.md) - 简化部署
3. [docs/architecture/deployment.md](./docs/architecture/deployment.md) - K8s部署

#### 性能优化

1. [docs/performance-optimization.md](./docs/performance-optimization.md) - 优化指南
2. [docs/database-comparison.md](./docs/database-comparison.md) - 数据库选择
3. [docs/monitoring-setup.md](./docs/monitoring-setup.md) - 监控设置

#### 故障排查

1. [QUICKSTART.md](./QUICKSTART.md) - Troubleshooting部分
2. [docs/development-sqlite.md](./docs/development-sqlite.md) - 常见问题
3. Service READMEs - 各服务的故障排查

---

## 📊 文档地图

```
agl/
├── README.md                           # 项目总览
├── README.zh-CN.md                     # 中文总览
├── QUICKSTART.md                       # 快速开始
├── QUICKSTART-MONOLITH.md             # 最简单开始 🌟
├── DEPLOYMENT-OPTIONS.md              # 部署选项对比
├── CLAUDE.md                          # 完整架构文档
│
├── docs/
│   ├── development-sqlite.md          # SQLite开发 🌟
│   ├── database-comparison.md         # 数据库对比
│   ├── simplified-deployment.md       # 简化部署 🌟
│   │
│   ├── emotion-system.md              # 情绪系统
│   ├── dialogue-system.md             # 对话系统
│   ├── memory-service.md              # 记忆服务
│   ├── analytics-dashboard.md         # 分析仪表板
│   ├── performance-optimization.md    # 性能优化
│   ├── monitoring-setup.md            # 监控设置
│   ├── integration-guide.md           # 集成指南
│   ├── testing.md                     # 测试指南
│   │
│   ├── api/
│   │   ├── README.md                  # API文档
│   │   └── websocket.md               # WebSocket API
│   │
│   ├── sdk/
│   │   ├── unity.md                   # Unity深度指南
│   │   ├── avatar.md                  # Avatar SDK指南
│   │   └── vision.md                  # Vision SDK指南
│   │
│   └── architecture/
│       ├── system-overview.md         # 系统概览
│       ├── development.md             # 开发环境
│       └── deployment.md              # 生产部署
│
└── sdk/
    ├── unity/README.md                # Unity SDK
    ├── web/README.md                  # Web SDK
    ├── unreal/README.md               # Unreal SDK
    ├── avatar/README.md               # Avatar SDK 🌟
    └── vision/README.md               # Vision SDK 🌟
```

---

## 🔍 按角色查找

### 游戏开发者

**主要文档**：
1. [QUICKSTART-MONOLITH.md](./QUICKSTART-MONOLITH.md)
2. [sdk/unity/README.md](./sdk/unity/README.md) 或你的平台
3. [docs/api/README.md](./docs/api/README.md)
4. [docs/integration-guide.md](./docs/integration-guide.md)

**可选**：
- [sdk/avatar/README.md](./sdk/avatar/README.md) - 3D形象
- [sdk/vision/README.md](./sdk/vision/README.md) - 视觉AI

---

### 后端开发者

**主要文档**：
1. [CLAUDE.md](./CLAUDE.md)
2. [docs/architecture/system-overview.md](./docs/architecture/system-overview.md)
3. [docs/development-sqlite.md](./docs/development-sqlite.md)
4. [docs/api/README.md](./docs/api/README.md)

**深入**：
- [docs/emotion-system.md](./docs/emotion-system.md)
- [docs/dialogue-system.md](./docs/dialogue-system.md)
- [docs/memory-service.md](./docs/memory-service.md)

---

### DevOps工程师

**主要文档**：
1. [DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md)
2. [docs/simplified-deployment.md](./docs/simplified-deployment.md)
3. [docs/architecture/deployment.md](./docs/architecture/deployment.md)
4. [docs/monitoring-setup.md](./docs/monitoring-setup.md)

**优化**：
- [docs/performance-optimization.md](./docs/performance-optimization.md)
- [docs/database-comparison.md](./docs/database-comparison.md)

---

### 产品经理

**主要文档**：
1. [README.md](./README.md)
2. [DEPLOYMENT-OPTIONS.md](./DEPLOYMENT-OPTIONS.md)
3. [docs/analytics-dashboard.md](./docs/analytics-dashboard.md)

---

## 📝 文档更新日志

### 最新更新（2025-11）

- ✅ 添加 Monolith服务文档
- ✅ 添加 SQLite开发指南
- ✅ 添加 数据库对比文档
- ✅ 添加 Avatar SDK指南
- ✅ 添加 Vision SDK指南
- ✅ 更新 快速开始指南
- ✅ 添加 简化部署指南
- ✅ 添加 部署选项对比

### 核心文档（稳定）

- README.md
- CLAUDE.md
- docs/api/README.md
- SDK READMEs

---

## 🆘 找不到文档？

### 搜索关键词

| 你想找... | 搜索关键词 | 推荐文档 |
|----------|-----------|---------|
| 快速开始 | quickstart, start | QUICKSTART-MONOLITH.md |
| SQLite | sqlite, database | development-sqlite.md |
| 部署 | deploy, deployment | DEPLOYMENT-OPTIONS.md |
| Unity | unity, c#, sdk | sdk/unity/README.md |
| 3D形象 | avatar, 3d, render | sdk/avatar/README.md |
| 视觉AI | vision, screen, ai | sdk/vision/README.md |
| 情绪 | emotion, detect | emotion-system.md |
| 对话 | dialogue, chat | dialogue-system.md |
| API | api, rest, http | docs/api/README.md |
| 架构 | architecture, system | CLAUDE.md |

### 仍然找不到？

1. 查看项目根目录的 `README.md`
2. 浏览 `docs/` 目录
3. 查看对应SDK的 `README.md`
4. 提交 [GitHub Issue](https://github.com/yourusername/agl/issues)

---

## 🎓 学习路径

### 初级（1周）

Day 1-2:
- [ ] README.md
- [ ] QUICKSTART-MONOLITH.md
- [ ] 运行Monolith服务
- [ ] 测试API

Day 3-4:
- [ ] docs/emotion-system.md
- [ ] docs/dialogue-system.md
- [ ] 集成Unity SDK（或你的平台）

Day 5-7:
- [ ] docs/memory-service.md
- [ ] sdk/avatar/README.md（可选）
- [ ] 构建简单demo

### 中级（2-3周）

Week 2:
- [ ] CLAUDE.md
- [ ] docs/architecture/system-overview.md
- [ ] docs/api/README.md
- [ ] 理解微服务架构

Week 3:
- [ ] docs/database-comparison.md
- [ ] docs/performance-optimization.md
- [ ] 切换到PostgreSQL
- [ ] 性能调优

Week 4:
- [ ] DEPLOYMENT-OPTIONS.md
- [ ] docs/simplified-deployment.md
- [ ] 部署到Railway/VPS

### 高级（1-2月）

Month 1:
- [ ] docs/architecture/deployment.md
- [ ] docs/monitoring-setup.md
- [ ] K8s部署
- [ ] 监控配置

Month 2:
- [ ] 所有service文档
- [ ] 深度定制
- [ ] 性能优化
- [ ] 生产运维

---

**快速导航回到顶部** ⬆️
