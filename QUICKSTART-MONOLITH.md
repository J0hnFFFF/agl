# AGL快速开始 - 单体版本

**5分钟启动完整的AGL服务！**

这是AGL平台的简化版本，所有功能都整合在一个进程中，使用SQLite数据库。非常适合：

- ✅ 本地开发和测试
- ✅ MVP和原型验证
- ✅ 小规模部署（<10K用户）
- ✅ 学习和体验AGL功能

---

## 🚀 快速启动

### 方法1：一键启动（推荐）

```bash
# 克隆仓库
git clone <repository-url>
cd agl

# 一键启动！
npm run dev:monolith
```

就这么简单！服务将在 `http://localhost:3000` 启动。

### 方法2：手动启动

```bash
cd services/monolith

# 安装依赖
npm install

# 启动服务
npm run dev
```

---

## ✅ 验证服务

### 1. 检查健康状态

```bash
curl http://localhost:3000/health
```

**期望输出**:
```json
{
  "status": "ok",
  "service": "AGL Monolith",
  "version": "1.0.0",
  "database": "SQLite",
  "cache": "In-Memory"
}
```

### 2. 测试情绪分析

```bash
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.victory",
    "data": {
      "killCount": 15,
      "mvp": true
    }
  }'
```

**期望输出**:
```json
{
  "emotion": "excited",
  "intensity": 0.9,
  "confidence": 0.95,
  "action": "celebrate",
  "method": "rule",
  "cached": false
}
```

### 3. 测试对话生成

```bash
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "persona": "cheerful",
    "language": "zh"
  }'
```

**期望输出**:
```json
{
  "dialogue": "太棒了！你真厉害！",
  "emotion": "excited",
  "source": "template",
  "persona": "cheerful"
}
```

---

## 📱 Unity集成示例

### 1. 安装Unity SDK

将 `sdk/unity/` 文件夹导入Unity项目。

### 2. 配置AGL

```csharp
using AGL;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    private AGLClient aglClient;

    void Start()
    {
        // 连接到Monolith服务
        aglClient = new AGLClient(new AGLConfig
        {
            ApiUrl = "http://localhost:3000",
            WebSocketUrl = "ws://localhost:3000"
        });

        // 监听伴侣动作
        aglClient.OnCompanionAction += HandleCompanionAction;
    }

    void OnPlayerVictory(int killCount, bool isMVP)
    {
        // 发送游戏事件
        aglClient.SendGameEvent("player.victory", new
        {
            killCount = killCount,
            mvp = isMVP
        });
    }

    void HandleCompanionAction(CompanionAction action)
    {
        Debug.Log($"Emotion: {action.Emotion}");
        Debug.Log($"Dialogue: {action.Dialogue}");

        // 更新UI显示对话
        dialogueText.text = action.Dialogue;

        // 播放对应动画
        animator.SetTrigger(action.Action);
    }
}
```

---

## 🎮 Web集成示例

### 1. 安装Web SDK

```bash
npm install @agl/web-sdk socket.io-client
```

### 2. 基础集成

```typescript
import { AGLClient } from '@agl/web-sdk';
import { io } from 'socket.io-client';

// 创建客户端
const client = new AGLClient({
  apiUrl: 'http://localhost:3000',
  socketUrl: 'http://localhost:3000'
});

// 连接WebSocket
const socket = io('http://localhost:3000');

// 监听伴侣动作
socket.on('companion_action', (action) => {
  console.log('Emotion:', action.emotion);
  console.log('Dialogue:', action.dialogue);

  // 更新UI
  updateDialogue(action.dialogue);
  playAnimation(action.action);
});

// 发送游戏事件
async function onPlayerWin() {
  socket.emit('game_event', {
    playerId: 'player_123',
    eventType: 'player.victory',
    data: { killCount: 15 },
    context: {}
  });
}
```

### 3. 使用Avatar SDK渲染3D伴侣

