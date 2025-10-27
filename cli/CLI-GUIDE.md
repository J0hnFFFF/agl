# AGL CLI Tool Guide

Complete guide for the AGL Command Line Interface - developer tools for building AI game companions.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [agl init](#agl-init)
  - [agl dev](#agl-dev)
  - [agl deploy](#agl-deploy)
  - [agl config](#agl-config)
  - [agl status](#agl-status)
- [Configuration](#configuration)
- [Project Templates](#project-templates)
- [Workflows](#workflows)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

---

## Installation

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn**
- **Git** (recommended)
- **Docker** (optional, for containerized development)

### Install Globally

```bash
npm install -g @agl/cli
```

### Install as Dev Dependency

```bash
npm install --save-dev @agl/cli
```

### Verify Installation

```bash
agl --version
agl --help
```

---

## Quick Start

### 1. Initialize a New Project

```bash
agl init my-game --template web
cd my-game
```

### 2. Configure API Credentials

```bash
agl config --set apiKey=your-api-key-here
```

### 3. Start Development Environment

```bash
agl dev --services all
```

### 4. Check Service Status

```bash
agl status
```

### 5. Deploy to Staging

```bash
agl deploy --env staging --services all
```

---

## Commands

### `agl init`

Initialize a new AGL project with template scaffolding.

#### Syntax

```bash
agl init [project-name] [options]
```

#### Arguments

- `[project-name]` - Name of the project (prompted if not provided)

#### Options

- `-t, --template <template>` - Project template (default: `web`)
  - `web` - TypeScript + Vite web project
  - `unity` - Unity C# project
  - `unreal` - Unreal C++ project
- `-p, --path <path>` - Custom project directory path
- `--skip-install` - Skip dependency installation
- `--skip-git` - Skip git repository initialization

#### Examples

##### Create Web Project

```bash
agl init my-web-game --template web
```

This creates:
```
my-web-game/
├── package.json
├── tsconfig.json
├── index.html
├── src/
│   └── main.ts
├── .gitignore
├── .agl.yml
└── README.md
```

##### Create Unity Project

```bash
agl init my-unity-game --template unity
```

This creates:
```
my-unity-game/
├── Assets/
│   └── Scripts/
│       └── AGLManager.cs
├── .agl.yml
├── .gitignore
└── README.md
```

##### Create Unreal Project

```bash
agl init my-unreal-game --template unreal
```

This creates:
```
my-unreal-game/
├── Source/
│   └── my-unreal-game/
│       ├── AGLManager.h
│       └── AGLManager.cpp
├── .agl.yml
├── .gitignore
└── README.md
```

##### Custom Path

```bash
agl init game-project --path /custom/location --skip-git
```

#### Interactive Mode

If project name is omitted, CLI prompts for input:

```bash
agl init

? Project name: my-awesome-game
? Select template: (Use arrow keys)
❯ web - TypeScript + Vite
  unity - Unity C#
  unreal - Unreal C++
```

#### What Gets Created

**All Templates:**
- `.agl.yml` - AGL configuration file
- `.gitignore` - Git ignore rules
- `README.md` - Project documentation

**Web Template:**
- `package.json` - npm dependencies (@agl/web-sdk)
- `tsconfig.json` - TypeScript configuration
- `index.html` - HTML entry point
- `src/main.ts` - Example AGL client usage
- Configured with Vite for HMR

**Unity Template:**
- `Assets/Scripts/AGLManager.cs` - Unity MonoBehaviour
- Example emotion analysis and dialogue generation
- Ready to attach to GameObject

**Unreal Template:**
- `Source/[ProjectName]/AGLManager.h` - Actor header
- `Source/[ProjectName]/AGLManager.cpp` - Actor implementation
- Blueprint-callable functions

---

### `agl dev`

Start local development environment with AGL services.

#### Syntax

```bash
agl dev [options]
```

#### Options

- `-s, --services <services>` - Services to start (default: `all`)
  - `all` - All services (API, Emotion, Dialogue, Memory, DB, Redis, Qdrant)
  - `api` - API service only
  - `emotion` - Emotion analysis service
  - `dialogue` - Dialogue generation service
  - `memory` - Memory/RAG service
  - Comma-separated: `api,emotion,dialogue`
- `-p, --port <port>` - API service port (default: `3000`)
- `--docker` - Use Docker Compose

#### Examples

##### Start All Services (Native)

```bash
agl dev
```

Output:
```
    █████╗  ██████╗ ██╗
   ██╔══██╗██╔════╝ ██║
   AI Game Companion Engine

✔ Environment check passed
✔ API service started
✔ Emotion service started
✔ Dialogue service started
✔ Memory service started

┌─────────────────────────────────────────┐
│ ✨ Ready                                 │
├─────────────────────────────────────────┤
│ Development environment is running! 🚀  │
│                                          │
│ API Service: http://localhost:3000      │
│ Metrics: http://localhost:3000/api/v1/metrics/health │
│                                          │
│ Press Ctrl+C to stop all services       │
└─────────────────────────────────────────┘
```

##### Start Specific Services

```bash
agl dev --services api,emotion --port 8080
```

##### Start with Docker

```bash
agl dev --docker
```

This:
1. Checks for `docker-compose.yml`
2. Creates default configuration if missing
3. Runs `docker-compose up -d`
4. Shows service status

#### Service URLs

| Service | Default URL | Health Check |
|---------|------------|--------------|
| API Service | http://localhost:3000 | /api/v1/metrics/health |
| Emotion Service | http://localhost:8000 | /health |
| Dialogue Service | http://localhost:8001 | /health |
| Memory Service | http://localhost:3002 | /health |
| PostgreSQL | localhost:5432 | - |
| Redis | localhost:6379 | - |
| Qdrant | localhost:6333 | - |

#### Environment Checks

**Non-Docker Mode:**
- ✅ Node.js installed
- ✅ Python installed (for emotion/dialogue services)
- ⚠️  PostgreSQL installed (warning if missing)

**Docker Mode:**
- ✅ Docker installed and running
- ✅ Docker Compose available

#### Graceful Shutdown

Press `Ctrl+C` to stop all services:

```
^C
Received SIGINT, shutting down gracefully...
✔ All services stopped
```

#### Auto-Generated docker-compose.yml

If using `--docker` without existing `docker-compose.yml`, CLI creates:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: agl_user
      POSTGRES_PASSWORD: agl_password_dev
      POSTGRES_DB: agl_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

  api-service:
    build: ./services/api-service
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://agl_user:agl_password_dev@postgres:5432/agl_dev
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
  # ... more services
```

---

### `agl deploy`

Deploy AGL services to different environments.

#### Syntax

```bash
agl deploy [options]
```

#### Options

- `-e, --env <environment>` - Deployment environment (required)
  - `dev` - Development environment
  - `staging` - Staging environment
  - `production` - Production environment
- `-s, --services <services>` - Services to deploy (required)
  - `all` - All services
  - Comma-separated: `api,emotion,dialogue`
- `--skip-build` - Skip build step
- `--skip-tests` - Skip test execution

#### Examples

##### Deploy to Development

```bash
agl deploy --env dev --services all
```

##### Deploy Specific Services to Staging

```bash
agl deploy --env staging --services api,emotion
```

##### Deploy to Production (with Confirmation)

```bash
agl deploy --env production --services all
```

Output:
```
? Are you sure you want to deploy to PRODUCTION? (y/N) y

✔ Running tests...
✔ All tests passed
✔ Building services...
✔ Build completed
✔ Deploying services...
⠸ Deploying api...
⠸ Deploying emotion...
✔ Deployment completed

┌─────────────────────────────────────────┐
│ ✨ Success                               │
├─────────────────────────────────────────┤
│ Services deployed successfully to       │
│ production! 🚀                          │
│                                          │
│ Next steps:                              │
│   1. Verify deployment: agl status --env production │
│   2. Monitor logs                        │
│   3. Run smoke tests                     │
│                                          │
│ Dashboard: https://dashboard.agl.dev/production │
└─────────────────────────────────────────┘
```

##### Quick Deploy (Skip Tests and Build)

```bash
agl deploy --env dev --services api --skip-tests --skip-build
```

#### Deployment Flow

1. **Environment Validation**
   - Check if inside AGL project
   - Load configuration
   - Verify API key (required for production)

2. **Production Confirmation** (if env=production)
   - Prompt user for confirmation
   - Cancel if declined

3. **Test Execution** (unless --skip-tests)
   - Run `npm test`
   - Prompt to continue if tests fail
   - Cancel if user declines

4. **Build** (unless --skip-build)
   - Run `npm run build`
   - Fail deployment if build fails

5. **Service Deployment**
   - Deploy each service sequentially
   - Show progress spinner
   - Update status for each service

6. **Success Message**
   - Show deployment URL
   - Provide next steps
   - Display dashboard link

#### Production Safeguards

- ⚠️  Requires explicit confirmation
- ⚠️  Requires API key in configuration
- ⚠️  Runs tests by default (use --skip-tests to override)
- ⚠️  Runs build by default (use --skip-build to override)

#### Error Handling

**Test Failures:**
```
✗ Tests failed
? Tests failed. Continue anyway? (y/N) n
Deployment cancelled.
```

**Build Failures:**
```
✗ Build failed
Error: Deployment failed
```

**Missing API Key:**
```
✗ API key not configured. Set it in .agl.yml or global config
```

---

### `agl config`

Manage AGL configuration (local and global).

#### Syntax

```bash
agl config [options]
```

#### Options

- `--set <key=value>` - Set configuration value
- `--get <key>` - Get configuration value
- `--list` - List all configuration
- `--global` - Use global configuration (default: local)

#### Examples

##### Set Local Configuration

```bash
agl config --set apiKey=your-api-key-123
agl config --set apiBaseUrl=https://api.agl.dev
```

Output:
```
✔ Configuration updated: apiKey = your-api-key-123
ℹ Scope: local
```

##### Set Global Configuration

```bash
agl config --set apiKey=global-key --global
```

##### Get Configuration Value

```bash
agl config --get apiKey
```

Output:
```
your-api-key-123
```

##### List All Configuration

```bash
agl config --list
```

Output:
```
ℹ Configuration (merged):

┌─────────────────────┬──────────────────────────────────┐
│ Key                 │ Value                            │
├─────────────────────┼──────────────────────────────────┤
│ projectName         │ my-game                          │
│ template            │ web                              │
│ apiKey              │ your-api-key-123                 │
│ apiBaseUrl          │ https://api.agl.dev              │
│ emotionServiceUrl   │ https://emotion.agl.dev          │
│ dialogueServiceUrl  │ https://dialogue.agl.dev         │
│ memoryServiceUrl    │ https://memory.agl.dev           │
└─────────────────────┴──────────────────────────────────┘
```

##### List Global Configuration

```bash
agl config --list --global
```

##### Set Nested Configuration

```bash
agl config --set deployment.region=us-west-2
agl config --set deployment.replicas=3
```

##### Set Configuration with Special Characters

```bash
agl config --set apiUrl="https://api.example.com?key=value&other=data"
agl config --set description="My Awesome Game Project"
```

#### Configuration Scopes

**Local Configuration** (`.agl.yml` in project directory):
- Project-specific settings
- Overrides global configuration
- Not committed to git (in `.gitignore`)
- Used by default

**Global Configuration** (`~/.agl/config.yml`):
- User-wide settings
- Applied to all projects
- Good for API keys, default URLs
- Use `--global` flag

**Merged Configuration**:
```
Global Config + Local Config (local overrides global)
```

#### Configuration Keys

Common configuration keys:

```yaml
# Project Info
projectName: my-game
template: web
createdAt: 2024-01-26T10:00:00Z

# API Credentials
apiKey: your-api-key-here

# Service URLs
apiBaseUrl: https://api.agl.dev
emotionServiceUrl: https://emotion.agl.dev
dialogueServiceUrl: https://dialogue.agl.dev
memoryServiceUrl: https://memory.agl.dev

# Deployment
deployment:
  region: us-west-2
  replicas: 3
  environment: production
```

#### Help Message

```bash
agl config
```

Output:
```
ℹ AGL Configuration Management

ℹ Usage:
ℹ   agl config --set key=value     Set configuration value
ℹ   agl config --get key            Get configuration value
ℹ   agl config --list               List all configuration
ℹ   agl config --global            Use global configuration

ℹ Examples:
ℹ   agl config --set apiKey=your-key
ℹ   agl config --get apiKey
ℹ   agl config --list --global
```

---

### `agl status`

Check health status of all AGL services.

#### Syntax

```bash
agl status [options]
```

#### Options

- `-v, --verbose` - Show detailed health check responses

#### Examples

##### Basic Status Check

```bash
agl status
```

Output:
```
ℹ Checking AGL services status...

⠸ Checking API Service...
✔ API Service: ✓ Online
✔ Emotion Service: ✓ Online
✔ Dialogue Service: ✓ Online
✔ Memory Service: ✓ Online

┌────────────────────┬────────────┬──────────────────────────────┐
│ Service            │ Status     │ URL                          │
├────────────────────┼────────────┼──────────────────────────────┤
│ API Service        │ ✓ Online   │ http://localhost:3000        │
│ Emotion Service    │ ✓ Online   │ http://localhost:8000        │
│ Dialogue Service   │ ✓ Online   │ http://localhost:8001        │
│ Memory Service     │ ✓ Online   │ http://localhost:3002        │
└────────────────────┴────────────┴──────────────────────────────┘

✔ All services are online (4/4)
```

##### Verbose Mode

```bash
agl status --verbose
```

Output:
```
✔ API Service: ✓ Online
{
  "status": "healthy",
  "uptime": 12345,
  "version": "1.0.0",
  "timestamp": "2024-01-26T10:00:00Z"
}
✔ Emotion Service: ✓ Online
{
  "status": "healthy",
  "model_loaded": true
}
...
```

##### Service Offline

```bash
agl status
```

Output:
```
✔ API Service: ✓ Online
✗ Emotion Service: ✗ Offline
✔ Dialogue Service: ✓ Online
✗ Memory Service: ✗ Offline

⚠ Some services are offline (2/4 online)
```

##### Service Unhealthy

```bash
agl status
```

Output:
```
✔ API Service: ✓ Online
✗ Emotion Service: ✗ Unhealthy (503)
✔ Dialogue Service: ✓ Online
✔ Memory Service: ✓ Online

⚠ Some services are offline (3/4 online)
```

#### Health Check Endpoints

| Service | Health Check URL |
|---------|------------------|
| API Service | `{apiBaseUrl}/api/v1/metrics/health` |
| Emotion Service | `{emotionServiceUrl}/health` |
| Dialogue Service | `{dialogueServiceUrl}/health` |
| Memory Service | `{memoryServiceUrl}/health` |

#### Service Status Indicators

- `✓ Online` - Service responding with HTTP 200
- `✗ Offline` - Service not reachable (connection refused/timeout)
- `✗ Unhealthy (XXX)` - Service responding but with non-200 status code

#### Timeout

Each health check has a 5-second timeout. If a service doesn't respond within 5 seconds, it's marked as offline.

#### Configuration URLs

Service URLs are loaded from configuration:
```bash
agl config --set apiBaseUrl=http://localhost:3000
agl config --set emotionServiceUrl=http://localhost:8000
```

Default URLs used if not configured:
- API Service: `http://localhost:3000`
- Emotion Service: `http://localhost:8000`
- Dialogue Service: `http://localhost:8001`
- Memory Service: `http://localhost:3002`

---

## Configuration

### Configuration Files

#### Local Configuration (`.agl.yml`)

Located in project root, not committed to git:

```yaml
projectName: my-game
template: web
createdAt: 2024-01-26T10:00:00Z
apiKey: local-api-key
apiBaseUrl: http://localhost:3000
```

#### Global Configuration (`~/.agl/config.yml`)

Located in user home directory:

```yaml
apiKey: global-api-key
apiBaseUrl: https://api.agl.dev
emotionServiceUrl: https://emotion.agl.dev
dialogueServiceUrl: https://dialogue.agl.dev
memoryServiceUrl: https://memory.agl.dev
```

### Configuration Precedence

```
Local (.agl.yml) > Global (~/.agl/config.yml) > Defaults
```

### Environment Variables

AGL CLI respects environment variables:

```bash
export AGL_API_KEY=your-api-key
export AGL_API_BASE_URL=https://api.agl.dev
```

Priority:
```
Local Config > Environment Variables > Global Config > Defaults
```

### Configuration Validation

CLI validates configuration on load:

```bash
agl config --list
```

Validates:
- ✅ URL formats (`apiBaseUrl`, `emotionServiceUrl`, etc.)
- ✅ Required fields for production deployment
- ⚠️  Warns about missing recommended fields

---

## Project Templates

### Web Template (TypeScript + Vite)

**Best For:** Browser-based games, web applications

**Tech Stack:**
- TypeScript 5.3
- Vite 5.0 (HMR, fast builds)
- @agl/web-sdk

**Project Structure:**
```
my-web-game/
├── package.json
├── tsconfig.json
├── index.html
├── src/
│   └── main.ts          # AGL client initialization
├── .gitignore
├── .agl.yml
└── README.md
```

**Example Code (src/main.ts):**
```typescript
import { AGLClient } from '@agl/web-sdk';

// Initialize AGL Client
const aglClient = new AGLClient({
  apiKey: 'your-api-key-here',
});

// Analyze player emotion
async function analyzeEmotion() {
  const response = await aglClient.emotion.analyze({
    type: 'player.victory',
    data: { mvp: true, winStreak: 5 },
  });

  console.log('Emotion:', response.emotion);
  console.log('Intensity:', response.intensity);
}

// Generate dialogue
async function generateDialogue() {
  const response = await aglClient.dialogue.generate({
    eventType: 'player.victory',
    emotion: 'excited',
    persona: 'cheerful',
    language: 'en',
  });

  console.log('Dialogue:', response.dialogue);
}
```

**Development:**
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

### Unity Template (C#)

**Best For:** Unity games (2D/3D)

**Tech Stack:**
- Unity 2021.3+
- AGL Unity SDK (C#)
- .NET Standard 2.1

**Project Structure:**
```
my-unity-game/
├── Assets/
│   └── Scripts/
│       └── AGLManager.cs    # MonoBehaviour
├── .agl.yml
├── .gitignore
└── README.md
```

**Example Code (AGLManager.cs):**
```csharp
using UnityEngine;
using AGL;

public class AGLManager : MonoBehaviour
{
    private AGLClient client;

    void Start()
    {
        // Initialize AGL Client
        client = new AGLClient(new AGLConfig
        {
            ApiKey = "your-api-key-here",
        });

        Debug.Log("AGL Client initialized!");
    }

    public async void AnalyzeEmotion()
    {
        var response = await client.Emotion.AnalyzeAsync(new EmotionRequest
        {
            Type = EventType.PlayerVictory,
            Data = new { mvp = true, winStreak = 5 }
        });

        Debug.Log($"Emotion: {response.Emotion}");
        Debug.Log($"Intensity: {response.Intensity}");
    }
}
```

**Setup:**
1. Open project in Unity
2. Configure API key in `.agl.yml`
3. Attach `AGLManager` script to GameObject
4. Call methods from your game logic

---

### Unreal Template (C++)

**Best For:** Unreal Engine games

**Tech Stack:**
- Unreal Engine 5.0+
- AGL Unreal SDK (C++)
- Blueprint integration

**Project Structure:**
```
my-unreal-game/
├── Source/
│   └── my-unreal-game/
│       ├── AGLManager.h     # Actor header
│       └── AGLManager.cpp   # Actor implementation
├── .agl.yml
├── .gitignore
└── README.md
```

**Example Code (AGLManager.h):**
```cpp
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "AGL/AGLClient.h"
#include "AGLManager.generated.h"

UCLASS()
class MY_UNREAL_GAME_API AAGLManager : public AActor
{
    GENERATED_BODY()

public:
    AAGLManager();

protected:
    virtual void BeginPlay() override;

private:
    TSharedPtr<UAGLClient> AGLClient;

public:
    UFUNCTION(BlueprintCallable)
    void AnalyzeEmotion();
};
```

**Example Code (AGLManager.cpp):**
```cpp
#include "AGLManager.h"

AAGLManager::AAGLManager()
{
    PrimaryActorTick.bCanEverTick = false;
}

void AAGLManager::BeginPlay()
{
    Super::BeginPlay();

    // Initialize AGL Client
    FAGLConfig Config;
    Config.ApiKey = TEXT("your-api-key-here");

    AGLClient = MakeShared<UAGLClient>(Config);

    UE_LOG(LogTemp, Log, TEXT("AGL Client initialized!"));
}

void AAGLManager::AnalyzeEmotion()
{
    FEmotionRequest Request;
    Request.Type = EEventType::PlayerVictory;

    AGLClient->EmotionService->AnalyzeAsync(Request, [](const FEmotionResponse& Response)
    {
        UE_LOG(LogTemp, Log, TEXT("Emotion: %s"), *Response.Emotion);
    });
}
```

**Setup:**
1. Open project in Unreal Engine
2. Configure API key in `.agl.yml`
3. Add `AGLManager` to your level
4. Call Blueprint functions or C++ methods

---

## Workflows

### Workflow 1: Start New Project

```bash
# 1. Create project
agl init my-game --template web

# 2. Navigate to project
cd my-game

# 3. Set API key
agl config --set apiKey=your-api-key

# 4. Start development
agl dev

# 5. Verify services (in another terminal)
agl status

# 6. Start coding!
```

### Workflow 2: Daily Development

```bash
# Morning: Start services
agl dev --services all

# Check if everything is running
agl status

# Work on your game...

# Evening: Stop services
# Press Ctrl+C in dev terminal
```

### Workflow 3: Deployment Pipeline

```bash
# 1. Run tests locally
npm test

# 2. Deploy to staging
agl deploy --env staging --services all

# 3. Verify staging
agl status  # (with staging URLs in config)

# 4. Deploy to production
agl deploy --env production --services all

# 5. Monitor production
agl status
```

### Workflow 4: Configuration Management

```bash
# Set global defaults (once)
agl config --set apiKey=your-global-key --global
agl config --set apiBaseUrl=https://api.agl.dev --global

# Override for specific project
cd my-special-game
agl config --set apiBaseUrl=https://api-dev.agl.dev

# List merged config
agl config --list
```

### Workflow 5: Multi-Environment Development

```bash
# Development environment
agl config --set apiBaseUrl=http://localhost:3000
agl dev

# Staging environment
agl config --set apiBaseUrl=https://staging-api.agl.dev
agl status

# Production environment
agl config --set apiBaseUrl=https://api.agl.dev
agl status
```

---

## Troubleshooting

### Issue: CLI Command Not Found

**Problem:**
```bash
agl: command not found
```

**Solution:**
```bash
# Reinstall globally
npm install -g @agl/cli

# Or use via npx
npx @agl/cli init my-game

# Or add to PATH (if installed locally)
export PATH="$PATH:./node_modules/.bin"
```

---

### Issue: Not an AGL Project

**Problem:**
```bash
✗ Not an AGL project. Run this command inside an AGL project directory.
```

**Solution:**
```bash
# Check if .agl.yml exists
ls -la .agl.yml

# If missing, initialize project
agl init my-game

# Or create .agl.yml manually
echo "projectName: my-game" > .agl.yml
```

---

### Issue: Services Not Starting

**Problem:**
```bash
✗ Failed to start development environment
Error: Node.js not found
```

**Solution:**
```bash
# Install Node.js
# Visit https://nodejs.org

# Or use nvm
nvm install 16
nvm use 16

# Verify
node --version
```

---

### Issue: Docker Services Not Starting

**Problem:**
```bash
✗ Docker or Docker Compose not found
```

**Solution:**
```bash
# Install Docker Desktop
# Visit https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version

# Start Docker Desktop

# Retry
agl dev --docker
```

---

### Issue: Port Already in Use

**Problem:**
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port
lsof -i :3000     # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>     # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
agl dev --port 8080
```

---

### Issue: API Key Not Configured

**Problem:**
```bash
✗ API key not configured. Set it in .agl.yml or global config
```

**Solution:**
```bash
# Set API key locally
agl config --set apiKey=your-api-key-here

# Or set globally
agl config --set apiKey=your-api-key-here --global

# Verify
agl config --get apiKey
```

---

### Issue: Service Health Check Failed

**Problem:**
```bash
✗ API Service: ✗ Offline
⚠ Some services are offline (0/4 online)
```

**Solution:**
```bash
# 1. Check if services are running
agl dev

# 2. Verify URLs in config
agl config --list

# 3. Test URLs manually
curl http://localhost:3000/api/v1/metrics/health

# 4. Check logs for errors
# (depends on how you started services)

# 5. Restart services
# Ctrl+C in dev terminal, then agl dev
```

---

### Issue: Deployment Failed

**Problem:**
```bash
✗ Build failed
Error: Command failed: npm run build
```

**Solution:**
```bash
# 1. Run build locally to see full error
npm run build

# 2. Fix TypeScript errors

# 3. Verify all dependencies installed
npm install

# 4. Retry deployment
agl deploy --env dev --services all
```

---

### Issue: Production Deployment Blocked

**Problem:**
```bash
✗ API key not configured. Set it in .agl.yml or global config
```

**Solution:**
```bash
# Production requires API key
agl config --set apiKey=production-api-key

# Retry
agl deploy --env production --services all
```

---

### Issue: Configuration Corrupted

**Problem:**
```bash
Error: Failed to parse .agl.yml
```

**Solution:**
```bash
# Backup current config
cp .agl.yml .agl.yml.backup

# Remove invalid characters
# Edit .agl.yml in text editor

# Or reinitialize
rm .agl.yml
agl config --set projectName=my-game
agl config --set template=web
```

---

### Debug Mode

Enable debug mode for detailed logs:

```bash
DEBUG=true agl dev
DEBUG=true agl deploy --env dev --services all
```

---

## Advanced Usage

### Custom Service URLs

```bash
# Development
agl config --set apiBaseUrl=http://localhost:3000
agl config --set emotionServiceUrl=http://localhost:8000

# Production
agl config --set apiBaseUrl=https://api.example.com
agl config --set emotionServiceUrl=https://emotion.example.com
```

### CI/CD Integration

#### GitHub Actions

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'

      - name: Install AGL CLI
        run: npm install -g @agl/cli

      - name: Configure AGL
        run: |
          agl config --set apiKey=${{ secrets.AGL_API_KEY }} --global
          agl config --set apiBaseUrl=https://staging-api.agl.dev

      - name: Deploy to Staging
        run: agl deploy --env staging --services all
```

#### GitLab CI

`.gitlab-ci.yml`:
```yaml
deploy_staging:
  stage: deploy
  image: node:16
  script:
    - npm install -g @agl/cli
    - agl config --set apiKey=$AGL_API_KEY --global
    - agl deploy --env staging --services all
  only:
    - main
```

### Docker Compose Customization

Create custom `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  api-service:
    build: ./custom-api
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/db
      CUSTOM_VAR: value
    volumes:
      - ./data:/app/data

  # Add custom services
  custom-service:
    image: my-custom-service:latest
    ports:
      - "9000:9000"
```

Then run:
```bash
agl dev --docker  # Uses your custom docker-compose.yml
```

### Programmatic Usage

Use AGL CLI programmatically in Node.js:

```javascript
const { execSync } = require('child_process');

// Initialize project
execSync('agl init my-game --template web --skip-git', { stdio: 'inherit' });

// Set configuration
execSync('agl config --set apiKey=key-123', { stdio: 'inherit' });

// Deploy
execSync('agl deploy --env staging --services all --skip-tests', { stdio: 'inherit' });
```

### Custom Templates

Create your own templates:

1. Create template directory:
```
templates/
└── my-custom-template/
    ├── package.json.ejs
    ├── src/
    │   └── index.ts.ejs
    └── README.md.ejs
```

2. Use EJS variables:
```json
{
  "name": "<%= projectName %>",
  "version": "1.0.0"
}
```

3. Load template (future feature):
```bash
agl init my-game --template ./templates/my-custom-template
```

---

## Best Practices

### 1. Configuration Management

✅ **Do:**
- Use global config for API keys
- Use local config for project-specific URLs
- Add `.agl.yml` to `.gitignore`
- Document required config in README

❌ **Don't:**
- Commit `.agl.yml` with API keys to git
- Hard-code API keys in source code
- Share production API keys in staging config

### 2. Development Workflow

✅ **Do:**
- Start all services with `agl dev`
- Check status with `agl status` regularly
- Stop services with Ctrl+C (graceful shutdown)
- Use `--docker` for consistent environments

❌ **Don't:**
- Kill service processes forcefully
- Mix Docker and native services
- Run multiple `agl dev` instances

### 3. Deployment

✅ **Do:**
- Test locally before deploying
- Deploy to staging first
- Use production confirmation for prod deploys
- Monitor services after deployment

❌ **Don't:**
- Skip tests in production
- Deploy without API key configured
- Force push without confirmation

### 4. Project Structure

✅ **Do:**
- Follow template structure
- Use `.agl.yml` for configuration
- Keep README updated
- Version control except `.agl.yml`

❌ **Don't:**
- Modify template structure unnecessarily
- Store credentials in source files
- Commit generated files

---

## Additional Resources

- **AGL Documentation**: https://docs.agl.dev
- **API Reference**: https://docs.agl.dev/api
- **Web SDK**: https://docs.agl.dev/sdk/web
- **Unity SDK**: https://docs.agl.dev/sdk/unity
- **Unreal SDK**: https://docs.agl.dev/sdk/unreal
- **GitHub Issues**: https://github.com/agl/cli/issues
- **Community Discord**: https://discord.gg/agl

---

## Feedback

Found a bug or have a feature request?

1. **GitHub Issues**: https://github.com/agl/cli/issues
2. **Discord**: https://discord.gg/agl
3. **Email**: support@agl.dev

---

## License

Copyright © 2024 AGL Team. All rights reserved.
