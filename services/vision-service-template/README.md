# ⚠️ [DEPRECATED] Vision Service Template

## 🚫 此服务已废弃 - 请使用 Vision Service

**此模板已被完整的 Vision Service 替代。请使用 `services/vision-service/` 代替。**

- **已废弃**: `services/vision-service-template/` (本目录)
- **✅ 使用新版本**: `services/vision-service/` - 完整的生产级实现

### 废弃原因

在 **Phase 5** 中，我们实现了完整的生产级 Vision Service：
- ✅ 完整的 GPT-4V + Claude Vision 集成
- ✅ 场景分析、角色识别、事件检测
- ✅ 图像优化 (20-40% 成本节省)
- ✅ 智能缓存 (1小时 TTL)
- ✅ 日预算管理 ($50/day)
- ✅ 80+ 测试，85%+ 覆盖率

**本目录仅作为 Phase 4B 的历史参考保留。**

---

# Vision Service Template (Architecture Reference - Historical)

⚠️ **注意：这是一个架构模板/参考实现，核心功能未完全实现**

**本模板展示如何实现可选的后端代理服务，提供 API 密钥安全、缓存和成本优化**

## ⚠️ 当前状态

- ✅ API 端点定义完整
- ✅ 数据模型完整
- ✅ 配置管理完整
- ❌ **核心视觉分析逻辑未实现**（返回 501 Not Implemented）
- ❌ 测试覆盖率 0%

**如需使用视觉分析功能，请：**
1. 参考 [TEMPLATE-README.md](./TEMPLATE-README.md) 了解如何实现
2. 或直接使用 Vision SDK 调用 OpenAI/Anthropic API（推荐用于开发阶段）

## 概述

Vision Service Template 是一个**可选**的后端代理服务模板，位于 Vision SDK 和 LLM APIs (OpenAI GPT-4V / Anthropic Claude Vision) 之间。

### 为什么需要代理服务？

#### 使用场景对比

| 场景 | 直接调用 API (Vision SDK) | 使用代理服务 |
|------|---------------------------|--------------|
| **开发/原型** | ✅ 推荐 (快速、简单) | ❌ 不需要 |
| **小型项目** | ✅ 可用 | ⚠️ 可选 |
| **生产环境** | ⚠️ API密钥暴露风险 | ✅ **强烈推荐** |
| **多用户应用** | ❌ 成本无法控制 | ✅ **必需** |

#### 代理服务的优势

1. **安全性** 🔒
   - API 密钥完全隐藏在后端
   - 前端无法访问敏感凭证
   - 防止密钥泄露和滥用

2. **成本优化** 💰
   - 智能缓存 (24小时)，相同截图无需重复分析
   - 每日预算限制，防止成本失控
   - 成本追踪和监控

3. **性能提升** ⚡
   - 缓存命中 <10ms vs 直接调用 2-5秒
   - 减少 LLM API 调用次数
   - 降低延迟

4. **统一管理** 📊
   - 集中管理 API 密钥
   - 统一错误处理
   - 请求日志和审计

### 何时使用

**建议使用代理服务的情况**:
- ✅ 生产环境部署
- ✅ 多用户应用
- ✅ 需要成本控制
- ✅ 需要 API 密钥安全

**可以直接使用 Vision SDK 的情况**:
- ✅ 本地开发和测试
- ✅ 原型和演示
- ✅ 个人项目
- ✅ API 密钥可以安全管理（如 Unity 构建配置）

---

## 快速开始

### 安装依赖

```bash
cd services/vision-service
pip install -r requirements.txt
```

### 配置环境变量

在项目根目录的 `.env` 文件中添加：

```bash
# Vision Service
VISION_SERVICE_PORT=8002
VISION_ENABLED=true

# OpenAI API Key (for GPT-4V)
OPENAI_API_KEY=sk-...

# Anthropic API Key (for Claude Vision)
ANTHROPIC_API_KEY=sk-ant-...

# Cost Control
VISION_DAILY_BUDGET=100.0

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 启动服务

```bash
# 开发模式
python app.py

# 生产模式
uvicorn app:app --host 0.0.0.0 --port 8002
```

服务运行在 `http://localhost:8002`

---

## API 端点

### POST /analyze

分析游戏截图

**Request**:
```json
{
  "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "prompt": "What is happening in this game scene?",
  "provider": "openai-gpt4v",
  "context": "This is a screenshot from an RPG game",
  "max_tokens": 1000
}
```

