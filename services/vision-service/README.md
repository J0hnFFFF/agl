# Vision Service - AI-Powered Game Screenshot Analysis

**Transform Game Screenshots into Actionable Intelligence**

Part of AGL (AI Game Companion Engine) Phase 5 implementation.

---

## 🎯 Overview

Vision Service analyzes game screenshots using state-of-the-art vision AI models (OpenAI GPT-4V and Anthropic Claude Vision) to extract structured information about scenes, events, characters, and UI elements.

```
Screenshot → [Image Processing] → [Vision API] → [Scene Analysis] → Structured Data
```

**Single API Call** = Complete Game Scene Understanding

---

## ✨ Features

### Core Capabilities
- **Multi-Provider Support**: OpenAI GPT-4V and Anthropic Claude Vision
- **Intelligent Image Optimization**: Automatic resize and compression (20-50% cost savings)
- **Structured Data Extraction**: Scene, character, events, UI elements
- **Scene Change Detection**: Track scene transitions and similarities
- **Event Detection**: Combat, dialogue, exploration, deaths, victories
- **Cost Management**: Daily budget limits, cost tracking, alerts

### Analysis Types
- **Full Analysis**: Complete scene understanding (default)
- **Scene Only**: Environment and atmosphere detection
- **Event Detection**: Game events and activities
- **Character Status**: Health, level, equipment recognition
- **UI Elements**: Identify HUD, menus, text boxes

### Performance & Cost Optimization
- **1-Hour Caching**: Instant responses for analyzed images
- **Image Optimization**: Automatic resize to reduce API costs
- **Budget Enforcement**: Configurable daily limits with alerts
- **Multiple Formats**: PNG, JPEG, WebP, GIF support

---

## 📦 Installation

### Prerequisites

- Python 3.11+
- Redis (for caching)
- OpenAI API Key (for GPT-4V) **or** Anthropic API Key (for Claude Vision)

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"  # For GPT-4V
export ANTHROPIC_API_KEY="your-anthropic-api-key"  # For Claude Vision
export REDIS_HOST="localhost"
export REDIS_PORT="6379"

# Optional: Configure provider preference
export VISION_PROVIDER="openai"  # Options: openai, anthropic, both

# Run service
uvicorn app:app --host 0.0.0.0 --port 8007 --reload
```

---

## 🚀 Quick Start

### Basic Screenshot Analysis

```bash
# Analyze game screenshot
curl -X POST http://localhost:8007/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image_data": "<base64-encoded-screenshot>",
    "image_format": "png",
    "analysis_type": "full",
    "game_name": "Elden Ring",
    "enable_scene_detection": true
  }'
```

### File Upload

```bash
# Upload screenshot file
curl -X POST http://localhost:8007/analyze/file \
  -F "file=@screenshot.png" \
  -F "game_name=Elden Ring" \
  -F "analysis_type=full"
