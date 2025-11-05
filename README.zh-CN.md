<div align="center">

# 🎮 AGL - AI游戏陪伴引擎

**为游戏注入情感智能的AI陪伴角色**

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/python-%3E%3D3.11-blue.svg)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.3.0-blue.svg)](https://www.typescriptlang.org/)

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [SDK](#-sdks) • [文档](#-文档) • [架构](#-架构)

</div>

---

## 🌟 什么是AGL？

AGL（AI Game Companion Engine）是一个云端SaaS平台，为游戏开发者提供**情感化AI陪伴角色**。与传统NPC不同，AGL陪伴角色具有：

- 🎭 **情感反应** - 实时响应游戏事件的情感变化（36种情绪变体）
- 💬 **场景对话** - 使用混合模板+LLM系统生成上下文对话（1,000+模板）
- 🧠 **记忆系统** - 通过向量搜索实现语义记忆（三层架构）
- 🌍 **多语言支持** - 英语、中文、日语、韩语（每种语言300+模板）
- 🎨 **3D动画** - 情感驱动的表情和动作（3个角色，每个37个动画）
- 🎙️ **语音合成** - 3种角色语音的文本转语音，7天缓存
- 📊 **实时监控** - 分析仪表板，包含成本跟踪和性能指标

**适用于**：游戏工作室、独立开发者和所有希望打造引人入胜游戏体验的团队。

---

## ✨ 功能特性

### 核心能力

| 功能 | 描述 | 技术 |
|------|------|------|
| 🎭 **情绪识别** | 混合规则+ML系统，36种情绪变体 | Claude API + 规则引擎 |
| 💬 **AI对话** | 90/10混合策略（模板+LLM）实现成本优化 | Anthropic Claude Haiku/Sonnet |
| 🧠 **记忆系统** | 三层记忆架构与语义搜索 | PostgreSQL + Qdrant + Redis |
| 🌐 **多语言** | 英语、中文、日语、韩语对话（每种300+模板） | i18n模板系统 |
| 🎨 **3D形象** | 3个角色，每个37个动画，CDN托管模型 | Three.js + React Three Fiber |
| 🎙️ **语音合成** | 3种角色语音的文本转语音，7天缓存 | OpenAI TTS API |
| 👁️ **视觉AI** | 游戏画面理解提供场景感知（可选） | GPT-4V / Claude Vision |
| 📊 **分析仪表板** | 实时监控、成本跟踪、性能指标 | Flask + Chart.js |

### 开发者体验

- ✅ **多平台SDK**：Unity（C#）、Unreal（C++）、Web（TypeScript）
- ✅ **命令行工具**：5个命令（init、dev、deploy、config、status）简化开发流程
- ✅ **简单集成**：简洁的API和完整的文档
- ✅ **灵活部署**：开发用单体模式，生产用微服务
- ✅ **成本优化**：智能缓存和模板回退
- ✅ **生产就绪**：完整的监控、测试和部署指南
- ✅ **高测试覆盖率**：818+测试用例，85%+覆盖率

---

## 🚀 快速开始

### 方式一：单体模式（推荐新手）

**60秒启动 - 无需Docker！**

```bash
# 克隆并运行
git clone https://github.com/J0hnFFFF/agl.git
cd agl
npm run dev:monolith
```

服务运行在 `http://localhost:3000` ✨

### 方式二：微服务模式（类生产环境）

```bash
# 1. 克隆仓库
git clone https://github.com/J0hnFFFF/agl.git
cd agl

# 2. 配置环境
cp .env.example .env
# 编辑.env添加API密钥（ANTHROPIC_API_KEY, OPENAI_API_KEY）

# 3. 启动基础设施
npm run dev:stack

# 4. 安装依赖
npm install
cd services/api-service && npx prisma generate && npx prisma migrate dev

# 5. 启动核心服务（在不同终端）
npm run dev:api       # API服务（端口3000）
npm run dev:realtime  # 实时网关（端口3001）
npm run dev:emotion   # 情绪服务（端口8000）
npm run dev:dialogue  # 对话服务（端口8001）
npm run dev:memory    # 记忆服务（端口3002）

# 6. 启动可选服务（在其他终端）
npm run dev:voice     # 语音服务（端口8003） - 文本转语音
npm run dev:dashboard # 分析仪表板（端口5000） - 监控
```

### 试用一下

```bash
# 分析玩家情绪
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.victory",
    "data": {"killCount": 15, "mvp": true}
  }'

# 生成陪伴对话
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "persona": "cheerful",
    "language": "zh"
  }'
```

📚 **完整指南**：查看 [QUICKSTART.md](./QUICKSTART.md) 了解详细说明。

---

## 🎮 SDKs

### Unity (C#)

```csharp
using AGL;

// 初始化客户端
var client = new AGLClient(new AGLConfig {
    ApiUrl = "http://localhost:3000"
});

// 发送游戏事件
await client.SendGameEvent("player.victory", new {
    killCount = 15,
    mvp = true
});

// 监听陪伴反应
client.OnCompanionAction += (action) => {
    Debug.Log($"情绪: {action.Emotion}");
    Debug.Log($"对话: {action.Dialogue}");
    PlayAnimation(action.Action);
};
```

📖 [Unity SDK文档](./sdk/unity/README.md)

### Web / TypeScript

```typescript
import { AGLClient } from '@agl/web';

const client = new AGLClient({
  apiUrl: 'http://localhost:3000'
});

// 发送事件并获取响应
const response = await client.sendGameEvent('player.victory', {
  killCount: 15,
  mvp: true
});

console.log(response.emotion);   // "excited"
console.log(response.dialogue);  // "太棒了！你势不可挡！"
```

📖 [Web SDK文档](./sdk/web/README.md)

### Unreal Engine (C++)

```cpp
#include "AGLClient.h"

void AMyGameMode::BeginPlay()
{
    Super::BeginPlay();

    // 初始化AGL客户端
    AGLClient = NewObject<UAGLClient>();

    FAGLConfig Config;
    Config.ApiUrl = TEXT("http://localhost:3000");
    AGLClient->Initialize(Config);
}

void AMyGameMode::OnPlayerVictory(int32 KillCount, bool bIsMVP)
{
    // 创建游戏事件
    FAGLGameEvent Event;
    Event.EventType = TEXT("player.victory");
    Event.Data.Add(TEXT("killCount"), FString::FromInt(KillCount));

    // 发送事件
    FOnGameEventComplete Callback;
    Callback.BindLambda([](bool bSuccess, const FAGLCompanionAction& Action)
    {
        if (bSuccess)
        {
            UE_LOG(LogTemp, Log, TEXT("对话: %s"), *Action.Dialogue);
        }
    });

    AGLClient->SendGameEvent(Event, Callback);
}
```

📖 [Unreal SDK文档](./sdk/unreal/README.md)

---

## 🏗 架构

**8个微服务的云原生架构：**

```
┌─────────────────────────────────────────────────────────┐
│              游戏客户端（Unity/Unreal/Web）              │
│                         SDK                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/WebSocket
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  API服务（NestJS, 3000）                 │
│            REST API + WebSocket + 身份认证               │
└──────┬───────────────┬──────────────────┬───────────────┘
       │               │                  │
       ↓               ↓                  ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  情绪服务    │ │   对话服务   │ │  记忆服务    │
│(FastAPI,8000)│ │(FastAPI,8001)│ │(Node.js,3002)│
│              │ │              │ │              │
│• 规则引擎    │ │• 模板系统    │ │• 向量搜索    │
│• ML分类器    │ │• LLM生成     │ │• 语义匹配    │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  语音服务    │ │   仪表板     │ │  视觉服务    │
│(FastAPI,8003)│ │(Flask, 5000) │ │(FastAPI,8002)│
│              │ │              │ │              │
│• OpenAI TTS  │ │• 监控分析    │ │• 屏幕理解    │
│• 7天缓存     │ │• 成本跟踪    │ │• GPT-4V      │
└──────────────┘ └──────────────┘ └──────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌──────────────┐ ┌──────────┐  ┌──────────┐
│ PostgreSQL   │ │  Redis   │  │  Qdrant  │
│  (主数据库)  │ │  (缓存)  │  │ (向量库) │
└──────────────┘ └──────────┘  └──────────┘
```

### 关键设计决策

1. **混合情绪检测**：85%规则引擎（快速、免费）+ 15% ML（精准）
2. **90/10对话策略**：90%模板（便宜）+ 10% LLM（质量）
3. **三层记忆**：短期（Redis）+ 长期（PostgreSQL）+ 语义（Qdrant）
4. **成本优化**：智能缓存、预算管理、优雅降级

---

## 🛠 技术栈

**后端服务**
- Node.js 20+ with TypeScript 5.3 and NestJS 10.x
- Python 3.11+ with FastAPI 0.109+
- PostgreSQL 15+ (主数据库，带分区表)
- Redis 7+ (缓存 + 消息队列 + 成本跟踪)
- Qdrant 1.7+ (向量数据库用于语义记忆)

**AI/ML**
- Anthropic Claude API (主要LLM - Haiku/Sonnet)
- OpenAI API (TTS语音合成 + Whisper STT + 嵌入)
- GPT-4V / Claude Vision (视觉AI，可选)
- LangChain (LLM编排)

**客户端SDK**
- Unity: C# SDK with UnityWebRequest
- Unreal: C++插件支持Blueprint
- Web: TypeScript SDK支持浏览器和Node.js

**基础设施**
- Docker + Docker Compose
- Kubernetes (生产部署)
- Prometheus + Grafana (监控)

---

## 📚 文档

### 入门指南
- [快速开始指南](./QUICKSTART.md) - 5分钟上手
- [单体模式指南](./QUICKSTART-MONOLITH.md) - 简化的单服务部署
- [SQLite开发](./docs/development-sqlite.md) - 轻量级本地开发

### 平台文档
- [架构指南](./CLAUDE.md) - 详细的技术架构和设计决策
- [API参考](./docs/api/README.md) - 完整的REST API文档（52个端点）
- [部署指南](./docs/deployment-guide.md) - 生产部署和运维
- [监控配置](./docs/monitoring-setup.md) - Prometheus和Grafana配置
- [性能优化](./docs/performance-optimization.md) - 数据库调优和缓存
- [CLI工具指南](./docs/CLI-GUIDE.md) - 命令行工具使用指南（5个命令）

### 服务指南
- [情绪系统](./docs/emotion-system.md) - 混合规则+ML情绪检测
- [对话系统](./docs/dialogue-system.md) - 模板+LLM对话生成
- [记忆服务](./docs/memory-service.md) - 向量搜索和语义记忆
- [语音服务](./services/voice-service/README.md) - 文本转语音合成（5,000+字）
- [分析仪表板](./services/dashboard/README.md) - 使用监控和成本跟踪

### SDK文档
- [Unity SDK](./sdk/unity/README.md) - C# SDK完整API参考
- [Web SDK](./sdk/web/README.md) - TypeScript SDK支持浏览器和Node.js
- [Unreal SDK](./sdk/unreal/README.md) - C++插件支持Blueprint
- [Avatar SDK](./sdk/avatar/README.md) - 3D形象渲染引擎
- [Vision SDK](./sdk/vision/README.md) - AI驱动的游戏画面分析

---

## 🗺 路线图

### ✅ 第一阶段：MVP（已完成）
- 核心基础设施和微服务
- 带身份认证的API服务和游戏/玩家管理
- 基础情绪识别和基于模板的对话
- Unity SDK和全面测试

### ✅ 第二阶段：生产功能（已完成）
- 带向量搜索的记忆服务（Qdrant + OpenAI嵌入）
- LLM对话生成（Anthropic Claude + 90/10混合）
- ML情绪分类器（Claude API + 基于规则的混合）
- 带成本跟踪的分析仪表板
- 性能优化（缓存、索引、连接池）

### ✅ 第三阶段：多平台和部署（已完成）
- Web SDK（TypeScript）和Unreal SDK（C++）
- 多语言支持（英语、中文、日语）
- 3D Avatar SDK（Three.js + 情绪动画）
- Vision AI SDK（GPT-4V/Claude Vision用于屏幕分析）
- 生产部署指南（Docker Compose + Kubernetes）
- 监控配置（Prometheus + Grafana）

### ✅ 第四阶段A：测试与工具（已完成）
- **818+测试用例**，85%+覆盖率（Web SDK 55+，Unity SDK 125+，Unreal SDK 88+，服务318+，CLI 182+）
- **CLI工具**：5个命令简化开发流程（init、dev、deploy、config、status）
- **韩语支持**：第4种语言，300+模板
- **监控增强**：指标收集、成本追踪、性能仪表板

### ✅ 第四阶段B：高级功能（已完成）
- **语音服务**：OpenAI TTS集成，3种角色语音，7天缓存
- **分析仪表板**：Flask + Chart.js，4个页面（概览、成本、性能、设置）
- **视觉服务模板**：GPT-4V/Claude Vision架构参考
- **3D Avatar SDK增强**：3个角色，37个动画，CDN托管

### ✅ 第四阶段修复：代码质量（已完成）
- **质量提升**：生产就绪评分从6.3/10提升至8.0/10
- **代码清理**：修复TypeScript/Python错误，标准化代码风格
- **测试增强**：修复测试，提高覆盖率
- **文档完善**：100,000+字文档

### 🚧 第五阶段：高级功能补全（规划中）
- [ ] **STT服务**：Whisper API语音识别
- [ ] **语音对话集成**：完整的语音交互流程 + 唇形同步
- [ ] **Vision服务完整实现**：从模板到实战可用
- [ ] **社交功能**：角色导出/导入、社区库

---

## 💰 成本估算

### 开发环境（SQLite + 单体）
- **基础设施**：$0/月（本地开发）
- **LLM API**：~$10-30/月（测试）
- **语音API**：~$5/月（测试）
- **总计**：~$15-35/月

### 小规模生产（<1000活跃玩家）
- **基础设施**：$200/月（DigitalOcean Kubernetes）
- **LLM API**：~$300/月（带缓存优化）
- **语音API**：~$50/月（TTS，带7天缓存）
- **CDN**：$20/月
- **总计**：~$570/月

### 增长阶段（10,000+活跃玩家）
- **基础设施**：$800/月
- **LLM API**：~$2,000/月（90/10策略）
- **语音API**：~$300/月（TTS + STT，高缓存命中率）
- **CDN/带宽**：$200/月
- **总计**：~$3,300/月

**目标**：<$0.35每月活跃用户（MAU）

**成本优化策略**：
- 90/10对话策略（模板优先）
- 7天语音缓存（减少TTS调用）
- 规则引擎优先（避免ML API调用）
- CDN缓存3D资产

---

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行特定服务测试
npm run test:api          # API服务测试
npm run test:emotion      # 情绪服务测试（50+测试）
npm run test:dialogue     # 对话服务测试（80+测试）
npm run test:memory       # 记忆服务测试（60+测试）
npm run test:voice        # 语音服务测试（48+测试）

# SDK测试
npm run test:web-sdk      # Web SDK测试（55+测试）
npm run test:unity-sdk    # Unity SDK测试（125+测试）
npm run test:unreal-sdk   # Unreal SDK测试（88+测试）

# CLI工具测试
npm run test:cli          # CLI工具测试（182+测试）

# 集成测试
npm run test:integration

# 负载测试
npm run test:load
```

**覆盖率**：
- **总计**：818+测试用例，85%+覆盖率
- **Web SDK**：55+测试，85%+覆盖率
- **Unity SDK**：125+测试，85%+覆盖率
- **Unreal SDK**：88+测试，85%+覆盖率
- **服务层**：318+测试，85%+覆盖率
- **CLI工具**：182+测试，85%+覆盖率

包含完整的单元测试、集成测试和端到端测试。

---

## 🤝 贡献

这目前是一个私有项目。当项目开源时将添加贡献指南。

---

## 📄 许可证

专有 - 保留所有权利。

此项目目前为闭源。如需许可咨询，请联系开发团队。

---

## 📞 联系与支持

- **文档**：浏览 [docs/](./docs) 目录
- **问题**：通过GitHub Issues报告bug或请求功能
- **邮箱**：j0hn.wahahaha@gmail.com（占位符）

---

<div align="center">

**为想要创造难忘体验的游戏开发者而构建 ❤️**

[开始使用](#-快速开始) • [阅读文档](#-文档) • [查看示例](./examples)

</div>
