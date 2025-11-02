# Vision SDK Guide

**AI-Powered Game Screen Analysis for AGL Platform**

The Vision SDK enables your AI companion to "see" and understand what's happening in the game through advanced computer vision and AI analysis.

---

## Overview

The Vision SDK provides **screen capture** and **AI analysis** capabilities, allowing your companion to react to visual game states, not just programmatic events. This creates more immersive and contextually aware companions.

### Key Features

- **Screen Capture**: Canvas, Video, Display (Screen Capture API), Window
- **Vision AI Integration**: OpenAI GPT-4V and Anthropic Claude Vision
- **Game State Recognition**: Automatic detection of 12 game states (combat, menu, dialogue, etc.)
- **Flexible Analysis**: Custom prompts and structured responses
- **Performance Optimized**: Configurable quality, resolution, and capture intervals
- **TypeScript**: Full type safety with comprehensive validation
- **Error Handling**: Robust error management with detailed messages

---

## Installation

```bash
npm install @agl/vision
```

### Dependencies

```bash
npm install axios openai
```

---

## Quick Start

### 1. Screen Capture

Capture screenshots from various sources:

```typescript
import { ScreenCapture } from '@agl/vision';

// Capture from Canvas
const capture = new ScreenCapture({
  source: 'canvas',
  target: document.getElementById('game-canvas'),
  format: 'jpeg',
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080
});

// Single capture
const screenshot = await capture.capture();
console.log(screenshot.data); // base64 image data

// Auto-capture at intervals
capture.startAutoCapture((screenshot) => {
  console.log('Captured at:', screenshot.timestamp);
});
```

### 2. Vision AI Analysis

Analyze screenshots using GPT-4V or Claude Vision:

```typescript
import { VisionAnalyzer } from '@agl/vision';

const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-vision-preview',
  maxTokens: 1000
});

const response = await analyzer.analyze({
  screenshot,
  prompt: 'What is happening in this game scene?'
});

console.log(response.content);
console.log('Confidence:', response.confidence);
```

### 3. Game State Recognition

Automatically detect game states:

```typescript
import { GameStateRecognizer } from '@agl/vision';

const recognizer = new GameStateRecognizer(analyzer);

const gameState = await recognizer.recognize(screenshot);

console.log(gameState.category);        // "combat", "menu", "dialogue", etc.
console.log(gameState.confidence);      // 0.95
console.log(gameState.sceneDescription); // Detailed description
```

---

## Complete Integration Example

```typescript
import { ScreenCapture, VisionAnalyzer, GameStateRecognizer } from '@agl/vision';
import { useAGLClient } from '@agl/web-sdk';

function setupVisionAnalysis() {
  // 1. Setup screen capture
  const capture = new ScreenCapture({
    source: 'canvas',
    target: '#game-canvas',
    format: 'jpeg',
    quality: 0.8
  });

  // 2. Setup vision analyzer
  const analyzer = new VisionAnalyzer({
    provider: 'openai-gpt4v',
    apiKey: process.env.OPENAI_API_KEY
  });

  // 3. Setup game state recognizer
  const recognizer = new GameStateRecognizer(analyzer);

  // 4. Analyze game screen periodically
  setInterval(async () => {
    const screenshot = await capture.capture();
    const gameState = await recognizer.recognize(screenshot);

    // React to game state
    if (gameState.category === 'combat') {
      emotionService.setEmotion('confident', 0.8);
      dialogueService.generate({
        context: gameState.sceneDescription,
        emotion: 'confident'
      });
    } else if (gameState.category === 'victory') {
      emotionService.setEmotion('excited', 0.9);
    }
  }, 3000); // Analyze every 3 seconds
}
```

---

## Vision Providers

### OpenAI GPT-4V

```typescript
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-vision-preview',
  maxTokens: 1000,
  temperature: 0.7
});
```

**Features**:
- High accuracy
- Fast response (~2-3s)
- Good at complex scene understanding
- Supports detailed prompts

### Anthropic Claude Vision

```typescript
const analyzer = new VisionAnalyzer({
  provider: 'anthropic-claude',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus-20240229',
  maxTokens: 1000,
  temperature: 0.7
});
```

**Features**:
- Excellent at nuanced analysis
- Strong reasoning capabilities
- Good performance (~2-4s)
- Detailed scene descriptions

### Custom Provider

```typescript
const analyzer = new VisionAnalyzer({
  provider: 'custom',
  apiKey: 'your-key',
  apiEndpoint: 'https://your-api.com/analyze'
});

const response = await analyzer.analyzeWithCustom(request, async (req, config) => {
  // Your custom analysis logic
  const result = await yourVisionAPI.analyze(req.screenshot);

  return {
    content: result.description,
    confidence: result.confidence,
    processingTime: result.time
  };
});
```

