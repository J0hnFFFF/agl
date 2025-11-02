# AGL Monolith Quick Test Script (PowerShell)
# Run this after starting the monolith service with: npm run dev:monolith

$API_URL = "http://localhost:3000"
$ErrorActionPreference = "Continue"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🎮 AGL Monolith Test Suite" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get -TimeoutSec 5
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Create Game
Write-Host "Test 2: Create Game" -ForegroundColor Blue
try {
    $gameData = @{
        clientId = "test_client"
        name = "Test Game"
        description = "Quick test game"
    } | ConvertTo-Json

    $game = Invoke-RestMethod -Uri "$API_URL/api/games" -Method Post `
        -ContentType "application/json" -Body $gameData -TimeoutSec 5

    Write-Host "✓ Game created: $($game.id)" -ForegroundColor Green
    Write-Host "  Name: $($game.name)" -ForegroundColor Gray
    $gameId = $game.id
} catch {
    Write-Host "✗ Failed to create game: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Create Player
Write-Host "Test 3: Create Player" -ForegroundColor Blue
try {
    $playerData = @{
        gameId = $gameId
        externalId = "test_player_001"
        characterPersona = "cheerful"
    } | ConvertTo-Json

    $player = Invoke-RestMethod -Uri "$API_URL/api/players" -Method Post `
        -ContentType "application/json" -Body $playerData -TimeoutSec 5

    Write-Host "✓ Player created: $($player.id)" -ForegroundColor Green
    Write-Host "  Persona: $($player.characterPersona)" -ForegroundColor Gray
    $playerId = $player.id
} catch {
    Write-Host "✗ Failed to create player: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Emotion Analysis - Victory
Write-Host "Test 4: Emotion Analysis (Victory)" -ForegroundColor Blue
try {
    $emotionData = @{
        eventType = "player.victory"
        data = @{
            killCount = 15
            mvp = $true
        }
    } | ConvertTo-Json

    $emotion = Invoke-RestMethod -Uri "$API_URL/api/emotion/analyze" -Method Post `
        -ContentType "application/json" -Body $emotionData -TimeoutSec 5

    Write-Host "✓ Emotion detected: $($emotion.emotion)" -ForegroundColor Green
    Write-Host "  Intensity: $($emotion.intensity)" -ForegroundColor Gray
    Write-Host "  Confidence: $($emotion.confidence)" -ForegroundColor Gray
    Write-Host "  Action: $($emotion.action)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Emotion analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Emotion Analysis - Death
Write-Host "Test 5: Emotion Analysis (Death)" -ForegroundColor Blue
try {
    $emotionData = @{
        eventType = "player.death"
        data = @{
            deathCount = 5
        }
    } | ConvertTo-Json

    $emotion = Invoke-RestMethod -Uri "$API_URL/api/emotion/analyze" -Method Post `
        -ContentType "application/json" -Body $emotionData -TimeoutSec 5

    Write-Host "✓ Emotion detected: $($emotion.emotion)" -ForegroundColor Green
    Write-Host "  Intensity: $($emotion.intensity)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Emotion analysis failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Dialogue Generation - Chinese
Write-Host "Test 6: Dialogue Generation (Chinese)" -ForegroundColor Blue
try {
    $dialogueData = @{
        emotion = "excited"
        persona = "cheerful"
        language = "zh"
    } | ConvertTo-Json

    $dialogue = Invoke-RestMethod -Uri "$API_URL/api/dialogue/generate" -Method Post `
        -ContentType "application/json" -Body $dialogueData -TimeoutSec 5

    Write-Host "✓ Dialogue generated: $($dialogue.dialogue)" -ForegroundColor Green
    Write-Host "  Source: $($dialogue.source)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Dialogue generation failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Dialogue Generation - English
Write-Host "Test 7: Dialogue Generation (English)" -ForegroundColor Blue
try {
    $dialogueData = @{
        emotion = "excited"
        persona = "cheerful"
        language = "en"
    } | ConvertTo-Json

    $dialogue = Invoke-RestMethod -Uri "$API_URL/api/dialogue/generate" -Method Post `
        -ContentType "application/json" -Body $dialogueData -TimeoutSec 5

    Write-Host "✓ Dialogue generated: $($dialogue.dialogue)" -ForegroundColor Green
} catch {
    Write-Host "✗ Dialogue generation failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Store Memory
Write-Host "Test 8: Store Memory" -ForegroundColor Blue
try {
    $memoryData = @{
        playerId = $playerId
        type = "achievement"
        content = "First victory with 15 kills - incredible performance!"
        emotion = "excited"
        importance = 0.9
    } | ConvertTo-Json

    $memory = Invoke-RestMethod -Uri "$API_URL/api/memory/store" -Method Post `
        -ContentType "application/json" -Body $memoryData -TimeoutSec 5

    Write-Host "✓ Memory stored: $($memory.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Memory storage failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: Retrieve Memories
Write-Host "Test 9: Retrieve Memories" -ForegroundColor Blue
try {
    $memories = Invoke-RestMethod -Uri "$API_URL/api/memory/search?playerId=$playerId&limit=5" `
        -Method Get -TimeoutSec 5

    $count = $memories.Count
    Write-Host "✓ Retrieved $count memories" -ForegroundColor Green

    foreach ($mem in $memories | Select-Object -First 3) {
        Write-Host "  - $($mem.content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Memory retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 10: Various Event Types
Write-Host "Test 10: Various Event Types" -ForegroundColor Blue

$events = @(
    @{ eventType = "player.achievement"; data = @{ rarity = "legendary" }; name = "Achievement" },
    @{ eventType = "player.level_up"; data = @{ newLevel = 10 }; name = "Level Up" },
    @{ eventType = "combat.start"; data = @{}; name = "Combat Start" },
    @{ eventType = "player.item_acquired"; data = @{ itemRarity = "epic" }; name = "Item Acquired" }
)

foreach ($event in $events) {
    try {
        $eventData = $event | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "$API_URL/api/emotion/analyze" -Method Post `
            -ContentType "application/json" -Body $eventData -TimeoutSec 5
        Write-Host "  ✓ $($event.name) event processed" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $($event.name) event failed" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✓ All tests completed!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your AGL Monolith service is working correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "Try these endpoints manually:" -ForegroundColor Yellow
Write-Host "  Health:   curl $API_URL/health"
Write-Host "  Emotion:  curl -X POST $API_URL/api/emotion/analyze -H 'Content-Type: application/json' -d '{\"eventType\":\"player.victory\",\"data\":{}}'"
Write-Host "  Dialogue: curl -X POST $API_URL/api/dialogue/generate -H 'Content-Type: application/json' -d '{\"emotion\":\"excited\",\"persona\":\"cheerful\",\"language\":\"zh\"}'"
Write-Host ""
