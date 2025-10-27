### AGL Vision - Unreal Engine Plugin

Unreal Engine C++ plugin for capturing game screens and sending them to the @agl/vision system for AI analysis.

---

## Installation

### 1. Create Plugin Directory

Create the following directory structure in your Unreal project:

```
[YourProject]/
  Plugins/
    AGLVision/
      Source/
        AGLVision/
          Public/
            AGLVisionCapture.h
          Private/
            AGLVisionCapture.cpp
          AGLVision.Build.cs
      AGLVision.uplugin
```

### 2. Copy Plugin Files

- Copy `AGLVisionCapture.h` to `Public/`
- Copy `AGLVisionCapture.cpp` to `Private/`

### 3. Create Build File

Create `AGLVision.Build.cs`:

```csharp
using UnrealBuildTool;

public class AGLVision : ModuleRules
{
    public AGLVision(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[] {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "RenderCore",
            "RHI",
            "ImageWrapper"
        });

        PrivateDependencyModuleNames.AddRange(new string[] {
            "Slate",
            "SlateCore"
        });
    }
}
```

### 4. Create Plugin Descriptor

Create `AGLVision.uplugin`:

```json
{
  "FileVersion": 3,
  "Version": 1,
  "VersionName": "0.1.0",
  "FriendlyName": "AGL Vision",
  "Description": "Screen capture for AI game companion vision analysis",
  "Category": "AI",
  "CreatedBy": "AGL Team",
  "CreatedByURL": "https://github.com/agl",
  "DocsURL": "",
  "MarketplaceURL": "",
  "SupportURL": "",
  "CanContainContent": false,
  "IsBetaVersion": true,
  "IsExperimentalVersion": false,
  "Installed": false,
  "Modules": [
    {
      "Name": "AGLVision",
      "Type": "Runtime",
      "LoadingPhase": "Default"
    }
  ]
}
```

### 5. Enable Plugin

1. Open your Unreal project
2. **Edit → Plugins**
3. Find "AGL Vision" under "Project" category
4. Check "Enabled"
5. Restart Unreal Editor

---

## Usage

### Blueprint Setup

1. **Create Actor**:
   - Content Browser → Right-click → Blueprint Class
   - Select "AGLVisionCapture" as parent class
   - Name it "BP_AGLVisionCapture"

2. **Place in Level**:
   - Drag BP_AGLVisionCapture into your level
   - Configure settings in Details panel

3. **Settings**:
   - Capture Width: 1920
   - Capture Height: 1080
   - JPEG Quality: 80
   - Capture Interval: 1.0
   - Auto Start: ✓

### C++ Usage

```cpp
// MyGameMode.h
#include "AGLVisionCapture.h"

UCLASS()
class AMyGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Vision")
    AAGLVisionCapture* VisionCapture;
};

// MyGameMode.cpp
void AMyGameMode::BeginPlay()
{
    Super::BeginPlay();

    // Spawn vision capture actor
    FActorSpawnParameters SpawnParams;
    VisionCapture = GetWorld()->SpawnActor<AAGLVisionCapture>(
        AAGLVisionCapture::StaticClass(),
        FVector::ZeroVector,
        FRotator::ZeroRotator,
        SpawnParams
    );

    if (VisionCapture)
    {
        VisionCapture->CaptureWidth = 1280;
        VisionCapture->CaptureHeight = 720;
        VisionCapture->CaptureInterval = 2.0f;
        VisionCapture->StartCapture();
    }
}
```

### Blueprint Functions

Available Blueprint nodes:

- **Start Capture** - Begin automatic screen capture
- **Stop Capture** - Stop automatic screen capture
- **Capture Now** - Capture single screenshot immediately
- **Is Capturing** - Check if capture is running

Example Blueprint:

```
Event BeginPlay
  ↓
Get Actor of Class (AGLVisionCapture)
  ↓
Start Capture
```

---

## JavaScript Integration

### 1. Define Callback Function