```tsx
import { AvatarController } from '@agl/avatar';
import { useState, useEffect } from 'react';

function Companion() {
  const [emotion, setEmotion] = useState('neutral');
  const [dialogue, setDialogue] = useState('');

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('companion_action', (action) => {
      setEmotion(action.emotion);
      setDialogue(action.dialogue);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <AvatarController
      config={{
        customization: {
          modelSource: { type: 'gltf', url: '/models/companion.gltf' }
        },
        initialEmotion: emotion
      }}
      dialogueText={dialogue}
      bubbleConfig={{
        enabled: true,
        position: 'top',
        maxWidth: 300
      }}
    />
  );
}
```

---

## 🗄️ 数据库管理

### 查看数据库

```bash
# 安装SQLite浏览器
npm install -g sqlite3

# 打开数据库
sqlite3 services/monolith/agl.db

# 查看表
.tables

# 查询数据
SELECT * FROM players;
SELECT * FROM memories ORDER BY created_at DESC LIMIT 10;
```

### 备份数据库

```bash
# 备份
cp services/monolith/agl.db services/monolith/agl.db.backup

# 恢复
cp services/monolith/agl.db.backup services/monolith/agl.db
```

---

## 🚢 部署到生产环境

### 方法1：使用Railway（推荐）

1. 访问 https://railway.app
2. 连接GitHub仓库
3. 添加环境变量:
   ```
   MONOLITH_PORT=3000
   ```
4. Railway自动部署！

成本：$5-20/月

### 方法2：VPS部署

```bash
# SSH到服务器
ssh user@your-server.com

# 克隆代码
git clone <repository-url>
cd agl

# 安装Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 启动服务
cd services/monolith
npm install
npm run build
npm start

# 使用PM2保持运行
npm install -g pm2
pm2 start dist/server.js --name agl
pm2 save
pm2 startup
```

成本：$5/月（DigitalOcean/Linode）

---

## 🔧 常见问题

### Q: 如何更改端口？

A: 设置环境变量 `MONOLITH_PORT`

```bash
MONOLITH_PORT=8080 npm run dev:monolith
```

### Q: 如何启用LLM对话生成？

A: 在 `.env` 文件中添加API密钥：

```bash
ANTHROPIC_API_KEY=sk-ant-xxx
```

LLM会在10%的情况下使用（特殊场景）。

### Q: 数据库文件在哪里？

A: `services/monolith/agl.db`

### Q: 如何重置数据库？

A: 删除 `agl.db` 文件，重启服务会自动创建新数据库。

```bash
rm services/monolith/agl.db
npm run dev:monolith
```

### Q: 支持多少并发用户？

A: 单进程可支持1000+并发连接。如需更多，请使用完整K8s版本。

### Q: 如何添加向量搜索？

A: 使用 `sqlite-vss` 扩展，详见完整文档。

---

## 📊 性能对比

| 指标 | Monolith版本 | 完整K8s版本 |
|------|-------------|------------|
| 启动时间 | 1分钟 | 30分钟+ |
| 响应延迟 | 10-50ms | 10-50ms |
| 并发能力 | 1K用户 | 100K+用户 |
| 月度成本 | $5 | $200 |
| 部署难度 | ⭐ | ⭐⭐⭐⭐⭐ |
| 水平扩展 | ❌ | ✅ |
| 向量搜索 | 可选 | ✅ |

---

## 🎓 下一步

1. **添加更多游戏事件** - 扩展情绪规则引擎
2. **自定义对话模板** - 编辑 `dialogue-generator.ts`
3. **集成Avatar SDK** - 3D虚拟形象渲染
4. **添加Vision SDK** - AI画面分析
5. **生产部署** - Railway或VPS

---

## 📚 更多资源

- [完整API文档](./docs/api/README.md)
- [Unity SDK指南](./sdk/unity/README.md)
- [Avatar SDK指南](./sdk/avatar/README.md)
- [Vision SDK指南](./sdk/vision/README.md)
- [简化部署指南](./docs/simplified-deployment.md)

---

**开始构建你的AI游戏伴侣吧！** 🎮🤖