**Response**:
```json
{
  "content": "The player is in combat with two enemies. Health bar shows 75% HP.",
  "confidence": 0.95,
  "method": "openai-gpt4v",
  "provider": "openai-gpt4v",
  "cost": 0.0123,
  "cache_hit": false,
  "latency_ms": 2456.7,
  "token_usage": {
    "prompt_tokens": 1205,
    "completion_tokens": 42,
    "total_tokens": 1247
  }
}
```

### POST /recognize-game-state

识别游戏状态

**Request**:
```json
{
  "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "provider": "openai-gpt4v",
  "confidence_threshold": 0.8
}
```

**Response**:
```json
{
  "category": "combat",
  "confidence": 0.92,
  "scene_description": "Player is engaged in combat with multiple enemies",
  "method": "openai-gpt4v",
  "cost": 0.0098,
  "cache_hit": false,
  "latency_ms": 1987.3
}
```

### GET /health

健康检查

**Response**:
```json
{
  "status": "ok",
  "service": "vision-service",
  "version": "0.1.0",
  "vision_enabled": true,
  "cache_enabled": true,
  "provider_status": {
    "openai": "ok",
    "anthropic": "ok"
  },
  "cache_stats": {...},
  "cost_stats": {...}
}
```

### GET /stats

服务统计

**Response**:
```json
{
  "cache": {
    "hits": 89,
    "misses": 34,
    "hit_rate": "72.4%",
    "cache_size": 123
  },
  "cost": {
    "daily_budget": "$100.00",
    "daily_cost": "$15.67",
    "remaining": "$84.33",
    "total_requests": 123,
    "cached_requests": 89,
    "openai_requests": 20,
    "anthropic_requests": 14
  }
}
```

---

## Vision SDK 集成

### 配置代理 URL

修改 Vision SDK 配置，使用代理服务而非直接调用 API：

#### 方式 1: 使用 Custom Provider

```typescript
import { VisionAnalyzer } from '@agl/vision';

const analyzer = new VisionAnalyzer({
  provider: 'custom',
  apiKey: 'dummy',  // 不需要真实密钥
  apiEndpoint: 'http://localhost:8002/analyze'
});

// 使用 analyzeWithCustom 方法
const response = await analyzer.analyzeWithCustom(
  {
    screenshot,
    prompt: 'What is happening in this game scene?'
  },
  async (request, config) => {
    // 调用代理服务
    const res = await fetch('http://localhost:8002/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        screenshot: request.screenshot.data,
        prompt: request.prompt,
        context: request.context
      })
    });

    const data = await res.json();

    return {
      content: data.content,
      confidence: data.confidence || 0.9,
      processingTime: data.latency_ms
    };
  }
);
```

#### 方式 2: 创建辅助函数

```typescript
// visionProxy.ts
export async function analyzeWithProxy(
  screenshot: Screenshot,
  prompt: string,
  options?: {
    provider?: 'openai-gpt4v' | 'anthropic-claude';
    context?: string;
    maxTokens?: number;
  }
) {
  const response = await fetch('http://localhost:8002/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      screenshot: screenshot.data,
      prompt,
      provider: options?.provider || 'openai-gpt4v',
      context: options?.context,
      max_tokens: options?.maxTokens || 1000
    })
  });

  if (!response.ok) {
    throw new Error(`Vision analysis failed: ${response.statusText}`);
  }

  return await response.json();
}

// 使用
const result = await analyzeWithProxy(screenshot, 'What is happening?');
console.log(result.content);
console.log(`Cost: $${result.cost}, Cache hit: ${result.cache_hit}`);
```

#### 方式 3: 游戏状态识别

```typescript
export async function recognizeGameStateWithProxy(
  screenshot: Screenshot,
  confidenceThreshold: number = 0.7
) {
  const response = await fetch('http://localhost:8002/recognize-game-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      screenshot: screenshot.data,
      confidence_threshold: confidenceThreshold
    })
  });

  return await response.json();
}

// 使用
const gameState = await recognizeGameStateWithProxy(screenshot, 0.8);
if (gameState.category === 'combat' && gameState.confidence > 0.9) {
  console.log('High confidence combat detected!');
}
```

---

## 部署

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
```

构建和运行:
```bash
docker build -t agl-vision-service .
docker run -d -p 8002:8002 \
  -e OPENAI_API_KEY=sk-... \
  -e REDIS_HOST=redis \
  agl-vision-service
```

### Docker Compose

添加到 `docker-compose.yml`:
```yaml
services:
  vision-service:
    build: ./services/vision-service
    container_name: agl-vision-service
    environment:
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - VISION_SERVICE_PORT=8002
    ports:
      - "8002:8002"
    depends_on:
      - redis
    networks:
      - agl-network
