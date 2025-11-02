# 🧪 Quick Testing Guide

Fast ways to test your AGL Monolith service.

---

## ⚡ Fastest Way - Use Test Script

### Windows (PowerShell)

```powershell
# Start the service in one terminal
npm run dev:monolith

# Run test script in another terminal
.\scripts\test-monolith.ps1
```

### Windows (CMD)

```cmd
# Start the service in one terminal
npm run dev:monolith

# Run test script in another terminal
scripts\test-monolith.bat
```

### Mac/Linux (Bash)

```bash
# Start the service in one terminal
npm run dev:monolith

# Run test script in another terminal
chmod +x scripts/test-monolith.sh
./scripts/test-monolith.sh
```

---

## 🎯 Manual Testing

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Test Emotion Analysis

**Victory Event:**
```bash
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d "{\"eventType\":\"player.victory\",\"data\":{\"killCount\":15,\"mvp\":true}}"
```

Expected response:
```json
{
  "emotion": "excited",
  "intensity": 0.9,
  "confidence": 0.95,
  "action": "celebrate",
  "method": "rule"
}
```

**Death Event:**
```bash
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d "{\"eventType\":\"player.death\",\"data\":{\"deathCount\":5}}"
```

### 3. Test Dialogue Generation

**Chinese:**
```bash
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d "{\"emotion\":\"excited\",\"persona\":\"cheerful\",\"language\":\"zh\"}"
```

Expected response:
```json
{
  "dialogue": "太棒了！你真厉害！",
  "emotion": "excited",
  "source": "template",
  "persona": "cheerful",
  "language": "zh"
}
```

**English:**
```bash
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d "{\"emotion\":\"excited\",\"persona\":\"cheerful\",\"language\":\"en\"}"
```

**Japanese:**
```bash
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d "{\"emotion\":\"excited\",\"persona\":\"cheerful\",\"language\":\"ja\"}"
```

### 4. Test Game Management

