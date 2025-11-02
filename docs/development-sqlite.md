# SQLite开发模式指南

**简化的开发环境 - 无需Docker、PostgreSQL、Redis**

本指南展示如何使用SQLite进行本地开发，完全不需要Docker和复杂的数据库设置。

---

## 🎯 为什么使用SQLite开发模式？

### ✅ 优势

- **零依赖** - 不需要安装PostgreSQL、Redis、Qdrant
- **即时启动** - 无需等待Docker容器启动
- **简单备份** - 数据库就是一个文件
- **快速重置** - 删除文件即可重置数据
- **跨平台** - Windows/Mac/Linux完全一致
- **低资源** - 内存占用<100MB

### ⚠️ 限制

- **不支持并发写入** - 适合开发，不适合生产
- **无向量搜索** - 需要额外配置sqlite-vss
- **单机** - 无法水平扩展

---

## 🚀 快速开始

### 方法1：使用Monolith服务（最简单）

```bash
# 一键启动所有功能
npm run dev:monolith
```

这会启动：
- ✅ HTTP API (端口3000)
- ✅ WebSocket服务
- ✅ SQLite数据库
- ✅ 内存缓存
- ✅ 情绪分析
- ✅ 对话生成
- ✅ 记忆管理

**完整文档**: [Monolith README](../services/monolith/README.md)

---

### 方法2：使用现有微服务（保持架构）

如果你想保持微服务架构，但使用SQLite：

#### 1. 配置环境变量

创建 `.env` 文件：

```bash
# 复制模板
cp .env.example .env
```

编辑 `.env`，设置为SQLite模式：

```bash
# ============================================
# 数据库配置 - SQLite开发模式
# ============================================
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db

# ============================================
# 缓存 - 使用内存缓存（可选Redis）
# ============================================
# 注释掉Redis，服务会自动使用内存缓存
# REDIS_URL=redis://localhost:6379

# ============================================
# 向量数据库 - 跳过（可选）
# ============================================
# QDRANT_URL=http://localhost:6333

# ============================================
# API Keys（可选，不用LLM可以不设置）
# ============================================
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
```

#### 2. 生成Prisma客户端

```bash
cd services/api-service
npx prisma generate
```

#### 3. 运行数据库迁移

```bash
npx prisma migrate dev --name init
```

这会创建 `dev.db` 文件在 `services/api-service/` 目录下。

#### 4. 启动服务

```bash
# 终端1 - API服务
npm run dev:api

# 终端2 - Realtime Gateway
npm run dev:realtime

# 终端3 - Emotion Service (Python)
npm run dev:emotion

# 终端4 - Dialogue Service (Python)
npm run dev:dialogue

# 终端5 - Memory Service
npm run dev:memory
```

---

## 📊 对比：PostgreSQL vs SQLite

| 特性 | PostgreSQL | SQLite |
|------|-----------|--------|
| 安装 | 需要Docker/本地安装 | ✅ 内置，零配置 |
| 启动时间 | 30-60秒 | ✅ 即时 |
| 内存占用 | ~200MB | ✅ ~10MB |
| 并发写入 | ✅ 高性能 | ⚠️ 有限 |
| 向量搜索 | ✅ pgvector | ⚠️ 需要sqlite-vss |
| 数据备份 | 需要工具 | ✅ 复制文件 |
| 生产环境 | ✅ 推荐 | ❌ 不推荐 |
| 开发环境 | 可以 | ✅ 强烈推荐 |

---

## 🗄️ 数据库管理

### 查看数据库

#### 使用Prisma Studio（推荐）

```bash
cd services/api-service
npx prisma studio
```

浏览器会自动打开 `http://localhost:5555`，可视化管理数据。

#### 使用SQLite CLI

```bash
# 安装sqlite3 (如果没有)
# Windows: choco install sqlite
# Mac: brew install sqlite3
# Linux: apt-get install sqlite3

# 打开数据库
sqlite3 services/api-service/dev.db

# 查看表
.tables

# 查询数据
SELECT * FROM clients;
SELECT * FROM games;
SELECT * FROM players LIMIT 10;

# 退出
.quit
```

#### 使用VS Code扩展

安装 "SQLite Viewer" 扩展，然后：
1. 在VS Code中打开 `dev.db` 文件
2. 点击右上角"Open Database"

### 备份数据库

```bash
# 备份
cp services/api-service/dev.db services/api-service/dev.db.backup

# 恢复
cp services/api-service/dev.db.backup services/api-service/dev.db
```

### 重置数据库

```bash
# 删除数据库文件
rm services/api-service/dev.db

# 重新运行迁移
cd services/api-service
npx prisma migrate dev
```

---

## 🔄 切换到PostgreSQL（生产部署）

