# 数据库选择指南

**PostgreSQL vs SQLite - 如何选择？**

---

## 快速决策树

```
你是在...？
│
├─ 本地开发/学习
│  └─ ✅ 使用 SQLite
│
├─ 团队开发（<5人）
│  └─ ✅ 使用 SQLite 或 PostgreSQL（取决于团队偏好）
│
├─ 测试环境
│  └─ ✅ 使用 SQLite（快速、隔离）
│
├─ Staging环境
│  └─ ✅ 使用 PostgreSQL（与生产一致）
│
└─ 生产环境
   └─ ✅ 必须使用 PostgreSQL
```

---

## 详细对比

| 维度 | SQLite | PostgreSQL |
|------|--------|-----------|
| **安装** | ✅ 零配置，内置 | ⚠️ 需要Docker或本地安装 |
| **启动时间** | ✅ < 1秒 | ⚠️ 30-60秒 |
| **内存占用** | ✅ ~10MB | ⚠️ ~200MB |
| **磁盘占用** | ✅ 单文件（几MB） | ⚠️ 数据目录（几GB） |
| **并发读取** | ✅ 优秀 | ✅ 优秀 |
| **并发写入** | ⚠️ 单线程 | ✅ 多线程 |
| **事务支持** | ✅ 完整ACID | ✅ 完整ACID |
| **外键约束** | ✅ 支持 | ✅ 支持 |
| **JSON支持** | ✅ 支持 | ✅ 更强大 |
| **全文搜索** | ⚠️ 基础FTS5 | ✅ 强大的tsvector |
| **向量搜索** | ⚠️ 需要sqlite-vss扩展 | ✅ pgvector原生支持 |
| **数据库大小限制** | ⚠️ 建议<1GB | ✅ 无限制 |
| **水平扩展** | ❌ 不支持 | ✅ 支持（复制、分片） |
| **备份** | ✅ 复制文件 | ⚠️ 需要pg_dump |
| **恢复** | ✅ 复制文件 | ⚠️ 需要pg_restore |
| **重置** | ✅ 删除文件 | ⚠️ DROP DATABASE |
| **版本管理** | ✅ 文件可进Git LFS | ❌ 不适合 |
| **调试工具** | ✅ Prisma Studio, sqlite3, VS Code | ✅ pgAdmin, Prisma Studio |
| **学习曲线** | ✅ 简单 | ⚠️ 中等 |
| **运维成本** | ✅ 零 | ⚠️ 需要DBA知识 |

---

## 场景分析

### 场景1：个人开发者学习AGL

**推荐**: ✅ SQLite

**理由**:
- 无需配置Docker
- 一个命令启动（`npm run dev:monolith`）
- 数据库就是一个文件，易于理解
- 重置简单（删除文件）

**启动方式**:
```bash
npm run dev:monolith
```

---

### 场景2：小团队开发（2-5人）

**推荐**: ✅ SQLite 或 PostgreSQL

**SQLite优势**:
- 每个开发者独立数据库
- 无需共享数据库服务器
- Git可以管理种子数据

**PostgreSQL优势**:
- 与生产环境一致
- 团队共享测试数据
- 更好的并发支持

**决策建议**:
- 如果追求简单 → SQLite
- 如果追求一致性 → PostgreSQL

---

### 场景3：CI/CD测试环境

**推荐**: ✅ SQLite

**理由**:
- 每次测试独立数据库
- 无需启动/停止PostgreSQL
- 测试速度快（内存数据库）
- 并行测试无冲突

**GitHub Actions示例**:
```yaml
- name: Test
  env:
    DATABASE_PROVIDER: sqlite
    DATABASE_URL: file::memory:?cache=shared
  run: |
    npx prisma migrate deploy
    npm test
```

---

### 场景4：Staging环境

**推荐**: ✅ PostgreSQL

**理由**:
- 必须与生产环境一致
- 测试数据库性能
- 验证迁移脚本
- 压力测试

---

### 场景5：生产环境

**推荐**: ✅ PostgreSQL（必须）

**理由**:
- 高并发支持
- 数据持久性保证
- 备份/恢复能力
- 监控和优化工具
- 水平扩展能力

---

## 切换成本分析

### SQLite → PostgreSQL

**难度**: ⭐⭐ 简单

**步骤**:
1. 更新 `.env`:
   ```bash
   DATABASE_PROVIDER=postgresql
   DATABASE_URL=postgresql://...
   ```

2. 重新生成Prisma客户端:
   ```bash
   npx prisma generate
   ```

3. 运行迁移:
   ```bash
   npx prisma migrate deploy
   ```

**数据迁移**:
- 小数据量（<1GB）: 使用Prisma导出/导入
- 大数据量: 使用pgloader工具

**耗时**: 1-4小时（取决于数据量）

---

### PostgreSQL → SQLite

**难度**: ⭐ 非常简单

**步骤**:
1. 更新 `.env`:
   ```bash
   DATABASE_PROVIDER=sqlite
   DATABASE_URL=file:./dev.db
   ```

2. 重新生成并迁移:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

**耗时**: 10分钟

---

## 性能基准测试

### 读取性能

| 操作 | SQLite | PostgreSQL |
|------|--------|-----------|
| 简单查询 | 0.5ms | 1-2ms |
| JOIN查询 | 2-5ms | 3-8ms |
| 聚合查询 | 5-15ms | 10-30ms |
| 全表扫描(10K行) | 50ms | 80ms |

**结论**: SQLite读取更快（本地文件）

---

### 写入性能

| 操作 | SQLite | PostgreSQL |
|------|--------|-----------|
| 单条INSERT | 0.5ms | 2ms |
| 批量INSERT(100) | 10ms | 15ms |
| 并发写入(10线程) | ⚠️ 排队执行 | ✅ 并发执行 |
| 事务提交 | 1ms | 3ms |