**Create Game:**
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"test_client\",\"name\":\"My Test Game\",\"description\":\"Testing AGL\"}"
```

**Get All Games:**
```bash
curl http://localhost:3000/api/games
```

### 5. Test Player Management

**Create Player:**
```bash
# Use the game ID from previous step
curl -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d "{\"gameId\":\"game_abc123\",\"externalId\":\"player_001\",\"characterPersona\":\"cheerful\"}"
```

**Get All Players:**
```bash
curl http://localhost:3000/api/players
```

### 6. Test Memory System

**Store Memory:**
```bash
# Use the player ID from previous step
curl -X POST http://localhost:3000/api/memory/store \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"player_abc123\",\"type\":\"achievement\",\"content\":\"First victory!\",\"emotion\":\"excited\",\"importance\":0.9}"
```

**Search Memories:**
```bash
curl "http://localhost:3000/api/memory/search?playerId=player_abc123&limit=10"
```

---

## 🎮 Complete Workflow Test

```bash
# 1. Create a game
GAME_RESPONSE=$(curl -s -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test","name":"Test Game","description":"Test"}')

echo "Game created: $GAME_RESPONSE"

# Extract game ID (on Mac/Linux)
GAME_ID=$(echo $GAME_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# 2. Create a player
PLAYER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/players \
  -H "Content-Type: application/json" \
  -d "{\"gameId\":\"$GAME_ID\",\"externalId\":\"player_001\",\"characterPersona\":\"cheerful\"}")

echo "Player created: $PLAYER_RESPONSE"

# Extract player ID
PLAYER_ID=$(echo $PLAYER_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# 3. Simulate game event
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{"eventType":"player.victory","data":{"killCount":15,"mvp":true}}'

# 4. Generate dialogue
curl -X POST http://localhost:3000/api/dialogue/generate \
  -H "Content-Type: application/json" \
  -d '{"emotion":"excited","persona":"cheerful","language":"zh"}'

# 5. Store memory
curl -X POST http://localhost:3000/api/memory/store \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"$PLAYER_ID\",\"type\":\"achievement\",\"content\":\"First 15 kill victory!\",\"emotion\":\"excited\",\"importance\":0.9}"

# 6. Retrieve memories
curl "http://localhost:3000/api/memory/search?playerId=$PLAYER_ID&limit=5"
```

---

## 🧪 Test All Event Types

```bash
# Victory
curl -X POST http://localhost:3000/api/emotion/analyze -H "Content-Type: application/json" \
  -d '{"eventType":"player.victory","data":{"killCount":15}}'

# Death
curl -X POST http://localhost:3000/api/emotion/analyze -H "Content-Type: application/json" \
  -d '{"eventType":"player.death","data":{"deathCount":3}}'

# Achievement
curl -X POST http://localhost:3000/api/emotion/analyze -H "Content-Type: application/json" \
  -d '{"eventType":"player.achievement","data":{"rarity":"legendary"}}'

# Level up
curl -X POST http://localhost:3000/api/emotion/analyze -H "Content-Type: application/json" \
  -d '{"eventType":"player.level_up","data":{"newLevel":10}}'

# Item acquired
curl -X POST http://localhost:3000/api/emotion/analyze -H "Content-Type: application/json" \
  -d '{"eventType":"player.item_acquired","data":{"itemRarity":"epic"}}'

# Combat start
curl -X POST http://localhost:3000/api/emotion/analyze -H "Content-Type: application/json" \
  -d '{"eventType":"combat.start","data":{}}'

# Boss defeated
curl -X POST http://localhost:3000/api/emotion/analyze -H "Content-Type: application/json" \
  -d '{"eventType":"combat.boss_defeated","data":{"bossName":"Dragon King"}}'
```

---

## 🎭 Test All Emotions

```bash
# Test each emotion with appropriate events
for emotion in excited confident happy sad frustrated angry afraid surprised neutral calm determined focused playful curious
do
  echo "Testing: $emotion"
  curl -X POST http://localhost:3000/api/dialogue/generate \
    -H "Content-Type: application/json" \
    -d "{\"emotion\":\"$emotion\",\"persona\":\"cheerful\",\"language\":\"en\"}"
  echo ""
done
```

---

## 👤 Test All Personas

```bash
# Test each persona
for persona in cheerful serious playful
do
  echo "Testing: $persona"
  curl -X POST http://localhost:3000/api/dialogue/generate \
    -H "Content-Type: application/json" \
    -d "{\"emotion\":\"excited\",\"persona\":\"$persona\",\"language\":\"en\"}"
  echo ""
done
```

---

## 🌐 Test All Languages

```bash
# Test each language
for lang in zh en ja
do
  echo "Testing: $lang"
  curl -X POST http://localhost:3000/api/dialogue/generate \
    -H "Content-Type: application/json" \
    -d "{\"emotion\":\"excited\",\"persona\":\"cheerful\",\"language\":\"$lang\"}"
  echo ""
done
```

---

## 🔧 Using Postman or REST Client

### Import as cURL

1. Open Postman or any REST client
2. Import the cURL commands above
3. Create a collection named "AGL Tests"
4. Save each request

### Environment Variables

Create these variables:
- `base_url`: `http://localhost:3000`
- `game_id`: (set after creating game)
- `player_id`: (set after creating player)

---

## 📊 Expected Test Results

### Success Indicators

✅ **All requests return HTTP 200 OK**
✅ **Emotion analysis returns valid emotion names**
✅ **Dialogue generation returns non-empty text**
✅ **Memory operations return IDs**
✅ **All languages work (zh, en, ja)**

### Common Issues

❌ **Connection refused** → Service not running, run `npm run dev:monolith`
❌ **404 Not Found** → Check endpoint URL
❌ **500 Server Error** → Check service logs
❌ **Empty responses** → Database not initialized

---

## 🐛 Troubleshooting

### Service won't start

```bash
# Check if port is in use
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Check service logs
cd services/monolith
npm run dev  # Watch for errors
```

### Database issues

```bash
# Check if database exists
ls -la services/monolith/agl.db

# Reinitialize database
rm services/monolith/agl.db
npm run dev:monolith
```

### API returns errors

```bash
# Check detailed response
curl -v http://localhost:3000/health

# Check service logs
# Look for error messages in the terminal running npm run dev:monolith
```

---

## 📈 Performance Testing

### Load Test with Apache Bench

```bash
# Install ab (Apache Bench)
# Mac: brew install httpd
# Ubuntu: sudo apt install apache2-utils

# Test emotion endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 -p emotion.json -T application/json \
  http://localhost:3000/api/emotion/analyze

# emotion.json content:
# {"eventType":"player.victory","data":{"killCount":15}}
```

### Monitor Performance

```bash
# Watch response times
while true; do
  time curl -s http://localhost:3000/health > /dev/null
  sleep 1
done
```

---

## 🎯 Next Steps

After testing:

1. ✅ **Verify all features work**
2. 📝 **Check logs for any warnings**
3. 🗄️ **Inspect database** with `npx prisma studio` in `services/monolith`
4. 🚀 **Integrate with your game** using SDK
5. 📊 **Monitor performance** under load

---

## 📚 Related Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [Monolith Mode Guide](./QUICKSTART-MONOLITH.md)
- [API Documentation](./docs/api/README.md)
- [Emotion System](./docs/emotion-system.md)
- [Dialogue System](./docs/dialogue-system.md)

---

**Ready to build! 🎮✨**