---

## Game State Detection

### Supported Game States

The Vision SDK can automatically recognize these game states:

- **combat** - Battle or combat scenario
- **menu** - Menu or UI screen
- **dialogue** - Conversation with NPC
- **inventory** - Inventory management screen
- **map** - Map or navigation view
- **cutscene** - Cinematic or cutscene
- **loading** - Loading screen
- **paused** - Game paused
- **victory** - Victory or success screen
- **defeat** - Defeat or game over screen
- **gameplay** - General gameplay
- **unknown** - Unknown or ambiguous state

### Quick State Check

```typescript
// Check if current state is combat
const isCombat = await recognizer.isState(screenshot, 'combat');

if (isCombat) {
  companion.setEmotion('confident');
  companion.speak('Focus on the enemy!');
}
```

### Multi-State Detection

```typescript
// Detect multiple possible states
const states = await recognizer.detectStates(
  screenshot,
  ['combat', 'menu', 'dialogue']
);

states.forEach(state => {
  console.log(`${state.category}: ${state.confidence * 100}%`);
});
```

### Continuous Monitoring

```typescript
// Monitor game state continuously
for await (const gameState of recognizer.monitorState(
  () => capture.capture(),
  2000 // Check every 2 seconds
)) {
  console.log('Current state:', gameState.category);

  // React to state changes
  if (gameState.category === 'combat' && gameState.confidence > 0.8) {
    // High confidence combat detected
    companion.enterCombatMode();
  }
}
```

---

## Integration with AGL Services

### With Emotion Service

Update companion emotion based on visual game state:

```typescript
async function updateEmotionFromScreen() {
  const screenshot = await capture.capture();
  const gameState = await recognizer.recognize(screenshot);

  // Map game state to emotion
  const emotionMap = {
    'victory': { emotion: 'excited', intensity: 0.9 },
    'defeat': { emotion: 'disappointed', intensity: 0.7 },
    'combat': { emotion: 'confident', intensity: 0.8 },
    'menu': { emotion: 'neutral', intensity: 0.5 },
    'dialogue': { emotion: 'happy', intensity: 0.6 }
  };

  const { emotion, intensity } = emotionMap[gameState.category] ||
    { emotion: 'neutral', intensity: 0.5 };

  emotionService.setEmotion(emotion, intensity);
}
```

### With Dialogue Service

Generate contextual dialogue based on what's visible:

```typescript
async function generateContextualDialogue() {
  const screenshot = await capture.capture();

  const analysis = await analyzer.analyze({
    screenshot,
    prompt: 'Describe what the player is doing in one sentence.'
  });

  // Use visual context for dialogue
  const dialogue = await dialogueService.generate({
    context: analysis.content,
    emotion: 'happy'
  });

  console.log(dialogue); // "Wow, you're doing great in that battle!"
}
```

---

## Advanced Usage

### Custom Prompts

```typescript
const response = await analyzer.analyze({
  screenshot,
  prompt: `Analyze this game screenshot and answer:
1. Is the player's health low?
2. Are there enemies nearby?
3. What items are visible on screen?`,
  context: 'You are analyzing a screenshot from an RPG game.'
});

console.log(response.content);
```

### Event Handlers

```typescript
const capture = new ScreenCapture(config, {
  onCapture: (screenshot) => {
    console.log('Captured screenshot:', screenshot.size, 'bytes');
  },
  onError: (error) => {
    console.error('Capture error:', error);
  },
  onStart: () => {
    console.log('Auto-capture started');
  },
  onStop: () => {
    console.log('Auto-capture stopped');
  }
});

const analyzer = new VisionAnalyzer(config, {
  onAnalysisComplete: (response) => {
    console.log('Analysis complete:', response.content);
  },
  onAnalysisError: (error) => {
    console.error('Analysis failed:', error);
  },
  onGameStateDetected: (gameState) => {
    console.log('Detected state:', gameState.category);
  }
});
```

---

## Performance Optimization

### Capture Performance

```typescript
// Reduce image size for faster analysis
const capture = new ScreenCapture({
  maxWidth: 1280,  // Lower resolution
  maxHeight: 720,
  quality: 0.7     // Lower quality = smaller file
});
```

### Analysis Frequency

```typescript
// Don't analyze too frequently - it's expensive!
setInterval(analyzeGameScreen, 5000); // Every 5 seconds instead of 1
```

### Prompt Optimization

```typescript
// Shorter, focused prompts = faster responses + lower cost
const response = await analyzer.analyze({
  screenshot,
  prompt: 'Is this combat? Yes or no only.' // Instead of long detailed prompt
});
```

