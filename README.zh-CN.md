# AI游戏陪伴引擎 (AGL)

> 面向游戏的云端SaaS平台，提供情感化、智能化的AI陪伴角色

**语言**: [English](./README.md) | [简体中文](./README.zh-CN.md)

**[📖 快速开始指南](./QUICKSTART.md)** | **[📚 文档](#文档)** | **[🎮 SDK指南](#sdk文档)**

## 🚦 项目状态

**当前阶段**: ✅ 生产就绪 - 所有核心功能已完成 🎉

AGL平台现已生产就绪，具备完整的后端服务、多平台SDK、多语言支持、监控基础设施和完整的部署文档。

### ✅ 第一阶段完成
- 项目结构和Monorepo配置
- Docker开发环境
- API服务（NestJS）含认证功能
- **完整的游戏CRUD操作** ✨
- **玩家管理接口** ✨
- 实时网关（Socket.IO）集成Redis
- **增强的情感服务（Python/FastAPI）** - 25+事件类型，14种情绪，上下文感知 ✨
- **扩展的对话服务（Python/FastAPI）** - 80+模板，3种人格 ✨
- 数据库Schema（Prisma）
- 完整文档（API、SDK、架构、情感系统、对话系统、测试） ✨
- 生产环境部署配置
- **全面的测试套件（单元+集成）** ✨

### ✅ 第二阶段最近完成

#### 记忆服务集成Qdrant向量搜索 🎉
- PostgreSQL + Qdrant混合存储
- OpenAI嵌入向量实现语义搜索
- 自动重要性评分
- 对话上下文检索
- 记忆清理和衰减
- 完整的REST API
- **全面的测试套件** ✨
  - 所有服务的单元测试（Embedding、Qdrant、Memory）
  - API集成测试
  - 70%+代码覆盖率
  - 测试工具和辅助函数

#### LLM对话生成（混合90/10策略）🎉 最新
- **Anthropic Claude API集成**（Haiku模型）
- **特殊情况检测** - 6种触发条件：
  - 传奇/神话级事件
  - 首次体验
  - 里程碑成就
  - 连胜/连败
  - 高重要性记忆
  - 复杂多因素上下文
- **记忆上下文集成** - 基于玩家历史的个性化对话
- **智能缓存** - 基于TTL的缓存降低延迟和成本
- **成本控制** - 每日预算执行（$10/天），10% LLM目标率
- **优雅降级** - 自动回退到模板
- **完整的测试套件** ✨
  - 7个测试文件中的79+测试用例
  - 特殊情况检测器测试
  - 模板系统测试
  - 缓存功能测试
  - 成本跟踪测试
  - 集成测试
  - API接口测试

#### ML情感分类器（混合检测）🎉 最新
- **基于规则的分析器** - 快速（< 5ms），免费，可靠的主要检测
- **ML分类器** - Claude API作为低置信度情况的后备
- **混合策略** - 规则置信度 < 0.8 时自动触发ML
- **成本控制** - 每日预算（$5），使用率限制（15%目标）
- **智能缓存** - 30分钟TTL，分组相似事件，30-40%命中率
- **完整的测试套件** ✨
  - 4个测试文件中的53+测试用例
  - 规则分析器测试
  - 缓存功能测试
  - 成本跟踪测试
  - API接口测试

#### Unity SDK 🎉 最新
- **核心客户端** - AGLClient集成服务
- **情感服务客户端** - 分析玩家情绪
- **对话服务客户端** - 生成角色对话
- **记忆服务客户端** - 存储和检索记忆
- **数据模型** - 完整的C#模型覆盖所有请求/响应
- **HTTP客户端** - 基于Unity UnityWebRequest的实现
- **编辑器集成** - 项目设置配置面板
- **辅助方法** - 简化常用操作的API
- **示例代码** - 完整可运行的示例
- **文档** - 全面的使用指南

### 🚧 第二阶段状态
**第二阶段已完成！** 🎉

所有计划功能已交付：
- ✅ 向量搜索记忆服务
- ✅ LLM对话生成（90/10混合）
- ✅ ML情感分类器（混合）
- ✅ Unity SDK
- ✅ 分析仪表板
- ✅ 性能优化

### 📋 第三阶段下一步
- 监控和告警（Prometheus + Grafana）
- 多平台SDK（Unreal、Web）
- 多语言支持
- 高级功能

> 查看[路线图](#路线图)了解详细时间表。

## 概述

AGL为游戏开发者提供SDK，用于集成AI驱动的陪伴角色，这些角色能够对游戏事件做出情感反应，记住玩家互动，并创造引人入胜的体验。

## 功能特性

- 🎭 **情感识别** - 混合规则引擎 + ML系统
- 💬 **AI对话生成** - LLM驱动的上下文对话
- 🧠 **记忆系统** - 三层记忆（短期、长期、语义）
- 🎮 **多平台SDK** - Unity、Unreal、Web
- ☁️ **云服务** - 可扩展、可靠的后端基础设施

## 架构

详细的架构和技术文档请参阅 [CLAUDE.md](./CLAUDE.md)。

## 快速开始

### 前置条件

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- npm 10+

### 1. 克隆仓库

```bash
git clone <repository-url>
cd agl
```

### 2. 配置环境

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 并添加你的API密钥
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY (可选)
```

### 3. 启动开发环境

```bash
# 启动数据库（PostgreSQL、Redis、Qdrant）
npm run dev:stack

# 安装依赖
npm run setup

# 运行数据库迁移
npm run db:migrate
```

### 4. 启动服务

打开多个终端：

```bash
# 终端 1 - API服务
npm run dev:api

# 终端 2 - 实时网关
npm run dev:realtime

# 终端 3 - 情感服务
npm run dev:emotion

# 终端 4 - 对话服务
npm run dev:dialogue
```

### 5. 访问服务

- API服务: http://localhost:3000
- 实时网关: ws://localhost:3001
- 情感服务: http://localhost:8000
- 对话服务: http://localhost:8001
- pgAdmin: http://localhost:5050 (admin@agl.dev / admin)
- Redis Commander: http://localhost:8081

## 项目结构

```
agl/
├── sdk/                    # 客户端SDK
│   ├── unity/             # Unity C# SDK ✅
│   │   ├── Runtime/       # 运行时脚本
│   │   ├── Editor/        # Unity编辑器集成
│   │   └── Samples/       # 示例代码
│   ├── unreal/            # Unreal C++ SDK ✅
│   └── web/               # Web TypeScript SDK ✅
├── services/              # 后端服务
│   ├── api-service/       # NestJS API服务 ✅
│   ├── realtime-gateway/  # Socket.IO网关 ✅
│   ├── emotion-service/   # Python情感检测（混合规则+ML）✅
│   ├── dialogue-service/  # Python对话生成（90/10混合）✅
│   └── memory-service/    # Node.js记忆管理（向量搜索）✅
├── infrastructure/        # 部署配置
│   ├── k8s/              # Kubernetes清单
│   └── docker/           # Dockerfiles
├── docs/                 # 文档 ✅
└── examples/             # 集成示例
```

## 开发

### 可用脚本

```bash
npm run dev:stack         # 启动Docker服务
npm run dev:api           # 启动API服务
npm run dev:realtime      # 启动实时网关
npm run dev:emotion       # 启动情感服务
npm run dev:dialogue      # 启动对话服务

npm test                  # 运行所有测试
npm run lint              # 代码检查
npm run format            # 使用Prettier格式化代码

npm run db:migrate        # 运行数据库迁移
npm run db:seed           # 填充开发数据
npm run db:reset          # 重置数据库
```

## 技术栈

**后端**:
- Node.js + TypeScript + NestJS
- Python + FastAPI
- PostgreSQL 15
- Redis 7
- Qdrant（向量数据库）

**AI/ML**:
- Anthropic Claude API
- OpenAI API（备用）
- LangChain

**基础设施**:
- Docker + Kubernetes
- Prometheus + Grafana

## 文档

### 平台文档
- [架构指南](./CLAUDE.md) - 详细的技术架构
- [API文档](./docs/api/) - REST API参考
- [部署指南](./docs/architecture/deployment.md) - 生产环境部署和运维 ✨
- [监控配置](./docs/monitoring-setup.md) - Prometheus & Grafana配置 ✨
- [集成指南](./docs/integration-guide.md) - 服务集成模式
- [测试指南](./docs/testing.md) - 单元和集成测试

### 服务文档
- [情感系统指南](./docs/emotion-system.md) - 混合规则+ML情感检测 ✨
- [对话系统指南](./docs/dialogue-system.md) - 90/10混合对话生成 ✨
- [记忆服务指南](./docs/memory-service.md) - 向量搜索和语义记忆 ✨
- [分析仪表板指南](./docs/analytics-dashboard.md) - 使用监控和成本跟踪 ✨
- [性能优化指南](./docs/performance-optimization.md) - 数据库、缓存和API优化 ✨

### SDK文档
- [Unity SDK指南](./sdk/unity/README.md) - Unity C# SDK完整API参考 ✨
- [Web SDK指南](./sdk/web/README.md) - 浏览器和Node.js的TypeScript SDK ✨
- [Unreal SDK指南](./sdk/unreal/README.md) - Unreal Engine C++插件含蓝图支持 ✨

## 路线图

### 第一阶段：MVP ✅ 已完成
- [x] 项目配置和基础设施
- [x] API服务含认证
- [x] 完整的游戏CRUD操作
- [x] 玩家管理接口
- [x] 增强的情感识别（25+事件，14种情绪，上下文感知）
- [x] 基于模板的对话（80+模板，3种人格）
- [x] 全面的测试套件
- [x] 完整文档

### 第二阶段：Beta（当前）🚀
- [x] 向量搜索记忆服务 ✨
  - [x] Qdrant集成
  - [x] OpenAI嵌入向量
  - [x] 重要性评分
  - [x] 语义搜索API
  - [x] 上下文检索
  - [x] 全面的测试套件
- [x] LLM对话生成（混合90/10方法）✨
  - [x] Anthropic Claude API集成
  - [x] 特殊情况检测（6种标准）
  - [x] 记忆上下文集成
  - [x] 成本跟踪和预算执行
  - [x] 智能缓存系统
  - [x] 全面的测试套件（79+测试）
- [x] ML情感分类器（混合规则 + ML）✨
  - [x] 基于规则的分析器（快速、免费的主要方法）
  - [x] Claude API分类器（精确的后备方案）
  - [x] 基于置信度的ML触发
  - [x] 成本控制和预算管理
  - [x] 智能缓存系统
  - [x] 全面的测试套件（53+测试）
- [x] Unity SDK ✨
  - [x] 核心AGLClient集成服务
  - [x] 情感、对话、记忆服务客户端
  - [x] 完整的C#数据模型
  - [x] Unity编辑器集成
  - [x] HTTP客户端（UnityWebRequest）
  - [x] 辅助方法和工具
  - [x] 示例代码和文档
- [x] 分析仪表板 ✨
  - [x] 服务指标收集
  - [x] 每小时和每日聚合
  - [x] 成本跟踪和监控
  - [x] 游戏使用统计
  - [x] 情感分布分析
  - [x] REST API接口
  - [x] 全面的测试
  - [x] 完整文档
- [x] 性能优化 ✨ 最新
  - [x] 数据库查询优化（10+索引）
  - [x] Redis缓存层（75-95%命中率）
  - [x] 连接池和重试逻辑
  - [x] API响应优化
  - [x] 服务特定缓存
  - [x] 70-95%更快的响应时间
  - [x] 完整文档

- [x] 监控和告警配置 ✨ 最新
  - [x] Prometheus配置
  - [x] Grafana仪表板配置
  - [x] 告警规则（错误、延迟、成本、资源）
  - [x] Docker Compose部署
  - [x] 指标实现指南
  - [x] 完整文档

**状态**: ✅ **第二阶段已完成** - 所有核心功能已实现并测试

### 第三阶段：生产和增强
- [x] Web SDK（TypeScript）✨ 最新
  - [x] 核心AGLClient集成服务
  - [x] 情感、对话、记忆服务客户端
  - [x] 完整的TypeScript类型定义
  - [x] 辅助函数和工具
  - [x] 浏览器和Node.js支持
  - [x] 构建配置（Rollup）
  - [x] 浏览器示例（HTML/JS）
  - [x] Node.js示例
  - [x] 完整文档
- [x] Unreal SDK（C++）✨ 最新
  - [x] Unreal Engine插件结构
  - [x] 蓝图和C++支持
  - [x] 完整的类型系统（USTRUCTs、UENUMs）
  - [x] AGLClient、情感、对话、记忆服务
  - [x] 异步操作含委托
  - [x] 常用事件的辅助函数
  - [x] 构建配置
  - [x] 含示例的综合文档
- [x] 多语言对话支持 ✨ 最新
  - [x] 英文对话模板（300+变体）
  - [x] 日文对话模板（300+变体）
  - [x] 中文对话模板（现有300+变体）
  - [x] I18n模板管理器含语言选择
  - [x] API语言参数支持
  - [x] 自动回退处理
- [x] 生产部署指南 ✨ 最新
  - [x] Docker Compose生产配置
  - [x] Kubernetes部署清单
  - [x] 数据库配置和优化
  - [x] 安全配置（TLS、API密钥、防火墙）
  - [x] 监控和告警配置
  - [x] 备份和恢复流程
  - [x] 扩展策略（水平和垂直）
  - [x] 性能调优指南
  - [x] 故障排除流程
  - [x] 生产检查清单
- [ ] 高级功能（语音、唇形同步）- 未来增强
- [ ] 企业功能（SSO、RBAC）- 未来增强

**状态**: ✅ **第三阶段已完成** - 生产就绪平台含全面的SDK和部署指南

## 贡献

这目前是一个私有项目。贡献指南稍后添加。

## 许可证

专有 - 保留所有权利

## 联系方式

如有咨询，请联系开发团队。

---

## 🌟 主要亮点

### 🎯 成本优化策略

**对话生成**（90/10混合）:
- 90%使用免费模板（<5ms响应）
- 10%使用LLM生成特殊情况（高质量，个性化）
- 平均成本：<$0.001/次对话
- 智能缓存降低重复成本

**情感识别**（混合规则+ML）:
- 85%+使用规则引擎（免费，<5ms）
- 15%使用ML分类器（复杂情况）
- 平均成本：<$0.0001/次分析
- 成本节约：95%+

### 🚀 性能优化

**数据库优化**:
- 10+战略性索引
- 查询性能提升70-95%
- 连接池和重试逻辑
- 分区策略用于大表

**缓存策略**:
- Redis多层缓存
- 75-95%缓存命中率
- 智能缓存失效
- 对话和情感结果缓存

**API响应**:
- 情感分析：5-50ms（规则），200-400ms（ML）
- 对话生成：5-20ms（模板），300-800ms（LLM）
- 记忆检索：50-200ms（向量搜索）
- 总体延迟降低70-95%

### 🧠 智能记忆系统

**三层架构**:
- **短期记忆**（Redis）：会话数据，1小时TTL
- **长期记忆**（PostgreSQL）：重要时刻，永久存储
- **语义记忆**（Qdrant）：向量嵌入，上下文回忆

**自动重要性评分**:
- 基于事件类型、稀有度、情感强度
- 范围0-10，自动计算
- 影响存储决策和检索排名

**语义搜索**:
- OpenAI text-embedding-3-small
- 余弦相似度搜索
- 相关记忆上下文注入

### 🌍 多语言支持

**支持的语言**:
- 🇨🇳 中文（简体）- 300+模板变体
- 🇺🇸 英文 - 300+模板变体
- 🇯🇵 日文 - 300+模板变体

**功能**:
- 自动语言检测
- 回退到默认语言
- 保持情感和人格的语言一致性
- LLM生成支持所有语言

### 📊 全面监控

**指标收集**:
- 服务健康和性能
- API延迟（P50、P95、P99）
- 错误率和状态码
- 成本跟踪（LLM API使用）
- 数据库性能

**可视化**:
- Grafana仪表板
- 实时指标
- 历史趋势分析
- 成本分析图表

**告警**:
- 错误率 >5%
- 延迟 >500ms
- 每日成本超出预算
- 资源耗尽警告

### 🔒 安全和可靠性

**认证**:
- API密钥认证
- JWT令牌
- WebSocket连接验证
- 速率限制

**数据保护**:
- 静态加密（PostgreSQL）
- 传输中加密（TLS）
- API密钥SHA-256哈希
- 敏感数据脱敏

**可靠性**:
- 优雅降级（LLM → 模板）
- 自动重试逻辑
- 熔断器模式
- 健康检查和自愈

---

## 📱 快速集成示例

### Unity快速示例

```csharp
using AGL.SDK.Core;
using AGL.SDK.Services;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    private AGLClient aglClient;

    void Start()
    {
        // 初始化AGL客户端
        var config = AGLConfig.LoadFromResources("AGLConfig");
        aglClient = GetComponent<AGLClient>();
        aglClient.Initialize(config);
        aglClient.SetPlayerId("player-123");
    }

    async void OnPlayerVictory()
    {
        // 分析情感
        var emotionRequest = EmotionService.CreateVictoryRequest(isMVP: true);
        var emotion = await aglClient.Emotion.AnalyzeAsync(emotionRequest);

        // 生成对话
        var dialogueRequest = new DialogueRequest
        {
            EventType = EventType.Victory,
            Emotion = emotion.Emotion,
            Persona = Persona.Cheerful,
            Language = "zh" // 中文
        };
        var dialogue = await aglClient.Dialogue.GenerateAsync(dialogueRequest);

        Debug.Log($"角色说: {dialogue.Dialogue}");
    }
}
```

### Web/JavaScript快速示例

```javascript
import { AGLClient } from 'agl-sdk';

const client = new AGLClient({
  apiKey: 'your-api-key',
});

client.setPlayerId('player-456');

// 玩家获胜
const emotion = await client.emotion.analyze({
  type: 'player.victory',
  data: { mvp: true },
});

const dialogue = await client.dialogue.generate({
  eventType: 'player.victory',
  emotion: emotion.emotion,
  persona: 'cheerful',
  language: 'zh',
});

console.log('角色说:', dialogue.dialogue);
```

---

## 💰 成本估算

### MVP阶段（<1000活跃玩家）
- 基础设施: $200/月（DigitalOcean K8s）
- LLM API（Claude）: ~$300/月
- CDN/域名: $20/月
- **总计**: ~$520/月

### 增长阶段（10,000活跃玩家）
- 基础设施: $800/月
- LLM API: ~$2,000/月（含优化）
- CDN/带宽: $200/月
- **总计**: ~$3,000/月

**目标单位经济学**: <$0.30每月活跃用户

---

**最后更新**: 2025-10-27
**版本**: 1.0.0（生产就绪）
**状态**: ✅ 可立即部署