```

---

## 性能指标

### 延迟对比

| 场景 | 直接调用 API | 使用代理 (缓存未命中) | 使用代理 (缓存命中) |
|------|--------------|------------------------|----------------------|
| GPT-4V | 2-5 秒 | 2-5 秒 | **<10ms** |
| Claude Vision | 2-4 秒 | 2-4 秒 | **<10ms** |

### 成本节省

**示例场景**: 游戏陪伴角色，每 3 秒分析一次截图

- **无缓存**: 1200 次/小时 × $0.01/次 = $12/小时 = $288/天
- **缓存命中率 70%**: 360 次/小时 × $0.01/次 = $3.6/小时 = $86.4/天
- **节省**: **70%** ($201.6/天)

### 缓存命中率

典型场景下的缓存命中率：
- 相同场景重复分析: **90%+**
- 游戏菜单/UI: **80%+**
- 动态战斗场景: **30-50%**
- 整体平均: **60-70%**

---

## 配置选项

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VISION_SERVICE_PORT` | 8002 | 服务端口 |
| `VISION_ENABLED` | true | 是否启用视觉分析 |
| `DEFAULT_PROVIDER` | openai-gpt4v | 默认 AI 提供商 |
| `OPENAI_MODEL` | gpt-4-vision-preview | OpenAI 模型 |
| `ANTHROPIC_MODEL` | claude-3-opus-20240229 | Anthropic 模型 |
| `MAX_TOKENS` | 1000 | 最大生成 tokens |
| `VISION_DAILY_BUDGET` | 100.0 | 每日预算 (USD) |
| `CACHE_ENABLED` | true | 是否启用缓存 |
| `CACHE_TTL` | 86400 | 缓存时长 (秒)，默认24小时 |

### 提供商选择

**OpenAI GPT-4V**:
- 成本: ~$0.01-0.02 per image
- 速度: 2-5 秒
- 优势: 更快、更便宜
- 劣势: 较短的回复

**Anthropic Claude Vision**:
- 成本: ~$0.015-0.03 per image
- 速度: 2-4 秒
- 优势: 更详细的分析、更好的推理
- 劣势: 稍贵

---

## 监控和调试

### 查看实时统计

```bash
curl http://localhost:8002/stats
```

### 查看缓存命中率

```python
# 在服务内部
from src.cache import vision_cache
stats = vision_cache.get_stats()
print(f"Hit rate: {stats['hit_rate']}")
```

### 清空缓存

```bash
curl -X POST http://localhost:8002/cache/clear
```

---

## 故障排查

### 问题1: 分析失败，返回 500 错误

**可能原因**:
- API 密钥无效
- 网络连接问题
- 图片格式不支持

**解决**:
1. 检查环境变量中的 API 密钥
2. 测试 API 密钥: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
3. 确保图片是 base64 编码的 JPEG/PNG

### 问题2: 缓存不工作

**可能原因**:
- Redis 未运行
- 缓存被禁用

**解决**:
1. 检查 Redis: `redis-cli ping`
2. 检查配置: `CACHE_ENABLED=true`

### 问题3: 成本超预算

**症状**: 返回错误 "Daily budget exceeded"

**解决**:
1. 增加预算: `VISION_DAILY_BUDGET=200.0`
2. 优化调用频率（降低分析间隔）
3. 提高缓存命中率

---

## 与 Vision SDK 的对比

| 特性 | Vision SDK (直接) | Vision Service (代理) |
|------|-------------------|------------------------|
| **API 密钥** | 前端暴露 ⚠️ | 后端隐藏 ✅ |
| **缓存** | 无 | 24小时缓存 ✅ |
| **成本控制** | 无 | 预算限制 ✅ |
| **部署复杂度** | 简单 ✅ | 需要后端 ⚠️ |
| **性能 (首次)** | 2-5s | 2-5s |
| **性能 (缓存)** | 2-5s | <10ms ✅ |
| **适用场景** | 开发/测试 | 生产环境 |

---

## 总结

### 推荐使用策略

**开发阶段**: 直接使用 Vision SDK
- 快速、简单、无需额外服务
- 适合原型和测试

**生产环境**: 使用 Vision Service 代理
- API 密钥安全
- 成本可控
- 缓存优化

### 快速决策

**问**: 我应该使用代理服务吗？
**答**:
- 如果是个人项目或原型 → **不需要**，直接用 Vision SDK
- 如果是生产环境或多用户应用 → **强烈推荐**使用代理

---

## 相关文档

- [Vision SDK README](../../sdk/vision/README.md) - Vision SDK 完整文档
- [API Documentation](../../docs/api/README.md) - API 接口文档
- [Implementation Patterns](../../docs/IMPLEMENTATION-PATTERNS.md) - 实现模式指南

---

**可选但推荐 - 为生产环境提供安全和成本优化**