**结论**: 单线程SQLite更快，多线程PostgreSQL更强

---

### 并发性能

| 场景 | SQLite | PostgreSQL |
|------|--------|-----------|
| 10并发读取 | ✅ 优秀 | ✅ 优秀 |
| 10并发写入 | ⚠️ 串行化 | ✅ 并发 |
| 100并发用户 | ⚠️ 瓶颈 | ✅ 良好 |
| 1000+并发 | ❌ 不支持 | ✅ 支持 |

**结论**: 生产环境必须用PostgreSQL

---

## 数据量限制

### SQLite

- **理论最大**: 281TB
- **实际推荐**: <1GB
- **超过1GB**: 性能下降明显
- **超过10GB**: 不推荐

### PostgreSQL

- **理论最大**: 无限制
- **实际生产**: TB级数据库常见
- **超大规模**: PB级也可支持

---

## 特性对比

### SQLite独有特性

✅ **零配置** - 无需安装、启动
✅ **单文件** - 数据库就是一个文件
✅ **跨平台** - Windows/Mac/Linux一致
✅ **内存模式** - `:memory:` 超快测试
✅ **文件级锁** - 简单可靠

### PostgreSQL独有特性

✅ **LISTEN/NOTIFY** - 实时通知
✅ **复制** - 主从同步
✅ **分区表** - 自动分区
✅ **JSON操作符** - jsonb性能优异
✅ **并行查询** - 自动并行化
✅ **pgvector** - 原生向量搜索
✅ **PostGIS** - 地理位置扩展

---

## 成本对比

### 开发环境

| 项目 | SQLite | PostgreSQL |
|------|--------|-----------|
| 硬件 | $0 | $0（本地）|
| 云服务 | $0 | $0（Docker）|
| 学习成本 | 1小时 | 4小时 |
| 维护成本 | 0 | 低 |

**总成本**: SQLite完胜

---

### 生产环境

| 项目 | SQLite | PostgreSQL |
|------|--------|-----------|
| 托管服务 | ❌ 不适用 | $25-200/月 |
| 自建VPS | $5/月 | $10-50/月 |
| 备份 | 复制文件 | 需要策略 |
| 监控 | 基础 | 完善 |
| 扩展 | ❌ 单机 | ✅ 可扩展 |

**总成本**: PostgreSQL贵但值得

---

## 推荐配置

### 开发环境（推荐）

```bash
# .env
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./dev.db

# 不需要Redis（使用内存缓存）
# REDIS_URL=

# 不需要Qdrant（开发阶段可选）
# QDRANT_URL=
```

**启动**:
```bash
npm run dev:monolith
```

---

### 测试环境（推荐）

```bash
# .env.test
DATABASE_PROVIDER=sqlite
DATABASE_URL=file::memory:?cache=shared

# 内存数据库，每次测试独立
```

**测试**:
```bash
npm test
```

---

### Staging环境（推荐）

```bash
# .env.staging
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://user:pass@staging-db:5432/agl_staging
REDIS_URL=redis://staging-redis:6379
QDRANT_URL=http://staging-qdrant:6333
```

---

### 生产环境（必须）

```bash
# .env.production
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://user:pass@prod-db:5432/agl_prod
REDIS_URL=redis://prod-redis:6379
QDRANT_URL=http://prod-qdrant:6333

# 使用连接池
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=30
```

---

## 常见问题

### Q: 我应该在Git中提交SQLite数据库吗？

**A**:

❌ **不要提交**实际数据库文件（`.db`）

✅ **应该提交**:
- 种子数据脚本（`prisma/seed.ts`）
- 迁移文件（`prisma/migrations/`）
- 示例配置（`.env.example`）

在 `.gitignore` 中添加:
```gitignore
*.db
*.db-journal
*.db-shm
*.db-wal
```

---

### Q: SQLite能支持多少用户？

**A**:

| 用户数 | 状态 |
|--------|------|
| 1-10 | ✅ 完美 |
| 10-100 | ✅ 良好 |
| 100-1000 | ⚠️ 可以但有限制 |
| 1000+ | ❌ 使用PostgreSQL |

**关键**: 看的是**并发写入**，不是总用户数。

---

### Q: 如何从SQLite迁移到PostgreSQL？

**A**: 三种方法

**方法1: Prisma导出/导入**（小数据量）
```bash
# 导出
npx prisma db pull
# 切换到PostgreSQL
DATABASE_PROVIDER=postgresql npx prisma db push
```

**方法2: pgloader**（大数据量）
```bash
pgloader sqlite://dev.db postgresql://user:pass@host/db
```

**方法3: 自定义脚本**
```typescript
// 读取SQLite
const sqliteData = await prisma.client.findMany();
// 写入PostgreSQL
await prisma.client.createMany({ data: sqliteData });
```

---

### Q: Prisma在两个数据库上有区别吗？

**A**: 几乎没有！

✅ **完全相同**:
- 查询API
- 关系定义
- 迁移命令
- Prisma Studio

⚠️ **小差异**:
- 枚举（Enum）: SQLite用字符串，PostgreSQL用真枚举
- JSON: 两者都支持，但操作符略不同
- 全文搜索: PostgreSQL更强大

---

## 总结

### 简单规则

```
开发 = SQLite
测试 = SQLite
Staging = PostgreSQL
生产 = PostgreSQL
```

### 终极建议

1. **刚开始学习AGL？**
   → 用SQLite + Monolith服务

2. **准备上线？**
   → 切换到PostgreSQL

3. **已经在生产？**
   → 必须用PostgreSQL

4. **团队开发？**
   → 个人选SQLite，共享选PostgreSQL

---

**开发用SQLite，生产用PostgreSQL - 两全其美！** 🎯