### Benchmarks

**Capture Performance**:
- Canvas capture: < 50ms
- Video capture: < 100ms
- Display capture: ~200ms (includes permission prompt)

**Analysis Performance**:
- GPT-4V: ~2-5 seconds per request
- Claude Vision: ~2-4 seconds per request
- Token usage: ~500-1500 tokens per image

---

## Configuration Limits

### ScreenCapture Constraints

```typescript
{
  quality: 0-1,              // Image quality
  maxWidth: 1-7680,          // Max 8K width
  maxHeight: 1-4320,         // Max 8K height
  interval: ≥100,            // Minimum 100ms for auto-capture
  source: 'canvas' | 'video' | 'display' | 'window'
}
```

### VisionAnalyzer Constraints

```typescript
{
  apiKey: string,            // Required, non-empty
  temperature: 0-1,          // Randomness
  maxTokens: 1-100000,       // Token limit
  provider: 'openai-gpt4v' | 'anthropic-claude' | 'custom'
}
```

### Error Examples

```typescript
// ❌ This will throw
new ScreenCapture({
  source: 'canvas',
  target: '#canvas',
  quality: 1.5  // Error: quality must be 0-1
});

// ❌ This will throw
new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: ''  // Error: apiKey cannot be empty
});

// ✅ This is valid
new ScreenCapture({
  source: 'canvas',
  target: '#canvas',
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080
});
```

---

## Security Considerations

⚠️ **IMPORTANT: API Key Security**

```typescript
// ✅ GOOD - Use environment variables
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: process.env.OPENAI_API_KEY
});

// ❌ BAD - Never hardcode API keys!
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: 'sk-...' // Never do this!
});
```

**Best Practices**:
- Never commit API keys to version control
- Use environment variables or secure key management
- Never expose API keys in client-side code
- Consider using a backend proxy to keep keys secure

---

## Unity Integration

For Unity games, use the provided plugin:

```csharp
using UnityEngine;
using System.Runtime.InteropServices;

public class AGLVisionCapture : MonoBehaviour
{
    [DllImport("__Internal")]
    private static extern void CaptureScreen(string base64Data);

    public void CaptureAndSend()
    {
        // Capture Unity camera
        RenderTexture rt = new RenderTexture(1920, 1080, 24);
        Camera.main.targetTexture = rt;
        Camera.main.Render();

        Texture2D screenshot = new Texture2D(1920, 1080, TextureFormat.RGB24, false);
        RenderTexture.active = rt;
        screenshot.ReadPixels(new Rect(0, 0, 1920, 1080), 0, 0);
        screenshot.Apply();

        // Convert to base64 and send to JavaScript
        byte[] bytes = screenshot.EncodeToJPG(80);
        string base64 = System.Convert.ToBase64String(bytes);
        CaptureScreen(base64);

        // Cleanup
        Camera.main.targetTexture = null;
        RenderTexture.active = null;
        Destroy(rt);
        Destroy(screenshot);
    }
}
```

JavaScript side:

```javascript
window.CaptureScreen = async function(base64Data) {
  const screenshot = {
    data: base64Data,
    format: 'jpeg',
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    size: base64Data.length
  };

  const gameState = await recognizer.recognize(screenshot);
  console.log('Unity game state:', gameState);
};
```

---

## Browser Support

- Chrome 91+ (Screen Capture API)
- Firefox 88+
- Safari 15+
- Edge 91+

**Note**: Display capture requires HTTPS or localhost.

---

## API Rate Limits

Vision API providers have rate limits. Handle them gracefully:

```typescript
const analyzer = new VisionAnalyzer(config, {
  onAnalysisError: async (error) => {
    if (error.message.includes('429')) {
      console.log('Rate limit hit, waiting...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Implement retry logic
    }
  }
});
```

**Provider Limits**:
- **OpenAI GPT-4V**: Varies by tier, see docs
- **Anthropic Claude**: Varies by tier, see docs

---

## Examples

See the [examples directory](../../sdk/vision/examples/) for complete working examples:

- **basic-capture.ts** - Simple screen capture
- **gpt4v-analysis.ts** - GPT-4V integration
- **claude-vision.ts** - Claude Vision integration
- **game-state-detection.ts** - Automatic state recognition
- **unity-integration.ts** - Unity game integration

---

## API Reference

See the [SDK README](../../sdk/vision/README.md) for complete API documentation and TypeScript definitions.

---

## Support

- Issues: https://github.com/agl/vision/issues
- Documentation: https://docs.agl.dev/sdk/vision
- Examples: https://agl.dev/examples/vision

---

**Let your AI companion see the game world through Vision AI.**