```

### Response Example

```json
{
  "analysis_text": "The screenshot shows a dark, atmospheric dungeon environment. The player character is engaged in combat with multiple enemies. The health bar shows approximately 60% health remaining...",
  "scene": {
    "description": "Dark dungeon combat scene",
    "location": "Underground catacomb",
    "environment": "dungeon",
    "atmosphere": "tense",
    "time_of_day": null,
    "weather": null
  },
  "character": {
    "name": null,
    "health": "60%",
    "level": "45",
    "equipment": ["sword", "shield", "armor"],
    "status_effects": []
  },
  "events": [
    {
      "event_type": "combat",
      "description": "Fighting enemies",
      "importance": "high",
      "confidence": 0.9
    }
  ],
  "ui_elements": [
    {
      "element_type": "health_bar",
      "content": "Health bar showing 60% HP",
      "importance": "high"
    }
  ],
  "scene_changed": false,
  "scene_similarity": null,
  "processing_time_ms": 2350.5,
  "cache_hit": false,
  "provider": "openai",
  "model": "gpt-4-vision-preview",
  "cost": 0.01275,
  "image_size": {"width": 1920, "height": 1080},
  "image_optimized": false
}
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VISION_PORT` | `8007` | Service port |
| `VISION_PROVIDER` | `openai` | Vision API provider (openai, anthropic, both) |
| `OPENAI_API_KEY` | - | OpenAI API key for GPT-4V |
| `OPENAI_MODEL` | `gpt-4-vision-preview` | OpenAI model |
| `OPENAI_DETAIL` | `auto` | Image detail level (low, high, auto) |
| `ANTHROPIC_API_KEY` | - | Anthropic API key for Claude Vision |
| `ANTHROPIC_MODEL` | `claude-3-5-sonnet-20250129` | Anthropic model |
| `MAX_IMAGE_SIZE` | `2048` | Max image dimension (pixels) |
| `COMPRESSION_QUALITY` | `85` | JPEG compression quality (0-100) |
| `ENABLE_IMAGE_OPTIMIZATION` | `true` | Auto-optimize images |
| `AUTO_RESIZE_THRESHOLD` | `2048` | Resize if larger than this |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `CACHE_ENABLED` | `true` | Enable result caching |
| `CACHE_TTL_SECONDS` | `3600` | Cache TTL (1 hour) |
| `DAILY_VISION_BUDGET` | `50.0` | Daily budget ($) |
| `COST_ALERT_THRESHOLD` | `0.8` | Alert at 80% budget |

---

## 📡 API Endpoints

### `POST /analyze`

Analyze game screenshot.

**Request:**
```json
{
  "image_data": "string",           // Base64-encoded image (required)
  "image_format": "png",            // Image format
  "analysis_type": "full",          // Analysis type
  "custom_prompt": "string",        // Custom prompt (optional)
  "game_name": "Elden Ring",        // Game context (optional)
  "player_id": "player_123",        // Player ID (optional)
  "session_id": "session_456",      // Session ID (optional)
  "previous_scene": "village",      // Previous scene (optional)
  "enable_cache": true,             // Enable caching
  "enable_scene_detection": true,   // Detect scene changes
  "enable_event_detection": true,   // Detect events
  "provider": "openai"              // API provider preference (optional)
}
```

**Response:** See example above

### `POST /analyze/file`

Analyze image from uploaded file.

**Request (multipart/form-data):**
- `file`: Image file
- `analysis_type`: Analysis type (optional)
- `game_name`: Game name (optional)
- `player_id`: Player ID (optional)
- `custom_prompt`: Custom prompt (optional)
- `enable_cache`: Enable caching (optional)
- `provider`: API provider (optional)

### `POST /analyze/batch`

Analyze multiple images in batch (max 10).

**Request:**
```json
{
  "images": [
    {"image_data": "<base64-1>", "analysis_type": "event"},
    {"image_data": "<base64-2>", "analysis_type": "event"}
  ],
  "aggregate_results": true
}
```

### `GET /health`

Health check with dependency status.

### `GET /stats`

Get service statistics and costs.

### `GET /budget`

Get budget status and remaining quota.

### `DELETE /cache`

Clear all cached results.

---

## 🎨 Analysis Types

### Full Analysis (Default)

Complete scene understanding with all data extraction:
- Scene description and atmosphere
- Character status and equipment
- Event detection
- UI elements

```json
{"analysis_type": "full"}
```

### Scene Only

Focus on environment and atmosphere:
- Location and environment type
- Atmosphere (tense, peaceful, exciting, etc.)
- Time of day and weather (if visible)

```json
{"analysis_type": "scene"}
```

### Event Detection

Detect game events:
- Combat situations
- Dialogue/conversations
- Exploration
- Deaths, victories, level-ups

```json
{"analysis_type": "event"}
```

### Character Status

Extract character information:
- Health/HP status
- Level
- Visible equipment
- Status effects

```json
{"analysis_type": "character"}
```

### UI Elements

Identify UI components:
- Health bars
- Minimaps
- Inventory displays
- Quest logs
- Chat/text boxes

```json
{"analysis_type": "ui"}
```

---

## ⚡ Performance

### Typical Latency

| Scenario | Total Time | Cost | Details |
|----------|------------|------|---------|
| **Cache Hit** | 10-20ms | $0 | Previous analysis |
| **Optimized Image** | 2-3s | $0.007-0.010 | Resized image, low detail |
| **Full Quality** | 3-5s | $0.012-0.015 | Original image, high detail |

### Cost per Analysis

| Provider | Detail Level | Cost | Notes |
|----------|--------------|------|-------|
| **OpenAI GPT-4V** | Low | $0.00765 | Reduced image detail |
| **OpenAI GPT-4V** | High | $0.01275 | Full image detail |
| **Anthropic Claude** | Standard | $0.012 | Fixed cost |

### Optimization Tips

1. **Enable Image Optimization**: Automatic resize saves 20-40% costs
2. **Use Caching**: Repeated analyses are free
3. **Choose Analysis Type**: Specific types are faster than full
4. **Set Detail Level**: Use "low" for simple scenes

---

## 🛡️ Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid image data` | Corrupted image | Check image encoding |
| `Daily budget exceeded` | Cost limit reached | Wait for next day or increase budget |
| `Vision API unavailable` | No API keys configured | Set OPENAI_API_KEY or ANTHROPIC_API_KEY |
| `Unsupported format` | Invalid image type | Use PNG, JPEG, or WebP |

### Fallback Behavior

1. **Primary provider down** → Automatically switches to backup provider
2. **Cache unavailable** → Processes without caching
3. **Budget exceeded** → Returns 429 error with budget info

---

## 🔗 Integration Examples

### Python Client

```python
import requests
import base64

# Read screenshot
with open("screenshot.png", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

# Analyze screenshot
response = requests.post("http://localhost:8007/analyze", json={
    "image_data": image_data,
    "image_format": "png",
    "analysis_type": "full",
    "game_name": "Elden Ring",
    "enable_scene_detection": True
})

result = response.json()

# Extract events
events = result['events']
print(f"Detected {len(events)} events:")
for event in events:
    print(f"  - {event['event_type']}: {event['description']}")

# Check scene
if result['scene']:
    scene = result['scene']
    print(f"\nScene: {scene['description']}")
    print(f"Atmosphere: {scene['atmosphere']}")

# Cost tracking
print(f"\nCost: ${result['cost']:.4f}")
print(f"Processing time: {result['processing_time_ms']:.0f}ms")
```

