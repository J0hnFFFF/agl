# AGL Monolith Service

**All-in-One AGL Service with SQLite**

这是一个简化的单体服务版本，将所有AGL功能整合到一个进程中，使用SQLite作为数据库。

## 特点

✅ **单进程** - 一个命令启动所有服务
✅ **SQLite** - 单文件数据库，无需安装PostgreSQL
✅ **内存缓存** - 替代Redis，零配置
✅ **快速部署** - 5分钟完成部署
✅ **低成本** - $5/月即可运行

## 快速开始

### 1. 安装依赖

```bash
cd services/monolith
npm install
```

### 2. 配置环境变量

```bash
# 创建 .env 文件（可选，LLM功能需要）
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
```

### 3. 启动服务

```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

服务将在 `http://localhost:3000` 启动

## API端点

### 健康检查
```http
GET /health
```

### 情绪分析
```http
POST /api/emotion/analyze
Content-Type: application/json

{
  "eventType": "player.victory",
  "data": {
    "killCount": 15,
    "mvp": true
  },
  "context": {}
}
```

**响应**:
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

### 对话生成
```http
POST /api/dialogue/generate
Content-Type: application/json

{
  "emotion": "excited",
  "context": {},
  "persona": "cheerful",
  "language": "zh"
}
```

**响应**:
```json
{
  "dialogue": "太棒了！你真厉害！",
  "emotion": "excited",
  "source": "template",
  "persona": "cheerful",
  "cached": false
}
```

### 记忆存储
```http
POST /api/memory/store
Content-Type: application/json

{
  "playerId": "player_123",
  "type": "achievement",
  "content": "首次获得15连杀",
  "emotion": "excited",
  "importance": 0.9
}
```

### 记忆搜索
```http
GET /api/memory/search?playerId=player_123&limit=10&minImportance=0.5
```

### 创建游戏
```http
POST /api/games
Content-Type: application/json

{
  "clientId": "client_123",
  "name": "My Awesome Game",
  "description": "An epic MOBA game"
}
```

### 创建玩家
```http
POST /api/players
Content-Type: application/json

{
  "gameId": "game_123",
  "externalId": "player_abc",
  "characterPersona": "cheerful"
}
```

## WebSocket

### 连接

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// 加入玩家房间
socket.emit('join', { playerId: 'player_123' });

// 发送游戏事件
socket.emit('game_event', {
  playerId: 'player_123',
  eventType: 'player.victory',
  data: { killCount: 15 },
  context: {}
});

// 接收伴侣动作
socket.on('companion_action', (action) => {
  console.log('Emotion:', action.emotion);
  console.log('Dialogue:', action.dialogue);
  console.log('Action:', action.action);
});
```

## 数据库

SQLite数据库位于: `agl.db`

### 表结构

- **clients** - 客户端（游戏开发者）
- **games** - 游戏
- **players** - 玩家
- **memories** - 记忆
- **game_events** - 游戏事件

### 备份

```bash
# 备份数据库
cp agl.db agl.db.backup

# 恢复
cp agl.db.backup agl.db
```

## 部署

### 本地开发

```bash
npm run dev
```

### 生产部署（VPS）

```bash
# 构建
npm run build

# 使用PM2运行
npm install -g pm2
pm2 start dist/server.js --name agl-monolith
pm2 save
pm2 startup
```

### Docker部署

```bash
# 构建镜像
docker build -t agl-monolith .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/agl.db:/app/agl.db \
  --name agl \
  agl-monolith
```

## 性能

- **响应时间**: 10-50ms（无LLM）
- **并发**: 支持1000+连接
- **内存占用**: ~100MB
- **数据库**: 单文件，支持TB级数据

## 限制

- **不支持水平扩展** - 单进程设计
- **无向量搜索** - 基础版本不包含语义搜索
- **内存缓存** - 重启后缓存清空

如需以上功能，请使用完整版K8s部署。

## 成本

### VPS部署（推荐）
- **DigitalOcean Droplet**: $4/月（512MB RAM）
- **Linode**: $5/月（1GB RAM）
- **Vultr**: $3.50/月（512MB RAM）

### 总成本
- VPS: $5/月
- Claude API: ~$10/月（可选）
- **总计**: $5-15/月

## 支持

需要帮助？查看完整文档：
- [简化部署指南](../../docs/simplified-deployment.md)
- [API文档](../../docs/api/README.md)

---

**简单、快速、经济的AGL部署方案！**
