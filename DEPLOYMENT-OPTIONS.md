# AGL部署选项总览

**从开发到生产 - 完整部署路径**

---

## 🎯 快速选择

根据你的情况选择最适合的方案：

| 你的情况 | 推荐方案 | 成本 | 启动时间 |
|----------|---------|------|---------|
| 🎓 学习AGL | Monolith + SQLite | $0 | 1分钟 |
| 💻 个人开发 | Monolith + SQLite | $0 | 1分钟 |
| 👥 小团队开发 | Monolith + SQLite | $0-5/月 | 1分钟 |
| 🚀 MVP上线 | Railway + PostgreSQL | $5-20/月 | 5分钟 |
| 📈 扩展阶段 | Serverless/Railway | $20-100/月 | 10分钟 |
| 🏢 生产环境 | K8s完整版 | $200+/月 | 30分钟 |

---

## 方案对比

### 1. 🟢 Monolith + SQLite（开发推荐）

**最简单的方案 - 一个命令启动所有功能**

```bash
npm run dev:monolith
```

#### 特点
- ✅ 零配置 - 不需要Docker、PostgreSQL、Redis
- ✅ 单进程 - 所有功能在一个服务中
- ✅ 单文件数据库 - `dev.db`
- ✅ 内存缓存 - 替代Redis
- ✅ 完整功能 - 情绪、对话、记忆、WebSocket

#### 适用场景
- 本地开发
- 学习和实验
- 单元测试
- 快速原型

#### 性能指标
- 响应时间: 10-50ms
- 并发能力: 1000连接
- 内存占用: ~100MB
- 数据库: <1GB推荐

#### 成本
- **开发**: $0
- **VPS部署**: $5/月

#### 完整文档
- [Monolith服务README](./services/monolith/README.md)
- [快速开始指南](./QUICKSTART-MONOLITH.md)
- [SQLite开发指南](./docs/development-sqlite.md)

---

### 2. 🔵 完整微服务 + SQLite（开发可选）

**保持微服务架构，但使用SQLite简化数据库**

```bash
# 启动服务（无需Docker）
npm run dev:api
npm run dev:realtime
npm run dev:emotion
npm run dev:dialogue
npm run dev:memory
```

#### 配置

`.env`:
```bash
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db
# 不设置REDIS_URL会使用内存缓存
```

#### 特点
- ✅ 微服务架构 - 与生产一致
- ✅ SQLite数据库 - 简化设置
- ✅ 可选Redis - 可用可不用
- ⚠️ 需要Python - Emotion/Dialogue服务

#### 适用场景
- 学习微服务架构
- 团队开发（各自独立数据库）
- 接近生产的开发环境

#### 成本
- $0（本地）

#### 完整文档
- [SQLite开发指南](./docs/development-sqlite.md)
- [数据库对比](./docs/database-comparison.md)

---

### 3. 🟡 完整微服务 + PostgreSQL（接近生产）

**完整的开发环境，与生产环境一致**

```bash
# 启动数据库
npm run dev:stack

# 迁移数据库
npm run db:migrate

# 启动所有服务
npm run dev:api
npm run dev:realtime
npm run dev:emotion
npm run dev:dialogue
npm run dev:memory
```

#### 配置

`.env`:
```bash
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://agl_user:agl_password_dev@localhost:5432/agl_dev
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
```

#### 特点
- ✅ 完整架构 - 所有组件
- ✅ 与生产一致 - 相同技术栈
- ✅ 向量搜索 - Qdrant支持
- ⚠️ 需要Docker - 3个容器（PostgreSQL, Redis, Qdrant）

#### 适用场景
- 生产前测试
- 性能调优
- 学习完整架构
- Staging环境

#### 成本
- $0（本地Docker）

#### 完整文档
- [架构文档](./CLAUDE.md)
- [开发指南](./docs/architecture/development.md)

---

### 4. 🟠 Railway一键部署

**托管服务 - 最快上线**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/agl)

#### 特点
- ✅ 一键部署 - 连接GitHub自动部署
- ✅ 内置数据库 - PostgreSQL + Redis
- ✅ 自动HTTPS - 域名自动配置
- ✅ 零运维 - 自动扩展

#### 适用场景
- MVP快速上线
- 小规模生产（<10K用户）
- 不想管理服务器

#### 配置
在Railway Dashboard设置环境变量：
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
```

#### 成本
- 免费: $5额度/月
- Hobby: $5/月起
- Pro: $20/月固定

#### 完整文档
- [简化部署指南](./docs/simplified-deployment.md)

---

### 5. 🟣 Serverless架构

**完全无服务器 - 自动扩展**

```
Vercel (Functions) + Supabase (DB) + Upstash (Redis)
```

#### 架构
```
Frontend (Vercel)
    ↓
Edge Functions (Vercel)
    ↓
