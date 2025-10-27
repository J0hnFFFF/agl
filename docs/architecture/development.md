# Development Guide

## Getting Started

This guide will help you set up a local development environment and understand the development workflow for the AGL project.

## Prerequisites

### Required Software

- **Node.js**: 20.x LTS or higher
- **npm**: 10.x or higher
- **Python**: 3.11 or higher
- **Docker**: 20.x or higher
- **Docker Compose**: 2.x or higher
- **Git**: 2.x or higher

### Recommended Tools

- **VS Code**: With recommended extensions (see below)
- **Postman** or **Insomnia**: For API testing
- **pgAdmin** or **DBeaver**: For database management
- **Redis Commander**: Installed via Docker Compose

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker",
    "humao.rest-client"
  ]
}
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/agl.git
cd agl
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

**Required Environment Variables**:

```bash
# Database
DATABASE_URL=postgresql://agl_user:agl_password_dev@localhost:5432/agl_dev

# Redis
REDIS_URL=redis://localhost:6379

# Qdrant
QDRANT_URL=http://localhost:6333

# JWT Secret (generate a random string)
JWT_SECRET=your-secret-key-change-in-production

# LLM API Keys
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-key  # Optional

# Service Ports
API_SERVICE_PORT=3000
REALTIME_GATEWAY_PORT=3001
EMOTION_SERVICE_PORT=8000
DIALOGUE_SERVICE_PORT=8001

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

### 3. Start Infrastructure

```bash
# Start databases and services
npm run dev:stack

# Wait for services to be healthy (check with):
docker-compose ps
```

**Services Running**:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Qdrant: `localhost:6333`
- pgAdmin: `http://localhost:5050`
- Redis Commander: `http://localhost:8081`

### 4. Install Dependencies

```bash
# Install Node.js dependencies
npm run setup

# This will install dependencies for:
# - Root project
# - API Service
# - Realtime Gateway
# - Memory Service
# - Web SDK

# Install Python dependencies
cd services/emotion-service
pip install -r requirements.txt

cd ../dialogue-service
pip install -r requirements.txt

cd ../..
```

### 5. Database Setup

```bash
# Navigate to API service
cd services/api-service

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed

cd ../..
```

### 6. Start Services

Open **4 separate terminals**:

**Terminal 1 - API Service**:
```bash
npm run dev:api
# Running on http://localhost:3000
```

**Terminal 2 - Realtime Gateway**:
```bash
npm run dev:realtime
# Running on ws://localhost:3001
```

**Terminal 3 - Emotion Service**:
```bash
npm run dev:emotion
# Running on http://localhost:8000
```

**Terminal 4 - Dialogue Service**:
```bash
npm run dev:dialogue
# Running on http://localhost:8001
```

### 7. Verify Setup

Test all services are running:

```bash
# API Service
curl http://localhost:3000/api/v1/health

# Emotion Service
curl http://localhost:8000/health

# Dialogue Service
curl http://localhost:8001/health
```

---

## Project Structure

```
agl/
├── services/
│   ├── api-service/          # NestJS REST API
│   │   ├── src/
│   │   │   ├── auth/         # Authentication module
│   │   │   ├── game/         # Game management
│   │   │   ├── character/    # Character personas
│   │   │   ├── prisma/       # Database service
│   │   │   └── common/       # Shared utilities
│   │   ├── prisma/
│   │   │   └── schema.prisma # Database schema
│   │   ├── test/             # Tests
│   │   └── package.json
│   │
│   ├── realtime-gateway/     # Socket.IO service
│   │   ├── src/
│   │   │   └── index.ts      # Main server
│   │   └── package.json
│   │
│   ├── emotion-service/      # Python emotion detection
│   │   ├── app/
│   │   │   ├── models/       # ML models
│   │   │   └── rules/        # Rule engine
│   │   ├── main.py           # FastAPI app
│   │   └── requirements.txt
│   │
│   ├── dialogue-service/     # Python dialogue generation
│   │   ├── app/
│   │   │   ├── generators/   # LLM + Template
│   │   │   └── templates/    # Dialogue templates
│   │   ├── main.py           # FastAPI app
│   │   └── requirements.txt
│   │
│   └── memory-service/       # Node.js memory management
│       └── src/
│
├── sdk/                      # Client SDKs
│   ├── unity/               # Unity C# SDK
│   ├── unreal/              # Unreal C++ SDK
│   └── web/                 # Web TypeScript SDK
│
├── infrastructure/           # Deployment configs
│   ├── k8s/                 # Kubernetes manifests
│   ├── docker/              # Dockerfiles
│   └── terraform/           # IaC (optional)
│
├── docs/                    # Documentation
│   ├── api/                 # API docs
│   ├── sdk/                 # SDK guides
│   └── architecture/        # Architecture docs
│
├── examples/                # Example projects
│   └── demo-game/          # Demo Unity game
│
├── scripts/                 # Utility scripts
│   ├── deploy-staging.sh
│   └── deploy-prod.sh
│
├── .env.example            # Environment template
├── docker-compose.yml      # Local development stack
├── package.json            # Root package.json (workspaces)
├── CLAUDE.md               # Technical guide for AI
└── README.md               # Project overview
```

