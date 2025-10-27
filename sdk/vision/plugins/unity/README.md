# AGL Vision - Unity Plugin

Unity C# plugin for capturing game screens and sending them to the @agl/vision system for AI analysis.

---

## Installation

### 1. Copy Plugin Files

Place `AGLVisionCapture.cs` in your Unity project:

```
Assets/
  Plugins/
    AGL/
      Vision/
        AGLVisionCapture.cs
```

### 2. Attach to GameObject

1. Create an empty GameObject in your scene (or use an existing one)
2. Add Component → Scripts → AGL → Vision → AGLVisionCapture
3. Configure settings in the Inspector

---

## Configuration

### Inspector Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Capture Camera** | Camera to capture from | Main Camera |
| **Capture Width** | Screenshot width (640-3840) | 1920 |
| **Capture Height** | Screenshot height (480-2160) | 1080 |
| **JPEG Quality** | Image quality 1-100 | 80 |
| **Capture Interval** | Seconds between captures | 1.0 |
| **Auto Start** | Start capturing on Start() | true |
| **Enable Debug** | Log debug messages | false |

---

## Usage

### Automatic Capture (Default)

With **Auto Start** enabled, captures begin automatically:

```csharp
// No code needed - just attach the component!
```

### Manual Control

```csharp
using AGL.Vision;

public class GameManager : MonoBehaviour
{
    public AGLVisionCapture visionCapture;

    void Start()
    {
        // Start capture
        visionCapture.StartCapture();
    }

    void OnBossFightStart()
    {
        // Capture immediately
        visionCapture.CaptureNow();
    }

    void OnPause()
    {
        // Stop capture
        visionCapture.StopCapture();
    }

    void OnResume()
    {
        // Resume capture
        visionCapture.StartCapture();
    }
}
```

### Check Capture Status

```csharp
if (visionCapture.IsCapturing())
{
    Debug.Log("Vision capture is active");
}
```

---

## JavaScript Integration

### 1. Define Callback Function

In your HTML/JavaScript file, define the callback that receives screenshots:

```javascript
// Receive screenshots from Unity
window.CaptureScreen = async function(base64Data) {
  console.log(`Received screenshot: ${base64Data.length} chars`);

  // Create screenshot object
  const screenshot = {
    data: base64Data,
    format: 'jpeg',
    width: 1920,
    height: 1080,
    timestamp: Date.now(),
    size: base64Data.length
  };

  // Analyze with @agl/vision
  const gameState = await recognizer.recognize(screenshot);

  console.log('Detected state:', gameState.category);
  console.log('Confidence:', gameState.confidence);

  // React to game state
  if (gameState.category === 'combat') {
    emotionService.setEmotion('excited', 0.9);
  }
};
```

### 2. Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { VisionAnalyzer, GameStateRecognizer } from '@agl/vision';

    // Setup vision analyzer
    const analyzer = new VisionAnalyzer({
      provider: 'openai-gpt4v',
      apiKey: 'your-api-key'
    });

    const recognizer = new GameStateRecognizer(analyzer);

    // Unity callback
    window.CaptureScreen = async function(base64Data) {
      const screenshot = {
        data: base64Data,
        format: 'jpeg',
        width: 1920,
        height: 1080,
        timestamp: Date.now(),
        size: base64Data.length
      };

      // Analyze game state
      const gameState = await recognizer.recognize(screenshot);

      // Update companion based on game state
      if (gameState.category === 'victory') {
        companion.celebrate();
      } else if (gameState.category === 'defeat') {
        companion.comfort();
      } else if (gameState.category === 'combat') {
        companion.cheer();
      }
    };
  </script>
</head>
<body>
  <!-- Unity WebGL content -->
  <div id="unity-container"></div>
</body>
</html>
```

---

## Performance Optimization

### Adjust Capture Settings

```csharp
// Lower resolution for faster processing
visionCapture.captureWidth = 1280;
visionCapture.captureHeight = 720;

// Lower quality for smaller file size
visionCapture.jpegQuality = 70;

// Capture less frequently
visionCapture.captureInterval = 2.0f; // Every 2 seconds
```

### Dynamic Adjustment

```csharp
public class AdaptiveCapture : MonoBehaviour
{
    public AGLVisionCapture visionCapture;

