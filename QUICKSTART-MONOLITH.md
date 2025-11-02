# 🚀 Monolith Mode - Quick Start

**The fastest way to start with AGL - no Docker, no complex setup, just Node.js!**

Perfect for: first-time users, learning, prototyping, and small projects.

---

## 🎯 What is Monolith Mode?

Monolith Mode is a **single-service deployment** that includes all AGL features:

- ✅ **All-in-one**: API, WebSocket, Emotion, Dialogue, and Memory services
- ✅ **Zero config**: SQLite database, in-memory cache
- ✅ **One command**: Start everything with `npm run dev:monolith`
- ✅ **Full features**: All core AGL capabilities included

### Monolith vs Microservices

| Feature | Monolith | Microservices |
|---------|----------|---------------|
| Setup time | 1 minute | 5-10 minutes |
| Dependencies | Node.js only | Node.js, Python, Docker |
| Database | SQLite (file-based) | PostgreSQL + Redis + Qdrant |
| Services | 1 process | 5+ processes |
| Best for | Development, testing | Production, learning architecture |

---

## ⚡ Quick Start

### Prerequisites

- **Node.js 20+** (check with `node --version`)
- That's it!

### Start in 60 Seconds

```bash
# 1. Clone repository
git clone https://github.com/J0hnFFFF/agl.git
cd agl

# 2. Start monolith
npm run dev:monolith
```

**Done!** 🎉

The service will:
1. Auto-install dependencies (first run only)
2. Initialize SQLite database
3. Start on `http://localhost:3000`

---

## 🧪 Test Your Installation

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Emotion Analysis

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

Expected response:
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

### Test Dialogue Generation

```bash
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "persona": "cheerful",
    "language": "en"
  }'
```

Expected response:
```json
{
  "dialogue": "Incredible! You're on fire!",
  "emotion": "excited",
  "source": "template",
  "persona": "cheerful",
  "language": "en"
}
```

### Test Memory Storage

```bash
# Store a memory
curl -X POST http://localhost:3000/api/memory/store \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test_player",
    "type": "achievement",
    "content": "First victory with 15 kills!",
    "emotion": "excited",
    "importance": 0.9
  }'

# Retrieve memories
curl "http://localhost:3000/api/memory/search?playerId=test_player&limit=5"
```

---

## 🎮 Complete Example: Game Integration

### 1. Create a Game

```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "my_game_studio",
    "name": "Battle Arena Pro",
    "description": "An epic battle royale game"
  }'
```

Save the returned `id` (e.g., `game_abc123`)

### 2. Create a Player

```bash
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "game_abc123",
    "externalId": "player_001",
    "characterPersona": "cheerful"
  }'
```

### 3. Send Game Events

```bash
# Player wins a match
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.victory",
    "data": {
      "killCount": 15,
      "mvp": true,
      "matchDuration": 1200
    }
  }'

# Player dies
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.death",
    "data": {
      "deathCount": 3,
      "killedBy": "enemy_sniper"
    }
  }'

# Player achieves milestone
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.achievement",
    "data": {
      "achievementId": "first_blood",
      "rarity": "legendary"
    }
  }'
```

### 4. Generate Context-Aware Dialogue

```bash
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "context": {
      "eventType": "player.victory",
      "killCount": 15,
      "mvp": true
    },
    "persona": "cheerful",
    "language": "en"
  }'
```

---

## 🌐 WebSocket Integration

### Connect and Listen for Events

```javascript
const io = require('socket.io-client');

// Connect to monolith WebSocket
const socket = io('http://localhost:3000');

// Join player room
socket.emit('join', { playerId: 'player_001' });

// Send game event
socket.emit('game_event', {
  playerId: 'player_001',
  eventType: 'player.victory',
  data: {
    killCount: 15,
    mvp: true
  },
  context: {}
});

// Listen for companion reactions
socket.on('companion_action', (action) => {
  console.log('Emotion:', action.emotion);
  console.log('Dialogue:', action.dialogue);
  console.log('Action:', action.action);
});

// Handle errors
socket.on('error', (error) => {
  console.error('Error:', error);
});
```

---

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the `services/monolith` directory (optional):

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database (SQLite is default)
DATABASE_URL=file:./dev.db

# API Keys (optional, for LLM features)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Logging
LOG_LEVEL=info
```

### Custom Port

```bash
# Set custom port
PORT=4000 npm run dev:monolith
```

### Production Build

```bash
# Build for production
cd services/monolith
npm run build

# Start production server
npm start
```

---

## 📊 Development Tools

### View Database (Prisma Studio)

```bash
cd services/monolith
npx prisma studio
```

Opens at `http://localhost:5555` - browse tables, edit data, run queries.

### View Database (SQLite CLI)

```bash
# Install sqlite3 (if not already installed)
# npm install -g sqlite3

# Open database
sqlite3 services/monolith/dev.db

# List tables
.tables

# Query players
SELECT * FROM players;

# Query games
SELECT * FROM games;

# Exit
.quit
```

### Check Logs

```bash
# Run with debug logging
LOG_LEVEL=debug npm run dev:monolith
```

### Monitor Performance

