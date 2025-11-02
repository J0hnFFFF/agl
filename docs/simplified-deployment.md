# Simplified Deployment Guide

**快速部署方案 - 从复杂到简单的三种选择**

当前的完整架构（PostgreSQL + Redis + Qdrant + 5个微服务 + K8s）对于早期开发和小规模部署来说过于复杂。本文档提供三种简化方案。

---

## 🚀 方案对比

| 方案 | 复杂度 | 成本 | 性能 | 适用场景 |
|------|--------|------|------|----------|
| **Serverless** | ⭐ 最简单 | 免费起步 | 中等 | MVP、演示、小规模 |
| **SQLite单体** | ⭐⭐ 简单 | ~$5/月 | 高 | 早期产品、自托管 |
| **Railway托管** | ⭐⭐⭐ 中等 | ~$20/月 | 高 | 快速上线、扩展 |
| **完整K8s** | ⭐⭐⭐⭐⭐ 复杂 | ~$200/月 | 最高 | 生产环境、大规模 |

---

## 方案1：Serverless架构（推荐新手）

### ✅ 优势
- **零运维** - 不需要管理服务器
- **免费起步** - Vercel/Supabase都有免费额度
- **自动扩展** - 按需付费
- **5分钟部署** - 一键部署

### 架构图

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Vercel)                                   │
│  - Next.js App                                       │
│  - Avatar SDK (Three.js)                             │
│  - Vision SDK                                        │
└────────────┬────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────┐
│  Vercel Edge Functions / API Routes                 │
│  - /api/emotion  (替代emotion-service)               │
│  - /api/dialogue (替代dialogue-service)              │
│  - /api/memory   (替代memory-service)                │
└────────────┬────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      ↓             ↓
┌──────────┐  ┌──────────────┐
│ Supabase │  │ Upstash Redis│
│          │  │              │
│ - Auth   │  │ - Cache      │
│ - DB     │  │ - Queue      │
│ - Vector │  │              │
└──────────┘  └──────────────┘
```

### 技术栈替换

| 原组件 | Serverless替代 | 说明 |
|--------|----------------|------|
| PostgreSQL | **Supabase** | 免费25GB + Auth + 实时订阅 |
| Redis | **Upstash Redis** | Serverless Redis，免费10K命令/天 |
| Qdrant | **Supabase pgvector** | PostgreSQL向量扩展 |
| 5个微服务 | **Vercel Edge Functions** | Serverless函数 |
| K8s | **Vercel部署** | 自动扩展 |

### 快速开始

#### 1. 创建Supabase项目

```bash
# 访问 https://supabase.com
# 创建新项目（免费）
# 复制数据库URL
```

#### 2. 创建Upstash Redis

```bash
# 访问 https://upstash.com
# 创建Redis数据库（免费）
# 复制REDIS_URL
```

#### 3. 项目配置

```bash
# .env.local
DATABASE_URL="postgresql://..."  # Supabase URL
REDIS_URL="redis://..."          # Upstash URL
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
```

#### 4. 部署到Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
cd agl
vercel deploy --prod
```

### Supabase数据库设置

```sql
-- 1. 创建表（在Supabase SQL Editor中运行）
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'FREE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  character_persona TEXT DEFAULT 'cheerful',
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, external_id)
);

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  emotion TEXT,
  importance FLOAT DEFAULT 0.5,
  embedding vector(1536),  -- pgvector扩展
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 启用pgvector扩展（向量搜索）
CREATE EXTENSION vector;

-- 3. 创建向量索引
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops);

-- 4. 启用Row Level Security（可选）
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
```

### Vercel API Routes示例

创建 `pages/api/emotion/analyze.ts`:

```typescript
import type { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: NextRequest) {
  const { eventType, data, context } = await req.json();

  // 简单规则引擎
  const emotion = analyzeWithRules(eventType, data);

  if (emotion.confidence > 0.8) {
    return new Response(JSON.stringify(emotion), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 低置信度时调用Claude
  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Analyze emotion from game event: ${eventType}. Return: happy, sad, angry, excited, etc.`
    }],
  });

  return new Response(JSON.stringify({
    emotion: extractEmotion(message.content),
    confidence: 0.9,
    method: 'ml'
  }));
}