---

## Development Workflow

### Making Changes

#### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/your-bug-name
```

#### 2. Make Changes

Edit files in your editor. The dev servers will auto-reload:

- **API Service**: Uses `nest start --watch`
- **Realtime Gateway**: Uses `ts-node-dev`
- **Python Services**: Uses `uvicorn --reload`

#### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific service tests
npm run test:api
npm run test:realtime

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:cov
```

#### 4. Lint and Format

```bash
# Lint all code
npm run lint

# Format code
npm run format
```

#### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add emotion progression feature"

# Follow conventional commits format:
# feat: new feature
# fix: bug fix
# docs: documentation changes
# refactor: code refactoring
# test: adding tests
# chore: maintenance tasks
```

#### 6. Push and Create PR

```bash
# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
# Fill in PR template with:
# - Description of changes
# - Related issues
# - Testing done
# - Screenshots (if UI changes)
```

---

## Database Development

### Working with Prisma

#### Create New Migration

```bash
cd services/api-service

# Make changes to prisma/schema.prisma
nano prisma/schema.prisma

# Create migration
npx prisma migrate dev --name add_new_field

# This will:
# 1. Generate SQL migration file
# 2. Apply migration to database
# 3. Regenerate Prisma client
```

#### Prisma Studio (Database GUI)

```bash
cd services/api-service
npx prisma studio

# Opens at http://localhost:5555
# Browse and edit database records
```

#### Reset Database

```bash
cd services/api-service

# WARNING: This deletes all data
npx prisma migrate reset

# Confirm with 'y'
```

#### Seed Database

```bash
cd services/api-service

# Edit prisma/seed.ts
nano prisma/seed.ts

# Run seed
npx prisma db seed
```

**Example Seed File**:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test client
  const client = await prisma.client.create({
    data: {
      name: 'Test Studio',
      email: 'test@example.com',
      apiKey: 'agl_test_key_123',
      tier: 'FREE',
      quotaPerMonth: 10000,
    },
  });

  console.log('Created test client:', client);

  // Create test game
  const game = await prisma.game.create({
    data: {
      clientId: client.id,
      name: 'Test Game',
      description: 'A test MOBA game',
    },
  });

  console.log('Created test game:', game);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Adding New Features

### Example: Adding New Event Type

#### 1. Update Database Schema (if needed)

```prisma
// services/api-service/prisma/schema.prisma

model GameEvent {
  // ... existing fields

  // Add new field for custom event data
  metadata  Json?   @default("{}")
}
```

Run migration:
```bash
cd services/api-service
npx prisma migrate dev --name add_event_metadata
```

#### 2. Update Emotion Service

```python
# services/emotion-service/app/rules.py

def evaluate_event(event):
    event_type = event.get("type")

    # Add new event type
    if event_type == "player.new_event_type":
        return {
            "emotion": "curious",
            "intensity": 0.6,
            "confidence": 0.85
        }

    # ... existing rules
```

#### 3. Update Dialogue Service

```python
# services/dialogue-service/app/templates.py

TEMPLATES = {
    # Add new templates
    ("player.new_event_type", "curious", "cheerful"): [
        "哦？发生了什么有趣的事？",
        "让我看看这是什么~",
    ],
    # ... existing templates
}
```

#### 4. Update SDK

```csharp
// sdk/unity/Runtime/EventTypes.cs

public static class EventTypes
{
    public const string NewEventType = "player.new_event_type";
    // ... existing types
}

// Usage
CompanionEngine.Instance.SendEvent(EventTypes.NewEventType, data);
```

#### 5. Add Tests

```typescript
// services/api-service/src/game/game.service.spec.ts

describe('GameService', () => {
  it('should handle new event type', async () => {
    const result = await service.processEvent({
      type: 'player.new_event_type',
      data: { ... },
    });

    expect(result.emotion).toBe('curious');
  });
});
```

#### 6. Update Documentation

```markdown
// docs/api/events.md

### player.new_event_type

Description: Triggered when...

**Required Data**:
- `field1`: Description
- `field2`: Description

