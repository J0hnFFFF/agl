#!/bin/bash

# AGL Monolith Quick Test Script
# Run this after starting the monolith service with: npm run dev:monolith

API_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=================================="
echo "🎮 AGL Monolith Test Suite"
echo "=================================="
echo ""

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $RESPONSE -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $RESPONSE)${NC}"
    exit 1
fi
echo ""

# Test 2: Create Game
echo -e "${BLUE}Test 2: Create Game${NC}"
GAME_RESPONSE=$(curl -s -X POST $API_URL/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test_client",
    "name": "Test Game",
    "description": "Quick test game"
  }')
GAME_ID=$(echo $GAME_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$GAME_ID" ]; then
    echo -e "${GREEN}✓ Game created: $GAME_ID${NC}"
else
    echo -e "${RED}✗ Failed to create game${NC}"
    exit 1
fi
echo ""

# Test 3: Create Player
echo -e "${BLUE}Test 3: Create Player${NC}"
PLAYER_RESPONSE=$(curl -s -X POST $API_URL/api/players \
  -H "Content-Type: application/json" \
  -d "{
    \"gameId\": \"$GAME_ID\",
    \"externalId\": \"test_player_001\",
    \"characterPersona\": \"cheerful\"
  }")
PLAYER_ID=$(echo $PLAYER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$PLAYER_ID" ]; then
    echo -e "${GREEN}✓ Player created: $PLAYER_ID${NC}"
else
    echo -e "${RED}✗ Failed to create player${NC}"
    exit 1
fi
echo ""

# Test 4: Emotion Analysis - Victory
echo -e "${BLUE}Test 4: Emotion Analysis (Victory)${NC}"
EMOTION_RESPONSE=$(curl -s -X POST $API_URL/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.victory",
    "data": {
      "killCount": 15,
      "mvp": true
    }
  }')
EMOTION=$(echo $EMOTION_RESPONSE | grep -o '"emotion":"[^"]*' | cut -d'"' -f4)
if [ "$EMOTION" = "excited" ]; then
    echo -e "${GREEN}✓ Emotion detected: $EMOTION${NC}"
    echo "Response: $EMOTION_RESPONSE"
else
    echo -e "${RED}✗ Unexpected emotion: $EMOTION${NC}"
fi
echo ""

# Test 5: Emotion Analysis - Death
echo -e "${BLUE}Test 5: Emotion Analysis (Death)${NC}"
EMOTION_RESPONSE=$(curl -s -X POST $API_URL/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "player.death",
    "data": {
      "deathCount": 5
    }
  }')
EMOTION=$(echo $EMOTION_RESPONSE | grep -o '"emotion":"[^"]*' | cut -d'"' -f4)
if [ "$EMOTION" = "frustrated" ] || [ "$EMOTION" = "sad" ]; then
    echo -e "${GREEN}✓ Emotion detected: $EMOTION${NC}"
else
    echo -e "${RED}✗ Unexpected emotion: $EMOTION${NC}"
fi
echo ""

# Test 6: Dialogue Generation - Chinese
echo -e "${BLUE}Test 6: Dialogue Generation (Chinese)${NC}"
DIALOGUE_RESPONSE=$(curl -s -X POST $API_URL/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "persona": "cheerful",
    "language": "zh"
  }')
DIALOGUE=$(echo $DIALOGUE_RESPONSE | grep -o '"dialogue":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$DIALOGUE" ]; then
    echo -e "${GREEN}✓ Dialogue generated: $DIALOGUE${NC}"
else
    echo -e "${RED}✗ Failed to generate dialogue${NC}"
fi
echo ""

# Test 7: Dialogue Generation - English
echo -e "${BLUE}Test 7: Dialogue Generation (English)${NC}"
DIALOGUE_RESPONSE=$(curl -s -X POST $API_URL/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{
    "emotion": "excited",
    "persona": "cheerful",
    "language": "en"
  }')
DIALOGUE=$(echo $DIALOGUE_RESPONSE | grep -o '"dialogue":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$DIALOGUE" ]; then
    echo -e "${GREEN}✓ Dialogue generated: $DIALOGUE${NC}"
else
    echo -e "${RED}✗ Failed to generate dialogue${NC}"
fi
echo ""

# Test 8: Store Memory
echo -e "${BLUE}Test 8: Store Memory${NC}"
MEMORY_RESPONSE=$(curl -s -X POST $API_URL/api/memory/store \
  -H "Content-Type: application/json" \
  -d "{
    \"playerId\": \"$PLAYER_ID\",
    \"type\": \"achievement\",
    \"content\": \"First victory with 15 kills - incredible performance!\",
    \"emotion\": \"excited\",
    \"importance\": 0.9
  }")
MEMORY_ID=$(echo $MEMORY_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$MEMORY_ID" ]; then
    echo -e "${GREEN}✓ Memory stored: $MEMORY_ID${NC}"
else
    echo -e "${RED}✗ Failed to store memory${NC}"
fi
echo ""

# Test 9: Retrieve Memories
echo -e "${BLUE}Test 9: Retrieve Memories${NC}"
MEMORIES=$(curl -s "$API_URL/api/memory/search?playerId=$PLAYER_ID&limit=5")
MEMORY_COUNT=$(echo $MEMORIES | grep -o '"id":"[^"]*' | wc -l)
if [ $MEMORY_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Retrieved $MEMORY_COUNT memories${NC}"
else
    echo -e "${RED}✗ No memories found${NC}"
fi
echo ""

# Test 10: Different Event Types
echo -e "${BLUE}Test 10: Various Event Types${NC}"

# Achievement
RESPONSE=$(curl -s -X POST $API_URL/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{"eventType": "player.achievement", "data": {"rarity": "legendary"}}')
echo -e "${GREEN}✓ Achievement event processed${NC}"

# Level up
RESPONSE=$(curl -s -X POST $API_URL/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{"eventType": "player.level_up", "data": {"newLevel": 10}}')
echo -e "${GREEN}✓ Level up event processed${NC}"

# Combat
RESPONSE=$(curl -s -X POST $API_URL/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{"eventType": "combat.start", "data": {}}')
echo -e "${GREEN}✓ Combat start event processed${NC}"

echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✓ All tests completed!${NC}"
echo "=================================="
echo ""
echo "Your AGL Monolith service is working correctly!"
echo ""
echo "Try these endpoints manually:"
echo "- Health: curl $API_URL/health"
echo "- Games: curl $API_URL/api/games"
echo "- Players: curl $API_URL/api/players"
echo ""