function analyzeWithRules(eventType, data) {
  // 简化的规则引擎
  if (eventType === 'player.victory') {
    return { emotion: 'excited', confidence: 0.95, intensity: 0.8 };
  }
  if (eventType === 'player.defeat') {
    return { emotion: 'disappointed', confidence: 0.9, intensity: 0.7 };
  }
  return { emotion: 'neutral', confidence: 0.5, intensity: 0.5 };
}
```

### 成本估算（月度）

| 服务 | 免费额度 | 付费起点 |
|------|----------|----------|
| Vercel | 100GB带宽 | $20/月（Pro） |
| Supabase | 500MB数据库 | $25/月（Pro） |
| Upstash | 10K命令/天 | $0.2/10万命令 |
| Claude API | - | ~$50/月（估算） |
| **总计** | **$0/月** | **~$95/月** |

---

## 方案2：SQLite单体架构

### ✅ 优势
- **单文件数据库** - 不需要安装PostgreSQL
- **本地开发友好** - 一个命令启动所有服务
- **高性能** - 无网络开销
- **易备份** - 复制一个文件即可

### 架构图

```
┌─────────────────────────────────────────────┐
│  AGL Monolith Service (Node.js)             │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ API Routes  │  │  WebSocket  │          │
│  └──────┬──────┘  └──────┬──────┘          │
│         │                │                 │
│  ┌──────▼────────────────▼──────┐          │
│  │  Service Layer               │          │
│  │  - EmotionService            │          │
│  │  - DialogueService           │          │
│  │  - MemoryService             │          │
│  └──────┬───────────────────────┘          │
│         │                                  │
│  ┌──────▼───────┐  ┌──────────┐           │
│  │   SQLite     │  │  Cache   │           │
│  │   + VSS      │  │ (Memory) │           │
│  │  (Vector)    │  │          │           │
│  └──────────────┘  └──────────┘           │
└─────────────────────────────────────────────┘
```

### 快速开始

#### 1. 安装依赖

```bash
cd agl
npm install better-sqlite3 sqlite-vss node-cache
```

#### 2. 创建单体服务

创建 `services/monolith/server.ts`:

```typescript
import express from 'express';
import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import NodeCache from 'node-cache';
import Anthropic from '@anthropic-ai/sdk';

// 初始化SQLite数据库
const db = new Database('agl.db');

// 启用WAL模式（提升并发性能）
db.pragma('journal_mode = WAL');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'FREE',
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    config TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    character_persona TEXT DEFAULT 'cheerful',
    preferences TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')),
    UNIQUE(game_id, external_id)
  );

  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    emotion TEXT,
    importance REAL DEFAULT 0.5,
    created_at INTEGER DEFAULT (strftime('%s','now'))
  );
`);

// 内存缓存（替代Redis）
const cache = new NodeCache({ stdTTL: 3600 });

// Express应用
const app = express();
app.use(express.json());

// API路由
app.post('/api/emotion/analyze', async (req, res) => {
  const { eventType, data } = req.body;

  // 检查缓存
  const cacheKey = `emotion:${eventType}:${JSON.stringify(data)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  // 规则引擎
  const emotion = analyzeWithRules(eventType, data);

  // 缓存结果
  cache.set(cacheKey, emotion);

  res.json(emotion);
});

