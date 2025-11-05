# Voice Service

**TTS (Text-to-Speech) synthesis with intelligent caching and cost optimization**

## 概述 (Overview)

Voice Service 是 AGL 平台的语音合成服务，提供高质量的多语言 TTS 功能，支持角色人设、智能缓存和成本控制。

**核心特性**:
- 🎤 **多语言支持**: 中文、英文、日文、韩文
- 🎭 **角色人设**: Cheerful、Cool、Cute 三种人设自动匹配语音
- 💾 **智能缓存**: 7天缓存周期，命中率可达 80%+
- 💰 **成本优化**: 每日预算控制、自动降级、详细成本追踪
- ⚡ **高性能**: 缓存命中 <10ms，TTS合成 <2s
- 🔊 **多格式**: MP3、Opus、AAC、FLAC

## 技术栈

- **框架**: FastAPI 0.109.0
- **Python**: 3.11+
- **TTS Provider**: OpenAI TTS API (tts-1 / tts-1-hd)
- **缓存**: Redis 7+
- **测试**: pytest, pytest-asyncio

## 架构设计

### 混合缓存策略

```
请求 → 检查缓存 → 命中?
           ↓ 是         ↓ 否
        返回音频    检查预算 → 超预算? → 错误
                       ↓ 否
                    TTS 合成 → 缓存结果 → 返回音频
```

**成本优化**:
- 缓存命中: $0, ~10ms
- TTS 合成: $0.015/1K字符, ~2s
- 目标缓存命中率: 80%+
- 每日预算限制: $50 (可配置)

### 语音选择策略

**Persona → Voice 映射**:
- `cheerful` (活泼): Nova (温暖、充满活力的女声)
- `cool` (冷静): Onyx (深沉、权威的男声)
- `cute` (可爱): Shimmer (轻快、友好的女声)

所有语音支持 4 种语言: zh-CN, en-US, ja-JP, ko-KR

## 快速开始

### 1. 安装依赖

```bash
cd services/voice-service
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `../../.env` 文件:

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Redis
REDIS_URL=redis://localhost:6379

# Voice Service Configuration
VOICE_SERVICE_PORT=8003
TTS_ENABLED=true
TTS_MODEL=tts-1  # or tts-1-hd
CACHE_ENABLED=true

# Cost Control
VOICE_DAILY_BUDGET=50.0
```

### 3. 启动服务

```bash
# 开发模式 (with reload)
python app.py

# 生产模式
uvicorn app:app --host 0.0.0.0 --port 8003
```

服务运行在 `http://localhost:8003`

### 4. 访问API文档

打开浏览器访问: `http://localhost:8003/docs`

## API 端点

### POST /synthesize

合成语音

**Request**:
```json
{
  "text": "你真厉害！继续加油！",
  "persona": "cheerful",
  "language": "zh-CN",
  "speed": 1.0,
  "format": "mp3"
}
```

**Response**:
```json
{
  "audio_url": "data:audio/mp3;base64,//uQx...",
  "text": "你真厉害！继续加油！",
  "persona": "cheerful",
  "language": "zh-CN",
  "voice": "nova",
  "format": "mp3",
  "method": "tts",
  "cost": 0.00015,
  "cache_hit": false,
  "latency_ms": 1842.5,
  "audio_duration_seconds": 2.1,
  "character_count": 10
}
```

**参数说明**:
- `text` (required): 要合成的文本，1-4096 字符
- `persona`: 角色人设 (cheerful/cool/cute)
- `language`: 目标语言 (zh-CN/en-US/ja-JP/ko-KR)
- `voice`: 指定语音 ID (可选，默认根据 persona 自动选择)
- `speed`: 语速 (0.25-4.0)，默认 1.0
- `format`: 音频格式 (mp3/opus/aac/flac)
- `force_synthesis`: 强制重新合成，跳过缓存