**Example**:
\`\`\`json
{
  "type": "player.new_event_type",
  "data": {
    "field1": "value",
    "field2": 123
  }
}
\`\`\`
```

---

## Testing

### Unit Tests

```bash
# API Service (Jest)
cd services/api-service
npm test

# Individual test file
npm test -- game.service.spec.ts

# Watch mode
npm test -- --watch
```

### Integration Tests

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration

# Stop test database
docker-compose -f docker-compose.test.yml down
```

### E2E Tests

```bash
# Start all services
npm run dev:stack
npm run dev:api &
npm run dev:realtime &

# Run E2E tests
npm run test:e2e
```

### Load Testing

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io/

# Run load test
k6 run scripts/load-test.js

# With custom parameters
k6 run --vus 100 --duration 30s scripts/load-test.js
```

**Example Load Test Script**:

```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,  // 50 virtual users
  duration: '60s',
};

export default function () {
  const apiKey = 'agl_test_key';
  const url = 'http://localhost:3000/api/v1/games';

  const res = http.get(url, {
    headers: {
      'X-API-Key': apiKey,
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

---

## Debugging

### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Service",
      "cwd": "${workspaceFolder}/services/api-service",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "port": 9229
    },
    {
      "type": "python",
      "request": "launch",
      "name": "Debug Emotion Service",
      "program": "${workspaceFolder}/services/emotion-service/main.py",
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/services/emotion-service"
    }
  ]
}
```

### Logging

**API Service** (NestJS):
```typescript
import { Logger } from '@nestjs/common';

export class GameService {
  private readonly logger = new Logger(GameService.name);

  async processEvent(event: GameEvent) {
    this.logger.log(`Processing event: ${event.type}`);
    this.logger.debug('Event data:', event.data);

    try {
      // ... processing
      this.logger.log('Event processed successfully');
    } catch (error) {
      this.logger.error('Failed to process event', error.stack);
      throw error;
    }
  }
}
```

**Python Services** (FastAPI):
```python
import logging

logger = logging.getLogger(__name__)

@app.post("/analyze")
async def analyze_emotion(event: dict):
    logger.info(f"Analyzing event: {event.get('type')}")
    logger.debug(f"Event data: {event}")

    try:
        result = process_emotion(event)
        logger.info(f"Emotion detected: {result['emotion']}")
        return result
    except Exception as e:
        logger.error(f"Error analyzing emotion: {e}", exc_info=True)
        raise
```

### Database Queries

Monitor SQL queries with Prisma:

```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// This will log all SQL queries to console
```

### Redis Debugging

```bash
# Connect to Redis CLI
docker exec -it agl-redis redis-cli

# Monitor commands
MONITOR

# View keys
KEYS *

# View specific key
GET api_key:agl_test_key

# View Stream entries
XREAD COUNT 10 STREAMS game_events 0
```

---

## Common Issues & Solutions

### Issue: Ports Already in Use

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /F /PID <PID>  # Windows
```

### Issue: Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check connection
psql -h localhost -U agl_user -d agl_dev

# Reset database
cd services/api-service
npx prisma migrate reset
```

### Issue: Redis Connection Failed

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
docker exec -it agl-redis redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose restart redis
```

### Issue: Python Dependencies Not Found

```bash
# Ensure you're using correct Python version
python --version  # Should be 3.11+

# Recreate virtual environment
cd services/emotion-service
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Performance Profiling

### Node.js Profiling

```bash
# Start with profiling
node --prof services/api-service/dist/main.js

# Generate readable report
node --prof-process isolate-0xnnnnnnnnnnnn-v8.log > processed.txt
```

### Python Profiling

```python
# Add profiling to endpoint
from cProfile import Profile
from pstats import Stats

@app.post("/analyze")
async def analyze_emotion(event: dict):
    profiler = Profile()
    profiler.enable()

    result = process_emotion(event)

    profiler.disable()
    stats = Stats(profiler)
    stats.sort_stats('cumtime')
    stats.print_stats(10)  # Top 10 functions

    return result
```

---

## Contributing

### Code Style

- **TypeScript**: Follow [Airbnb Style Guide](https://github.com/airbnb/javascript)
- **Python**: Follow [PEP 8](https://pep8.org/)
- Use Prettier for formatting
- Use ESLint for linting

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples**:
```
feat(emotion): add emotion progression feature
fix(api): resolve CORS issue in production
docs(sdk): update Unity integration guide
refactor(dialogue): optimize template matching
test(api): add integration tests for game endpoints
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Redis Documentation](https://redis.io/docs/)

## Getting Help

- **Documentation**: Check `/docs` folder
- **GitHub Issues**: Open an issue with details
- **Discord**: Join our development Discord
- **Email**: dev-support@agl.com
