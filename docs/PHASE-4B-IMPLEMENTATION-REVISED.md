# Phase 4B + Dashboard 实施方案（修订版）

**版本**: v2.0
**创建日期**: 2025-01-27
**修订原因**: **严格遵循现有架构，不引入破坏性变更**

---

## 🎯 核心原则

### ✅ 必须遵守的约束

1. **不破坏现有架构** - 所有扩展必须兼容现有系统
2. **不修改现有服务** - 除非是必要的功能增强
3. **遵循现有模式** - 新服务必须模仿现有服务的结构
4. **不引入新数据库** - 使用现有的 PostgreSQL + Redis + Qdrant
5. **不改变现有 API** - 只能新增端点，不能修改现有端点

---

## 📊 现有架构分析（基于代码探索）

### 现有服务清单

```
✅ 已完成的服务：
├── services/api-service/          # NestJS + Prisma + PostgreSQL
├── services/realtime-gateway/     # Socket.IO + Redis
├── services/emotion-service/      # Python FastAPI (规则 + ML)
├── services/dialogue-service/     # Python FastAPI (模板 + LLM)
└── services/memory-service/       # Node.js + Qdrant

✅ 已完成的 SDK：
├── sdk/avatar/                    # React + Three.js (73% 完成)
├── sdk/vision/                    # TypeScript (40% 完成)
├── sdk/unity/                     # C# (完成)
├── sdk/unreal/                    # C++ (完成)
└── sdk/web/                       # TypeScript (完成)

✅ 数据层：
├── PostgreSQL (主数据库)
├── Redis (缓存 + 消息队列)
└── Qdrant (向量数据库)
```

### 关键发现

**1. Avatar SDK 是纯前端**
- ✅ React 组件已完成
- ✅ Three.js 渲染引擎已实现
- ❌ **不需要新的后端服务**
- ❌ 只需要 3D 模型文件（存储在 CDN/S3）

**2. Vision SDK 是纯前端**
- ✅ 屏幕捕获已实现
- ✅ GPT-4V/Claude 集成已实现
- ❌ **当前直接调用外部 LLM API**
- ⚠️ 可选：添加代理服务（安全和成本优化）

**3. Voice Service 未实现**
- ❌ 完全未开始
- ✅ 应该遵循 `emotion-service/dialogue-service` 模式
- ✅ 使用 Python + FastAPI
- ✅ 端口 8003

**4. Dashboard 未实现**
- ❌ 完全未开始
- ✅ 应该调用现有的 `/api/v1/analytics/*` API
- ✅ 不引入新的数据库表

---

## 🚀 Phase 4B 实施计划（修订版）

### 任务 1: 完善 Avatar SDK（前端）

**目标**: 完善现有的 Avatar SDK，不引入新的后端服务

#### 1.1 当前状态分析

**已完成**：
```
sdk/avatar/
├── src/components/
│   ├── AvatarController.tsx       ✅ 完整
│   ├── AvatarRenderer.tsx         ✅ 完整
│   ├── AvatarModel.tsx            ✅ 完整
│   ├── AnimationPlayer.tsx        ✅ 完整
│   ├── EmotionWheel.tsx           ✅ 完整
│   └── BubbleTooltip.tsx          ✅ 完整
├── hooks/useAvatarState.ts        ✅ 完整
├── animations/emotionMap.ts       ✅ 完整（映射表）
└── tests/                         ✅ 43+ 测试用例
```

**缺失**：
- ❌ 真实的 3D 模型文件（.gltf/.glb）
- ❌ 真实的动画文件（.fbx 或 GLTF 动画）
- ❌ 纹理贴图文件（.png/.jpg）

#### 1.2 实施步骤

**步骤 1: 获取/创建 3D 资源**（2周）

**选项 A: 使用现有免费资源**（推荐快速启动）
```bash
# 从 Sketchfab / Mixamo / Ready Player Me 下载
# 免费的 CC0 授权角色模型

资源清单（示例）：
1. Warrior (战士)
   - Base Model: warrior.gltf (15K polygons)
   - Textures: warrior_diffuse.png, warrior_normal.png
   - Animations: idle, happy, sad, excited, angry, etc.

2. Mage (法师)
3. Archer (射手)
4. Priest (牧师)
5. Assassin (刺客)
```

**选项 B: 外包 3D 制作**（质量更好，需成本）
```bash
# 委托 3D 美术师制作
# 预算: ~$500-1000/角色（包含动画）
# 周期: 2-4周
```

**步骤 2: 优化和转换**（3天）

```bash
# 使用 Blender 批量优化
# 目标：
# - GLTF 格式 + Draco 压缩
# - 多层级 LOD (High/Medium/Low)
# - 纹理优化到 2048x2048 或更小

# 示例脚本
./scripts/optimize-models.sh
  ├── 输入: raw_models/*.fbx
  ├── 处理: Blender 自动化
  └── 输出: optimized/*.gltf (压缩70%)
```

**步骤 3: 上传到 CDN/S3**（1天）