    void Update()
    {
        // Capture more frequently during important moments
        if (IsBossFight())
        {
            visionCapture.captureInterval = 0.5f; // 2x per second
        }
        else
        {
            visionCapture.captureInterval = 2.0f; // Every 2 seconds
        }
    }
}
```

---

## Build Settings

### WebGL Platform

1. **File → Build Settings → WebGL**
2. **Player Settings → Publishing Settings:**
   - Compression Format: **Disabled** or **Gzip** (not Brotli)
   - Enable Exceptions: **Explicitly Thrown Exceptions Only**

### Template

Use a custom template to include @agl/vision:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./agl-vision-init.js"></script>
</head>
<body>
  {{{ UNITY_WEBGL_LOADER_GLUE }}}
</body>
</html>
```

---

## Troubleshooting

### "CaptureScreen is not defined"

**Problem**: JavaScript callback not found

**Solution**: Ensure `window.CaptureScreen` is defined before Unity loads:

```javascript
// Define BEFORE loading Unity
window.CaptureScreen = function(base64Data) {
  console.log('Received:', base64Data.length, 'chars');
};

// Then load Unity
createUnityInstance(canvas, config);
```

### "No camera found"

**Problem**: Main Camera not found

**Solution**: Either:
1. Tag your camera as "MainCamera"
2. Assign the camera manually in Inspector

### "DllNotFoundException"

**Problem**: Running in editor or non-WebGL platform

**Solution**: This is normal - the plugin only works in WebGL builds. Use `#if UNITY_WEBGL` checks:

```csharp
#if UNITY_WEBGL && !UNITY_EDITOR
CaptureScreen(base64Data);
#else
Debug.Log("Capture only works in WebGL builds");
#endif
```

### Performance Issues

**Problem**: Low framerate during capture

**Solutions**:
1. Reduce capture resolution
2. Increase capture interval
3. Lower JPEG quality
4. Use a separate camera with lower quality settings

---

## Examples

### Capture Only During Combat

```csharp
public class CombatCapture : MonoBehaviour
{
    public AGLVisionCapture visionCapture;

    void Start()
    {
        visionCapture.autoStart = false;
    }

    public void OnCombatStart()
    {
        visionCapture.StartCapture();
    }

    public void OnCombatEnd()
    {
        visionCapture.StopCapture();
    }
}
```

### Capture Different Cameras

```csharp
public class MultiCameraCapture : MonoBehaviour
{
    public AGLVisionCapture mainCapture;
    public AGLVisionCapture minimapCapture;

    void Start()
    {
        // Capture main view every second
        mainCapture.captureCamera = Camera.main;
        mainCapture.captureInterval = 1.0f;

        // Capture minimap every 5 seconds
        minimapCapture.captureCamera = minimapCamera;
        minimapCapture.captureInterval = 5.0f;

        mainCapture.StartCapture();
        minimapCapture.StartCapture();
    }
}
```

### Capture on Specific Events

```csharp
public class EventCapture : MonoBehaviour
{
    public AGLVisionCapture visionCapture;

    void Start()
    {
        visionCapture.autoStart = false;
    }

    public void OnPlayerDeath()
    {
        visionCapture.CaptureNow();
    }

    public void OnLevelComplete()
    {
        visionCapture.CaptureNow();
    }

    public void OnBossDefeated()
    {
        visionCapture.CaptureNow();
    }
}
```

---

## Technical Details

### Memory Management

The plugin automatically:
- Creates RenderTexture and Texture2D on Start()
- Cleans up textures on Destroy()
- Reuses textures between captures (no allocations per frame)

### Thread Safety

All captures happen on the main thread. WebGL is single-threaded, so this is safe.

### Capture Process

1. Save current camera target
2. Render camera to RenderTexture
3. Read pixels to Texture2D
4. Restore camera target
5. Encode to JPEG
6. Convert to Base64
7. Call JavaScript callback

---

## API Reference

### Public Methods

```csharp
void StartCapture()           // Start automatic capture loop
void StopCapture()            // Stop automatic capture loop
void CaptureNow()             // Capture single screenshot immediately
bool IsCapturing()            // Check if capture is running
```

### Public Fields

```csharp
Camera captureCamera          // Camera to capture from
int captureWidth              // Screenshot width (640-3840)
int captureHeight             // Screenshot height (480-2160)
int jpegQuality               // JPEG quality (1-100)
float captureInterval         // Capture interval in seconds
bool autoStart                // Start automatically on Start()
bool enableDebug              // Enable debug logging
```

---

## Requirements

- **Unity Version**: 2019.4 or higher
- **Platform**: WebGL only
- **C# Version**: .NET 4.x or .NET Standard 2.0

---

## License

Proprietary - Copyright © 2024 AGL Team

---

**Enable your AI companions to see and understand what players are experiencing.**
