# 🚀 AGL - 一键部署指南

**适用于**: 开源引擎快速部署

---

## 📋 三种部署方式

### 🥇 方式 1: Monolith 模式（最简单）

**推荐场景**: 快速测试、学习、小项目

**优势**:
- ✅ 无需 Docker
- ✅ 一条命令启动
- ✅ 使用 SQLite（零配置）
- ✅ 60 秒启动

**启动**:
```bash
npm run dev:monolith
```

服务运行在 `http://localhost:3000` ✨

---

### 🥈 方式 2: 基础设施 + 手动服务（推荐开发）

**推荐场景**: 开发调试、按需启动服务

**步骤**:

**1. 启动基础设施**
```bash
# Linux/Mac
npm run dev:stack

# Windows
docker-compose up -d postgres redis qdrant
```

**2. 启动需要的服务（在不同终端）**
```bash
npm run dev:api              # API Service (port 3000)
npm run dev:realtime         # Realtime Gateway (port 3001)
npm run dev:memory           # Memory Service (port 3002)
npm run dev:emotion          # Emotion Service (port 8000)
npm run dev:dialogue         # Dialogue Service (port 8001)
npm run dev:voice            # Voice Service (port 8003)
npm run dev:stt              # STT Service (port 8004)
npm run dev:voice-dialogue   # Voice Dialogue (port 8005)
npm run dev:lipsync          # Lip Sync Service (port 8006)
npm run dev:vision           # Vision Service (port 8007)
npm run dev:dashboard        # Dashboard (port 5000)
```

**优势**:
- ✅ 只启动需要的服务
- ✅ 易于调试和查看日志
- ✅ 节省资源

---

### 🥉 方式 3: 一键脚本（开发中）

**推荐场景**: 生产部署、完整测试

**启动**:

Linux/Mac:
```bash
chmod +x start-all.sh
./start-all.sh
```

Windows:
```batch
start-all.bat
```

**注意**: 完整的 Docker 部署目前还在完善中，需要：
- 所有服务的 Dockerfile
- 8GB+ RAM
- Docker 运行中

---

## ⚙️ 配置要求

### 最小配置（Monolith 模式）
- Node.js 20+
- 仅需配置 `.env` 文件

### 标准配置（推荐）
- Node.js 20+
- Python 3.11+
- Docker + Docker Compose
- 4GB RAM

### 完整配置
- 所有标准配置
- 8GB+ RAM
- PostgreSQL 15+
- Redis 7+
- Qdrant

---

## 📝 环境配置

### 1. 复制环境文件
```bash
cp .env.example .env
```

### 2. 编辑 `.env` 文件

**必需 (Monolith 模式)**:
```bash
ANTHROPIC_API_KEY=sk-ant-...     # Claude API
OPENAI_API_KEY=sk-...            # OpenAI API (可选)
```

**必需 (微服务模式)**:
```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Database
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://agl_user:agl_password_dev@localhost:5432/agl_dev
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333

# Security
JWT_SECRET=your-random-secret-here
API_KEY_SECRET=your-api-key-secret-here
```

---

## 🔍 验证部署

### 检查基础设施
```bash
# PostgreSQL
docker-compose ps postgres

# Redis
docker-compose ps redis

# Qdrant
docker-compose ps qdrant
```

### 检查服务健康
```bash
# API Service
curl http://localhost:3000/health

# Emotion Service
curl http://localhost:8000/health

# Dialogue Service
curl http://localhost:8001/health

# Dashboard
open http://localhost:5000
```

---

## 🛑 停止服务

### 停止基础设施
```bash
docker-compose down
```

### 停止 Monolith
```
Ctrl+C
```

### 停止手动服务
```
每个终端 Ctrl+C
```

---

## 🐛 常见问题

### 问题 1: 端口被占用
```bash
# 检查端口占用
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# 修改 .env 中的端口
API_SERVICE_PORT=3001
```

### 问题 2: Docker 未启动
```bash
# 检查 Docker 状态
docker info

# 启动 Docker Desktop (Windows/Mac)
# 或 systemctl start docker (Linux)
```

### 问题 3: API Key 无效
```bash
# 检查 .env 文件
cat .env | grep API_KEY

# 确保没有多余的空格或引号
ANTHROPIC_API_KEY=sk-ant-xxx  # ✅ 正确
ANTHROPIC_API_KEY="sk-ant-xxx"  # ❌ 错误（有引号）
```

### 问题 4: 数据库连接失败
```bash
# 检查 Docker 容器状态
docker-compose ps

# 重启基础设施
docker-compose restart postgres

# 查看日志
docker-compose logs postgres
```

---

## 📊 部署对比

| 特性 | Monolith | 基础设施+手动 | 完整Docker |
|------|----------|---------------|------------|
| **启动速度** | ⚡ 最快 (60秒) | 🚀 快 (2分钟) | 🐢 慢 (5-10分钟) |
| **资源占用** | 💚 低 (1GB) | 💛 中 (2-3GB) | 🔴 高 (4-8GB) |
| **适用场景** | 学习、测试 | 开发、调试 | 生产、CI/CD |
| **配置难度** | ⭐ 简单 | ⭐⭐ 中等 | ⭐⭐⭐ 复杂 |
| **依赖** | Node.js | Node.js + Python + Docker | 全部 + Dockerfiles |

---

## 🎯 推荐方案

### 对于新用户
```bash
npm run dev:monolith
```

### 对于开发者
```bash
# 1. 启动基础设施
npm run dev:stack

# 2. 只启动需要的服务
npm run dev:api
npm run dev:emotion
npm run dev:dialogue
```

### 对于生产环境
参考 [DEPLOYMENT.md](./docs/deployment-guide.md) 获取完整的 Kubernetes 部署方案。

---

## ✨ 下一步

部署成功后：

1. 📖 阅读 [QUICKSTART.md](./QUICKSTART.md) 了解如何使用 API
2. 🎮 查看 [SDK 文档](./sdk/) 集成到你的游戏
3. 📊 访问 Dashboard (http://localhost:5000) 查看监控数据
4. 🧪 运行测试：`npm test`

---

**需要帮助？**
- 📚 查看 [完整文档](./docs/)
- 💬 提交 [GitHub Issue](https://github.com/J0hnFFFF/agl/issues)
- 📧 邮件联系: j0hn.wahahaha@gmail.com

---

**最后更新**: 2025-11
**适用版本**: v2.1.0 (Phase 5)