```bash
# 目录结构
s3://agl-assets/
└── models/
    ├── cheerful/
    │   ├── model.gltf
    │   ├── textures/
    │   │   ├── diffuse.webp
    │   │   └── normal.webp
    │   └── animations/
    │       ├── idle.gltf
    │       ├── happy_1.gltf
    │       └── ...
    ├── cool/
    └── cute/

# 配置 CloudFlare CDN
# URL 格式: https://cdn.agl.dev/models/cheerful/model.gltf
```

**步骤 4: 更新 API Service**（1天）

**修改**: `services/api-service/src/character/character.controller.ts`

```typescript
// 当前实现（硬编码）
@Get()
async getAll(): Promise<Character[]> {
  return [
    { id: '1', name: 'Cheerful', persona: 'cheerful' },
    { id: '2', name: 'Cool', persona: 'cool' },
    { id: '3', name: 'Cute', persona: 'cute' },
  ];
}

// 修改为（包含模型 URL）
@Get()
async getAll(): Promise<Character[]> {
  const cdnBaseUrl = this.configService.get('CDN_BASE_URL');

  return [
    {
      id: '1',
      name: 'Cheerful',
      persona: 'cheerful',
      modelUrl: `${cdnBaseUrl}/models/cheerful/model.gltf`,
      thumbnailUrl: `${cdnBaseUrl}/models/cheerful/thumbnail.png`,
      animations: {
        idle: `${cdnBaseUrl}/models/cheerful/animations/idle.gltf`,
        happy_1: `${cdnBaseUrl}/models/cheerful/animations/happy_1.gltf`,
        // ... 36 种动画
      }
    },
    // ... 其他角色
  ];
}
```

**步骤 5: 更新 Avatar SDK 配置**（1天）

```typescript
// sdk/avatar/examples/BasicExample.tsx

import { AvatarController } from '@agl/avatar';

function App() {
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    // 从 API 获取角色配置
    fetch('http://localhost:3000/api/v1/characters/1')
      .then(res => res.json())
      .then(data => setCharacter(data));
  }, []);

  if (!character) return <div>Loading...</div>;

  return (
    <AvatarController
      config={{
        modelSource: {
          type: 'gltf',
          url: character.modelUrl  // 使用 API 返回的 URL
        },
        animations: character.animations,
        emotion: 'happy',
        intensity: 2
      }}
    />
  );
}
```

**步骤 6: 测试和文档**（2天）

```bash
# 测试清单
✅ 模型加载性能 (< 3 秒)
✅ 渲染帧率 (60 FPS @ 1080p)
✅ 动画切换流畅度
✅ 多角色切换
✅ 内存占用 (< 100MB)

# 更新文档
docs/sdk/avatar.md
  - 添加 CDN 配置说明
  - 添加自定义模型指南
  - 添加性能优化建议
```

**交付物**：
- ✅ 5 个优化后的 3D 角色模型
- ✅ 36 种动画文件（每角色）
- ✅ API 端点增强（返回模型 URL）
- ✅ 完整测试报告
- ✅ 使用文档

**时间**: 2-3 周
**成本**: $0-5000（取决于是否外包）

---

### 任务 2: 完善 Vision SDK（前端 + 可选代理）

**目标**: 完善 Vision SDK，可选添加后端代理服务

#### 2.1 当前状态分析

**已完成**：
```
sdk/vision/
├── src/capture/ScreenCapture.ts      ✅ 屏幕捕获
├── src/analysis/VisionAnalyzer.ts    ✅ LLM 集成
├── src/analysis/GameStateRecognizer.ts ✅ 状态识别
└── src/types/                        ✅ TypeScript 类型
```

**存在问题**：
- ⚠️ API Key 暴露在前端（安全风险）
- ⚠️ 无缓存机制（成本高）
- ⚠️ 无速率限制（可能被滥用）
- ⚠️ 测试不完整

#### 2.2 实施步骤

**方案 A: 最小化改动**（推荐开源项目）

仅完善前端 SDK，不添加后端服务。

```bash
# 步骤
1. 完善测试用例（3天）
2. 优化错误处理（1天）
3. 添加 Unity/Unreal 插件（5天）
4. 文档完善（2天）

# 交付物
- 完整测试套件（50+ 用例）
- Unity/Unreal 插件完成
- 详细使用文档
```

**方案 B: 添加可选的代理服务**（推荐生产环境）

添加 `vision-service` 解决安全和成本问题。

**新建**: `services/vision-service/`（遵循现有模式）

```
services/vision-service/
├── app.py                           # FastAPI 入口
├── src/
│   ├── vision_service.py            # 主服务
│   ├── vision_proxy.py              # LLM API 代理
│   ├── cache.py                     # Redis 缓存
│   ├── rate_limiter.py              # 速率限制
│   ├── cost_tracker.py              # 成本追踪
│   ├── models.py                    # Pydantic 模型
│   └── config.py                    # 配置
├── tests/                           # 测试
├── requirements.txt                 # Python 依赖
├── Dockerfile
└── README.md
```

**代码示例**：

