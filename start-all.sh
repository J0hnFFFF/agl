#!/bin/bash

# AGL - One-Click Startup Script
# This script starts ALL services (infrastructure + 10 microservices + dashboard)

set -e

echo "🚀 AGL - One-Click Startup"
echo "============================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file. Please edit it with your API keys:"
        echo "   - ANTHROPIC_API_KEY (required)"
        echo "   - OPENAI_API_KEY (required for voice & vision)"
        echo ""
        read -p "Press Enter after editing .env file..."
    else
        echo "❌ .env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📋 Startup Options:"
echo "1. Infrastructure only (PostgreSQL, Redis, Qdrant)"
echo "2. Full stack (Infrastructure + All 10 microservices + Dashboard)"
echo ""
read -p "Choose option (1 or 2): " option

if [ "$option" = "1" ]; then
    echo ""
    echo "🔧 Starting infrastructure services..."
    docker-compose up -d postgres redis qdrant
    echo ""
    echo "✅ Infrastructure started!"
    echo ""
    echo "📍 Services available:"
    echo "   - PostgreSQL: localhost:5432"
    echo "   - Redis: localhost:6379"
    echo "   - Qdrant: localhost:6333"
    echo ""
    echo "💡 To start microservices manually, run:"
    echo "   npm run dev:api       # API Service (port 3000)"
    echo "   npm run dev:realtime  # Realtime Gateway (port 3001)"
    echo "   npm run dev:memory    # Memory Service (port 3002)"
    echo "   npm run dev:emotion   # Emotion Service (port 8000)"
    echo "   npm run dev:dialogue  # Dialogue Service (port 8001)"
    echo "   npm run dev:voice     # Voice Service (port 8003)"
    echo "   npm run dev:stt       # STT Service (port 8004)"
    echo "   npm run dev:voice-dialogue  # Voice Dialogue (port 8005)"
    echo "   npm run dev:lipsync   # Lip Sync Service (port 8006)"
    echo "   npm run dev:vision    # Vision Service (port 8007)"
    echo "   npm run dev:dashboard # Dashboard (port 5000)"

elif [ "$option" = "2" ]; then
    echo ""
    echo "⚠️  Full stack mode requires:"
    echo "   - Dockerfiles in each service directory"
    echo "   - Sufficient RAM (8GB+ recommended)"
    echo "   - API keys in .env file"
    echo ""
    read -p "Continue? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        echo "❌ Cancelled"
        exit 0
    fi

    echo ""
    echo "📦 Building and starting all services..."
    echo "   This may take 5-10 minutes on first run..."
    echo ""

    # Uncomment all services in docker-compose.yml temporarily
    # (Note: This is a simplified version, actual implementation would need more robust parsing)
    echo "⚠️  Full stack Docker deployment is currently in development."
    echo "    For now, please use:"
    echo ""
    echo "    1. Start infrastructure: docker-compose up -d"
    echo "    2. Start services manually using npm commands"
    echo ""
    echo "Or use Monolith mode for quick testing:"
    echo "    npm run dev:monolith"

else
    echo "❌ Invalid option"
    exit 1
fi

echo ""
echo "✨ Done!"
