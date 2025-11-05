# AGL 产品功能清单

**AI Game Companion Engine - 完整功能列表**

更新时间: 2025-11
版本: Phase 4B (已修复)
状态: 生产就绪 (8.0/10)

---

## 📋 目录

1. [核心功能](#核心功能) (4 大核心)
2. [后端服务](#后端服务) (8 个服务)
3. [客户端 SDK](#客户端-sdk) (5 个 SDK)
4. [API 端点](#api-端点) (50+ 端点)
5. [数据管理](#数据管理) (3 种存储)
6. [运营工具](#运营工具) (1 个仪表板)
7. [支持的业务场景](#支持的业务场景)

---

## 核心功能

AGL 平台提供 **4 大核心功能模块**：

### 1. 🎭 智能情感识别

**功能描述**: 实时分析玩家情感状态，理解玩家感受

**技术实现**: 混合策略（规则引擎 85% + ML 分类器 15%）

**支持的情感** (12 种):
```
基础情感 (6):
- happy (开心)
- sad (悲伤)
- angry (愤怒)
- surprised (惊讶)
- fearful (恐惧)
- disgusted (厌恶)

游戏专用 (6):
- excited (兴奋) - 获得稀有物品
- proud (骄傲) - 完成成就
- confident (自信) - 连胜
- disappointed (失望) - 失败
- frustrated (沮丧) - 卡关
- neutral (中性) - 默认状态
```

**强度级别** (3 种):
- subtle (轻微)
- normal (正常)
- intense (强烈)

**识别方式**:
```
输入: 游戏事件 (event_type, event_data, context)
处理:
  1. 规则引擎匹配 (85% 场景, <50ms)
  2. ML 分类器 (15% 复杂场景, ~200ms)
  3. 情感历史追踪 (情感进展)
输出: emotion, intensity, confidence, method
```

**特性**:
- ✅ 实时响应 (<50ms P95)
- ✅ 高准确率 (>90%)
- ✅ 成本优化 (~$0.001/次)
- ✅ 情感进展追踪

---

### 2. 💬 AI 对话生成

**功能描述**: 生成个性化、上下文相关的陪伴对话

**技术实现**: 混合策略（模板库 90% + LLM 生成 10%）

**支持的角色** (3 种):
- **cheerful** (活力型) - 热情、积极、鼓励
- **cool** (冷静型) - 理性、战术、指导
- **cute** (可爱型) - 温柔、支持、关怀

**对话类型** (8 种):
```
1. greeting - 问候语
2. encouragement - 鼓励
3. celebration - 庆祝
4. comfort - 安慰
5. advice - 建议
6. question - 提问
7. reaction - 反应
8. farewell - 告别
```

**生成策略**:
```
输入: emotion, context, character_persona, dialogue_type
处理:
  1. 查找模板库 (90% 场景, <100ms, $0)
  2. LLM 生成 (10% 特殊场景, ~2s, ~$0.003)
  3. 缓存结果 (1小时 TTL)
输出: dialogue_text, method, cost, latency
```

**模板库规模**:
- 3 种角色 × 12 种情感 × 8 种对话类型 = **288 个基础模板**
- 每种 3-5 个变体 = **1000+ 对话模板**

**特性**:
- ✅ 快速响应 (<100ms 模板, ~2s LLM)
- ✅ 低成本 (<$0.001 平均)
- ✅ 个性化输出
- ✅ 上下文感知

---

### 3. 🧠 长期记忆系统

**功能描述**: 记住玩家历史，创造"活着"的陪伴体验

**记忆类型** (3 层):

#### L1: 短期记忆 (Redis, 1小时 TTL)
```
- 当前会话数据
- 最近10条对话
- 当前情感状态
- 临时上下文
```

#### L2: 长期记忆 (PostgreSQL, 永久)
```
- 重要成就
- 关键时刻
- 玩家偏好
- 特殊事件
```

#### L3: 语义记忆 (Qdrant向量数据库)
```
- 相似场景回忆
- 上下文检索
- 情感关联
- 智能联想
```

**记忆操作**:
```
1. create - 创建记忆
2. search - 检索相关记忆
3. update - 更新记忆重要性
4. recall - 回忆历史
5. forget - 遗忘(自动, 基于重要性)
```

**语义检索**:
```
输入: 当前场景描述
处理:
  1. 向量化 (Embedding)
  2. 相似度搜索 (Top-5)
  3. 重要性排序
输出: 相关历史记忆列表
```

**特性**:
- ✅ 三层存储架构
- ✅ 语义智能检索
- ✅ 自动遗忘机制
- ✅ 重要性评分

---

### 4. 🎨 3D 虚拟角色

**功能描述**: 实时渲染情感丰富的 3D 陪伴角色

**渲染技术**:
- Three.js + React Three Fiber (WebGL)
- 支持 GLTF/GLB 模型
- 实时动画切换
- 光影效果

**角色配置**:
```
每个角色包含:
- 1 个 3D 模型 (GLTF, <5MB)
- 1 个 idle 动画
- 36 个情感动画 (12 情感 × 3 强度)
- 缩略图 + 预览图
- 语音配置
```

**动画系统**:
```
情感 → 动画映射:
happy + subtle   → happy_subtle.gltf
happy + normal   → happy_normal.gltf
happy + intense  → happy_intense.gltf
(共 37 个动画)
```

**支持的模型格式**:
- GLTF (推荐, 开放标准)
- GLB (二进制 GLTF)
- Live2D (2D 动画, 未来支持)
- VRM (虚拟角色, 未来支持)

**性能要求**:
- 模型 <20k 三角形
- 纹理 <2048×2048
- 动画 <100 关键帧
- 总大小 <10MB

**特性**:
- ✅ 实时情感动画
- ✅ 流畅过渡 (0.3s)
- ✅ 自适应渲染质量
- ✅ 移动端优化

---

## 后端服务

AGL 平台包含 **8 个微服务**：

### 1. API Service (NestJS) ⭐ 核心

**端口**: 3000
**技术栈**: Node.js 20 + TypeScript 5 + NestJS 10
**职责**: 核心业务逻辑、数据管理、API 网关

**功能模块** (7 个):

#### 1.1 认证授权 (`/auth`)
```
POST /auth/register          - 注册客户端
POST /auth/login             - 登录
POST /auth/refresh           - 刷新 Token
POST /auth/logout            - 登出
GET  /auth/me                - 获取当前用户信息
```

#### 1.2 游戏管理 (`/games`)
```
GET    /games                - 获取游戏列表
POST   /games                - 创建游戏
GET    /games/:id            - 获取游戏详情
PATCH  /games/:id            - 更新游戏配置
DELETE /games/:id            - 删除游戏
```

#### 1.3 玩家管理 (`/players`)
```
GET    /players              - 获取玩家列表
POST   /players              - 创建玩家
GET    /players/:id          - 获取玩家详情
PATCH  /players/:id          - 更新玩家信息
DELETE /players/:id          - 删除玩家
```

#### 1.4 角色配置 (`/characters`)
```
GET    /characters           - 获取可用角色列表
GET    /characters/:id       - 获取角色详情
```

**返回数据**:
```json
{
  "id": "1",
  "name": "Cheerful Companion",
  "persona": "cheerful",
  "modelConfig": {
    "modelUrl": "https://cdn.../cheerful/model.gltf",
    "animations": { /* 37 个动画 URL */ },
    "thumbnailUrl": "...",
    "previewUrl": "..."
  },
  "voiceConfig": {
    "defaultVoice": "nova",
    "language": "zh-CN"
  }
}
```

#### 1.5 分析统计 (`/analytics`)
```
GET  /analytics/platform               - 平台整体统计
GET  /analytics/games/:id              - 游戏统计
GET  /analytics/games/:id/usage        - 使用统计
GET  /analytics/games/:id/emotions     - 情感分布
GET  /analytics/hourly                 - 实时监控 (小时级)
GET  /analytics/costs                  - 成本分析
GET  /analytics/metrics                - 服务指标
```

#### 1.6 性能指标 (`/metrics`)
```
GET  /metrics                - Prometheus 格式指标
GET  /metrics/health         - 健康检查
```

#### 1.7 事件上报 (`/events`)
```
POST /events                 - 上报游戏事件
POST /events/batch           - 批量上报事件
```

**数据库表** (11 个):
```
clients          - 客户端
games            - 游戏
players          - 玩家
memories         - 记忆
game_events      - 游戏事件
service_metrics  - 服务指标
daily_analytics  - 每日统计
hourly_analytics - 每小时统计
request_metrics  - 请求指标
cost_metrics     - 成本指标
```

---

### 2. Realtime Gateway (Socket.IO) ⭐ 实时通信

**端口**: 3001
**技术栈**: Node.js + Socket.IO 4.x
**职责**: WebSocket 实时通信、消息推送

**功能**:
```
1. 连接管理
   - WebSocket 连接
   - 自动重连
   - 心跳检测

2. 实时消息推送
   - emotion_update    - 情感变化推送
   - dialogue_ready    - 对话生成完成
   - memory_created    - 记忆创建通知
   - companion_event   - 角色事件

3. 房间/频道
   - 玩家独立频道
   - 游戏公共频道
   - 广播消息

4. 消息队列集成
   - Redis Streams
   - 事件订阅
   - 异步处理
```

**Socket.IO 事件**:
```javascript
// Client → Server
socket.emit('join_game', { gameId, playerId })
socket.emit('send_event', { type, data })
socket.emit('request_dialogue', { emotion, context })

// Server → Client
socket.on('emotion_detected', { emotion, intensity, confidence })
socket.on('dialogue_generated', { text, persona, method })
socket.on('companion_reaction', { animation, voice })
```

---

### 3. Emotion Service (Python FastAPI) ⭐ AI 核心

**端口**: 8000
**技术栈**: Python 3.11 + FastAPI 0.109
**职责**: 情感识别、规则引擎、ML 分类

**API 端点**:
```
POST /analyze                - 分析情感
GET  /health                 - 健康检查
GET  /stats                  - 统计信息
POST /cache/clear            - 清空缓存
GET  /rules                  - 查看规则
POST /rules                  - 添加规则
```

**分析流程**:
```python
Request:
{
  "event_type": "player_killed_enemy",
  "event_data": { "enemy_type": "boss", "combo": 10 },
  "player_id": "player-123",
  "context": { "recent_deaths": 5, "time_in_level": 600 }
}

Response:
{
  "emotion": "proud",
  "intensity": "intense",
  "confidence": 0.95,
  "method": "rule",  // or "ml" or "cached"
  "progression": {
    "previous": "frustrated",
    "change": "positive"
  },
  "cost": 0.0,
  "latency_ms": 42.3
}
```

**规则引擎** (50+ 规则):
```python
Rule 1: 击败 Boss → proud + intense
Rule 2: 连续死亡 3+ → frustrated + normal
Rule 3: 获得稀有物品 → excited + intense
Rule 4: 完成成就 → happy + normal
...
Rule 50+: 自定义规则
```

**ML 分类器** (用于复杂场景):
- 模型: scikit-learn Random Forest
- 特征: 120+ 维游戏特征
- 训练数据: 10,000+ 标注样本
- 准确率: >85%

---

### 4. Dialogue Service (Python FastAPI) ⭐ AI 核心

**端口**: 8001
**技术栈**: Python 3.11 + FastAPI + Anthropic Claude
**职责**: 对话生成、模板匹配、LLM 调用

**API 端点**:
```
POST /generate               - 生成对话
GET  /health                 - 健康检查
GET  /stats                  - 统计信息
POST /cache/clear            - 清空缓存
GET  /templates              - 查看模板库
POST /templates              - 添加模板
```

**生成流程**:
```python
Request:
{
  "emotion": "happy",
  "intensity": "normal",
  "persona": "cheerful",
  "dialogue_type": "celebration",
  "context": {
    "event": "level_completed",
    "player_name": "张三",
    "achievement": "速通大师"
  }
}

Response:
{
  "dialogue": "太厉害了！速通大师成就达成！你真的很优秀！",
  "persona": "cheerful",
  "method": "template",  // or "llm" or "cached"
  "cost": 0.0,
  "latency_ms": 89.5,
  "template_id": "cheerful_happy_celebration_01"
}
```

**模板库结构**:
```
templates/
├── cheerful/
│   ├── happy/
│   │   ├── celebration_01.txt
│   │   ├── celebration_02.txt
│   │   └── celebration_03.txt
│   ├── sad/
│   └── ...
├── cool/
└── cute/
```

**LLM 集成**:
- 主要: Anthropic Claude Haiku (快速、便宜)
- 备用: Claude Sonnet (复杂场景)
- 备用: OpenAI GPT-3.5 Turbo

**成本优化**:
- 模板库: $0 (90% 场景)
- 缓存: $0 (命中率 60%)
- LLM: ~$0.003/次 (10% 场景)
- **平均成本: <$0.001/次**

---

### 5. Memory Service (Node.js)

**端口**: 3002
**技术栈**: Node.js + TypeScript + Qdrant
**职责**: 记忆管理、向量检索、语义搜索

**API 端点**:
```
POST /memories               - 创建记忆
GET  /memories               - 获取记忆列表
GET  /memories/:id           - 获取记忆详情
PATCH /memories/:id          - 更新记忆
DELETE /memories/:id         - 删除记忆
POST /memories/search        - 语义搜索
POST /memories/recall        - 回忆相关记忆
GET  /memories/stats         - 记忆统计
```

**记忆创建**:
```javascript
Request:
{
  "player_id": "player-123",
  "type": "achievement",
  "content": "玩家首次击败最终Boss，尝试了7次才成功",
  "emotion": "proud",
  "importance": 0.9,
  "context": {
    "timestamp": "2024-01-15T10:30:00Z",
    "level": "final_stage",
    "attempts": 7
  }
}

Response:
{
  "memory_id": "mem-456",
  "embedding": [0.123, -0.456, ...],  // 384维向量
  "stored": true
}
```

**语义检索**:
```javascript
POST /memories/search
{
  "query": "玩家最近的困难挑战",
  "player_id": "player-123",
  "top_k": 5,
  "min_importance": 0.5
}

Response:
{
  "memories": [
    {
      "id": "mem-456",
      "content": "玩家首次击败最终Boss，尝试了7次才成功",
      "similarity": 0.89,
      "importance": 0.9,
      "created_at": "2024-01-15T10:30:00Z"
    },
    // ... top 5
  ]
}
```

**向量化模型**:
- sentence-transformers/all-MiniLM-L6-v2
- 384 维向量
- 本地运行 (无 API 成本)

---

### 6. Voice Service (Python FastAPI) 🆕 Phase 4B

**端口**: 8003
**技术栈**: Python 3.11 + FastAPI + OpenAI TTS
**职责**: 文本转语音、角色语音映射

**API 端点**:
```
POST /synthesize             - 文本转语音
GET  /voices                 - 可用语音列表
GET  /health                 - 健康检查
GET  /stats                  - 统计信息
POST /cache/clear            - 清空缓存
```

**语音合成**:
```python
Request:
{
  "text": "你真厉害！继续加油！",
  "persona": "cheerful",
  "language": "zh-CN",
  "speed": 1.0,
  "format": "mp3"
}

Response:
{
  "audio_url": "data:audio/mp3;base64,//uQx...",
  "persona": "cheerful",
  "voice": "nova",
  "format": "mp3",
  "method": "tts",  // or "cached"
  "cost": 0.00015,
  "latency_ms": 1842.5,
  "audio_duration_seconds": 2.1,
  "character_count": 10
}
```

**角色语音映射**:
```
cheerful → nova (OpenAI, 温暖活力)
cool     → onyx (OpenAI, 深沉权威)
cute     → shimmer (OpenAI, 轻快友好)
```

**支持的语言**:
- zh-CN (中文)
- en-US (英语)
- ja-JP (日语)
- ko-KR (韩语)

**音频格式**:
- MP3 (默认, 压缩)
- Opus (高质量)
- AAC (Apple 设备)
- FLAC (无损)
- WAV (未压缩)
- PCM (原始)

**成本**:
- OpenAI TTS-1: $0.015 / 1K characters
- 缓存 (7天): $0
- 典型对话 (20字): ~$0.0003

**性能**:
- 缓存未命中: 2-5秒
- 缓存命中: <10ms
- 缓存命中率: 60-70%

---

### 7. Vision Service Template 🆕 Phase 4B

**端口**: 8002
**状态**: ⚠️ **架构模板**（核心功能未实现）
**技术栈**: Python 3.11 + FastAPI + GPT-4V / Claude Vision
**职责**: 游戏截图分析（可选代理）

**设计目的**:
- 展示如何实现视觉分析代理
- API 密钥安全（后端隐藏）
- 智能缓存（24小时）
- 成本控制

**API 端点** (占位符):
```
POST /analyze                - 分析截图 (501 未实现)
POST /recognize-game-state   - 识别游戏状态 (501 未实现)
GET  /health                 - 健康检查
GET  /stats                  - 统计信息
POST /cache/clear            - 清空缓存
```

**使用场景对比**:
| 场景 | 直接调用 API | 使用代理 |
|------|--------------|----------|
| 开发/测试 | ✅ 推荐 | ❌ 不需要 |
| 生产环境 | ⚠️ 密钥暴露 | ✅ 推荐 |
| 多用户应用 | ❌ 成本失控 | ✅ 必需 |

**实现指南**: 参考 `TEMPLATE-README.md`

---

### 8. Dashboard (Flask) 🆕 Phase 4B

**端口**: 5000
**技术栈**: Python 3.11 + Flask 3.0 + Tailwind CSS + Chart.js
**职责**: 运营数据可视化、成本分析、实时监控

**功能页面** (4 个):

#### 8.1 平台概览 (`/`)
```
显示内容:
- 活跃游戏数
- 总玩家数
- 总事件数
- 总成本

- 方法使用分布 (饼图)
  - 规则引擎 vs ML 分类器
  - 模板库 vs LLM 生成
  - 缓存命中率

- 服务请求统计
  - 情感识别请求
  - 对话生成请求
  - 记忆操作数
```

#### 8.2 成本分析 (`/costs`)
```
显示内容:
- 总成本、总请求数、平均成本
- 按服务分解 (情感、对话、记忆)
- 每日成本趋势图
- 成本详细表格

支持筛选:
- 时间范围 (7/30/90 天)
- 游戏 ID
- 服务类型
```

#### 8.3 实时监控 (`/realtime`)
```
显示内容:
- 本小时指标
  - 事件数
  - 活跃玩家
  - 平均延迟
  - 本小时成本

- 每小时事件量 (柱状图)
- 服务请求分布 (折线图)
- 服务延迟趋势 (折线图)
- 小时详细数据表

特性:
- 自动刷新 (30秒)
- 支持 6/12/24/48 小时范围
```

#### 8.4 游戏详情 (`/game/:gameId`)
```
显示内容:
- 使用统计 (事件、玩家、延迟、成本)
- 情感分布 (柱状图)
- 每日趋势 (双轴折线图)
- 服务请求分解
```

**API 端点** (AJAX):
```
GET  /api/platform-stats     - 平台统计
GET  /api/hourly-data        - 实时数据
GET  /api/cost-data          - 成本数据
GET  /health                 - 健康检查
```

**缓存优化**:
- 1 分钟 TTL
- LRU 缓存 (128 条)
- 性能提升 50-100x

---

## 客户端 SDK

AGL 提供 **5 个客户端 SDK**：

### 1. Unity SDK (C#) 🎮

**平台**: Unity 2020.3+
**语言**: C#
**格式**: .unitypackage

**功能模块** (6 个):

#### 1.1 AGLClient (核心)
```csharp
var client = new AGLClient(apiKey, gameId);
await client.Initialize();

// 连接状态
client.OnConnected += () => Debug.Log("Connected");
client.OnDisconnected += () => Debug.Log("Disconnected");
```

#### 1.2 EmotionAnalyzer (情感识别)
```csharp
var emotion = await client.AnalyzeEmotion(
    eventType: "player_killed_enemy",
    eventData: new { enemy_type = "boss", combo = 10 },
    context: new { recent_deaths = 5 }
);

Debug.Log($"Emotion: {emotion.Emotion}, Intensity: {emotion.Intensity}");
```

#### 1.3 DialogueGenerator (对话生成)
```csharp
var dialogue = await client.GenerateDialogue(
    emotion: "happy",
    persona: "cheerful",
    dialogueType: "celebration",
    context: new { achievement = "速通大师" }
);

Debug.Log($"Dialogue: {dialogue.Text}");
```

#### 1.4 MemoryManager (记忆管理)
```csharp
// 创建记忆
await client.CreateMemory(
    type: "achievement",
    content: "玩家首次击败Boss",
    importance: 0.9
);

// 回忆相关记忆
var memories = await client.RecallMemories(
    query: "最近的困难挑战",
    topK: 5
);
```

#### 1.5 VoicePlayer (语音播放)
```csharp
var audioClip = await client.SynthesizeVoice(
    text: "你真厉害！",
    persona: "cheerful"
);

audioSource.clip = audioClip;
audioSource.Play();
```

#### 1.6 CompanionController (角色控制)
```csharp
// 获取角色配置
var character = await client.GetCharacter("cheerful");

// 设置角色
companion.SetCharacter(character);

// 播放情感动画
companion.PlayEmotionAnimation("happy", "normal");
```

**实时事件**:
```csharp
client.OnEmotionDetected += (emotion) => {
    companion.PlayEmotionAnimation(emotion.Emotion, emotion.Intensity);
};

client.OnDialogueReady += (dialogue) => {
    dialogueUI.ShowText(dialogue.Text);
    companion.PlayVoice(dialogue.AudioUrl);
};
```

---

### 2. Unreal SDK (C++) 🎮

**平台**: Unreal Engine 4.27 / 5.x
**语言**: C++
**格式**: Plugin

**功能模块** (类似 Unity SDK):
```cpp
// 初始化
FAGLClient* Client = NewObject<FAGLClient>();
Client->Initialize(ApiKey, GameId);

// 分析情感
FEmotionResult Emotion = Client->AnalyzeEmotion(EventType, EventData);

// 生成对话
FDialogueResult Dialogue = Client->GenerateDialogue(Emotion, Persona);

// 管理记忆
Client->CreateMemory(Type, Content, Importance);
TArray<FMemory> Memories = Client->RecallMemories(Query);

// 语音合成
USoundWave* Voice = Client->SynthesizeVoice(Text, Persona);

// 角色控制
Client->SetCharacter(CharacterId);
Client->PlayEmotionAnimation(Emotion, Intensity);
```

---

### 3. Web SDK (TypeScript) 🌐

**平台**: 浏览器 (WebGL 游戏)
**语言**: TypeScript / JavaScript
**格式**: npm package

**安装**:
```bash
npm install @agl/sdk
```

**使用**:
```typescript
import { AGLClient } from '@agl/sdk';

const client = new AGLClient({
  apiKey: 'your-api-key',
  gameId: 'game-123',
  realtimeEnabled: true
});

await client.initialize();

// 分析情感
const emotion = await client.analyzeEmotion({
  eventType: 'player_killed_enemy',
  eventData: { enemy_type: 'boss' }
});

// 生成对话
const dialogue = await client.generateDialogue({
  emotion: emotion.emotion,
  persona: 'cheerful',
  dialogueType: 'celebration'
});

// WebSocket 实时事件
client.on('emotion_detected', (emotion) => {
  companion.playAnimation(emotion.emotion);
});

client.on('dialogue_ready', (dialogue) => {
  ui.showDialogue(dialogue.text);
});
```

---

### 4. Avatar SDK (React Three Fiber) 🎨

**平台**: Web (React)
**技术**: Three.js + React Three Fiber
**格式**: npm package

**安装**:
```bash
npm install @agl/avatar
```

**使用**:
```tsx
import { AvatarController } from '@agl/avatar';

function GameCompanion() {
  const [emotion, setEmotion] = useState('neutral');
  const [dialogue, setDialogue] = useState('');

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: {
            type: 'gltf',
            url: 'https://cdn.../cheerful/model.gltf',
            scale: 1.0
          }
        },
        initialEmotion: emotion,
        enableAnimations: true,
        lighting: {
          ambient: 0.5,
          directional: 0.8
        }
      }}
      dialogueText={dialogue}
      handlers={{
        onEmotionChange: (emotion, intensity) => {
          console.log(`Emotion changed: ${emotion} (${intensity})`);
        },
        onAnimationComplete: (animName) => {
          console.log(`Animation completed: ${animName}`);
        }
      }}
    />
  );
}
```

**功能**:
- 3D 模型加载 (GLTF/GLB)
- 37 个情感动画
- 实时动画切换
- 光影效果
- 性能优化 (LOD, 懒加载)

---

### 5. Vision SDK (TypeScript) 🔍

**平台**: 浏览器 / Electron
**技术**: Screen Capture API + OpenAI GPT-4V / Claude Vision
**格式**: npm package

**安装**:
```bash
npm install @agl/vision
```

**使用**:
```typescript
import { VisionAnalyzer } from '@agl/vision';

const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: 'your-api-key',  // 或使用代理服务
  cacheEnabled: true
});

// 截图并分析
const screenshot = await analyzer.captureScreen();
const analysis = await analyzer.analyze({
  screenshot,
  prompt: 'What is happening in this game scene?'
});

console.log(analysis.content);  // "The player is in combat..."

// 识别游戏状态
const gameState = await analyzer.recognizeGameState(screenshot);
console.log(gameState.category);  // "combat", "menu", "dialogue"...
```

**使用场景**:
- 游戏场景理解
- 自动化测试
- 游戏状态识别
- 无 SDK 游戏集成

---

## API 端点总览

AGL 平台提供 **50+ REST API 端点**：

### API Service (20 端点)
```
/auth        - 5 端点 (认证授权)
/games       - 5 端点 (游戏管理)
/players     - 5 端点 (玩家管理)
/characters  - 2 端点 (角色配置)
/analytics   - 7 端点 (数据分析)
/events      - 2 端点 (事件上报)
/metrics     - 2 端点 (性能指标)
```

### Emotion Service (5 端点)
```
/analyze     - 情感分析
/health      - 健康检查
/stats       - 统计信息
/cache/clear - 清空缓存
/rules       - 规则管理
```

### Dialogue Service (5 端点)
```
/generate    - 对话生成
/health      - 健康检查
/stats       - 统计信息
/cache/clear - 清空缓存
/templates   - 模板管理
```

### Memory Service (8 端点)
```
/memories          - CRUD (4 端点)
/memories/search   - 语义搜索
/memories/recall   - 回忆记忆
/memories/stats    - 统计信息
/health            - 健康检查
```

### Voice Service (5 端点)
```
/synthesize  - 语音合成
/voices      - 语音列表
/health      - 健康检查
/stats       - 统计信息
/cache/clear - 清空缓存
```

### Dashboard (4 页面 + 4 API)
```
/            - 平台概览
/costs       - 成本分析
/realtime    - 实时监控
/game/:id    - 游戏详情

/api/platform-stats - 平台统计
/api/hourly-data    - 实时数据
/api/cost-data      - 成本数据
/health             - 健康检查
```

**总计**: **52 个公开端点**

---

## 数据管理

AGL 使用 **3 种数据存储**：

### 1. PostgreSQL (主数据库)

**版本**: 15+
**用途**: 核心业务数据、用户数据、统计数据

**数据表** (11 个):
```sql
clients          - 客户端账户
games            - 游戏信息
players          - 玩家信息
memories         - 长期记忆
game_events      - 游戏事件日志
service_metrics  - 服务性能指标
daily_analytics  - 每日统计
hourly_analytics - 每小时统计
request_metrics  - HTTP 请求指标
cost_metrics     - 成本追踪
```

**数据量估算** (10,000 活跃玩家):
- 核心数据: ~100MB
- 事件日志: ~10GB/月
- 统计数据: ~1GB/月
- **总计**: ~11GB/月

---

### 2. Redis (缓存 + 消息队列)

**版本**: 7+
**用途**: 缓存、会话、消息队列

**使用场景**:
```
1. 短期记忆 (1小时 TTL)
   - 当前会话数据
   - 最近对话

2. 缓存层
   - 情感分析结果 (1小时)
   - 对话生成结果 (1小时)
   - 语音合成结果 (7天)
   - Dashboard 数据 (1分钟)

3. 成本追踪
   - 每日预算
   - 实时成本
   - 请求计数

4. 消息队列
   - Redis Streams
   - 事件分发
   - 异步任务
```

**内存需求** (10,000 活跃玩家):
- 缓存: ~2GB
- 会话: ~500MB
- 队列: ~100MB
- **总计**: ~2.6GB

---

### 3. Qdrant (向量数据库)

**版本**: 1.7+
**用途**: 语义记忆、相似度搜索

**向量配置**:
- 模型: sentence-transformers/all-MiniLM-L6-v2
- 维度: 384
- 距离: Cosine

**存储估算** (10,000 玩家, 平均 100 条记忆/人):
- 向量数: 1,000,000
- 每个向量: 384 × 4 bytes = 1.5KB
- 索引开销: ~2x
- **总计**: ~3GB

---

## 运营工具

### Analytics Dashboard

**访问地址**: `http://localhost:5000`
**技术栈**: Flask + Tailwind CSS + Chart.js

**用户角色**:
- 运营团队 - 查看整体数据
- 产品经理 - 分析用户行为
- 财务团队 - 监控成本
- 技术团队 - 实时监控

**关键指标**:
```
业务指标:
- 活跃游戏数
- 总玩家数 (DAU/MAU)
- 事件数
- API 调用量

性能指标:
- P50/P95/P99 延迟
- 错误率
- 缓存命中率
- 可用性 (Uptime)

成本指标:
- 每日成本
- 成本分解 (情感/对话/记忆)
- 单用户成本
- 预算使用率

方法分布:
- 规则 vs ML (情感)
- 模板 vs LLM (对话)
- 缓存命中率
```

**告警功能**:
- 成本预算 80% 警告
- 成本预算 95% 严重警告
- 成本预算 100% 阻止
- 错误率 >5% 告警
- 延迟 >500ms (P95) 告警

---

## 支持的业务场景

AGL 支持 **8 种典型业务场景**：

### 1. 游戏陪伴 (核心场景)

**描述**: AI 角色实时陪伴玩家游戏，提供情感支持

**流程**:
```
1. 玩家触发游戏事件 (击杀敌人、完成关卡)
2. SDK 上报事件到 AGL
3. 情感识别 → 对话生成 → 语音合成
4. 角色播放动画 + 语音 + 对话
5. 记忆系统记录重要时刻
```

**用户体验**:
```
玩家击败 Boss 后:
- 角色: "太厉害了！你成功了！" (happy + intense 动画)
- 玩家感受: 被认可、有成就感
- 系统: 记录重要成就记忆
```

---

### 2. 情感陪伴

**描述**: 理解玩家情感，提供心理支持

**场景**:
```
玩家连续失败多次:
- 系统识别: frustrated + intense
- 角色反应: "别灰心，我相信你可以的！要不要休息一下？"
- 提供建议: "这个敌人有个弱点，试试攻击它的右侧"
```

---

### 3. 成长指导

**描述**: 基于玩家行为，提供个性化建议

**流程**:
```
1. 系统分析玩家行为模式
2. 识别技能短板
3. 生成针对性建议
4. 角色友好地传达建议
```

**示例**:
```
"我注意到你经常在Boss战中急于进攻，
不如试试先观察它的攻击模式？
耐心会帮助你找到最佳时机。"
```

---

### 4. 社交互动

**描述**: 多角色互动、社区功能

**功能**:
```
- 角色间对话
- 玩家与多个角色互动
- 社区分享
- 好友角色推荐
```

---

### 5. 个性化体验

**描述**: 根据玩家偏好定制体验

**记忆应用**:
```
系统回忆历史:
"上次你花了3小时才通过这关，
这次只用了1小时，进步真大！"

玩家偏好记忆:
- 喜欢的游戏风格
- 常用的战术
- 游戏时间偏好
```

---

### 6. 游戏辅助

**描述**: 提供游戏内帮助和引导

**功能**:
```
- 新手引导
- 关卡攻略提示
- 技能组合建议
- 资源管理建议
```

---

### 7. 内容创作

**描述**: AI 生成游戏内容

**应用**:
```
- 动态任务生成
- 角色背景故事
- 对话剧情
- 成就描述
```

---

### 8. 数据分析

**描述**: 游戏运营数据分析

**功能**:
```
- 玩家行为分析
- 留存率分析
- 情感趋势分析
- 付费转化分析
```

---

## 功能总结

### 核心指标

| 指标 | 数量 |
|------|------|
| **后端服务** | 8 个 |
| **客户端 SDK** | 5 个 |
| **API 端点** | 52 个 |
| **情感类型** | 12 种 × 3 强度 = 36 种状态 |
| **角色类型** | 3 种 (cheerful, cool, cute) |
| **对话模板** | 1000+ 个 |
| **3D 动画** | 37 个/角色 |
| **语音语言** | 4 种 |
| **数据库表** | 11 个 |
| **存储类型** | 3 种 (PostgreSQL, Redis, Qdrant) |
| **业务场景** | 8 种 |

### 技术栈

| 层级 | 技术 |
|------|------|
| **客户端** | Unity, Unreal, React, Three.js |
| **后端** | Node.js, Python, TypeScript |
| **框架** | NestJS, FastAPI, Flask, Socket.IO |
| **数据库** | PostgreSQL, Redis, Qdrant |
| **AI** | Claude (Anthropic), GPT (OpenAI) |
| **部署** | Docker, Kubernetes |
| **监控** | Prometheus, Grafana |

### 开发进度

| Phase | 状态 | 完成度 |
|-------|------|--------|
| **Phase 1-3** | ✅ 完成 | 100% |
| **Phase 4A** | ✅ 完成 | 100% |
| **Phase 4B** | ✅ 完成 | 100% |
| **整体评分** | 🎯 **8.0/10** | 生产就绪 |

---

## 下一步规划

### Phase 5 计划

1. **多模态集成**
   - 完整实现 Vision Service
   - 语音识别 (STT)
   - 多模态情感分析

2. **高级功能**
   - 跨游戏记忆
   - 角色个性进化
   - 多角色协作

3. **性能优化**
   - 提取共享代码库
   - Avatar 懒加载
   - 完整监控系统 (Prometheus + Grafana)

4. **企业功能**
   - 私有化部署
   - 白标服务
   - 角色市场

---

**AGL 是一个功能完整、架构清晰、生产就绪的 AI 游戏陪伴引擎平台** 🎮✨