```python
# app.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from src.vision_service import VisionService
from src.models import AnalyzeRequest, AnalyzeResponse
from src.rate_limiter import RateLimiter
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vision Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务
vision_service = VisionService()
rate_limiter = RateLimiter()

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_screenshot(
    request: AnalyzeRequest,
    api_key: str = Depends(rate_limiter.check_rate_limit)
):
    """
    分析游戏截图

    Args:
        request: 包含 screenshot 和 prompt
        api_key: 从 Header 提取（速率限制）

    Returns:
        分析结果（带缓存）
    """
    try:
        result = await vision_service.analyze(
            screenshot=request.screenshot,
            prompt=request.prompt,
            provider=request.provider or "openai"
        )

        logger.info(f"Analysis completed", extra={
            "cost": result.cost_usd,
            "cached": result.cached,
            "api_key": api_key[:8] + "..."
        })

        return result

    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "ok",
        "service": "vision-service",
        "version": "1.0.0"
    }

@app.get("/stats")
async def get_stats():
    """获取服务统计"""
    return await vision_service.get_stats()
```

```python
# src/vision_service.py
import base64
import hashlib
from typing import Dict
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from .cache import CacheService
from .cost_tracker import CostTracker
from .models import AnalyzeResponse
import logging

logger = logging.getLogger(__name__)

class VisionService:
    """视觉分析服务"""

    def __init__(self):
        self.openai_client = AsyncOpenAI()
        self.anthropic_client = AsyncAnthropic()
        self.cache = CacheService()
        self.cost_tracker = CostTracker()

    async def analyze(
        self,
        screenshot: str,  # base64 编码
        prompt: str,
        provider: str = "openai"
    ) -> AnalyzeResponse:
        """
        分析截图

        Args:
            screenshot: base64 编码的图片
            prompt: 分析提示词
            provider: LLM 提供商

        Returns:
            分析结果
        """

        # 1. 生成缓存键（基于图片哈希 + 提示词）
        cache_key = self._generate_cache_key(screenshot, prompt, provider)

        # 2. 检查缓存
        cached_result = await self.cache.get(cache_key)
        if cached_result:
            logger.debug(f"Cache hit: {cache_key}")
            cached_result['cached'] = True
            return AnalyzeResponse(**cached_result)

        # 3. 调用 LLM API
        logger.debug(f"Cache miss, calling {provider} API")

        if provider == "openai":
            result = await self._analyze_with_openai(screenshot, prompt)
        elif provider == "anthropic":
            result = await self._analyze_with_anthropic(screenshot, prompt)
        else:
            raise ValueError(f"Unknown provider: {provider}")

        result['cached'] = False
        result['provider'] = provider

        # 4. 记录成本
        await self.cost_tracker.record(result['cost_usd'])

        # 5. 缓存结果（1小时）
        await self.cache.set(cache_key, result, ttl=3600)

        return AnalyzeResponse(**result)

    async def _analyze_with_openai(
        self,
        screenshot: str,
        prompt: str
    ) -> Dict:
        """使用 OpenAI GPT-4V 分析"""

        response = await self.openai_client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{screenshot}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        content = response.choices[0].message.content
        tokens = response.usage.total_tokens

        # 计算成本
        # GPT-4V 定价: $0.01/image + $0.03/1K tokens
        cost = 0.01 + (tokens / 1000) * 0.03

        return {
            'content': content,
            'confidence': 0.9,
            'tokens': tokens,
            'cost_usd': cost,
            'processing_time_ms': 0  # 由调用者计算
        }

    async def _analyze_with_anthropic(
        self,
        screenshot: str,
        prompt: str
    ) -> Dict:
        """使用 Anthropic Claude Vision 分析"""
        # 实现略（类似 OpenAI）
        pass

    def _generate_cache_key(
        self,
        screenshot: str,
        prompt: str,
        provider: str
    ) -> str:
        """
        生成缓存键

        使用图片哈希 + 提示词哈希
        """
        # 计算图片哈希（取前 1MB 避免全文哈希）
        image_sample = screenshot[:1024*1024]
        image_hash = hashlib.md5(image_sample.encode()).hexdigest()[:16]

        # 计算提示词哈希
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:16]

        return f"vision:{provider}:{image_hash}:{prompt_hash}"

    async def get_stats(self) -> Dict:
        """获取服务统计"""
        return {
            'total_requests': await self.cost_tracker.get_total_requests(),
            'total_cost': await self.cost_tracker.get_total_cost(),
            'cache_hit_rate': await self.cache.get_hit_rate()
        }
```

**配置**：

```python
# src/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """服务配置"""

    # API Keys
    openai_api_key: str
    anthropic_api_key: str

    # Redis
    redis_url: str = "redis://localhost:6379"

    # 成本限制
    daily_cost_limit: float = 50.0

    # 缓存
    cache_ttl: int = 3600  # 1小时

    class Config:
        env_file = ".env"

settings = Settings()
```

**Docker 部署**：

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8002

# 启动服务
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
```

**集成到现有基础设施**：

```yaml
# docker-compose.yml 添加
  vision-service:
    build: ./services/vision-service
    ports:
      - "8002:8002"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    networks:
      - agl-network
```

**前端 SDK 更新**（可选使用代理）：

```typescript
// sdk/vision/src/analysis/VisionAnalyzer.ts

export class VisionAnalyzer {
  private config: VisionConfig;

  constructor(config: VisionConfig) {
    this.config = config;
  }

