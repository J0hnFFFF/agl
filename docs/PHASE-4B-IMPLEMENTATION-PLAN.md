# Phase 4B + Flask Dashboard 实施方案

**版本**: v1.0
**创建日期**: 2025-01-27
**项目阶段**: Phase 4B (Avatar + Vision + Voice) + Flask Dashboard
**质量标准**: 生产级代码质量、完整文档、完整测试

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 架构师规划](#2-架构师规划)
- [3. 高级研发规划](#3-高级研发规划)
- [4. 产品经理规划](#4-产品经理规划)
- [5. 资深测试规划](#5-资深测试规划)
- [6. 代码规范与标准](#6-代码规范与标准)
- [7. 实施时间表](#7-实施时间表)
- [8. 质量保证体系](#8-质量保证体系)

---

## 1. 项目概述

### 1.1 项目目标

**Phase 4B 完成项目**:
1. **Avatar SDK 完善** - 3D 模型、动画、性能优化
2. **Vision SDK 完善** - 屏幕捕获、LLM 集成、Unity/Unreal 插件
3. **Voice Service 实现** - STT、TTS、实时对话、唇形同步

**Flask Dashboard 新项目**:
4. **管理后台** - 开发者友好的可视化管理界面

### 1.2 质量目标

| 指标 | 目标值 | 验收标准 |
|-----|--------|---------|
| **代码覆盖率** | 85%+ | 所有模块单元测试 + 集成测试 |
| **文档完整度** | 100% | API 文档、架构文档、使用手册 |
| **代码注释率** | 30%+ | 关键逻辑必须有详细注释 |
| **性能指标** | P95 < 200ms | API 响应时间、渲染帧率 |
| **代码质量** | 0 errors | ESLint/Pylint/TypeScript 零错误 |

### 1.3 技术选型总览

```
Phase 4B:
├── Avatar SDK: React + Three.js + TypeScript
├── Vision SDK: TypeScript (前端) + Python FastAPI (后端)
└── Voice Service: Python FastAPI + OpenAI/Azure APIs

Flask Dashboard:
└── Python Flask + Jinja2 + Tailwind CSS + Chart.js
```

---

## 2. 架构师规划

### 2.1 整体系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    AGL Platform v1.2                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Client SDKs  │  │ Management   │  │ Admin        │     │
│  │              │  │ Dashboard    │  │ Portal       │     │
│  │ - Unity      │  │ (Flask)      │  │ (Future)     │     │
│  │ - Unreal     │  │              │  │              │     │
│  │ - Web        │  │ Port: 5000   │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                  │                                 │
│         │                  │                                 │
│  ┌──────▼──────────────────▼─────────────────────────────┐ │
│  │           API Gateway (Kong / Nginx)                   │ │
│  │           Port: 3000 (REST + WebSocket)                │ │
│  └──────┬─────────────────────────────────────────────────┘ │
│         │                                                     │
│  ┌──────▼──────────────────────────────────────────────┐   │
│  │              Core Services                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │
│  │  │ Emotion │  │Dialogue │  │ Memory  │            │   │
│  │  │ Service │  │Service  │  │ Service │            │   │
│  │  └─────────┘  └─────────┘  └─────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                     │
│  ┌──────▼──────────────────────────────────────────────┐   │
│  │          Phase 4B New Services                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐            │   │
│  │  │ Avatar  │  │ Vision  │  │  Voice  │            │   │
│  │  │ Service │  │ Service │  │ Service │            │   │
│  │  │(Node.js)│  │(Python) │  │(Python) │            │   │
│  │  │Port:3003│  │Port:8002│  │Port:8003│            │   │
│  │  └─────────┘  └─────────┘  └─────────┘            │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                     │
│  ┌──────▼──────────────────────────────────────────────┐   │
│  │              Data Layer                              │   │
│  │  ┌──────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │   │
│  │  │PostgreSQL│  │ Redis  │  │ Qdrant │  │MongoDB │ │   │
│  │  │          │  │        │  │        │  │ (New)  │ │   │
│  │  └──────────┘  └────────┘  └────────┘  └────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Phase 4B 模块架构设计

#### 2.2.1 Avatar Service 架构

```typescript
// 架构设计
services/avatar-service/
├── src/
│   ├── controllers/           # API 控制器
│   │   ├── avatar.controller.ts
│   │   ├── model.controller.ts
│   │   └── animation.controller.ts
│   ├── services/              # 业务逻辑
│   │   ├── avatar.service.ts   # 头像管理
│   │   ├── model.service.ts    # 模型加载/缓存
│   │   └── animation.service.ts # 动画管理
│   ├── models/                # 数据模型 (Prisma)
│   │   └── avatar.prisma
│   ├── utils/                 # 工具函数
│   │   ├── gltf-loader.ts
│   │   ├── texture-optimizer.ts
│   │   └── lod-generator.ts
│   ├── middleware/            # 中间件
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   └── config/                # 配置
│       ├── database.ts
│       └── storage.ts
├── assets/                    # 静态资源
│   ├── models/               # 3D 模型 (GLTF)
│   │   ├── warrior.gltf
│   │   ├── mage.gltf
│   │   └── ...
│   ├── textures/             # 纹理贴图
│   └── animations/           # FBX 动画文件
├── tests/                    # 测试
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                     # 文档
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── package.json
├── tsconfig.json
└── README.md
```

**技术决策**:
- **语言**: TypeScript (与现有 API Service 一致)
- **框架**: Express.js (轻量级 HTTP 服务)
- **ORM**: Prisma (数据库访问)
- **存储**: S3-compatible (MinIO 本地开发, AWS S3 生产)
- **缓存**: Redis (模型和纹理缓存)

**数据模型**:
```prisma
// prisma/schema.prisma

model AvatarModel {
  id          String   @id @default(cuid())
  name        String   @unique
  type        String   // warrior, mage, archer, priest, assassin
  gltfUrl     String   // S3 URL
  thumbnailUrl String?
  polygonCount Int
  fileSize    Int      // bytes
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  skins       Skin[]
  animations  Animation[]
}

model Skin {
  id          String   @id @default(cuid())
  name        String
  textureUrl  String   // S3 URL
  avatarId    String
  avatar      AvatarModel @relation(fields: [avatarId], references: [id])
  createdAt   DateTime @default(now())
}

model Animation {
  id          String   @id @default(cuid())
  name        String   // happy, sad, excited, etc.
  emotion     String
  intensity   Int      // 1, 2, 3
  fbxUrl      String   // S3 URL
  duration    Float    // seconds
  avatarId    String
  avatar      AvatarModel @relation(fields: [avatarId], references: [id])
  createdAt   DateTime @default(now())
}
```

**API 端点设计**:
```typescript
// RESTful API
GET    /api/v1/avatars                    # 列出所有角色模型
GET    /api/v1/avatars/:id                # 获取模型详情
POST   /api/v1/avatars                    # 上传新模型 (管理员)
DELETE /api/v1/avatars/:id                # 删除模型 (管理员)

GET    /api/v1/avatars/:id/skins          # 获取皮肤列表
POST   /api/v1/avatars/:id/skins          # 上传新皮肤

GET    /api/v1/avatars/:id/animations     # 获取动画列表
GET    /api/v1/avatars/:id/animations/:emotion/:intensity  # 获取特定动画
POST   /api/v1/avatars/:id/animations     # 上传新动画

GET    /api/v1/avatars/:id/download       # 下载完整模型包 (包含动画)
```

**性能优化策略**:
1. **CDN 加速**: 所有静态资源通过 CDN 分发
2. **模型压缩**: GLTF Draco 压缩 (减少 70-80% 体积)
3. **纹理优化**: WebP 格式 + 2048x2048 最大分辨率
4. **LOD 系统**: 3 个层级 (High/Medium/Low)
5. **懒加载**: 按需加载动画文件

---

#### 2.2.2 Vision Service 架构

```
services/vision-service/
├── src/
│   ├── api/                      # FastAPI 路由
│   │   ├── __init__.py
│   │   ├── capture.py            # 屏幕捕获 API
│   │   ├── analyze.py            # 分析 API
│   │   └── history.py            # 历史记录 API
│   ├── services/
│   │   ├── capture_service.py    # 捕获逻辑
│   │   ├── vision_analyzer.py    # LLM 分析
│   │   ├── game_recognizer.py    # 游戏状态识别
│   │   └── cache_service.py      # 结果缓存
│   ├── models/                   # Pydantic 模型
│   │   ├── capture.py
│   │   ├── analysis.py
│   │   └── game_state.py
│   ├── integrations/             # 第三方集成
│   │   ├── openai_client.py      # GPT-4V
│   │   ├── anthropic_client.py   # Claude Vision
│   │   └── ocr_engine.py         # Tesseract OCR
│   ├── storage/                  # 存储层
│   │   ├── mongodb.py            # 分析结果存储
│   │   └── s3.py                 # 截图存储
│   ├── utils/
│   │   ├── image_processor.py    # 图像处理
│   │   ├── video_clipper.py      # 视频剪辑
│   │   └── cost_tracker.py       # 成本追踪
│   └── config/
│       ├── settings.py
│       └── logging_config.py
├── plugins/                      # 游戏引擎插件
│   ├── unity/
│   │   └── VisionPlugin.cs
│   └── unreal/
│       └── VisionPlugin.cpp
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/                 # 测试图片
├── docs/
│   ├── API.md
│   ├── VISION_GUIDE.md
│   └── COST_OPTIMIZATION.md
├── requirements.txt
├── Dockerfile
└── README.md
```

**技术决策**:
- **语言**: Python 3.11+
- **框架**: FastAPI 0.104+
- **LLM**: GPT-4V (主) + Claude Vision (备)
- **OCR**: Tesseract (本地) + GPT-4V (复杂场景)
- **图像处理**: Pillow + OpenCV
- **存储**: MongoDB (分析结果) + S3 (截图原图)
- **消息队列**: Redis Streams (异步处理)

**数据模型** (MongoDB):
```python
# models/analysis.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class ScreenCapture(BaseModel):
    """屏幕捕获记录"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    game_id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    image_url: str  # S3 URL
    resolution: str  # "1920x1080"
    file_size: int  # bytes
    format: str = "png"

class VisionAnalysis(BaseModel):
    """视觉分析结果"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    capture_id: str
    player_id: str
    game_id: str
    timestamp: datetime = Field(default_factory=datetime.now)

    # 游戏状态识别
    game_state: Dict = {
        "scene": str,           # "battle", "menu", "loading"
        "player_health": float,  # 0-100
        "player_mana": float,    # 0-100
        "in_combat": bool,
        "enemies_visible": int,
        "ui_elements": List[str]
    }

    # LLM 分析结果
    llm_analysis: Dict = {
        "provider": str,        # "openai" or "anthropic"
        "model": str,           # "gpt-4-vision-preview"
        "prompt": str,
        "response": str,
        "confidence": float,
        "processing_time_ms": int,
        "cost_usd": float
    }

    # 建议和提示
    suggestions: List[Dict] = [
        {
            "type": str,        # "tactical", "warning", "hint"
            "priority": str,    # "high", "medium", "low"
            "message": str,
            "confidence": float
        }
    ]

    # 性能指标
    metrics: Dict = {
        "capture_time_ms": int,
        "ocr_time_ms": int,
        "llm_time_ms": int,
        "total_time_ms": int,
        "cache_hit": bool
    }
```

**API 端点设计**:
```python
# RESTful API
POST   /api/v1/vision/capture              # 提交截图
GET    /api/v1/vision/captures/:id         # 获取截图详情
POST   /api/v1/vision/analyze               # 分析截图 (异步)
GET    /api/v1/vision/analysis/:id         # 获取分析结果
GET    /api/v1/vision/history               # 历史记录
DELETE /api/v1/vision/captures/:id         # 删除截图

# WebSocket 实时推送
WS     /ws/v1/vision/stream                 # 实时分析流
```

**成本优化策略**:
```python
# 混合策略：本地 OCR + LLM
def analyze_screenshot(image: bytes) -> Analysis:
    # 1. 本地 OCR 提取文本 (免费)
    text = ocr_engine.extract_text(image)

    # 2. 规则引擎判断 (免费)
    if simple_rules.can_handle(text):
        return simple_rules.analyze(text)

    # 3. 检查缓存 (基于图像哈希)
    cache_key = hash_image(image)
    if cache.exists(cache_key):
        return cache.get(cache_key)

    # 4. LLM 分析 (付费，但缓存 1 小时)
    result = gpt4v.analyze(image, text)
    cache.set(cache_key, result, ttl=3600)

    return result
```

**预期成本**:
- GPT-4V: $0.01 - $0.03 per analysis
- 目标: 80% 缓存命中率
- 平均成本: ~$0.003 per request

---

#### 2.2.3 Voice Service 架构

```
services/voice-service/
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── stt.py                # 语音识别 API
│   │   ├── tts.py                # 语音合成 API
│   │   ├── dialogue.py           # 语音对话 API
│   │   └── lipsync.py            # 唇形同步 API
│   ├── services/
│   │   ├── stt_service.py        # Whisper 集成
│   │   ├── tts_service.py        # OpenAI TTS 集成
│   │   ├── dialogue_manager.py   # 对话管理
│   │   ├── voice_activity.py     # VAD 检测
│   │   └── lipsync_generator.py  # 唇形生成
│   ├── models/
│   │   ├── voice.py
│   │   ├── dialogue.py
│   │   └── phoneme.py
│   ├── integrations/
│   │   ├── openai_whisper.py
│   │   ├── openai_tts.py
│   │   ├── azure_speech.py       # 备用
│   │   └── elevenlabs.py         # 高质量 TTS
│   ├── audio/                    # 音频处理
│   │   ├── processor.py
│   │   ├── resampler.py
│   │   └── vad_detector.py
│   ├── cache/
│   │   ├── audio_cache.py        # 音频缓存
│   │   └── phoneme_cache.py
│   ├── utils/
│   │   ├── audio_utils.py
│   │   └── cost_tracker.py
│   └── config/
│       └── settings.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/                 # 测试音频
├── docs/
│   ├── API.md
│   ├── VOICE_GUIDE.md
│   └── LIPSYNC_TUTORIAL.md
├── requirements.txt
└── README.md
```

**技术决策**:
- **STT**: OpenAI Whisper API (主) + Azure Speech (备)
- **TTS**: OpenAI TTS (主) + ElevenLabs (高质量场景)
- **实时通信**: WebSocket + WebRTC
- **音频格式**: Opus (压缩) + WAV (原始)
- **VAD**: WebRTC VAD (浏览器端) + Silero VAD (服务端)
- **缓存**: Redis (音频片段) + S3 (完整文件)

**数据模型**:
```python
# models/voice.py
from pydantic import BaseModel
from enum import Enum
from typing import Optional, List

class VoiceProvider(str, Enum):
    OPENAI = "openai"
    AZURE = "azure"
    ELEVENLABS = "elevenlabs"

class VoicePersona(str, Enum):
    CHEERFUL = "cheerful"  # 活泼
    COOL = "cool"          # 冷静
    CUTE = "cute"          # 可爱

class STTRequest(BaseModel):
    """语音识别请求"""
    audio_data: bytes
    format: str = "wav"
    sample_rate: int = 16000
    language: str = "zh-CN"
    provider: VoiceProvider = VoiceProvider.OPENAI

class STTResponse(BaseModel):
    """语音识别响应"""
    text: str
    confidence: float
    language: str
    duration_ms: int
    cost_usd: float

class TTSRequest(BaseModel):
    """语音合成请求"""
    text: str
    language: str = "zh-CN"
    persona: VoicePersona = VoicePersona.CHEERFUL
    emotion: str = "neutral"  # happy, sad, excited
    speed: float = 1.0        # 0.5 - 2.0
    pitch: float = 1.0        # 0.5 - 2.0
    provider: VoiceProvider = VoiceProvider.OPENAI

class TTSResponse(BaseModel):
    """语音合成响应"""
    audio_url: str            # S3 URL
    duration_ms: int
    file_size: int
    format: str = "mp3"
    phonemes: List[Dict]      # 音素时间轴 (用于唇形同步)
    cost_usd: float

class LipSyncData(BaseModel):
    """唇形同步数据"""
    phonemes: List[Dict] = [
        {
            "phoneme": str,   # "A", "E", "I", "O", "U", etc.
            "start_ms": int,
            "end_ms": int,
            "mouth_shape": str  # "wide_open", "narrow", etc.
        }
    ]
    duration_ms: int
```

**API 端点设计**:
```python
# RESTful API
POST   /api/v1/voice/stt                   # 语音识别
POST   /api/v1/voice/tts                   # 语音合成
GET    /api/v1/voice/audio/:id             # 获取音频文件
POST   /api/v1/voice/lipsync               # 生成唇形数据

# WebSocket 实时对话
WS     /ws/v1/voice/dialogue                # 实时语音对话
```

**实时对话流程**:
```
Client (WebSocket)                    Voice Service
    │                                       │
    ├─► [Audio Stream] ──────────────────► │
    │   (Opus encoded, 20ms chunks)        │
    │                                       │
    │                                  ┌────▼────┐
    │                                  │   VAD   │ 检测语音活动
    │                                  └────┬────┘
    │                                       │
    │                                  ┌────▼────┐
    │                                  │Whisper  │ 实时识别
    │                                  │  STT    │
    │                                  └────┬────┘
    │                                       │
    │                                  ┌────▼────┐
    │                                  │Dialogue │ 对话管理
    │                                  │ Manager │
    │                                  └────┬────┘
    │                                       │
    │                                  ┌────▼────┐
    │                                  │OpenAI   │ 生成回复
    │                                  │  TTS    │
    │                                  └────┬────┘
    │                                       │
    │ ◄──────────────── [Audio Response] ◄─┤
    │   (Streaming, 边生成边播放)          │
```

**性能优化**:
1. **流式 TTS**: 边生成边播放 (降低首字节延迟)
2. **音频缓存**: 常用语句预生成并缓存
3. **VAD 优化**: 浏览器端 VAD 减少网络传输
4. **Opus 压缩**: 降低带宽 (16kHz, 32kbps)

---

### 2.3 Flask Dashboard 架构设计

```
services/dashboard/
├── app/
│   ├── __init__.py               # Flask 应用初始化
│   ├── config.py                 # 配置管理
│   ├── routes/                   # 路由蓝图
│   │   ├── __init__.py
│   │   ├── dashboard.py          # 首页 Dashboard
│   │   ├── games.py              # 游戏管理
│   │   ├── players.py            # 玩家管理
│   │   ├── analytics.py          # 数据分析
│   │   ├── avatars.py            # 头像管理
│   │   ├── vision.py             # 视觉分析
│   │   ├── voice.py              # 语音管理
│   │   ├── settings.py           # 设置
│   │   └── api_keys.py           # API Key 管理
│   ├── services/                 # 业务逻辑层
│   │   ├── agl_client.py         # 调用 AGL API
│   │   ├── analytics_service.py
│   │   ├── game_service.py
│   │   └── auth_service.py
│   ├── models/                   # 数据模型 (SQLAlchemy)
│   │   ├── user.py
│   │   ├── session.py
│   │   └── audit_log.py
│   ├── forms/                    # WTForms 表单
│   │   ├── game_form.py
│   │   ├── player_form.py
│   │   └── settings_form.py
│   ├── templates/                # Jinja2 模板
│   │   ├── base.html             # 基础模板
│   │   ├── layout.html           # 布局模板
│   │   ├── dashboard/
│   │   │   ├── index.html        # Dashboard 首页
│   │   │   └── widgets/          # 可复用组件
│   │   ├── games/
│   │   │   ├── list.html
│   │   │   ├── detail.html
│   │   │   └── create.html
│   │   ├── analytics/
│   │   │   ├── overview.html
│   │   │   ├── emotions.html
│   │   │   └── costs.html
│   │   └── components/           # 通用组件
│   │       ├── navbar.html
│   │       ├── sidebar.html
│   │       └── pagination.html
│   ├── static/                   # 静态资源
│   │   ├── css/
│   │   │   ├── tailwind.css      # Tailwind CSS
│   │   │   └── custom.css
│   │   ├── js/
│   │   │   ├── chart-utils.js    # Chart.js 封装
│   │   │   ├── api-client.js     # AJAX 请求
│   │   │   └── main.js
│   │   └── images/
│   ├── utils/                    # 工具函数
│   │   ├── decorators.py         # 装饰器 (登录验证)
│   │   ├── helpers.py
│   │   └── validators.py
│   └── middleware/
│       ├── auth.py               # 认证中间件
│       └── error_handlers.py     # 错误处理
├── migrations/                   # 数据库迁移 (Flask-Migrate)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── USER_GUIDE.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
├── scripts/
│   ├── init_db.py                # 初始化数据库
│   └── seed_data.py              # 填充示例数据
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

**技术决策**:
- **框架**: Flask 3.0+ (轻量级、易扩展)
- **模板引擎**: Jinja2 (Flask 内置)
- **ORM**: SQLAlchemy + Flask-SQLAlchemy
- **表单**: Flask-WTF + WTForms (CSRF 保护)
- **认证**: Flask-Login + JWT
- **迁移**: Flask-Migrate (Alembic)
- **前端框架**: Tailwind CSS 3.x
- **图表库**: Chart.js 4.x + ApexCharts
- **AJAX**: Fetch API (原生)

**数据模型** (SQLAlchemy):
```python
# models/user.py
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    """管理员用户"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='viewer')  # admin, operator, viewer
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class AuditLog(db.Model):
    """操作审计日志"""
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(50))  # create_game, delete_player, etc.
    resource_type = db.Column(db.String(50))
    resource_id = db.Column(db.String(100))
    details = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=db.func.now())
```

**页面结构设计**:
```html
<!-- templates/layout.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}AGL Platform{% endblock %}</title>
    <link href="{{ url_for('static', filename='css/tailwind.css') }}" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
    {% block head %}{% endblock %}
</head>
<body class="bg-gray-50">
    <div class="flex h-screen">
        <!-- 侧边栏 -->
        <aside class="w-64 bg-white shadow-lg">
            {% include 'components/sidebar.html' %}
        </aside>

        <!-- 主内容区 -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- 顶部导航栏 -->
            <header class="bg-white shadow">
                {% include 'components/navbar.html' %}
            </header>

            <!-- 内容区域 -->
            <main class="flex-1 overflow-x-hidden overflow-y-auto p-6">
                <!-- Flash 消息 -->
                {% with messages = get_flashed_messages(with_categories=true) %}
                    {% if messages %}
                        {% for category, message in messages %}
                            <div class="alert alert-{{ category }} mb-4">
                                {{ message }}
                            </div>
                        {% endfor %}
                    {% endif %}
                {% endwith %}

                <!-- 页面内容 -->
                {% block content %}{% endblock %}
            </main>
        </div>
    </div>

    <script src="{{ url_for('static', filename='js/main.js') }}"></script>
    {% block scripts %}{% endblock %}
</body>
</html>
```

**Dashboard 首页设计**:
```python
# routes/dashboard.py
from flask import Blueprint, render_template, jsonify
from app.services.analytics_service import AnalyticsService

bp = Blueprint('dashboard', __name__)
analytics_service = AnalyticsService()

@bp.route('/')
def index():
    """Dashboard 首页"""
    # 获取今日统计
    today_stats = analytics_service.get_today_stats()

    # 获取情感分布
    emotion_data = analytics_service.get_emotion_distribution(days=7)

    # 获取成本趋势
    cost_trend = analytics_service.get_cost_trend(days=7)

    # 获取活跃游戏
    active_games = analytics_service.get_active_games(limit=5)

    return render_template('dashboard/index.html',
        today_stats=today_stats,
        emotion_data=emotion_data,
        cost_trend=cost_trend,
        active_games=active_games
    )

@bp.route('/api/realtime-stats')
def realtime_stats():
    """实时统计 API (用于前端轮询)"""
    stats = analytics_service.get_realtime_stats()
    return jsonify(stats)
```

---

## 3. 高级研发规划

### 3.1 代码结构最佳实践

#### 3.1.1 TypeScript 代码规范

```typescript
/**
 * Avatar Service - 头像管理服务
 *
 * @module AvatarService
 * @description 提供3D头像模型的加载、缓存和管理功能
 * @author AGL Team
 * @version 1.0.0
 */

import { PrismaClient, AvatarModel } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Redis } from 'ioredis';
import { Logger } from './utils/logger';

/**
 * 头像服务配置
 */
interface AvatarServiceConfig {
  s3Bucket: string;
  s3Region: string;
  cacheExpiry: number; // 秒
  maxFileSize: number; // bytes
}

/**
 * 头像服务类
 *
 * @class AvatarService
 * @description 管理3D头像模型的完整生命周期
 *
 * @example
 * ```typescript
 * const service = new AvatarService(config);
 * const model = await service.getModel('warrior');
 * ```
 */
export class AvatarService {
  private prisma: PrismaClient;
  private s3: S3Client;
  private redis: Redis;
  private logger: Logger;
  private config: AvatarServiceConfig;

  /**
   * 构造函数
   *
   * @param {AvatarServiceConfig} config - 服务配置
   */
  constructor(config: AvatarServiceConfig) {
    this.config = config;
    this.prisma = new PrismaClient();
    this.s3 = new S3Client({ region: config.s3Region });
    this.redis = new Redis();
    this.logger = new Logger('AvatarService');
  }

  /**
   * 获取头像模型
   *
   * @param {string} modelId - 模型ID
   * @returns {Promise<AvatarModel>} 头像模型数据
   * @throws {NotFoundError} 模型不存在
   * @throws {CacheError} 缓存读取失败
   *
   * @example
   * ```typescript
   * const model = await service.getModel('warrior');
   * console.log(model.gltfUrl);
   * ```
   */
  async getModel(modelId: string): Promise<AvatarModel> {
    // 1. 检查缓存
    const cacheKey = `avatar:model:${modelId}`;
    const cached = await this.getCached(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for model: ${modelId}`);
      return JSON.parse(cached) as AvatarModel;
    }

    // 2. 从数据库查询
    this.logger.debug(`Cache miss, querying database for model: ${modelId}`);
    const model = await this.prisma.avatarModel.findUnique({
      where: { id: modelId },
      include: {
        skins: true,
        animations: true
      }
    });

    if (!model) {
      this.logger.warn(`Model not found: ${modelId}`);
      throw new NotFoundError(`Avatar model not found: ${modelId}`);
    }

    // 3. 缓存结果
    await this.setCached(cacheKey, JSON.stringify(model), this.config.cacheExpiry);

    return model;
  }

  /**
   * 从缓存获取数据
   *
   * @private
   * @param {string} key - 缓存键
   * @returns {Promise<string | null>} 缓存值或 null
   */
  private async getCached(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Redis get error: ${error.message}`, { key });
      return null; // 缓存失败不影响业务
    }
  }

  /**
   * 设置缓存
   *
   * @private
   * @param {string} key - 缓存键
   * @param {string} value - 缓存值
   * @param {number} expiry - 过期时间（秒）
   */
  private async setCached(key: string, value: string, expiry: number): Promise<void> {
    try {
      await this.redis.setex(key, expiry, value);
    } catch (error) {
      this.logger.error(`Redis set error: ${error.message}`, { key });
      // 缓存失败不抛出异常
    }
  }

  /**
   * 清理资源
   *
   * @description 断开所有连接，释放资源
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    this.redis.disconnect();
    this.logger.info('AvatarService cleaned up');
  }
}

/**
 * 自定义错误：资源未找到
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
```

**关键规范**:
- ✅ **JSDoc 注释**：所有公开方法必须有详细注释
- ✅ **类型安全**：严格使用 TypeScript 类型
- ✅ **错误处理**：明确的错误类型和处理
- ✅ **日志记录**：关键操作记录日志
- ✅ **资源清理**：提供清理方法

---

#### 3.1.2 Python 代码规范

```python
"""
Vision Service - 视觉分析服务

该模块提供游戏画面的AI视觉分析功能，包括：
- 屏幕捕获和存储
- GPT-4V/Claude Vision 集成
- 游戏状态识别
- 战术建议生成

Author: AGL Team
Version: 1.0.0
Date: 2025-01-27
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

from fastapi import HTTPException
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from PIL import Image
import io

# 配置日志
logger = logging.getLogger(__name__)


@dataclass
class VisionConfig:
    """视觉分析配置

    Attributes:
        openai_api_key: OpenAI API密钥
        anthropic_api_key: Anthropic API密钥
        default_provider: 默认提供商 ('openai' 或 'anthropic')
        max_image_size: 最大图片尺寸（字节）
        cache_ttl: 缓存过期时间（秒）
        cost_limit_daily: 每日成本限制（美元）
    """
    openai_api_key: str
    anthropic_api_key: str
    default_provider: str = "openai"
    max_image_size: int = 20 * 1024 * 1024  # 20MB
    cache_ttl: int = 3600  # 1小时
    cost_limit_daily: float = 50.0  # $50/天


class VisionAnalyzer:
    """视觉分析器

    提供游戏画面的AI分析功能，支持多个LLM提供商。

    Examples:
        >>> config = VisionConfig(openai_api_key="sk-...")
        >>> analyzer = VisionAnalyzer(config)
        >>> result = await analyzer.analyze(image_bytes, "识别游戏状态")
        >>> print(result['response'])

    Attributes:
        config: 配置对象
        openai_client: OpenAI 异步客户端
        anthropic_client: Anthropic 异步客户端
        cache_service: 缓存服务
        cost_tracker: 成本追踪器
    """

    def __init__(self, config: VisionConfig):
        """初始化视觉分析器

        Args:
            config: 配置对象

        Raises:
            ValueError: 如果API密钥无效
        """
        self.config = config

        # 初始化客户端
        self.openai_client = AsyncOpenAI(api_key=config.openai_api_key)
        self.anthropic_client = AsyncAnthropic(api_key=config.anthropic_api_key)

        # 初始化服务
        self.cache_service = CacheService()
        self.cost_tracker = CostTracker()

        logger.info("VisionAnalyzer initialized", extra={
            "provider": config.default_provider,
            "cache_ttl": config.cache_ttl
        })

    async def analyze(
        self,
        image: bytes,
        prompt: str,
        provider: Optional[str] = None,
        max_tokens: int = 300
    ) -> Dict:
        """分析图片

        使用指定的LLM提供商分析游戏截图。

        Args:
            image: 图片数据（bytes格式）
            prompt: 分析提示词
            provider: LLM提供商 ('openai' 或 'anthropic')，默认使用配置
            max_tokens: 最大生成token数

        Returns:
            包含分析结果的字典：
            {
                'response': str,          # LLM响应文本
                'confidence': float,      # 置信度 (0-1)
                'processing_time_ms': int,# 处理时间
                'cost_usd': float,        # 本次调用成本
                'provider': str,          # 使用的提供商
                'cached': bool            # 是否命中缓存
            }

        Raises:
            HTTPException: 图片尺寸超限或成本超限
            ValueError: 图片格式无效

        Examples:
            >>> result = await analyzer.analyze(
            ...     image_bytes,
            ...     "识别玩家血量和敌人数量",
            ...     provider="openai"
            ... )
            >>> print(f"响应: {result['response']}")
            >>> print(f"成本: ${result['cost_usd']:.4f}")
        """
        start_time = datetime.now()
        provider = provider or self.config.default_provider

        # 1. 验证图片尺寸
        if len(image) > self.config.max_image_size:
            logger.warning("Image size exceeds limit", extra={
                "size": len(image),
                "limit": self.config.max_image_size
            })
            raise HTTPException(
                status_code=400,
                detail=f"Image size exceeds {self.config.max_image_size} bytes"
            )

        # 2. 检查缓存
        cache_key = self._generate_cache_key(image, prompt, provider)
        cached_result = await self.cache_service.get(cache_key)

        if cached_result:
            logger.debug("Cache hit", extra={"cache_key": cache_key})
            cached_result['cached'] = True
            return cached_result

        # 3. 检查成本限制
        daily_cost = await self.cost_tracker.get_daily_cost()
        if daily_cost >= self.config.cost_limit_daily:
            logger.error("Daily cost limit exceeded", extra={
                "daily_cost": daily_cost,
                "limit": self.config.cost_limit_daily
            })
            raise HTTPException(
                status_code=429,
                detail="Daily cost limit exceeded"
            )

        # 4. 调用LLM
        try:
            if provider == "openai":
                result = await self._analyze_with_openai(image, prompt, max_tokens)
            elif provider == "anthropic":
                result = await self._analyze_with_anthropic(image, prompt, max_tokens)
            else:
                raise ValueError(f"Unknown provider: {provider}")
        except Exception as e:
            logger.error(f"LLM analysis failed: {e}", extra={
                "provider": provider,
                "prompt_length": len(prompt)
            }, exc_info=True)
            raise

        # 5. 计算处理时间
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        result['processing_time_ms'] = int(processing_time)
        result['provider'] = provider
        result['cached'] = False

        # 6. 记录成本
        await self.cost_tracker.record(result['cost_usd'])

        # 7. 缓存结果
        await self.cache_service.set(
            cache_key,
            result,
            ttl=self.config.cache_ttl
        )

        logger.info("Analysis completed", extra={
            "provider": provider,
            "cost": result['cost_usd'],
            "time_ms": processing_time
        })

        return result

    async def _analyze_with_openai(
        self,
        image: bytes,
        prompt: str,
        max_tokens: int
    ) -> Dict:
        """使用 OpenAI GPT-4V 分析

        Args:
            image: 图片数据
            prompt: 提示词
            max_tokens: 最大token数

        Returns:
            分析结果字典

        Note:
            GPT-4V 定价: $0.01 / image + $0.03 / 1K output tokens
        """
        import base64

        # 编码图片
        image_base64 = base64.b64encode(image).decode('utf-8')

        # 调用 OpenAI API
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
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=max_tokens
        )

        # 解析响应
        content = response.choices[0].message.content
        tokens_used = response.usage.total_tokens

        # 计算成本
        cost = 0.01 + (tokens_used / 1000) * 0.03

        return {
            'response': content,
            'confidence': 0.9,  # GPT-4V 默认高置信度
            'cost_usd': cost,
            'tokens': tokens_used
        }

    async def _analyze_with_anthropic(
        self,
        image: bytes,
        prompt: str,
        max_tokens: int
    ) -> Dict:
        """使用 Anthropic Claude Vision 分析

        Args:
            image: 图片数据
            prompt: 提示词
            max_tokens: 最大token数

        Returns:
            分析结果字典
        """
        # TODO: 实现 Anthropic Claude Vision 集成
        raise NotImplementedError("Anthropic integration coming soon")

    def _generate_cache_key(
        self,
        image: bytes,
        prompt: str,
        provider: str
    ) -> str:
        """生成缓存键

        使用图片哈希和提示词生成唯一缓存键。

        Args:
            image: 图片数据
            prompt: 提示词
            provider: 提供商

        Returns:
            缓存键字符串
        """
        import hashlib

        # 计算图片哈希（使用感知哈希更好，但这里简化为 MD5）
        image_hash = hashlib.md5(image).hexdigest()[:16]
        prompt_hash = hashlib.md5(prompt.encode()).hexdigest()[:16]

        return f"vision:{provider}:{image_hash}:{prompt_hash}"

    async def cleanup(self):
        """清理资源

        关闭所有连接，释放资源。
        """
        await self.openai_client.close()
        await self.anthropic_client.close()
        logger.info("VisionAnalyzer cleaned up")


# 辅助类（简化示例）
class CacheService:
    """缓存服务（实际应使用 Redis）"""
    async def get(self, key: str) -> Optional[Dict]:
        # 实现略
        return None

    async def set(self, key: str, value: Dict, ttl: int):
        # 实现略
        pass


class CostTracker:
    """成本追踪器"""
    async def get_daily_cost(self) -> float:
        # 实现略
        return 0.0

    async def record(self, cost: float):
        # 实现略
        pass
```

**关键规范**:
- ✅ **Docstring 文档**：所有类和方法必须有 Google 风格文档
- ✅ **类型注解**：使用 `typing` 模块明确类型
- ✅ **数据类**：使用 `@dataclass` 简化配置类
- ✅ **日志记录**：结构化日志（JSON 格式）
- ✅ **异常处理**：明确的异常类型和错误信息
- ✅ **资源清理**：提供 `cleanup` 方法

---

### 3.2 测试驱动开发 (TDD)

#### 3.2.1 单元测试示例

```typescript
// tests/unit/avatar.service.spec.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AvatarService, NotFoundError } from '../src/services/avatar.service';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

/**
 * Avatar Service 单元测试
 */
describe('AvatarService', () => {
  let service: AvatarService;
  let prismaMock: jest.Mocked<PrismaClient>;
  let redisMock: jest.Mocked<Redis>;

  beforeEach(() => {
    // 初始化 Mock
    prismaMock = {
      avatarModel: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      }
    } as any;

    redisMock = {
      get: vi.fn(),
      setex: vi.fn(),
      del: vi.fn()
    } as any;

    // 初始化服务（注入 Mock）
    service = new AvatarService({
      s3Bucket: 'test-bucket',
      s3Region: 'us-east-1',
      cacheExpiry: 3600,
      maxFileSize: 10 * 1024 * 1024
    });

    // 替换为 Mock
    (service as any).prisma = prismaMock;
    (service as any).redis = redisMock;
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('getModel', () => {
    const mockModel = {
      id: 'warrior-001',
      name: 'Warrior',
      type: 'warrior',
      gltfUrl: 'https://s3.example.com/warrior.gltf',
      thumbnailUrl: 'https://s3.example.com/warrior-thumb.png',
      polygonCount: 15000,
      fileSize: 2048000,
      skins: [],
      animations: []
    };

    it('应该从缓存返回模型（缓存命中）', async () => {
      // Arrange
      const modelId = 'warrior-001';
      redisMock.get.mockResolvedValue(JSON.stringify(mockModel));

      // Act
      const result = await service.getModel(modelId);

      // Assert
      expect(result).toEqual(mockModel);
      expect(redisMock.get).toHaveBeenCalledWith(`avatar:model:${modelId}`);
      expect(prismaMock.avatarModel.findUnique).not.toHaveBeenCalled(); // 不应查询数据库
    });

    it('应该从数据库查询并缓存（缓存未命中）', async () => {
      // Arrange
      const modelId = 'warrior-001';
      redisMock.get.mockResolvedValue(null); // 缓存未命中
      prismaMock.avatarModel.findUnique.mockResolvedValue(mockModel);

      // Act
      const result = await service.getModel(modelId);

      // Assert
      expect(result).toEqual(mockModel);
      expect(redisMock.get).toHaveBeenCalledWith(`avatar:model:${modelId}`);
      expect(prismaMock.avatarModel.findUnique).toHaveBeenCalledWith({
        where: { id: modelId },
        include: { skins: true, animations: true }
      });
      expect(redisMock.setex).toHaveBeenCalledWith(
        `avatar:model:${modelId}`,
        3600,
        JSON.stringify(mockModel)
      );
    });

    it('应该抛出 NotFoundError（模型不存在）', async () => {
      // Arrange
      const modelId = 'non-existent';
      redisMock.get.mockResolvedValue(null);
      prismaMock.avatarModel.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getModel(modelId)).rejects.toThrow(NotFoundError);
      await expect(service.getModel(modelId)).rejects.toThrow(
        `Avatar model not found: ${modelId}`
      );
    });

    it('应该在缓存失败时继续工作（优雅降级）', async () => {
      // Arrange
      const modelId = 'warrior-001';
      redisMock.get.mockRejectedValue(new Error('Redis connection failed'));
      prismaMock.avatarModel.findUnique.mockResolvedValue(mockModel);

      // Act
      const result = await service.getModel(modelId);

      // Assert
      expect(result).toEqual(mockModel);
      expect(prismaMock.avatarModel.findUnique).toHaveBeenCalled();
      // 缓存失败不应导致业务失败
    });
  });

  describe('createModel', () => {
    it('应该创建新模型并返回', async () => {
      // 实现略（参考上面的测试模式）
    });

    it('应该在名称重复时抛出错误', async () => {
      // 实现略
    });
  });
});
```

**测试覆盖目标**:
- ✅ **正常流程**：happy path
- ✅ **异常流程**：错误处理
- ✅ **边界条件**：空值、极限值
- ✅ **优雅降级**：依赖服务失败时的行为

---

#### 3.2.2 集成测试示例

```python
# tests/integration/test_vision_api.py

import pytest
import httpx
import base64
from pathlib import Path

# 测试配置
API_BASE_URL = "http://localhost:8002"
TEST_IMAGE_PATH = Path(__file__).parent / "fixtures" / "game_screenshot.png"


@pytest.fixture(scope="module")
async def client():
    """异步 HTTP 客户端"""
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=30.0) as client:
        yield client


@pytest.fixture
def sample_image():
    """测试图片"""
    with open(TEST_IMAGE_PATH, "rb") as f:
        return f.read()


class TestVisionAPI:
    """Vision API 集成测试"""

    @pytest.mark.asyncio
    async def test_analyze_screenshot_success(self, client, sample_image):
        """测试截图分析成功流程"""
        # Arrange
        image_base64 = base64.b64encode(sample_image).decode()
        payload = {
            "image_data": image_base64,
            "prompt": "识别游戏中玩家的血量和敌人数量",
            "provider": "openai"
        }

        # Act
        response = await client.post("/api/v1/vision/analyze", json=payload)

        # Assert
        assert response.status_code == 200
        data = response.json()

        # 验证响应结构
        assert "response" in data
        assert "confidence" in data
        assert "cost_usd" in data
        assert "processing_time_ms" in data

        # 验证数据类型
        assert isinstance(data['response'], str)
        assert isinstance(data['confidence'], float)
        assert 0 <= data['confidence'] <= 1
        assert isinstance(data['cost_usd'], float)
        assert data['cost_usd'] > 0

        # 验证响应内容不为空
        assert len(data['response']) > 10

    @pytest.mark.asyncio
    async def test_analyze_with_invalid_image(self, client):
        """测试无效图片处理"""
        # Arrange
        payload = {
            "image_data": "invalid_base64",
            "prompt": "测试提示",
            "provider": "openai"
        }

        # Act
        response = await client.post("/api/v1/vision/analyze", json=payload)

        # Assert
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "invalid" in data['detail'].lower()

    @pytest.mark.asyncio
    async def test_analyze_cache_hit(self, client, sample_image):
        """测试缓存命中"""
        # Arrange
        image_base64 = base64.b64encode(sample_image).decode()
        payload = {
            "image_data": image_base64,
            "prompt": "识别玩家血量",
            "provider": "openai"
        }

        # Act - 第一次请求
        response1 = await client.post("/api/v1/vision/analyze", json=payload)
        data1 = response1.json()
        cost1 = data1['cost_usd']

        # Act - 第二次请求（应该命中缓存）
        response2 = await client.post("/api/v1/vision/analyze", json=payload)
        data2 = response2.json()

        # Assert
        assert response2.status_code == 200
        assert data2['cached'] is True  # 缓存命中
        assert data2['cost_usd'] == 0  # 缓存不计费
        assert data2['response'] == data1['response']  # 响应一致

    @pytest.mark.asyncio
    async def test_cost_limit_exceeded(self, client, sample_image):
        """测试成本限制"""
        # 这个测试需要特殊配置（降低每日限额）或使用 Mock
        # 实现略
        pass

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, client, sample_image):
        """测试并发请求处理"""
        import asyncio

        # Arrange
        image_base64 = base64.b64encode(sample_image).decode()
        payload = {
            "image_data": image_base64,
            "prompt": "测试并发",
            "provider": "openai"
        }

        # Act - 并发 10 个请求
        tasks = [
            client.post("/api/v1/vision/analyze", json=payload)
            for _ in range(10)
        ]
        responses = await asyncio.gather(*tasks)

        # Assert
        for response in responses:
            assert response.status_code == 200


@pytest.mark.slow
class TestVisionPerformance:
    """性能测试"""

    @pytest.mark.asyncio
    async def test_analyze_latency(self, client, sample_image):
        """测试分析延迟"""
        import time

        # Arrange
        image_base64 = base64.b64encode(sample_image).decode()
        payload = {
            "image_data": image_base64,
            "prompt": "性能测试",
            "provider": "openai"
        }

        # Act
        start_time = time.time()
        response = await client.post("/api/v1/vision/analyze", json=payload)
        elapsed_ms = (time.time() - start_time) * 1000

        # Assert
        assert response.status_code == 200
        assert elapsed_ms < 5000  # P95 应该 < 5秒（包含LLM调用）

        data = response.json()
        print(f"Latency: {elapsed_ms:.0f}ms, Cost: ${data['cost_usd']:.4f}")
```

**集成测试策略**:
- ✅ **真实依赖**：使用真实的数据库、缓存、LLM API
- ✅ **端到端流程**：完整的请求-响应流程
- ✅ **并发测试**：验证系统在并发场景下的表现
- ✅ **性能测试**：验证延迟和吞吐量指标

---

### 3.3 性能优化策略

#### 3.3.1 数据库优化

```sql
-- Avatar Service 数据库索引优化

-- 1. 模型查询索引
CREATE INDEX idx_avatar_models_type ON avatar_models(type);
CREATE INDEX idx_avatar_models_created_at ON avatar_models(created_at DESC);

-- 2. 皮肤查询索引
CREATE INDEX idx_skins_avatar_id ON skins(avatar_id);

-- 3. 动画查询索引
CREATE INDEX idx_animations_avatar_emotion ON animations(avatar_id, emotion, intensity);

-- 4. 组合索引（常用查询）
CREATE INDEX idx_animations_emotion_intensity ON animations(emotion, intensity);

-- 5. 分析查询索引（Vision Service）
CREATE INDEX idx_vision_analysis_player_game ON vision_analysis(player_id, game_id, timestamp DESC);
CREATE INDEX idx_vision_analysis_cost ON vision_analysis((llm_analysis->>'cost_usd'));
```

#### 3.3.2 缓存策略

```typescript
/**
 * 多层缓存策略
 */
class MultiLevelCache {
  // L1: 内存缓存（最快，容量小）
  private memoryCache: Map<string, { value: any, expiry: number }>;

  // L2: Redis 缓存（快，容量中）
  private redis: Redis;

  // L3: 数据库（慢，容量大）
  private prisma: PrismaClient;

  async get(key: string): Promise<any> {
    // 1. 检查 L1 内存缓存
    const memCached = this.memoryCache.get(key);
    if (memCached && memCached.expiry > Date.now()) {
      return memCached.value;
    }

    // 2. 检查 L2 Redis 缓存
    const redisCached = await this.redis.get(key);
    if (redisCached) {
      const value = JSON.parse(redisCached);
      // 回填到 L1
      this.memoryCache.set(key, { value, expiry: Date.now() + 60000 }); // 1分钟
      return value;
    }

    // 3. 从 L3 数据库查询
    const dbValue = await this.fetchFromDatabase(key);
    if (dbValue) {
      // 回填到 L2 和 L1
      await this.redis.setex(key, 3600, JSON.stringify(dbValue)); // 1小时
      this.memoryCache.set(key, { value: dbValue, expiry: Date.now() + 60000 });
    }

    return dbValue;
  }
}
```

---

## 4. 产品经理规划

### 4.1 功能需求清单

#### 4.1.1 Flask Dashboard MVP 功能

**优先级 P0（核心功能）**:

1. **用户认证系统**
   - 登录/登出
   - Session 管理
   - 权限控制（管理员/查看者）

2. **Dashboard 首页**
   - 今日关键指标（事件数、玩家数、成本、延迟）
   - 情感分布饼图（最近 7 天）
   - 成本趋势折线图（最近 7 天）
   - 活跃游戏列表（Top 5）

3. **游戏管理**
   - 游戏列表（分页）
   - 游戏详情
   - 创建/编辑游戏（基本信息）
   - 删除游戏（软删除）

4. **分析页面**
   - 情感分析（饼图 + 柱状图）
   - 成本分析（趋势图 + 表格）
   - 性能监控（延迟分布）
   - 数据导出（CSV）

**优先级 P1（重要功能）**:

5. **玩家管理**
   - 玩家列表
   - 玩家详情（记忆、事件历史）
   - 玩家搜索

6. **Avatar 管理**
   - 模型列表
   - 上传新模型（GLTF + 纹理）
   - 预览模型
   - 删除模型

7. **Vision 分析记录**
   - 截图历史
   - 分析结果查看
   - 成本统计

8. **API Key 管理**
   - 生成新 Key
   - 查看配额
   - 吊销 Key

**优先级 P2（增强功能）**:

9. **实时监控**
   - WebSocket 实时数据推送
   - 实时日志查看
   - 告警通知

10. **系统设置**
    - 配置管理
    - 成本预算设置
    - 邮件通知配置

---

### 4.2 用户体验设计

#### 4.2.1 页面布局规范

```
┌────────────────────────────────────────────────────┐
│ Logo  AGL Platform      🔔 通知   👤 Admin  ↓     │ ← 顶部导航栏（固定）
├────────────────────────────────────────────────────┤
│ 侧│                                                 │
│ 边│  📊 Dashboard 首页                             │
│ 栏│  ┌────────────────────────────────────┐       │
│   │  │ 今日统计                            │       │
│ 📊│  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │       │
│ 📈│  │ │12.5K│ │2.3K │ │$12 │ │45ms │  │       │
│ 🎮│  │ └─────┘ └─────┘ └─────┘ └─────┘  │       │
│ 👥│  └────────────────────────────────────┘       │
│ 🎭│                                                 │
│ 👁│  ┌────────────────────────────────────┐       │
│ 🎙│  │ 情感分布 (最近7天)                 │       │
│ 💰│  │ [饼图]                             │       │
│ ⚙ │  └────────────────────────────────────┘       │
│   │                                                 │
│ 🚪│  ┌────────────────────────────────────┐       │
│   │  │ 成本趋势 (最近7天)                 │       │
│   │  │ [折线图]                           │       │
│   │  └────────────────────────────────────┘       │
│   │                                                 │
└───┴─────────────────────────────────────────────────┘
```

**设计规范**:
- **侧边栏宽度**: 256px（固定）
- **顶部导航栏高度**: 64px（固定）
- **内容区padding**: 24px
- **卡片间距**: 16px
- **响应式断点**:
  - Desktop: ≥1024px
  - Tablet: 768px - 1023px
  - Mobile: <768px（隐藏侧边栏，使用汉堡菜单）

---

### 4.3 用户流程图

#### 4.3.1 游戏开发者使用流程

```
开始
 │
 ├─► 注册账号 / 登录
 │
 ├─► Dashboard 首页
 │    └─► 查看今日数据概览
 │
 ├─► 创建游戏
 │    ├─► 填写游戏信息（名称、描述）
 │    ├─► 获取 API Key
 │    └─► 复制 SDK 集成代码
 │
 ├─► 集成 SDK 到游戏
 │    └─► [在游戏客户端完成]
 │
 ├─► 回到 Dashboard
 │    └─► 查看实时数据流入
 │
 ├─► 分析页面
 │    ├─► 查看情感分布
 │    ├─► 查看成本趋势
 │    └─► 导出数据报表
 │
 ├─► Avatar 管理（可选）
 │    ├─► 上传自定义 3D 模型
 │    ├─► 预览模型效果
 │    └─► 在游戏中使用
 │
 └─► 结束
```

---

## 5. 资深测试规划

### 5.1 测试策略

#### 5.1.1 测试金字塔

```
         ┌──────────┐
        /  E2E Tests  \      ← 10% (关键用户流程)
       /───────────────\
      / Integration Tests \   ← 30% (服务间交互)
     /─────────────────────\
    /    Unit Tests         \  ← 60% (函数/方法级别)
   /──────────────────────────\
```

**测试覆盖率目标**:
- **Unit Tests**: 85%+ 代码覆盖率
- **Integration Tests**: 核心 API 端点 100% 覆盖
- **E2E Tests**: 5-10 个关键用户流程

---

### 5.2 测试用例设计

#### 5.2.1 Avatar Service 测试矩阵

| 功能模块 | 测试场景 | 用例数 | 优先级 |
|---------|---------|--------|--------|
| **获取模型** | | | |
| - 正常流程 | 缓存命中 | 1 | P0 |
| - 正常流程 | 缓存未命中 | 1 | P0 |
| - 异常流程 | 模型不存在 | 1 | P0 |
| - 异常流程 | 缓存失败（优雅降级） | 1 | P1 |
| - 边界条件 | 并发请求 | 1 | P1 |
| **创建模型** | | | |
| - 正常流程 | 有效数据 | 1 | P0 |
| - 异常流程 | 名称重复 | 1 | P0 |
| - 异常流程 | 无效 GLTF 文件 | 1 | P1 |
| - 边界条件 | 文件尺寸超限 | 1 | P1 |
| **更新模型** | | | |
| - 正常流程 | 更新名称和纹理 | 1 | P0 |
| - 异常流程 | 模型不存在 | 1 | P0 |
| **删除模型** | | | |
| - 正常流程 | 软删除 | 1 | P0 |
| - 异常流程 | 模型不存在 | 1 | P0 |
| - 异常流程 | 关联数据处理 | 1 | P1 |

**总计**: 14+ 测试用例

---

#### 5.2.2 Vision Service 测试矩阵

| 功能模块 | 测试场景 | 用例数 | 优先级 |
|---------|---------|--------|--------|
| **截图分析** | | | |
| - 正常流程 | GPT-4V 分析成功 | 1 | P0 |
| - 正常流程 | 缓存命中 | 1 | P0 |
| - 异常流程 | 无效图片格式 | 1 | P0 |
| - 异常流程 | 图片尺寸超限 | 1 | P0 |
| - 异常流程 | LLM API 失败 | 1 | P1 |
| - 异常流程 | 成本限额超限 | 1 | P1 |
| - 边界条件 | 并发请求 | 1 | P1 |
| - 性能测试 | P95 延迟 < 5s | 1 | P1 |
| **游戏状态识别** | | | |
| - 正常流程 | 识别血量和敌人 | 1 | P0 |
| - 正常流程 | 识别 UI 元素 | 1 | P1 |
| **建议生成** | | | |
| - 正常流程 | 战术建议 | 1 | P1 |
| - 正常流程 | 警告提示 | 1 | P1 |

**总计**: 13+ 测试用例

---

### 5.3 性能测试计划

#### 5.3.1 负载测试场景

```python
# locust/vision_load_test.py

from locust import HttpUser, task, between
import base64

class VisionServiceUser(HttpUser):
    """Vision Service 负载测试"""
    wait_time = between(1, 3)  # 请求间隔 1-3 秒

    @task(10)  # 权重 10 (最常见)
    def analyze_screenshot(self):
        """分析截图"""
        with open("fixtures/sample.png", "rb") as f:
            image_base64 = base64.b64encode(f.read()).decode()

        self.client.post("/api/v1/vision/analyze", json={
            "image_data": image_base64,
            "prompt": "识别玩家血量",
            "provider": "openai"
        })

    @task(5)  # 权重 5
    def get_history(self):
        """获取历史记录"""
        self.client.get("/api/v1/vision/history?limit=20")

    @task(1)  # 权重 1
    def get_capture_detail(self):
        """获取截图详情"""
        self.client.get("/api/v1/vision/captures/test-id-123")


# 运行负载测试
# locust -f vision_load_test.py --host=http://localhost:8002
```

**测试目标**:
- **并发用户**: 100
- **持续时间**: 10 分钟
- **成功率**: >99%
- **P95 延迟**: <5秒

---

### 5.4 安全测试清单

| 测试项 | 描述 | 工具 |
|-------|------|------|
| **SQL 注入** | 测试所有数据库查询 | SQLMap |
| **XSS** | 测试所有用户输入 | OWASP ZAP |
| **CSRF** | 验证 CSRF token | 手动测试 |
| **认证绕过** | 测试未授权访问 | Burp Suite |
| **文件上传漏洞** | 测试恶意文件上传 | 手动测试 |
| **API 滥用** | 测试速率限制 | Artillery |
| **敏感信息泄露** | 检查日志和错误消息 | Grep + 代码审查 |

---

## 6. 代码规范与标准

### 6.1 命名规范

#### 6.1.1 TypeScript / JavaScript

```typescript
// 类名：PascalCase
class AvatarService {}
class UserManager {}

// 接口名：PascalCase，I 前缀可选
interface IAvatarConfig {}
interface AvatarConfig {}  // 推荐

// 函数名：camelCase，动词开头
function getModel() {}
function createUser() {}
async function fetchData() {}

// 变量名：camelCase
const userName = 'Alice';
let totalCount = 0;
const apiClient = new APIClient();

// 常量：UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const API_BASE_URL = 'https://api.example.com';

// 私有成员：下划线前缀（可选）
class Example {
  private _cache: Map<string, any>;
  public data: any[];
}

// 布尔变量：is/has/can 前缀
const isActive = true;
const hasPermission = false;
const canEdit = true;

// 文件名：kebab-case
// avatar-service.ts
// user-controller.ts
// api-client.ts
```

#### 6.1.2 Python

```python
# 类名：PascalCase
class VisionAnalyzer:
    pass

class UserService:
    pass

# 函数名：snake_case
def analyze_screenshot():
    pass

async def fetch_data():
    pass

# 变量名：snake_case
user_name = "Alice"
total_count = 0
api_client = APIClient()

# 常量：UPPER_SNAKE_CASE
MAX_IMAGE_SIZE = 20 * 1024 * 1024
API_BASE_URL = "https://api.example.com"

# 私有成员：单下划线前缀
class Example:
    def __init__(self):
        self._cache = {}
        self.data = []

# 布尔变量：is/has/can 前缀
is_active = True
has_permission = False
can_edit = True

# 文件名：snake_case
# vision_analyzer.py
# user_service.py
# api_client.py
```

---

### 6.2 注释规范

#### 6.2.1 TypeScript JSDoc

```typescript
/**
 * Avatar Service - 头像管理服务
 *
 * @module services/avatar
 * @description 提供3D头像模型的加载、缓存和管理功能
 *
 * @example
 * ```typescript
 * const service = new AvatarService(config);
 * const model = await service.getModel('warrior');
 * console.log(model.gltfUrl);
 * ```
 */

/**
 * 获取头像模型
 *
 * @param {string} modelId - 模型ID
 * @returns {Promise<AvatarModel>} 头像模型数据
 * @throws {NotFoundError} 模型不存在时抛出
 *
 * @example
 * ```typescript
 * const model = await service.getModel('warrior-001');
 * ```
 */
async getModel(modelId: string): Promise<AvatarModel> {
  // 实现略
}

/**
 * 验证模型文件
 *
 * @private
 * @param {Buffer} fileData - 文件数据
 * @returns {boolean} 是否有效
 */
private validateModelFile(fileData: Buffer): boolean {
  // 实现略
}
```

#### 6.2.2 Python Docstring

```python
"""
Vision Service - 视觉分析服务

该模块提供游戏画面的AI视觉分析功能。

Classes:
    VisionAnalyzer: 主要的视觉分析类
    CostTracker: 成本追踪器

Functions:
    analyze_screenshot: 分析游戏截图
    extract_game_state: 提取游戏状态

Examples:
    >>> analyzer = VisionAnalyzer(config)
    >>> result = await analyzer.analyze(image, prompt)
    >>> print(result['response'])
"""

def analyze_screenshot(image: bytes, prompt: str) -> Dict:
    """分析游戏截图

    使用GPT-4V分析游戏截图并返回结构化结果。

    Args:
        image: 图片数据（PNG/JPEG格式）
        prompt: 分析提示词

    Returns:
        包含以下字段的字典：
        - response (str): LLM响应文本
        - confidence (float): 置信度 (0-1)
        - cost_usd (float): 本次调用成本

    Raises:
        ValueError: 图片格式无效
        HTTPException: 成本超限

    Examples:
        >>> result = analyze_screenshot(image_data, "识别血量")
        >>> print(result['response'])
        '玩家血量: 75%, 敌人数量: 3'

    Note:
        该函数会自动缓存结果1小时。
    """
    pass
```

---

### 6.3 Git Commit 规范

```bash
# Commit 消息格式
<type>(<scope>): <subject>

<body>

<footer>

# 类型 (type)
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
perf:     性能优化
test:     测试相关
chore:    构建/工具/依赖更新

# 范围 (scope)
avatar:   Avatar Service
vision:   Vision Service
voice:    Voice Service
dashboard: Flask Dashboard
sdk:      SDK 相关
docs:     文档
test:     测试

# 示例
feat(avatar): add GLTF model upload API

Implemented a new API endpoint for uploading custom GLTF models.
- Supports Draco compression
- Validates polygon count (< 50K)
- Automatic thumbnail generation
- S3 storage integration

Closes #123

---

fix(vision): handle GPT-4V timeout gracefully

Added timeout handling and retry logic for GPT-4V API calls.
- 30s timeout
- 3 retries with exponential backoff
- Fallback to cached results

Fixes #456

---

docs(dashboard): update installation guide

- Added Docker Compose instructions
- Updated environment variable list
- Fixed broken links
```

---

## 7. 实施时间表

### 7.1 Phase 4B 时间规划

#### Week 6-7: Avatar SDK 完善（2周）

| 任务 | 负责人 | 工作量 | 交付物 |
|-----|--------|--------|--------|
| 5种角色 3D 建模 | 3D 美术 | 10天 | GLTF 模型文件 |
| 12种皮肤纹理制作 | 纹理美术 | 5天 | PNG/WebP 纹理 |
| 36种骨骼动画制作 | 动画师 | 10天 | FBX 动画文件 |
| Avatar Service 开发 | 后端工程师 | 8天 | API 服务 + 测试 |
| 模型优化和 LOD | 技术美术 | 3天 | 优化后的模型 |
| 集成测试 | 测试工程师 | 2天 | 测试报告 |

**里程碑**: Avatar SDK 功能完整，性能达标

#### Week 8-10: Vision SDK 完善（3周）

| 任务 | 负责人 | 工作量 | 交付物 |
|-----|--------|--------|--------|
| Vision Service 后端开发 | Python 工程师 | 10天 | FastAPI 服务 + 测试 |
| GPT-4V 集成和优化 | AI 工程师 | 5天 | LLM 集成代码 |
| Unity 插件开发 | Unity 工程师 | 5天 | C# 插件 |
| Unreal 插件开发 | Unreal 工程师 | 5天 | C++ 插件 |
| 成本优化和缓存策略 | 后端工程师 | 3天 | 缓存层实现 |
| 集成测试 | 测试工程师 | 3天 | 测试报告 |
| 文档编写 | 技术文档 | 2天 | API 文档 + 使用指南 |

**里程碑**: Vision SDK 功能完整，成本可控

#### Week 11-14: Voice Service 开发（4周）

| 任务 | 负责人 | 工作量 | 交付物 |
|-----|--------|--------|--------|
| Voice Service 架构设计 | 架构师 | 2天 | 架构文档 |
| STT 集成 (Whisper) | Python 工程师 | 5天 | STT 模块 + 测试 |
| TTS 集成 (OpenAI TTS) | Python 工程师 | 5天 | TTS 模块 + 测试 |
| 实时对话管理 | 后端工程师 | 8天 | WebSocket 服务 |
| 唇形同步生成 | 算法工程师 | 5天 | 唇形算法 + 测试 |
| Unity/Unreal 插件 | 客户端工程师 | 6天 | 语音插件 |
| 音频缓存和优化 | 后端工程师 | 3天 | 缓存层 |
| 集成测试 | 测试工程师 | 4天 | 测试报告 |
| 文档编写 | 技术文档 | 2天 | 完整文档 |

**里程碑**: Voice Service 上线，延迟达标

---

### 7.2 Flask Dashboard 时间规划

#### Week 1-2: 基础架构（2周）

| 任务 | 负责人 | 工作量 | 交付物 |
|-----|--------|--------|--------|
| 项目脚手架搭建 | 后端工程师 | 1天 | Flask 项目结构 |
| 数据库设计和迁移 | 后端工程师 | 2天 | SQLAlchemy 模型 |
| 认证系统实现 | 后端工程师 | 3天 | 登录/注册/权限 |
| 基础 UI 框架 | 前端工程师 | 3天 | Tailwind 布局 |
| AGL API 客户端封装 | 后端工程师 | 2天 | API Client |
| 单元测试 | 测试工程师 | 2天 | 测试套件 |

#### Week 3: 核心页面（1周）

| 任务 | 负责人 | 工作量 | 交付物 |
|-----|--------|--------|--------|
| Dashboard 首页 | 前端+后端 | 3天 | 首页 + 图表 |
| 游戏管理页面 | 前端+后端 | 2天 | CRUD 页面 |
| 分析页面 | 前端+后端 | 2天 | 图表页面 |

#### Week 4: 测试和部署（1周）

| 任务 | 负责人 | 工作量 | 交付物 |
|-----|--------|--------|--------|
| 集成测试 | 测试工程师 | 2天 | 测试报告 |
| 性能优化 | 后端工程师 | 1天 | 优化报告 |
| 文档编写 | 技术文档 | 1天 | 用户指南 |
| Docker 部署配置 | DevOps | 1天 | Dockerfile |
| 上线和验收 | 产品经理 | 1天 | 验收报告 |

**总计**: 4周完成 Flask Dashboard MVP

---

### 7.3 整体时间表甘特图

```
Phase 4B + Dashboard 实施计划 (16 周)

Week  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
      |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
Avatar █████████████                                    Avatar 完成
SDK      ▲  完成 3D 模型
         ▲  完成动画
            ▲  完成 Service

Vision            ██████████████                        Vision 完成
SDK                  ▲  完成后端
                     ▲  完成插件
                        ▲  完成测试

Voice                         ███████████████           Voice 完成
Service                          ▲  完成 STT/TTS
                                 ▲  完成实时对话
                                    ▲  完成唇形同步

Flask                                        ████████   Dashboard 完成
Dashboard                                       ▲  MVP 上线

测试    ═══════════════════════════════════════════   持续集成测试
文档    ═══════════════════════════════════════════   持续文档更新

里程碑  M1      M2         M3            M4        M5
        Week 7  Week 10    Week 14       Week 16
```

---

## 8. 质量保证体系

### 8.1 代码审查流程

```
开发者提交 PR
    │
    ├─► 自动化检查
    │   ├─ Lint (ESLint/Pylint)
    │   ├─ Type Check (TypeScript/MyPy)
    │   ├─ Unit Tests (Jest/Pytest)
    │   └─ Coverage Check (>85%)
    │
    ├─► 人工代码审查
    │   ├─ 架构合理性
    │   ├─ 代码质量
    │   ├─ 测试完整性
    │   ├─ 文档完整性
    │   └─ 性能考虑
    │
    ├─► 测试环境部署
    │   └─ 集成测试
    │
    ├─► 审批通过
    │   └─ 至少 2 名审批者
    │
    └─► 合并到主分支
```

### 8.2 CI/CD Pipeline

```yaml
# .github/workflows/phase4b.yml

name: Phase 4B CI/CD

on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'services/avatar-service/**'
      - 'services/vision-service/**'
      - 'services/voice-service/**'
      - 'services/dashboard/**'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # TypeScript Lint
      - name: Lint Avatar Service
        run: |
          cd services/avatar-service
          npm install
          npm run lint

      # Python Lint
      - name: Lint Vision Service
        run: |
          cd services/vision-service
          pip install pylint black
          pylint src/
          black --check src/

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v3

      # TypeScript Tests
      - name: Test Avatar Service
        run: |
          cd services/avatar-service
          npm install
          npm test
          npm run test:coverage

      # Python Tests
      - name: Test Vision Service
        run: |
          cd services/vision-service
          pip install -r requirements.txt
          pytest --cov=src --cov-report=xml

      # Upload Coverage
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker Images
        run: |
          docker build -t agl/avatar-service:${{ github.sha }} services/avatar-service
          docker build -t agl/vision-service:${{ github.sha }} services/vision-service
          docker build -t agl/voice-service:${{ github.sha }} services/voice-service
          docker build -t agl/dashboard:${{ github.sha }} services/dashboard

  deploy-staging:
    needs: [build]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          # 部署到测试环境
          kubectl apply -f infrastructure/k8s/staging/
```

---

### 8.3 质量指标追踪

```python
# scripts/quality_metrics.py

"""
质量指标追踪脚本

每日自动运行，生成质量报告。
"""

import subprocess
import json
from datetime import datetime

def get_test_coverage():
    """获取测试覆盖率"""
    result = subprocess.run(
        ['npm', 'run', 'test:coverage'],
        capture_output=True,
        text=True
    )
    # 解析覆盖率
    return 85.3  # 示例

def get_code_quality():
    """获取代码质量分数"""
    # 运行 SonarQube 或类似工具
    return {
        'bugs': 0,
        'vulnerabilities': 0,
        'code_smells': 5,
        'technical_debt': '2h'
    }

def get_performance_metrics():
    """获取性能指标"""
    return {
        'api_p95_latency': 150,  # ms
        'avatar_render_fps': 60,
        'vision_analysis_time': 2800,  # ms
    }

def generate_report():
    """生成质量报告"""
    report = {
        'date': datetime.now().isoformat(),
        'coverage': get_test_coverage(),
        'quality': get_code_quality(),
        'performance': get_performance_metrics()
    }

    # 保存报告
    with open(f'reports/quality_{datetime.now():%Y%m%d}.json', 'w') as f:
        json.dump(report, f, indent=2)

    print(f"Quality Report Generated:")
    print(f"  Coverage: {report['coverage']}%")
    print(f"  Bugs: {report['quality']['bugs']}")
    print(f"  API Latency: {report['performance']['api_p95_latency']}ms")

if __name__ == '__main__':
    generate_report()
```

---

## 9. 总结

### 9.1 关键里程碑

| 时间点 | 里程碑 | 验收标准 |
|--------|--------|---------|
| **Week 7** | Avatar SDK 完成 | 5种模型 + 36种动画 + 测试通过 |
| **Week 10** | Vision SDK 完成 | GPT-4V 集成 + 插件完成 + 成本<$0.01/次 |
| **Week 14** | Voice Service 完成 | STT+TTS 延迟<500ms + 唇形同步 |
| **Week 16** | Flask Dashboard 上线 | 核心功能完成 + 文档齐全 |

### 9.2 质量承诺

✅ **代码质量**: 0 errors, 0 warnings
✅ **测试覆盖率**: 85%+
✅ **文档完整度**: 100%
✅ **注释详细度**: 30%+
✅ **性能达标**: P95 < 200ms

### 9.3 下一步行动

1. **立即开始**: Week 6-7 Avatar SDK 完善
2. **同步准备**: Flask Dashboard 技术选型确认
3. **团队组建**: 确认各角色负责人
4. **环境搭建**: 开发/测试/生产环境准备

---

**文档维护**: 本文档将随着开发进展持续更新。
**责任人**: 架构师 + 产品经理 + 技术 Lead
**更新频率**: 每周五更新

---

## 附录

### A. 参考文档

- [Phase 4 Roadmap](./PHASE-4-ROADMAP.md)
- [Phase 4B Progress](./PHASE-4B-PROGRESS.md)
- [Code Standards](./CODE-STANDARDS.md)
- [Testing Guide](./TESTING-GUIDE.md)

### B. 联系方式

- **架构师**: architecture@agl.com
- **技术 Lead**: tech-lead@agl.com
- **产品经理**: pm@agl.com
- **测试经理**: qa-lead@agl.com

---

**End of Document**