Supabase (PostgreSQL + Vector)
Upstash (Redis)
```

#### 特点
- ✅ 零运维 - 完全托管
- ✅ 自动扩展 - 按需付费
- ✅ 全球CDN - 低延迟
- ✅ 免费起步 - 有免费额度

#### 适用场景
- 全球化产品
- 流量不确定
- 不想管理服务器

#### 成本
- 免费: Vercel(100GB) + Supabase(500MB)
- 付费: $50-200/月（看使用量）

#### 完整文档
- [Serverless部署指南](./docs/simplified-deployment.md#方案1serverless架构推荐新手)

---

### 6. 🔴 Kubernetes完整版（生产推荐）

**企业级部署 - 高可用**

```bash
# 构建镜像
npm run build:docker

# 部署到K8s
kubectl apply -f infrastructure/k8s/
```

#### 架构
- 5个微服务 Pods
- PostgreSQL（主从）
- Redis Cluster
- Qdrant Cluster
- Prometheus + Grafana
- Nginx Ingress

#### 特点
- ✅ 高可用 - 多副本
- ✅ 水平扩展 - 自动扩缩容
- ✅ 服务发现 - K8s原生
- ✅ 滚动更新 - 零停机
- ⚠️ 复杂 - 需要K8s知识

#### 适用场景
- 生产环境（>10K用户）
- 高并发需求
- 需要高可用
- 企业级应用

#### 成本
- 最小: $200/月（DigitalOcean K8s）
- 推荐: $500/月（3节点集群）
- 企业: $1000+/月（多区域、高可用）

#### 完整文档
- [部署指南](./docs/architecture/deployment.md)
- [K8s配置](./infrastructure/k8s/README.md)

---

## 迁移路径

### 典型升级路径

```
阶段1: 开发
  Monolith + SQLite ($0)
      ↓
阶段2: 早期测试
  微服务 + SQLite ($0)
      ↓
阶段3: MVP上线
  Railway ($20/月)
      ↓
阶段4: 用户增长
  Serverless ($100/月)
      ↓
阶段5: 规模化
  K8s ($500/月)
```

### 数据库迁移

**SQLite → PostgreSQL**:
```bash
# 1. 更新环境变量
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://...

# 2. 重新生成Prisma
npx prisma generate

# 3. 运行迁移
npx prisma migrate deploy

# 4. 迁移数据（如需要）
npx prisma db pull
```

耗时: 1-4小时

---

## 决策树

```
你的用户量？
│
├─ 0-100用户
│  └─ 用Monolith + SQLite
│
├─ 100-1000用户
│  ├─ 想要简单？
│  │  └─ 用Railway
│  └─ 想要控制？
│     └─ VPS + Monolith
│
├─ 1K-10K用户
│  ├─ 全球用户？
│  │  └─ 用Serverless
│  └─ 区域用户？
│     └─ Railway/VPS
│
└─ 10K+用户
   └─ 必须用K8s完整版
```

---

## 成本对比（月度）

| 方案 | 基础设施 | LLM API | 总计 | 用户量 |
|------|---------|---------|------|--------|
| Monolith开发 | $0 | $0 | **$0** | 本地 |
| Monolith生产 | $5 | $50 | **$55** | <1K |
| Railway | $20 | $100 | **$120** | 1K-10K |
| Serverless | $50 | $200 | **$250** | 10K-50K |
| K8s完整版 | $500 | $500 | **$1000** | 50K+ |

*LLM API成本按实际使用计算*

---

## 性能对比

| 方案 | 响应时间 | 并发 | 可用性 |
|------|---------|------|--------|
| Monolith | 10-50ms | 1K | 单点 |
| 微服务+SQLite | 20-80ms | 5K | 中 |
| Railway | 50-150ms | 10K | 高 |
| Serverless | 100-300ms | 无限 | 最高 |
| K8s | 10-50ms | 100K+ | 最高 |

---

## 推荐方案

### 🥇 学习阶段
→ **Monolith + SQLite**
- 一行命令启动
- 零成本
- 完整功能

### 🥈 开发阶段
→ **Monolith + SQLite** 或 **微服务 + SQLite**
- 简单快速
- 易于调试
- 接近生产

### 🥉 MVP上线
→ **Railway**
- 5分钟部署
- $20/月
- 自动扩展

### 🏆 生产环境
→ **K8s完整版**
- 企业级
- 高可用
- 可扩展

---

## 下一步

选择你的方案并查看详细指南：

1. **Monolith开发** → [快速开始](./QUICKSTART-MONOLITH.md)
2. **SQLite开发** → [SQLite指南](./docs/development-sqlite.md)
3. **Railway部署** → [简化部署](./docs/simplified-deployment.md)
4. **K8s部署** → [部署指南](./docs/architecture/deployment.md)

---

**选择适合你的方案，随着业务增长逐步升级！** 🚀