```bash
# Check memory usage
node --expose-gc services/monolith/dist/main.js

# Enable CPU profiling
node --prof services/monolith/dist/main.js
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# Kill process or use different port
PORT=4000 npm run dev:monolith
```

### Database Locked Error

```bash
# Stop all processes using the database
pkill -f "node.*monolith"

# Remove database lock
rm services/monolith/dev.db-*

# Restart
npm run dev:monolith
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
cd services/monolith
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### TypeScript Compilation Errors

```bash
cd services/monolith
npm run build
# Fix any errors shown
```

### Memory Errors

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev:monolith
```

---

## 🎯 Supported Features

### ✅ Fully Supported

- **Emotion Analysis**: Rule-based detection for 25+ event types
- **Dialogue Generation**: Template-based for 14 emotions, 3 personas
- **Memory Management**: SQLite-backed storage with basic search
- **Multi-language**: English, Chinese, Japanese dialogue
- **WebSocket**: Real-time event processing
- **REST API**: Complete HTTP API

### ⚠️ Limited in Monolith Mode

- **ML Emotion Classification**: Requires external API (optional)
- **LLM Dialogue Generation**: Requires Anthropic/OpenAI API (optional)
- **Vector Search**: Basic text search only (no semantic embeddings)
- **Advanced Caching**: In-memory only (Redis not available)

### 💡 Upgrade to Microservices for:

- PostgreSQL + Redis + Qdrant for production-scale data
- ML-powered emotion classification
- Advanced LLM dialogue with memory context
- Horizontal scaling and high availability
- Advanced caching and performance optimization

---

## 📈 Scaling Considerations

### When to Switch to Microservices

Consider migrating when:

- **Users**: >100 concurrent connections
- **Data**: >10,000 players or >100,000 events
- **Features**: Need ML classification or semantic memory
- **Deployment**: Moving to production
- **Team**: Multiple developers working on different services

### Migration Path

```bash
# 1. Export data from SQLite
cd services/monolith
npx prisma db pull
npx prisma db push

# 2. Start microservices stack
cd ../..
npm run dev:stack

# 3. Configure PostgreSQL
# Edit .env:
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://...

# 4. Migrate data
npm run db:migrate

# 5. Start individual services
npm run dev:api
npm run dev:realtime
npm run dev:emotion
npm run dev:dialogue
npm run dev:memory
```

---

## 🎨 SDK Integration Examples

### Unity

```csharp
using AGL;

var client = new AGLClient(new AGLConfig
{
    ApiUrl = "http://localhost:3000"
});

await client.SendGameEvent("player.victory", new
{
    killCount = 15,
    mvp = true
});
```

📖 [Full Unity Guide](./sdk/unity/README.md)

### Web / JavaScript

```javascript
import { AGLClient } from '@agl/web';

const client = new AGLClient({
  apiUrl: 'http://localhost:3000'
});

const result = await client.sendGameEvent('player.victory', {
  killCount: 15,
  mvp: true
});

console.log(result.emotion);
console.log(result.dialogue);
```

📖 [Full Web Guide](./sdk/web/README.md)

### Unreal Engine

```cpp
UAGLClient* Client = NewObject<UAGLClient>();

FAGLConfig Config;
Config.ApiUrl = TEXT("http://localhost:3000");
Client->Initialize(Config);

FAGLGameEvent Event;
Event.EventType = TEXT("player.victory");
Client->SendGameEvent(Event, Callback);
```

📖 [Full Unreal Guide](./sdk/unreal/README.md)

---

## 🔄 Deployment Options

### Option 1: Deploy Monolith to VPS

```bash
# Build for production
cd services/monolith
npm run build

# Copy to server
scp -r dist package.json user@server:/opt/agl

# On server
cd /opt/agl
npm install --production
npm start
```

### Option 2: Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY services/monolith/package*.json ./
RUN npm ci --production
COPY services/monolith/dist ./dist
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t agl-monolith .
docker run -p 3000:3000 -v $(pwd)/data:/app/data agl-monolith
```

### Option 3: Cloud Platforms

**Railway:**
```bash
railway init
railway up
```

**Render:**
```bash
# Connect GitHub repo
# Set build command: cd services/monolith && npm install && npm run build
# Set start command: cd services/monolith && npm start
```

**Heroku:**
```bash
heroku create agl-monolith
git push heroku main
```

---

## 📚 Next Steps

### Learn More
- [Main README](./README.md) - Project overview
- [Full Quick Start](./QUICKSTART.md) - Microservices setup
- [Architecture Guide](./CLAUDE.md) - Technical deep dive
- [API Documentation](./docs/api/README.md) - Complete API reference

### Advanced Features
- [3D Avatar SDK](./sdk/avatar/README.md) - Add visual companions
- [Vision AI SDK](./sdk/vision/README.md) - Screen analysis
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

### Get Help
- [GitHub Issues](https://github.com/J0hnFFFF/agl/issues)
- [Discussions](https://github.com/J0hnFFFF/agl/discussions)
- [Documentation](./docs)

---

**You're all set! Start building with AGL Monolith Mode! 🎮✨**