In your HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { VisionAnalyzer, GameStateRecognizer } from '@agl/vision';

    // Setup analyzer
    const analyzer = new VisionAnalyzer({
      provider: 'openai-gpt4v',
      apiKey: 'your-api-key'
    });

    const recognizer = new GameStateRecognizer(analyzer);

    // Unreal callback
    window.CaptureScreen = async function(base64Data) {
      console.log('Received screenshot from Unreal');

      const screenshot = {
        data: base64Data,
        format: 'jpeg',
        width: 1920,
        height: 1080,
        timestamp: Date.now(),
        size: base64Data.length
      };

      // Analyze
      const gameState = await recognizer.recognize(screenshot);

      console.log('Game state:', gameState.category);
      console.log('Confidence:', gameState.confidence);

      // React to state
      if (gameState.category === 'combat') {
        companion.cheer('You can do it!');
      }
    };
  </script>
</head>
<body>
  <!-- Unreal WebAssembly content will load here -->
  <div id="unreal-container"></div>
</body>
</html>
```

### 2. Complete Example

```javascript
// vision-integration.js
import { VisionAnalyzer, GameStateRecognizer } from '@agl/vision';

class UnrealVisionIntegration {
  constructor(apiKey) {
    this.analyzer = new VisionAnalyzer({
      provider: 'openai-gpt4v',
      apiKey: apiKey
    });

    this.recognizer = new GameStateRecognizer(this.analyzer);

    // Register callback
    window.CaptureScreen = this.handleCapture.bind(this);
  }

  async handleCapture(base64Data) {
    const screenshot = {
      data: base64Data,
      format: 'jpeg',
      width: 1920,
      height: 1080,
      timestamp: Date.now(),
      size: base64Data.length
    };

    try {
      const gameState = await this.recognizer.recognize(screenshot);

      this.onGameStateDetected(gameState);
    } catch (error) {
      console.error('Vision analysis error:', error);
    }
  }

  onGameStateDetected(gameState) {
    // Override this method to handle game states
    console.log('Detected:', gameState.category, gameState.confidence);
  }
}

// Usage
const integration = new UnrealVisionIntegration('your-api-key');
integration.onGameStateDetected = (gameState) => {
  if (gameState.category === 'victory') {
    companionAI.celebrate();
  } else if (gameState.category === 'defeat') {
    companionAI.comfort();
  }
};
```

---

## Performance Optimization

### Adjust Capture Settings

Lower resolution and quality for better performance:

```cpp
VisionCapture->CaptureWidth = 1280;
VisionCapture->CaptureHeight = 720;
VisionCapture->JPEGQuality = 70;
VisionCapture->CaptureInterval = 2.0f;
```

### Conditional Capture

Capture only during important moments:

```cpp
// In your game mode or controller
void AMyPlayerController::OnCombatStart()
{
    if (VisionCapture && !VisionCapture->IsCapturing())
    {
        VisionCapture->StartCapture();
    }
}

void AMyPlayerController::OnCombatEnd()
{
    if (VisionCapture && VisionCapture->IsCapturing())
    {
        VisionCapture->StopCapture();
    }
}
```

### Event-Based Capture

Capture on specific events instead of intervals:

```cpp
void AMyCharacter::OnPlayerDeath()
{
    if (VisionCapture)
    {
        VisionCapture->CaptureNow();
    }
}

void AMyBoss::OnBossDefeated()
{
    if (VisionCapture)
    {
        VisionCapture->CaptureNow();
    }
}
```

---

## Build Configuration

### HTML5 (WebAssembly) Platform

1. **Install HTML5 Platform Support**:
   - Epic Games Launcher → Library → Engine Version → Options
   - Select "HTML5" platform

2. **Project Settings**:
   - **Edit → Project Settings → Platforms → HTML5**
   - Enable "Use fixed time step" for consistent capture timing

3. **Build Settings**:
   - **File → Package Project → HTML5**
   - Choose output directory
   - Wait for build to complete

### Packaging

Ensure your `.uplugin` file is included in packaged builds:

```json
{
  "CanContainContent": false,
  "Installed": false
}
```

---

## Troubleshooting

### "CaptureScreen is not defined"

**Problem**: JavaScript callback not found

**Solution**: Define `window.CaptureScreen` before loading Unreal:

```html
<script>
  // Define BEFORE Unreal loads
  window.CaptureScreen = function(base64) {
    console.log('Captured:', base64.length);
  };
