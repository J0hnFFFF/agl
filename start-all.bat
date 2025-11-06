@echo off
REM AGL - One-Click Startup Script (Windows)

echo.
echo 🚀 AGL - One-Click Startup
echo ============================
echo.

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo ✅ Created .env file. Please edit it with your API keys:
        echo    - ANTHROPIC_API_KEY (required^)
        echo    - OPENAI_API_KEY (required for voice ^& vision^)
        echo.
        pause
    ) else (
        echo ❌ .env.example not found. Please create .env manually.
        exit /b 1
    )
)

echo 📋 Startup Options:
echo 1. Infrastructure only (PostgreSQL, Redis, Qdrant^)
echo 2. Infrastructure + Manual services (Recommended^)
echo 3. Monolith mode (Easiest - No Docker required^)
echo.
set /p option="Choose option (1/2/3): "

if "%option%"=="1" (
    echo.
    echo 🔧 Starting infrastructure services...
    docker-compose up -d postgres redis qdrant
    echo.
    echo ✅ Infrastructure started!
    echo.
    echo 📍 Services available:
    echo    - PostgreSQL: localhost:5432
    echo    - Redis: localhost:6379
    echo    - Qdrant: localhost:6333
    echo.
    echo 💡 Next steps: Start microservices with npm commands

) else if "%option%"=="2" (
    echo.
    echo 🔧 Starting infrastructure...
    docker-compose up -d postgres redis qdrant
    echo.
    echo ✅ Infrastructure started!
    echo.
    echo 💡 Now start services in separate terminals:
    echo    npm run dev:api
    echo    npm run dev:realtime
    echo    npm run dev:memory
    echo    npm run dev:emotion
    echo    npm run dev:dialogue
    echo    npm run dev:voice
    echo    npm run dev:stt
    echo    npm run dev:voice-dialogue
    echo    npm run dev:lipsync
    echo    npm run dev:vision
    echo    npm run dev:dashboard

) else if "%option%"=="3" (
    echo.
    echo 🚀 Starting Monolith mode...
    echo    All-in-one mode, no Docker required!
    echo.
    npm run dev:monolith

) else (
    echo ❌ Invalid option
    exit /b 1
)

echo.
echo ✨ Done!
pause