**返回字段**:
- `audio_url`: Base64 编码的音频数据 URL
- `method`: 合成方法 (tts/cached)
- `cost`: 成本 (USD)
- `cache_hit`: 是否命中缓存
- `latency_ms`: 处理延迟 (毫秒)
- `audio_duration_seconds`: 音频时长 (秒)
- `character_count`: 字符数

### GET /voices

获取可用语音列表

**Response**:
```json
[
  {
    "voice_id": "nova",
    "provider": "openai",
    "name": "Nova",
    "gender": "female",
    "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"],
    "persona": "cheerful",
    "description": "Warm, energetic voice (Cheerful persona)"
  },
  ...
]
```

### GET /health

健康检查

**Response**:
```json
{
  "status": "ok",
  "service": "voice-service",
  "version": "0.1.0",
  "tts_enabled": true,
  "cache_enabled": true,
  "provider_status": {
    "openai": "ok"
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
    "hits": 125,
    "misses": 23,
    "hit_rate": "84.5%",
    "cache_size": 148,
    "ttl_seconds": 604800,
    "enabled": true
  },
  "cost": {
    "daily_budget": "$50.00",
    "daily_cost": "$2.3450",
    "remaining": "$47.66",
    "usage_percent": "4.7%",
    "total_requests": 148,
    "cached_requests": 125,
    "tts_requests": 23,
    "cache_hit_rate": "84.5%",
    "total_characters": 2850,
    "tts_characters": 1530,
    "avg_cached_latency_ms": "8.2",
    "avg_tts_latency_ms": "1842.5"
  }
}
```

### POST /cache/clear

清空缓存

**Response**:
```json
{
  "status": "ok",
  "message": "Cache cleared successfully"
}
```

## 使用示例

### Python 客户端

```python
import requests

# 合成语音
response = requests.post(
    "http://localhost:8003/synthesize",
    json={
        "text": "你真厉害！继续加油！",
        "persona": "cheerful",
        "language": "zh-CN",
        "format": "mp3"
    }
)

result = response.json()

# 保存音频文件
import base64
audio_base64 = result["audio_url"].split(",")[1]
audio_bytes = base64.b64decode(audio_base64)

with open("output.mp3", "wb") as f:
    f.write(audio_bytes)

print(f"音频已保存，成本: ${result['cost']:.4f}")
```

### curl 示例

```bash
# 合成中文语音
curl -X POST http://localhost:8003/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你好，欢迎使用AGL语音服务！",
    "persona": "cheerful",
    "language": "zh-CN"
  }'

# 合成英文语音，指定语音
curl -X POST http://localhost:8003/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, welcome to AGL Voice Service!",
    "persona": "cool",
    "language": "en-US",
    "voice": "onyx"
  }'

# 获取服务统计
curl http://localhost:8003/stats
```

## 测试

### 运行所有测试

```bash
pytest tests/ -v
```

### 运行特定测试

```bash
# API 测试
pytest tests/test_api.py -v

# 缓存测试
pytest tests/test_cache.py -v

# 成本追踪测试
pytest tests/test_cost_tracker.py -v
```

### 测试覆盖率

```bash
pytest tests/ --cov=src --cov-report=html
```

**当前覆盖率**: 85%+

## 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENAI_API_KEY` | - | OpenAI API 密钥 (必需) |
| `VOICE_SERVICE_PORT` | 8003 | 服务端口 |
| `TTS_ENABLED` | true | 是否启用 TTS |
| `TTS_MODEL` | tts-1 | TTS 模型 (tts-1/tts-1-hd) |
| `CACHE_ENABLED` | true | 是否启用缓存 |
| `CACHE_TTL` | 604800 | 缓存时长 (秒)，默认7天 |
| `VOICE_DAILY_BUDGET` | 50.0 | 每日预算 (USD) |
| `REDIS_HOST` | localhost | Redis 主机 |
| `REDIS_PORT` | 6379 | Redis 端口 |

### TTS 模型对比

