@echo off
REM AGL Monolith Quick Test Script for Windows
REM Run this after starting the monolith service with: npm run dev:monolith

setlocal enabledelayedexpansion

set API_URL=http://localhost:3000

echo ==================================
echo 🎮 AGL Monolith Test Suite
echo ==================================
echo.

REM Test 1: Health Check
echo Test 1: Health Check
curl -s -o nul -w "HTTP Status: %%{http_code}" %API_URL%/health
echo.
echo ✓ Health check completed
echo.

REM Test 2: Create Game
echo Test 2: Create Game
curl -s -X POST %API_URL%/api/games ^
  -H "Content-Type: application/json" ^
  -d "{\"clientId\":\"test_client\",\"name\":\"Test Game\",\"description\":\"Quick test game\"}"
echo.
echo ✓ Game creation attempted
echo.

REM Test 3: Emotion Analysis - Victory
echo Test 3: Emotion Analysis (Victory)
curl -s -X POST %API_URL%/api/emotion/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"eventType\":\"player.victory\",\"data\":{\"killCount\":15,\"mvp\":true}}"
echo.
echo ✓ Victory emotion analyzed
echo.

REM Test 4: Emotion Analysis - Death
echo Test 4: Emotion Analysis (Death)
curl -s -X POST %API_URL%/api/emotion/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"eventType\":\"player.death\",\"data\":{\"deathCount\":5}}"
echo.
echo ✓ Death emotion analyzed
echo.

REM Test 5: Dialogue Generation - Chinese
echo Test 5: Dialogue Generation (Chinese)
curl -s -X POST %API_URL%/api/dialogue/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"emotion\":\"excited\",\"persona\":\"cheerful\",\"language\":\"zh\"}"
echo.
echo ✓ Chinese dialogue generated
echo.

REM Test 6: Dialogue Generation - English
echo Test 6: Dialogue Generation (English)
curl -s -X POST %API_URL%/api/dialogue/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"emotion\":\"excited\",\"persona\":\"cheerful\",\"language\":\"en\"}"
echo.
echo ✓ English dialogue generated
echo.

REM Test 7: Various Event Types
echo Test 7: Various Event Types

curl -s -X POST %API_URL%/api/emotion/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"eventType\":\"player.achievement\",\"data\":{\"rarity\":\"legendary\"}}" >nul
echo ✓ Achievement event processed

curl -s -X POST %API_URL%/api/emotion/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"eventType\":\"player.level_up\",\"data\":{\"newLevel\":10}}" >nul
echo ✓ Level up event processed

curl -s -X POST %API_URL%/api/emotion/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"eventType\":\"combat.start\",\"data\":{}}" >nul
echo ✓ Combat start event processed

echo.

REM Summary
echo ==================================
echo ✓ All tests completed!
echo ==================================
echo.
echo Your AGL Monolith service is working correctly!
echo.
echo Try these endpoints manually:
echo - Health: curl %API_URL%/health
echo - Emotion: curl -X POST %API_URL%/api/emotion/analyze -H "Content-Type: application/json" -d "{\"eventType\":\"player.victory\",\"data\":{}}"
echo.

pause