app.post('/api/dialogue/generate', async (req, res) => {
  const { emotion, context } = req.body;

  // 90%使用模板，10%使用LLM
  const useTemplate = Math.random() < 0.9;

  if (useTemplate) {
    const dialogue = getTemplate(emotion);
    return res.json({ dialogue, source: 'template' });
  }

  // LLM生成
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Generate a short companion dialogue for emotion: ${emotion}. Context: ${context}`
    }],
  });

  const dialogue = extractText(message.content);
  res.json({ dialogue, source: 'llm' });
});

app.post('/api/memory/store', async (req, res) => {
  const { playerId, content, emotion, importance } = req.body;

  const stmt = db.prepare(`
    INSERT INTO memories (id, player_id, content, emotion, importance)
    VALUES (?, ?, ?, ?, ?)
  `);

  const id = crypto.randomUUID();
  stmt.run(id, playerId, content, emotion, importance);

  res.json({ id, success: true });
});

app.get('/api/memory/search', (req, res) => {
  const { playerId, limit = 10 } = req.query;

  const stmt = db.prepare(`
    SELECT * FROM memories
    WHERE player_id = ?
    ORDER BY importance DESC, created_at DESC
    LIMIT ?
  `);

  const memories = stmt.all(playerId, limit);
  res.json({ memories });
});

// WebSocket服务器
const server = app.listen(3000, () => {
  console.log('🚀 AGL Monolith running on http://localhost:3000');
});

const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('game_event', async (event) => {
    // 处理游戏事件
    const emotion = analyzeWithRules(event.type, event.data);
    socket.emit('companion_action', { emotion });
  });
});

// 辅助函数
function analyzeWithRules(eventType: string, data: any) {
  // 规则引擎逻辑
  if (eventType === 'player.victory') {
    return { emotion: 'excited', confidence: 0.95, intensity: 0.8 };
  }
  return { emotion: 'neutral', confidence: 0.5, intensity: 0.5 };
}

function getTemplate(emotion: string) {
  const templates = {
    excited: ['太棒了！', '你真厉害！', '完美！'],
    happy: ['不错哦~', '做得好！', '继续加油！'],
    // ... 更多模板
  };
  const options = templates[emotion] || ['继续努力！'];
  return options[Math.floor(Math.random() * options.length)];
}

function extractText(content: any) {
  return content[0].text;
}
```

#### 3. 启动服务

```bash
# 一个命令启动所有功能
npm run dev:monolith

# 或直接运行
node services/monolith/server.js
```

#### 4. 向量搜索（可选）

如果需要语义搜索，使用sqlite-vss：

```bash
npm install sqlite-vss
```

```typescript
import { loadVss } from 'sqlite-vss';

const db = new Database('agl.db');
await loadVss(db);

// 创建向量表
db.exec(`
  CREATE VIRTUAL TABLE vss_memories USING vss0(
    embedding(1536)
  );
`);

// 插入向量
const embedding = await getEmbedding(content); // OpenAI API
db.prepare('INSERT INTO vss_memories(rowid, embedding) VALUES (?, ?)')
  .run(memoryId, JSON.stringify(embedding));

// 搜索
const results = db.prepare(`
  SELECT memory_id, distance
  FROM vss_memories
  WHERE vss_search(embedding, ?)
  LIMIT 5
`).all(JSON.stringify(queryEmbedding));
```

### 部署到VPS（$5/月）

```bash
# DigitalOcean / Linode / Vultr
# 选择最小配置：1GB RAM, 1 CPU

# SSH到服务器
ssh root@your-server-ip

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 克隆代码
git clone <your-repo>
cd agl

# 安装依赖
npm install

# 使用PM2运行（保持进程）
npm install -g pm2
pm2 start services/monolith/server.js --name agl
pm2 save
pm2 startup

# 配置Nginx反向代理（可选）
apt install nginx
# ... nginx配置
```

---

## 方案3：Railway一键部署

### ✅ 优势
- **一键部署** - 连接GitHub自动部署
- **内置数据库** - PostgreSQL + Redis已集成
- **零配置** - 自动HTTPS、域名
- **开发者友好** - 免费$5额度/月

### 快速开始

#### 1. 准备Railway配置

创建 `railway.toml`:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start:monolith"
healthcheckPath = "/health"
healthcheckTimeout = 100

[[services]]
name = "api"
source = "services/api-service"

[[services]]
name = "postgres"
type = "postgresql"

[[services]]
name = "redis"
type = "redis"
```

#### 2. 一键部署

```bash
# 访问 https://railway.app
# 点击 "Deploy from GitHub"
# 选择你的仓库
# Railway自动检测并部署
```

#### 3. 环境变量配置

在Railway Dashboard中设置：

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # 自动注入
REDIS_URL=${{Redis.REDIS_URL}}           # 自动注入
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
```

### 成本

- 免费：$5额度/月（足够MVP）
- Hobby：$5/月起（按使用付费）
- Pro：$20/月（固定价格，无限使用）

---

## 方案对比矩阵

### 开发体验

| 特性 | Serverless | SQLite单体 | Railway | K8s完整版 |
|------|-----------|-----------|---------|-----------|
| 启动时间 | 5分钟 | 1分钟 | 3分钟 | 30分钟+ |
| 本地开发 | 一般 | 优秀 | 良好 | 复杂 |
| 调试难度 | 中等 | 简单 | 简单 | 困难 |
| 学习曲线 | 平缓 | 平缓 | 平缓 | 陡峭 |

### 性能

| 指标 | Serverless | SQLite单体 | Railway | K8s完整版 |
|------|-----------|-----------|---------|-----------|
| 冷启动 | 0-2秒 | 无 | 无 | 无 |
| 响应延迟 | 100-300ms | 10-50ms | 50-100ms | 10-50ms |
| 并发能力 | 高 | 中 | 高 | 最高 |
| 数据库性能 | 中等 | 高 | 高 | 最高 |

### 成本（1000 MAU）

| 方案 | 免费额度 | 付费成本 |
|------|---------|---------|
| Serverless | ✅ 可能免费 | ~$50/月 |
| SQLite单体 | ❌ | $5/月（VPS） |
| Railway | ⚠️ $5额度 | ~$20/月 |
| K8s完整版 | ❌ | ~$200/月 |

---

## 推荐选择

### 你应该选择：

1. **Serverless** - 如果你：
   - ✅ 刚开始做MVP
   - ✅ 不想管理服务器
   - ✅ 流量不确定
   - ✅ 想要免费起步

2. **SQLite单体** - 如果你：
   - ✅ 需要本地开发
   - ✅ 预算有限（$5/月）
   - ✅ 用户量<10K
   - ✅ 喜欢简单架构

3. **Railway** - 如果你：
   - ✅ 想要快速上线
   - ✅ 需要完整PostgreSQL
   - ✅ 愿意付费$20/月
   - ✅ 需要扩展性

4. **K8s完整版** - 如果你：
   - ✅ 已有付费用户
   - ✅ 需要高可用
   - ✅ 用户量>100K
   - ✅ 有运维团队

---

## 迁移路径

```
开始阶段: Serverless (免费)
    ↓
早期用户: SQLite单体 ($5/月)
    ↓
产品验证: Railway ($20/月)
    ↓
规模化: K8s完整版 ($200+/月)
```

---

## 下一步

选择一个方案并查看详细指南：

- [Serverless部署完整指南](./serverless-deployment-guide.md)
- [SQLite单体架构指南](./sqlite-monolith-guide.md)
- [Railway一键部署指南](./railway-deployment-guide.md)

---

**从简单开始，按需扩展！**