  async analyze(screenshot: string, prompt: string): Promise<AnalysisResult> {
    // 如果配置了代理服务，使用代理
    if (this.config.useProxy && this.config.proxyUrl) {
      return this.analyzeWithProxy(screenshot, prompt);
    }

    // 否则直接调用 LLM API（原有逻辑）
    return this.analyzeDirectly(screenshot, prompt);
  }

  private async analyzeWithProxy(
    screenshot: string,
    prompt: string
  ): Promise<AnalysisResult> {
    const response = await fetch(`${this.config.proxyUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey  // 游戏开发者的 API Key
      },
      body: JSON.stringify({
        screenshot,
        prompt,
        provider: 'openai'
      })
    });

    return await response.json();
  }

  private async analyzeDirectly(
    screenshot: string,
    prompt: string
  ): Promise<AnalysisResult> {
    // 原有逻辑（直接调用 OpenAI）
    // ...
  }
}
```

**交付物（方案 B）**：
- ✅ Vision Service 后端服务
- ✅ API Key 代理和隐藏
- ✅ 缓存机制（降低成本）
- ✅ 速率限制
- ✅ 成本追踪
- ✅ 完整测试（50+ 用例）
- ✅ Docker 部署配置
- ✅ 文档

**时间**: 1-2 周
**成本**: $0

---

### 任务 3: 实现 Voice Service（新建）

**目标**: 新建 Voice Service，遵循现有 Python + FastAPI 模式

#### 3.1 架构设计（遵循 emotion-service 模式）

**目录结构**（完全模仿 emotion-service）：

```
services/voice-service/
├── app.py                           # FastAPI 应用入口
├── src/
│   ├── voice_service.py             # 主服务（类似 emotion_service.py）
│   ├── tts_engine.py                # TTS 引擎
│   ├── voice_cache.py               # 音频缓存
│   ├── cost_tracker.py              # 成本追踪（复用模式）
│   ├── models.py                    # Pydantic 模型
│   └── config.py                    # 配置管理
├── tests/                           # 测试
│   ├── test_voice_service.py
│   ├── test_tts_engine.py
│   └── test_integration.py
├── requirements.txt                 # Python 依赖
├── Dockerfile                       # Docker 镜像
├── .env.example                     # 环境变量模板
└── README.md                        # 服务文档
```

#### 3.2 代码实现

**app.py**（类似 emotion-service/app.py）：

```python
"""
Voice Service - 语音合成服务

提供 TTS (Text-to-Speech) 功能，支持多语言和情感表达。

Author: AGL Team
Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.voice_service import VoiceService
from src.models import SynthesizeRequest, SynthesizeResponse
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用
app = FastAPI(
    title="Voice Service",
    description="AI Game Companion - Voice Synthesis Service",
    version="1.0.0"
)

# CORS 配置（与其他服务一致）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务
voice_service = VoiceService()

@app.post("/synthesize", response_model=SynthesizeResponse)
async def synthesize_speech(request: SynthesizeRequest):
    """
    合成语音

    Args:
        request: 包含文本、语言、角色、情绪等参数

    Returns:
        音频 URL、时长、成本等信息
    """
    try:
        result = await voice_service.synthesize(
            text=request.text,
            language=request.language,
            persona=request.persona,
            emotion=request.emotion,
            speed=request.speed,
            provider=request.provider
        )

        logger.info(f"Synthesis completed", extra={
            "persona": request.persona,
            "language": request.language,
            "cost": result.cost_usd,
            "cached": result.cached
        })

        return result

    except Exception as e:
        logger.error(f"Synthesis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voices")
async def list_voices():
    """列出可用的语音"""
    return await voice_service.list_voices()

@app.get("/health")
async def health():
    """健康检查"""
    return {
        "status": "ok",
        "service": "voice-service",
        "version": "1.0.0"
    }

@app.get("/stats")
async def get_stats():
    """获取服务统计"""
    return await voice_service.get_stats()

@app.post("/cache/clear")
async def clear_cache():
    """清除缓存"""
    await voice_service.clear_cache()
    return {"message": "Cache cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
```

**src/models.py**（Pydantic 模型）：

```python
"""
数据模型定义

使用 Pydantic 进行数据验证。
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from enum import Enum

class VoiceProvider(str, Enum):
    """TTS 提供商"""
    OPENAI = "openai"
    ELEVENLABS = "elevenlabs"
    AZURE = "azure"

class VoicePersona(str, Enum):
    """角色人格"""
    CHEERFUL = "cheerful"  # 活泼
    COOL = "cool"          # 冷静
    CUTE = "cute"          # 可爱

class VoiceEmotion(str, Enum):
    """语音情绪"""
    NEUTRAL = "neutral"
    HAPPY = "happy"
    SAD = "sad"
    EXCITED = "excited"
    ANGRY = "angry"

class SynthesizeRequest(BaseModel):
    """语音合成请求"""

    text: str = Field(..., min_length=1, max_length=500, description="要合成的文本")
    language: str = Field(default="zh-CN", description="语言代码")
    persona: VoicePersona = Field(default=VoicePersona.CHEERFUL, description="角色人格")
    emotion: VoiceEmotion = Field(default=VoiceEmotion.NEUTRAL, description="情绪")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="语速 (0.5-2.0)")
    provider: VoiceProvider = Field(default=VoiceProvider.OPENAI, description="TTS 提供商")

    class Config:
        json_schema_extra = {
            "example": {
                "text": "太棒了！你做得很好！",
                "language": "zh-CN",
                "persona": "cheerful",
                "emotion": "happy",
                "speed": 1.0,
                "provider": "openai"
            }
        }

class SynthesizeResponse(BaseModel):
    """语音合成响应"""

    audio_url: str = Field(..., description="音频文件 URL")
    duration_ms: int = Field(..., description="音频时长（毫秒）")
    file_size: int = Field(..., description="文件大小（字节）")
    format: str = Field(default="mp3", description="音频格式")
    cost_usd: float = Field(..., description="本次合成成本（美元）")
    cached: bool = Field(default=False, description="是否命中缓存")
    provider: str = Field(..., description="使用的提供商")

    class Config:
        json_schema_extra = {
            "example": {
                "audio_url": "https://cdn.agl.dev/audio/abc123.mp3",
                "duration_ms": 2500,
                "file_size": 45000,
                "format": "mp3",
                "cost_usd": 0.003,
                "cached": False,
                "provider": "openai"
            }
        }
```

**src/voice_service.py**（主服务逻辑）：

```python
"""
Voice Service - 语音合成主服务

混合策略：
1. 缓存优先（常用对话预生成）
2. 成本控制（每日预算管理）
3. 多提供商支持（OpenAI/ElevenLabs/Azure）
"""

import hashlib
from typing import Dict, List
from .tts_engine import TTSEngine
from .voice_cache import VoiceCache
from .cost_tracker import CostTracker
from .models import SynthesizeResponse, VoiceProvider
import logging

logger = logging.getLogger(__name__)

class VoiceService:
    """语音合成服务"""

    def __init__(self):
        """初始化服务"""
        self.tts_engine = TTSEngine()
        self.cache = VoiceCache()
        self.cost_tracker = CostTracker()

        logger.info("VoiceService initialized")

    async def synthesize(
        self,
        text: str,
        language: str,
        persona: str,
        emotion: str,
        speed: float,
        provider: str
    ) -> SynthesizeResponse:
        """
        合成语音

        Args:
            text: 文本
            language: 语言
            persona: 角色人格
            emotion: 情绪
            speed: 语速
            provider: 提供商

        Returns:
            合成结果
        """

        # 1. 生成缓存键
        cache_key = self._generate_cache_key(
            text, language, persona, emotion, speed, provider
        )

        # 2. 检查缓存
        cached_audio = await self.cache.get(cache_key)
        if cached_audio:
            logger.debug(f"Cache hit: {cache_key}")
            return SynthesizeResponse(
                audio_url=cached_audio['url'],
                duration_ms=cached_audio['duration_ms'],
                file_size=cached_audio['file_size'],
                format=cached_audio['format'],
                cost_usd=0.0,  # 缓存不计费
                cached=True,
                provider=provider
            )

        # 3. 检查每日预算
        daily_cost = await self.cost_tracker.get_daily_cost()
        if daily_cost >= 50.0:  # 每日限额 $50
            logger.warning(f"Daily budget exceeded: ${daily_cost}")
            raise Exception("Daily cost limit exceeded")

        # 4. 调用 TTS 引擎
        logger.debug(f"Synthesizing with {provider}")

        audio_data = await self.tts_engine.synthesize(
            text=text,
            language=language,
            persona=persona,
            emotion=emotion,
            speed=speed,
            provider=provider
        )

        # 5. 上传到 S3/CDN
        audio_url = await self._upload_audio(audio_data, cache_key)

        # 6. 记录成本
        await self.cost_tracker.record(audio_data['cost'])

        # 7. 缓存结果（7天）
        await self.cache.set(cache_key, {
            'url': audio_url,
            'duration_ms': audio_data['duration_ms'],
            'file_size': audio_data['file_size'],
            'format': 'mp3'
        }, ttl=7 * 24 * 3600)  # 7天

        logger.info(f"Synthesis completed, cost: ${audio_data['cost']:.4f}")

        return SynthesizeResponse(
            audio_url=audio_url,
            duration_ms=audio_data['duration_ms'],
            file_size=audio_data['file_size'],
            format='mp3',
            cost_usd=audio_data['cost'],
            cached=False,
            provider=provider
        )

    def _generate_cache_key(
        self,
        text: str,
        language: str,
        persona: str,
        emotion: str,
        speed: float,
        provider: str
    ) -> str:
        """生成缓存键"""
        key_string = f"{text}:{language}:{persona}:{emotion}:{speed}:{provider}"
        return f"voice:{hashlib.md5(key_string.encode()).hexdigest()}"

    async def _upload_audio(self, audio_data: bytes, cache_key: str) -> str:
        """上传音频到 S3/CDN"""
        # 实现略（使用 boto3 上传到 S3）
        # 返回 CDN URL
        return f"https://cdn.agl.dev/audio/{cache_key}.mp3"

    async def list_voices(self) -> List[Dict]:
        """列出可用语音"""
        return [
            {
                "persona": "cheerful",
                "name": "Cheerful Voice",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"],
                "emotions": ["neutral", "happy", "excited"]
            },
            {
                "persona": "cool",
                "name": "Cool Voice",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"],
                "emotions": ["neutral", "calm", "serious"]
            },
            {
                "persona": "cute",
                "name": "Cute Voice",
                "languages": ["zh-CN", "en-US", "ja-JP", "ko-KR"],
                "emotions": ["neutral", "happy", "surprised"]
            }
        ]

    async def get_stats(self) -> Dict:
        """获取服务统计"""
        return {
            "total_requests": await self.cost_tracker.get_total_requests(),
            "total_cost": await self.cost_tracker.get_total_cost(),
            "cache_hit_rate": await self.cache.get_hit_rate(),
            "daily_cost": await self.cost_tracker.get_daily_cost()
        }

    async def clear_cache(self):
        """清除缓存"""
        await self.cache.clear_all()
        logger.info("Cache cleared")
```

**src/tts_engine.py**（TTS 引擎）：

```python
"""
TTS 引擎 - 集成多个 TTS 提供商
"""

from openai import AsyncOpenAI
import logging

logger = logging.getLogger(__name__)

class TTSEngine:
    """TTS 引擎"""

    def __init__(self):
        self.openai_client = AsyncOpenAI()
        # self.elevenlabs_client = ElevenLabs()  # 未来添加

    async def synthesize(
        self,
        text: str,
        language: str,
        persona: str,
        emotion: str,
        speed: float,
        provider: str
    ) -> dict:
        """
        合成语音

        Returns:
            {
                'audio_data': bytes,
                'duration_ms': int,
                'file_size': int,
                'cost': float
            }
        """

        if provider == "openai":
            return await self._synthesize_openai(text, language, persona, speed)
        elif provider == "elevenlabs":
            # 未来实现
            raise NotImplementedError("ElevenLabs not yet implemented")
        else:
            raise ValueError(f"Unknown provider: {provider}")

    async def _synthesize_openai(
        self,
        text: str,
        language: str,
        persona: str,
        speed: float
    ) -> dict:
        """使用 OpenAI TTS"""

        # 根据 persona 选择语音
        voice_map = {
            "cheerful": "nova",  # 女声，活泼
            "cool": "onyx",      # 男声，沉稳
            "cute": "shimmer"    # 女声，温柔
        }
        voice = voice_map.get(persona, "nova")

        # 调用 OpenAI TTS API
        response = await self.openai_client.audio.speech.create(
            model="tts-1",  # tts-1 或 tts-1-hd
            voice=voice,
            input=text,
            speed=speed
        )

        # 获取音频数据
        audio_data = response.content

        # 计算成本（OpenAI TTS-1 定价: $15 / 1M characters）
        char_count = len(text)
        cost = (char_count / 1_000_000) * 15.0

        # 估算时长（简单估算：中文 ~150 字/分钟）
        duration_ms = int((char_count / 150) * 60 * 1000)

        return {
            'audio_data': audio_data,
            'duration_ms': duration_ms,
            'file_size': len(audio_data),
            'cost': cost
        }
```

**requirements.txt**：

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.0
pydantic-settings==2.1.0
openai==1.10.0
redis==5.0.1
boto3==1.34.0  # S3 上传
python-multipart==0.0.6
```

**Docker 部署**：

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8003

# 启动服务
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8003", "--reload"]
```

**集成到基础设施**：

```yaml
# docker-compose.yml 添加
  voice-service:
    build: ./services/voice-service
    ports:
      - "8003:8003"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - REDIS_URL=redis://redis:6379
      - DAILY_BUDGET_USD=50.0
    depends_on:
      - redis
    networks:
      - agl-network
```

**测试**：

```python
# tests/test_voice_service.py
import pytest
from httpx import AsyncClient
from app import app

@pytest.mark.asyncio
async def test_synthesize_success():
    """测试语音合成成功"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/synthesize", json={
            "text": "你好，世界！",
            "language": "zh-CN",
            "persona": "cheerful",
            "emotion": "happy",
            "speed": 1.0,
            "provider": "openai"
        })

        assert response.status_code == 200
        data = response.json()

        assert "audio_url" in data
        assert data["cached"] in [True, False]
        assert data["cost_usd"] >= 0

@pytest.mark.asyncio
async def test_list_voices():
    """测试列出语音"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/voices")

        assert response.status_code == 200
        voices = response.json()

        assert len(voices) >= 3
        assert voices[0]["persona"] in ["cheerful", "cool", "cute"]
```

**交付物**：
- ✅ Voice Service 完整实现
- ✅ 多提供商支持（OpenAI TTS）
- ✅ 缓存机制（降低成本）
- ✅ 成本追踪和预算管理
- ✅ 完整测试套件（30+ 用例）
- ✅ Docker 部署配置
- ✅ API 文档
- ✅ 使用指南

**时间**: 2-3 周
**成本**: $0（代码实现）+ TTS API 使用成本

---

### 任务 4: Flask Dashboard（调用现有 API）

**目标**: 创建 Flask Dashboard，仅调用现有 Analytics API，不修改数据库

#### 4.1 架构设计（轻量级）

**核心原则**：
- ✅ **只调用现有 API**（`/api/v1/analytics/*`）
- ✅ **不创建新表**（使用现有 PostgreSQL）
- ✅ **不修改 Prisma schema**
- ✅ **独立服务**（可选部署）

**目录结构**：

```
services/dashboard/
├── app/
│   ├── __init__.py                  # Flask 应用工厂
│   ├── config.py                    # 配置
│   ├── routes/                      # 路由（蓝图）
│   │   ├── __init__.py
│   │   ├── main.py                  # 主页 + Dashboard
│   │   ├── games.py                 # 游戏管理
│   │   ├── players.py               # 玩家管理
│   │   └── analytics.py             # 分析页面
│   ├── services/                    # 业务逻辑
│   │   ├── agl_client.py            # AGL API 客户端
│   │   └── auth_service.py          # 简单认证
│   ├── templates/                   # Jinja2 模板
│   │   ├── base.html                # 基础模板
│   │   ├── layout.html              # 布局
│   │   ├── dashboard/               # Dashboard 页面
│   │   │   └── index.html
│   │   ├── games/                   # 游戏管理页面
│   │   │   ├── list.html
│   │   │   └── detail.html
│   │   └── components/              # 可复用组件
│   │       ├── navbar.html
│   │       └── sidebar.html
│   ├── static/                      # 静态资源
│   │   ├── css/
│   │   │   └── main.css             # Tailwind CSS
│   │   └── js/
│   │       └── main.js              # JavaScript
│   └── utils/
│       └── helpers.py               # 工具函数
├── tests/                           # 测试
├── requirements.txt                 # Python 依赖
├── Dockerfile
├── .env.example
└── README.md
```

#### 4.2 核心代码实现

**app/__init__.py**（Flask 应用工厂）：

```python
"""
Dashboard Application Factory
"""

from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app(config_class=Config):
    """创建 Flask 应用"""

    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS
    CORS(app)

    # 注册蓝图
    from app.routes.main import bp as main_bp
    from app.routes.games import bp as games_bp
    from app.routes.analytics import bp as analytics_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(games_bp, url_prefix='/games')
    app.register_blueprint(analytics_bp, url_prefix='/analytics')

    return app
```

**app/services/agl_client.py**（API 客户端）：

```python
"""
AGL API 客户端

调用现有的 API Service 端点。
"""

import httpx
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class AGLClient:
    """AGL API 客户端"""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            base_url=base_url,
            headers={"X-API-Key": api_key},
            timeout=30.0
        )

    # ========== Games API ==========

    async def get_games(self) -> List[Dict]:
        """获取游戏列表"""
        response = await self.client.get("/api/v1/games")
        response.raise_for_status()
        return response.json()

    async def get_game(self, game_id: str) -> Dict:
        """获取游戏详情"""
        response = await self.client.get(f"/api/v1/games/{game_id}")
        response.raise_for_status()
        return response.json()

    # ========== Analytics API ==========

    async def get_game_analytics(
        self,
        game_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict]:
        """获取游戏分析数据"""
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        response = await self.client.get(
            f"/api/v1/analytics/games/{game_id}",
            params=params
        )
        response.raise_for_status()
        return response.json()

    async def get_game_usage(
        self,
        game_id: str,
        days: int = 30
    ) -> Dict:
        """获取游戏使用统计"""
        response = await self.client.get(
            f"/api/v1/analytics/games/{game_id}/usage",
            params={"days": days}
        )
        response.raise_for_status()
        return response.json()

    async def get_emotions(
        self,
        game_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict:
        """获取情感分布"""
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        response = await self.client.get(
            f"/api/v1/analytics/games/{game_id}/emotions",
            params=params
        )
        response.raise_for_status()
        return response.json()

    async def get_cost_analytics(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        game_id: Optional[str] = None
    ) -> Dict:
        """获取成本分析"""
        params = {}
        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date
        if game_id:
            params['gameId'] = game_id

        response = await self.client.get(
            "/api/v1/analytics/costs",
            params=params
        )
        response.raise_for_status()
        return response.json()

    async def close(self):
        """关闭客户端"""
        await self.client.aclose()
```

**app/routes/main.py**（Dashboard 主页）：

```python
"""
Dashboard 主页路由
"""

from flask import Blueprint, render_template
from app.services.agl_client import AGLClient
from app.config import Config
import asyncio

bp = Blueprint('main', __name__)

def get_client():
    """获取 AGL 客户端"""
    return AGLClient(
        base_url=Config.AGL_API_URL,
        api_key=Config.AGL_API_KEY
    )

@bp.route('/')
async def index():
    """Dashboard 首页"""

    client = get_client()

    try:
        # 获取游戏列表
        games = await client.get_games()

        # 获取第一个游戏的统计（示例）
        if games:
            game_id = games[0]['id']
            usage = await client.get_game_usage(game_id, days=7)
            emotions = await client.get_emotions(game_id)
        else:
            usage = None
            emotions = None

        return render_template(
            'dashboard/index.html',
            games=games,
            usage=usage,
            emotions=emotions
        )

    finally:
        await client.close()
```

**app/templates/dashboard/index.html**（首页模板）：

```html
{% extends "layout.html" %}

{% block title %}Dashboard - AGL Platform{% endblock %}

{% block content %}
<div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Dashboard</h1>

    <!-- 统计卡片 -->
    {% if usage %}
    <div class="grid grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="text-gray-500 text-sm">Total Events</div>
            <div class="text-3xl font-bold">{{ usage.summary.totalEvents | format_number }}</div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="text-gray-500 text-sm">Active Players</div>
            <div class="text-3xl font-bold">{{ usage.summary.totalPlayers | format_number }}</div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="text-gray-500 text-sm">Total Cost</div>
            <div class="text-3xl font-bold text-green-600">${{ usage.summary.totalCost | round(2) }}</div>
        </div>
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="text-gray-500 text-sm">Avg Latency</div>
            <div class="text-3xl font-bold">{{ usage.summary.avgLatency | round(0) }}ms</div>
        </div>
    </div>
    {% endif %}

    <!-- 情感分布图 -->
    {% if emotions %}
    <div class="bg-white p-6 rounded-lg shadow mb-8">
        <h2 class="text-xl font-bold mb-4">Emotion Distribution</h2>
        <canvas id="emotionChart"></canvas>
    </div>
    {% endif %}

    <!-- 游戏列表 -->
    <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-bold mb-4">Active Games</h2>
        <table class="w-full">
            <thead>
                <tr class="border-b">
                    <th class="text-left py-2">Name</th>
                    <th class="text-left py-2">Players</th>
                    <th class="text-left py-2">Events</th>
                    <th class="text-left py-2">Actions</th>
                </tr>
            </thead>
            <tbody>
                {% for game in games %}
                <tr class="border-b">
                    <td class="py-2">{{ game.name }}</td>
                    <td class="py-2">-</td>
                    <td class="py-2">-</td>
                    <td class="py-2">
                        <a href="/games/{{ game.id }}" class="text-blue-500 hover:underline">
                            View Details
                        </a>
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
    </div>
</div>

<script>
    // 渲染情感分布图
    {% if emotions %}
    const emotionData = {
        labels: {{ emotions.keys() | list | tojson }},
        datasets: [{
            data: {{ emotions.values() | list | tojson }},
            backgroundColor: [
                '#10b981', '#3b82f6', '#6366f1', '#8b5cf6',
                '#ec4899', '#f59e0b', '#ef4444', '#6b7280'
            ]
        }]
    };

    new Chart(document.getElementById('emotionChart'), {
        type: 'pie',
        data: emotionData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
    {% endif %}
</script>
{% endblock %}
```

**requirements.txt**：

```txt
Flask==3.0.0
Flask-CORS==4.0.0
httpx==0.26.0
python-dotenv==1.0.0
```

**Docker 部署**：

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 5000

# 启动服务
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]
```

**集成到基础设施**：

```yaml
# docker-compose.yml 添加
  dashboard:
    build: ./services/dashboard
    ports:
      - "5000:5000"
    environment:
      - AGL_API_URL=http://api-service:3000
      - AGL_API_KEY=${AGL_API_KEY}
      - FLASK_ENV=development
    depends_on:
      - api-service
    networks:
      - agl-network
```

**交付物**：
- ✅ Flask Dashboard 完整实现
- ✅ 调用现有 Analytics API
- ✅ 响应式 UI（Tailwind CSS）
- ✅ 图表可视化（Chart.js）
- ✅ Docker 部署配置
- ✅ 使用文档

**时间**: 1-2 周
**成本**: $0

---

## 📅 修订版时间表

```
Phase 4B + Dashboard 实施 (12-16 周)

Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
      |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
Avatar ████████                                          完善 Avatar SDK
SDK      ▲ 获取模型
         ▲ 优化上传
            ▲ API 集成

Vision         ████████                                  完善 Vision SDK
SDK (可选)        ▲ 添加测试
                  ▲ 代理服务（可选）
                     ▲ 插件完善

Voice                    ████████████                    新建 Voice Service
Service                     ▲ TTS 引擎
                            ▲ 缓存系统
                               ▲ 测试完成

Dashboard                               ████████          Flask Dashboard
                                           ▲ API 客户端
                                           ▲ UI 页面
                                              ▲ 部署上线

测试      ══════════════════════════════════════════     持续测试
文档      ══════════════════════════════════════════     持续文档

里程碑    M1      M2         M3            M4        M5
          Week 3  Week 6     Week 12       Week 14   Week 16
```

---

## 🎯 质量保证（不变）

### 代码质量标准

- ✅ **测试覆盖率**: 85%+
- ✅ **代码注释**: 30%+
- ✅ **文档完整度**: 100%
- ✅ **性能达标**: P95 < 200ms
- ✅ **0 errors, 0 warnings**

### 架构约束

- ✅ **不破坏现有服务**
- ✅ **不修改现有数据库 schema**（除非必要）
- ✅ **遵循现有代码模式**
- ✅ **向后兼容**

---

## 📋 下一步行动

1. **确认方案**: 审阅本修订版方案
2. **选择优先级**:
   - Avatar SDK 完善（必须）
   - Vision 代理服务（可选）
   - Voice Service（必须）
   - Dashboard（建议）
3. **开始实施**: 从 Avatar SDK 开始

---

**文档维护**: 本文档基于代码探索结果，严格遵循现有架构
**责任人**: 技术 Lead + 架构师
**更新日期**: 2025-01-27

**End of Document**
