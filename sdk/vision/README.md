# @agl/vision

**Engine-level Game Screen Analysis System for AGL**

AI-powered visual analysis of game screens using GPT-4 Vision and Claude Vision APIs.

## Features

- **Screen Capture**: Capture from Canvas, Video, Display (Screen Capture API), Window
- **Vision AI Integration**: GPT-4V (OpenAI) and Claude Vision (Anthropic)
- **Game State Recognition**: Automatic detection of game states (combat, menu, dialogue, etc.)
- **Flexible Analysis**: Custom prompts and structured responses
- **Performance Optimized**: Configurable quality, resolution, intervals
- **TypeScript**: Full type safety with comprehensive input validation
- **Error Handling**: Robust error handling with detailed error messages

---

## Important Security Notes

⚠️ **API Key Security**:
- Never commit API keys to version control
- Always use environment variables or secure key management
- Never expose API keys in client-side code in production
- Consider using a backend proxy to keep keys secure

```typescript
// ✅ GOOD - Using environment variables
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: process.env.OPENAI_API_KEY
});

// ❌ BAD - Hardcoded API key
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: 'sk-...' // Never do this!
});
```

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

```typescript
import { ScreenCapture } from '@agl/vision';

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

// Auto-capture at intervals
capture.startAutoCapture((screenshot) => {
  console.log('Captured:', screenshot);
});
```

### 2. Vision Analysis

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
```

### 3. Game State Recognition

```typescript
import { GameStateRecognizer } from '@agl/vision';

const recognizer = new GameStateRecognizer(analyzer);

const gameState = await recognizer.recognize(screenshot);

console.log(gameState.category); // "combat", "menu", "dialogue", etc.
console.log(gameState.confidence); // 0.95
console.log(gameState.sceneDescription);
```

---

## Complete Example

```typescript
import { ScreenCapture, VisionAnalyzer, GameStateRecognizer } from '@agl/vision';

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

// 4. Analyze game screen
async function analyzeGameScreen() {
  // Capture screenshot
  const screenshot = await capture.capture();

  // Detect game state
  const gameState = await recognizer.recognize(screenshot);

  // React to game state
  if (gameState.category === 'combat') {
    console.log('Player is in combat!');
    // Trigger companion response
  } else if (gameState.category === 'victory') {
    console.log('Player won!');
    // Celebrate
  }

  return gameState;
}

// Auto-analyze every 3 seconds
setInterval(analyzeGameScreen, 3000);
```

---

## Vision Providers

### OpenAI GPT-4V

```typescript
const analyzer = new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: 'sk-...',
  model: 'gpt-4-vision-preview',
  maxTokens: 1000,
  temperature: 0.7
});
```

### Anthropic Claude

```typescript
const analyzer = new VisionAnalyzer({
  provider: 'anthropic-claude',
  apiKey: 'sk-ant-...',
  model: 'claude-3-opus-20240229',
  maxTokens: 1000,
  temperature: 0.7
});
```

### Custom Provider

```typescript
const analyzer = new VisionAnalyzer({
  provider: 'custom',
  apiKey: 'your-key',
  apiEndpoint: 'https://your-api.com/analyze'
});

const response = await analyzer.analyzeWithCustom(request, async (req, config) => {
  // Your custom analysis logic
  return {
    content: 'Analysis result',
    confidence: 0.9,
    processingTime: 0
  };
});
```

---

## Game State Detection

### Supported States

- `combat` - Battle or combat scenario
- `menu` - Menu or UI screen
- `dialogue` - Conversation with NPC
- `inventory` - Inventory management
- `map` - Map or navigation view
- `cutscene` - Cinematic or cutscene
- `loading` - Loading screen
- `paused` - Game paused
- `victory` - Victory or success
- `defeat` - Defeat or game over
- `gameplay` - General gameplay
- `unknown` - Unknown state

### Quick State Check

```typescript
const isCombat = await recognizer.isState(screenshot, 'combat');

if (isCombat) {
  // React to combat
}
```

### Multi-State Detection

```typescript
const states = await recognizer.detectStates(screenshot, ['combat', 'menu', 'dialogue']);

states.forEach(state => {
  console.log(`${state.category}: ${state.confidence}`);
});
```

---

## Integration with AGL

### With Emotion Service

```typescript
import { useAGLClient } from '@agl/web-sdk';
import { ScreenCapture, VisionAnalyzer, GameStateRecognizer } from '@agl/vision';

async function updateEmotionBasedOnGameState() {
  const screenshot = await capture.capture();
  const gameState = await recognizer.recognize(screenshot);

  // Update emotion based on game state
  if (gameState.category === 'victory') {
    emotionService.setEmotion('excited', 0.9);
  } else if (gameState.category === 'defeat') {
    emotionService.setEmotion('disappointed', 0.7);
  } else if (gameState.category === 'combat') {
    emotionService.setEmotion('confident', 0.8);
  }
}
```

### With Dialogue Service

```typescript
async function generateContextualDialogue() {
  const screenshot = await capture.capture();

  const analysis = await analyzer.analyze({
    screenshot,
    prompt: 'Describe what the player is doing in this game scene in one sentence.'
  });

  // Use analysis as context for dialogue
  const dialogue = await dialogueService.generate({
    context: analysis.content,
    emotion: 'happy'
  });

  console.log(dialogue); // "Wow, you're doing great in that battle!"
}
```

---

## Advanced Usage

### Continuous Monitoring

```typescript
for await (const gameState of recognizer.monitorState(
  () => capture.capture(),
  2000 // Check every 2 seconds
)) {
  console.log('Current state:', gameState.category);

  // React to state changes
  if (gameState.category === 'combat' && gameState.confidence > 0.8) {
    // High confidence combat detected
  }
}
```

### Custom Prompts

```typescript
const response = await analyzer.analyze({
  screenshot,
  prompt: `Analyze this game screenshot and tell me:
1. Is the player's health low?
2. Are there enemies nearby?
3. What items are visible?`,
  context: 'You are analyzing a screenshot from an RPG game.'
});
```

### Event Handlers

```typescript
const capture = new ScreenCapture(config, {
  onCapture: (screenshot) => console.log('Captured!', screenshot.size),
  onError: (error) => console.error('Capture error:', error),
  onStart: () => console.log('Capture started'),
  onStop: () => console.log('Capture stopped')
});