| 模型 | 质量 | 延迟 | 成本 |
|------|------|------|------|
| `tts-1` | 标准 | ~1.5s | $0.015/1K 字符 |
| `tts-1-hd` | 高清 | ~2s | $0.030/1K 字符 |

**建议**: 生产环境使用 `tts-1`，追求最高质量时使用 `tts-1-hd`

## 性能指标

### 延迟

- **缓存命中**: 5-15ms
- **TTS 合成**: 1-3s (取决于文本长度)
- **P95**: <100ms (80% 缓存命中率)

### 成本估算

**假设场景**: 游戏陪伴角色，每次对话 20 字符

- 无缓存: $0.0003/对话 × 10万对话/天 = $30/天
- 80% 缓存: $0.0003/对话 × 2万对话/天 = $6/天

**节省**: 80% 缓存命中率可节省 80% 成本

### 吞吐量

- 单实例: ~100 TPS (缓存命中)
- 单实例: ~5 TPS (TTS 合成)
- 横向扩展: 通过 Redis 共享缓存

## Docker 部署

### 构建镜像

```bash
# 在项目根目录
docker build -t agl-voice-service ./services/voice-service
```

### 运行容器

```bash
docker run -d \
  --name agl-voice-service \
  -p 8003:8003 \
  -e OPENAI_API_KEY=sk-... \
  -e REDIS_URL=redis://redis:6379 \
  agl-voice-service
```

### Docker Compose

在项目根目录的 `docker-compose.yml` 中已包含 Voice Service 配置:

```bash
# 启动所有服务
docker-compose up -d

# 仅启动 Voice Service 及其依赖
docker-compose up -d voice-service redis
```

## 故障排查

### 问题1: TTS 合成失败

**症状**: 返回 500 错误，日志显示 "Failed to synthesize speech"

**可能原因**:
- OpenAI API Key 无效或过期
- OpenAI API 配额用尽
- 网络连接问题

**解决方案**:
1. 检查 `OPENAI_API_KEY` 配置
2. 检查 OpenAI 账户余额和配额
3. 检查网络连接到 api.openai.com

### 问题2: 缓存不工作

**症状**: 所有请求都走 TTS，成本很高

**可能原因**:
- Redis 未连接
- 缓存被禁用

**解决方案**:
1. 检查 Redis 是否运行: `redis-cli ping`
2. 检查 `CACHE_ENABLED` 配置
3. 查看日志是否有 Redis 连接错误

### 问题3: 每日预算达到上限

**症状**: 返回错误 "Daily budget exceeded"

**解决方案**:
1. 增加 `VOICE_DAILY_BUDGET` 配置
2. 等待下一天自动重置
3. 优化缓存命中率
4. 手动清空当天成本记录 (Redis key)

## 监控指标

### 关键指标

1. **成本指标**:
   - 每日总成本
   - 成本增长趋势
   - 每请求平均成本

2. **性能指标**:
   - P50/P95/P99 延迟
   - TTS 合成延迟
   - 缓存延迟

3. **缓存指标**:
   - 缓存命中率
   - 缓存大小
   - 缓存失效率

4. **业务指标**:
   - 总请求数
   - TTS 请求占比
   - 字符数总量

### Prometheus 指标

TODO: 添加 Prometheus 导出器

## 未来优化

- [ ] 支持 ElevenLabs TTS (更高质量)
- [ ] 支持流式音频返回
- [ ] CDN 存储 (S3) 代替 Redis
- [ ] 语音克隆支持
- [ ] 情感控制 (快乐、悲伤、愤怒等)
- [ ] SSML 支持
- [ ] 批量合成接口
- [ ] Prometheus 监控集成

## 贡献

遵循项目统一的代码规范和测试要求:
- 代码覆盖率 85%+
- 详细注释 (30%+)
- 完整的 API 文档
- 性能测试

## 许可证

Proprietary - All rights reserved

## 联系方式

如有问题或建议，请联系: j0hn.wahahaha@gmail.com