</script>
<script src="UnrealGame.js"></script>
```

### "Render target not initialized"

**Problem**: Capture called before BeginPlay

**Solution**: Wait for actor to initialize:

```cpp
void AMyGameMode::BeginPlay()
{
    Super::BeginPlay();

    // Wait one frame
    FTimerHandle TimerHandle;
    GetWorld()->GetTimerManager().SetTimer(TimerHandle, [this]()
    {
        if (VisionCapture)
        {
            VisionCapture->StartCapture();
        }
    }, 0.1f, false);
}
```

### "Module 'ImageWrapper' not found"

**Problem**: Missing module dependency

**Solution**: Add to `.Build.cs`:

```csharp
PublicDependencyModuleNames.AddRange(new string[] {
    "ImageWrapper"  // Add this
});
```

### Performance Issues

**Solutions**:

1. Lower resolution:
   ```cpp
   VisionCapture->CaptureWidth = 1280;
   VisionCapture->CaptureHeight = 720;
   ```

2. Reduce capture frequency:
   ```cpp
   VisionCapture->CaptureInterval = 3.0f; // Every 3 seconds
   ```

3. Lower JPEG quality:
   ```cpp
   VisionCapture->JPEGQuality = 60;
   ```

---

## Examples

### Dynamic Quality Adjustment

```cpp
// Adjust quality based on performance
void AMyGameMode::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    float FPS = 1.0f / DeltaTime;

    if (VisionCapture)
    {
        if (FPS < 30.0f)
        {
            // Low FPS - reduce capture quality
            VisionCapture->CaptureWidth = 1280;
            VisionCapture->CaptureHeight = 720;
            VisionCapture->CaptureInterval = 3.0f;
        }
        else if (FPS > 60.0f)
        {
            // High FPS - increase quality
            VisionCapture->CaptureWidth = 1920;
            VisionCapture->CaptureHeight = 1080;
            VisionCapture->CaptureInterval = 1.0f;
        }
    }
}
```

### Capture During Specific Game States

```cpp
void AMyGameMode::OnGameStateChanged(EGameState NewState)
{
    if (!VisionCapture) return;

    switch (NewState)
    {
    case EGameState::Combat:
        VisionCapture->CaptureInterval = 0.5f; // Fast capture during combat
        VisionCapture->StartCapture();
        break;

    case EGameState::Exploration:
        VisionCapture->CaptureInterval = 3.0f; // Slow capture during exploration
        break;

    case EGameState::Cutscene:
        VisionCapture->StopCapture(); // Don't capture cutscenes
        break;

    default:
        break;
    }
}
```

---

## API Reference

### Public Functions

```cpp
void StartCapture()          // Start automatic capture
void StopCapture()           // Stop automatic capture
void CaptureNow()            // Capture immediately
bool IsCapturing() const     // Check if capturing
```

### Public Properties

```cpp
int32 CaptureWidth           // Screenshot width (640-3840)
int32 CaptureHeight          // Screenshot height (480-2160)
int32 JPEGQuality            // JPEG quality (1-100)
float CaptureInterval        // Capture interval in seconds
bool bAutoStart              // Auto-start on BeginPlay
bool bEnableDebug            // Enable debug logging
```

---

## Technical Details

### Capture Process

1. Read viewport pixels to render target
2. Convert FColor array to JPEG
3. Encode JPEG bytes to Base64
4. Call JavaScript via Emscripten

### Memory Management

- Render target created on BeginPlay
- Cleaned up on EndPlay
- Reused for all captures (no per-frame allocation)

### Threading

- All operations on game thread
- HTML5/WebAssembly is single-threaded

---

## Requirements

- **Unreal Engine**: 4.27 or 5.x
- **Platform**: HTML5 (WebAssembly) only
- **Modules**: Core, Engine, RenderCore, RHI, ImageWrapper

---

## License

Proprietary - Copyright © 2024 AGL Team

---

**Enable your AI companions to see and understand Unreal Engine games.**