### Unity C# Client

```csharp
using UnityEngine;
using System;
using System.Collections;
using System.IO;

public class VisionClient : MonoBehaviour
{
    private const string API_URL = "http://localhost:8007/analyze/file";

    public IEnumerator AnalyzeScreenshot(string screenshotPath)
    {
        // Read screenshot file
        byte[] imageBytes = File.ReadAllBytes(screenshotPath);

        // Create multipart form data
        WWWForm form = new WWWForm();
        form.AddBinaryData("file", imageBytes, "screenshot.png", "image/png");
        form.AddField("game_name", "My Game");
        form.AddField("analysis_type", "event");

        using (var www = UnityWebRequest.Post(API_URL, form))
        {
            yield return www.SendWebRequest();

            if (www.result == UnityWebRequest.Result.Success)
            {
                var response = JsonUtility.FromJson<VisionResponse>(
                    www.downloadHandler.text
                );

                Debug.Log($"Analysis: {response.analysis_text}");

                // Handle detected events
                foreach (var evt in response.events)
                {
                    Debug.Log($"Event: {evt.event_type} - {evt.description}");

                    // Trigger appropriate response
                    if (evt.event_type == "combat")
                    {
                        ShowCombatTip();
                    }
                }
            }
            else
            {
                Debug.LogError($"Vision analysis failed: {www.error}");
            }
        }
    }
}
```

### JavaScript/Web Client

```javascript
// Capture game screenshot
async function analyzeGameplay(imageBlob) {
  const formData = new FormData();
  formData.append('file', imageBlob, 'screenshot.png');
  formData.append('game_name', 'Browser Game');
  formData.append('analysis_type', 'full');

  const response = await fetch('http://localhost:8007/analyze/file', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  console.log('Analysis:', result.analysis_text);

  // Display events to player
  result.events.forEach(event => {
    showNotification(`${event.event_type}: ${event.description}`);
  });

  // Update companion dialogue based on scene
  if (result.scene) {
    updateCompanionDialogue(result.scene.atmosphere);
  }

  return result;
}

// Capture screenshot from canvas
function captureScreenshot(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      analyzeGameplay(blob);
      resolve(blob);
    }, 'image/png');
  });
}
```

---

## 🧪 Testing

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Test specific endpoint
pytest tests/test_api.py::test_vision_analysis -v
```

---

## 📝 Development

### Project Structure

```
vision-service/
├── app.py                      # FastAPI application
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── src/
│   ├── __init__.py
│   ├── config.py              # Configuration
│   ├── models.py              # Pydantic models
│   ├── image_processor.py     # Image optimization
│   ├── vision_client.py       # Vision API clients
│   ├── scene_analyzer.py      # Scene analysis & event detection
│   └── cache.py               # Redis cache & cost tracking
└── tests/
    ├── __init__.py
    └── test_api.py            # API tests
```

### Adding Features

1. **Add new event type**:
   - Update `scene_analyzer.py::_detect_events()`
   - Add detection keywords to config

2. **Add new vision provider**:
   - Implement client in `vision_client.py`
   - Add configuration in `config.py`

3. **Custom analysis prompts**:
   - Use `custom_prompt` parameter
   - Or modify `default_analysis_prompt` in config

---

## 🔗 Related Services

- [STT Service](../stt-service/) - Speech-to-text recognition
- [Voice Dialogue Service](../voice-dialogue-service/) - Complete voice interaction
- [Lip Sync Service](../lipsync-service/) - Lip sync animation generation
- [Dashboard](../dashboard/) - Real-time monitoring and analytics

---

## 💡 Use Cases

### AI Game Companion

```python
# Companion reacts to game events
result = analyze_screenshot(screenshot)

if any(e.event_type == "combat" for e in result['events']):
    companion.say("Be careful! Looks intense!")
elif any(e.event_type == "victory" for e in result['events']):
    companion.say("Great job! Well played!")
```

### Gameplay Coaching

```python
# Analyze player performance
results = batch_analyze(session_screenshots)

# Detect patterns
combat_deaths = sum(1 for r in results for e in r.events if e.event_type == "death")

if combat_deaths > 5:
    show_combat_tips()
```

### Stream Analysis

```python
# Analyze stream for highlights
for screenshot in stream_frames:
    result = analyze_screenshot(screenshot)

    # Detect highlight moments
    if any(e.importance == "high" for e in result['events']):
        mark_as_highlight(screenshot)
```

---

## 📄 License

Part of AGL Platform - Proprietary License

---

**Version**: 1.0.0 (Phase 5)
**Status**: ✅ Production Ready
**Last Updated**: 2025-11