const analyzer = new VisionAnalyzer(config, {
  onAnalysisComplete: (response) => console.log('Analysis done:', response.content),
  onAnalysisError: (error) => console.error('Analysis error:', error),
  onGameStateDetected: (gameState) => console.log('State:', gameState.category)
});
```

---

## Performance

### Capture Performance

- Canvas capture: < 50ms
- Video capture: < 100ms
- Display capture: ~200ms (includes permission prompt)

### Analysis Performance

- GPT-4V: ~2-5 seconds per request
- Claude Vision: ~2-4 seconds per request
- Token usage: ~500-1500 tokens per image (varies by resolution)

### Optimization Tips

```typescript
// 1. Reduce image size
const capture = new ScreenCapture({
  maxWidth: 1280,  // Lower resolution = faster analysis
  maxHeight: 720,
  quality: 0.7     // Lower quality = smaller file size
});

// 2. Limit analysis frequency
setInterval(analyzeGameScreen, 5000); // Every 5 seconds instead of 1

// 3. Use specific prompts
const response = await analyzer.analyze({
  screenshot,
  prompt: 'Is this combat? Yes or no only.' // Shorter responses = fewer tokens
});
```

---

## Limitations & Constraints

### Configuration Limits

**ScreenCapture**:
- `quality`: Must be between 0 and 1
- `maxWidth`: Must be between 1 and 7680 pixels (8K width limit)
- `maxHeight`: Must be between 1 and 4320 pixels (8K height limit)
- `interval`: Must be at least 100ms for auto-capture
- `source`: Must be one of: 'canvas', 'video', 'display', 'window'

**VisionAnalyzer**:
- `apiKey`: Required, cannot be empty or whitespace-only
- `temperature`: Must be between 0 and 1
- `maxTokens`: Must be between 1 and 100,000
- `provider`: Must be one of: 'openai-gpt4v', 'anthropic-claude', 'custom'

### Error Handling

All configuration errors throw descriptive errors immediately:

```typescript
// ❌ This will throw: "CaptureConfig.quality must be between 0 and 1, got 1.5"
new ScreenCapture({
  source: 'canvas',
  target: '#canvas',
  quality: 1.5
});

// ❌ This will throw: "VisionConfig.apiKey is required and cannot be empty"
new VisionAnalyzer({
  provider: 'openai-gpt4v',
  apiKey: ''
});

// ❌ This will throw: "CaptureConfig.interval must be at least 100ms, got 50ms"
new ScreenCapture({
  source: 'canvas',
  target: '#canvas',
  interval: 50
});

// ✅ This is valid
new ScreenCapture({
  source: 'canvas',
  target: '#canvas',
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  interval: 1000
});
```

### Supported Capture Sources

**Implemented**:
- ✅ `canvas` - Capture from HTML Canvas element
- ✅ `video` - Capture from HTML Video element
- ✅ `display` - Capture using Screen Capture API (requires user permission)
- ✅ `window` - Alias for display capture

**Not Implemented**:
- ❌ Custom capture sources (use `analyzeWithCustom()` instead)

### Browser Compatibility

**Screen Capture API** (for `display` and `window` sources):
- Requires HTTPS or localhost
- Requires user permission (browser prompt)
- Not available in all browsers (see Browser Support section)

**Canvas/Video Capture**:
- Works in all modern browsers
- No special permissions required

### API Rate Limits

Vision API providers have rate limits:

**OpenAI GPT-4V**:
- Rate limits vary by tier
- Handle 429 errors with exponential backoff
- See: https://platform.openai.com/docs/guides/rate-limits

**Anthropic Claude**:
- Rate limits vary by tier
- Handle 429 errors with exponential backoff
- See: https://docs.anthropic.com/claude/reference/rate-limits

```typescript
// Example: Handle rate limit errors
const analyzer = new VisionAnalyzer(config, {
  onAnalysisError: async (error) => {
    if (error.message.includes('429')) {
      console.log('Rate limit hit, waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Implement retry logic here
    }
  }
});
```

---

## Unity Plugin

Place in `Assets/Plugins/AGL/Vision/`:

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

        // Convert to base64
        byte[] bytes = screenshot.EncodeToJPG(80);
        string base64 = System.Convert.ToBase64String(bytes);

        // Send to JavaScript
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
// Receive from Unity
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

## API Reference

See TypeScript definitions in `src/types/index.ts`.

---

## License

Proprietary - Copyright © 2024 AGL Team

---

**Bring vision to your AI companions. Let them see what players see.**