当你准备部署到生产时：

### 1. 更新环境变量

```bash
# .env.production
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379
QDRANT_URL=http://host:6333
```

### 2. 生成新的Prisma客户端

```bash
cd services/api-service
DATABASE_PROVIDER=postgresql npx prisma generate
```

### 3. 运行迁移

```bash
npx prisma migrate deploy
```

### 4. 数据迁移（可选）

如果需要从SQLite迁移数据到PostgreSQL：

```bash
# 导出SQLite数据
sqlite3 dev.db .dump > data.sql

# 转换并导入PostgreSQL（需要手动调整SQL）
# 或使用工具如 pgloader
```

---

## 💡 最佳实践

### 1. 环境隔离

```bash
# 开发环境
.env                    # SQLite
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db

# 测试环境
.env.test               # SQLite (独立数据库)
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./test.db

# 生产环境
.env.production         # PostgreSQL
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://...
```

### 2. Git忽略数据库文件

确保 `.gitignore` 包含：

```gitignore
# SQLite databases
*.db
*.db-journal
*.db-shm
*.db-wal

# Prisma
prisma/migrations/
```

### 3. 种子数据

创建 `prisma/seed.ts` 用于开发数据：

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 创建测试客户端
  const client = await prisma.client.create({
    data: {
      name: 'Test Client',
      email: 'test@example.com',
      apiKey: 'test-key-123',
      tier: 'FREE',
    },
  });

  // 创建测试游戏
  const game = await prisma.game.create({
    data: {
      clientId: client.id,
      name: 'Test Game',
      description: 'A test game for development',
    },
  });

  console.log('Seed data created:', { client, game });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

运行种子：

```bash
npx prisma db seed
```

---

## 🐛 常见问题

### Q: SQLite支持所有Prisma特性吗？

A: 大部分支持，但有些限制：
- ❌ 不支持枚举（Enum）- 会转换为字符串
- ❌ 不支持全文搜索 - 需要额外配置
- ❌ 并发写入性能较差
- ✅ 支持关系、外键、索引

### Q: 如何添加向量搜索？

A: 使用 `sqlite-vss` 扩展：

```bash
npm install sqlite-vss
```

在代码中加载：

```typescript
import Database from 'better-sqlite3';
import { loadVss } from 'sqlite-vss';

const db = new Database('dev.db');
await loadVss(db);

db.exec(`
  CREATE VIRTUAL TABLE vss_memories USING vss0(
    embedding(1536)
  );
`);
```

完整示例见 [Monolith服务](../services/monolith/README.md)。

### Q: SQLite性能够用吗？

A: 对于开发环境完全够用：
- ✅ 读取速度极快（本地文件）
- ✅ 轻量级查询 < 1ms
- ⚠️ 并发写入有限（开发环境单用户无影响）
- ⚠️ 不适合>1000并发用户

### Q: 数据库文件变大怎么办？

A: 运行VACUUM命令：

```bash
sqlite3 dev.db "VACUUM;"
```

或在代码中：

```typescript
db.exec('VACUUM');
```

### Q: 如何在CI/CD中使用？

A: 非常简单：

```yaml
# .github/workflows/test.yml
- name: Test
  env:
    DATABASE_PROVIDER: sqlite
    DATABASE_URL: file:./test.db
  run: |
    npx prisma migrate deploy
    npm test
```

---

## 📈 性能优化

### 1. 启用WAL模式

```sql
PRAGMA journal_mode = WAL;
```

这会显著提升并发读取性能。

### 2. 调整缓存大小

```sql
PRAGMA cache_size = -64000;  -- 64MB缓存
```

### 3. 使用连接池

虽然SQLite是单文件，但可以使用读连接池：

```typescript
import Database from 'better-sqlite3';

const db = new Database('dev.db', {
  readonly: false,
  fileMustExist: false,
});

db.pragma('journal_mode = WAL');
db.pragma('cache_size = -64000');
```

---

## 🎓 学习资源

- [Prisma SQLite文档](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [SQLite官方文档](https://www.sqlite.org/docs.html)
- [sqlite-vss向量搜索](https://github.com/asg017/sqlite-vss)

---

## 总结

### 推荐使用场景

✅ **使用SQLite**：
- 本地开发
- 单元测试
- 原型验证
- 学习和实验

❌ **使用PostgreSQL**：
- 生产部署
- 高并发场景
- 需要向量搜索
- 多实例部署

### 最佳实践

1. **开发**: SQLite + Monolith服务
2. **测试**: SQLite + 独立测试数据库
3. **Staging**: PostgreSQL（与生产一致）
4. **生产**: PostgreSQL + Redis + Qdrant

---

**开发就用SQLite，简单又高效！** 🚀
