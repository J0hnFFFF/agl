## AGL Unreal Engine SDK

Unreal Engine plugin for integrating AGL (AI Game Companion Engine) into your Unreal Engine projects.

## Features

- 🎮 **Emotion Analysis** - Analyze player events and get emotional responses
- 💬 **Dynamic Dialogue** - Generate context-aware NPC dialogue
- 🧠 **Memory System** - Store and retrieve player memories with semantic search
- 🎨 **Blueprint Support** - Full Blueprint and C++ API
- 🔒 **Type-Safe** - Complete Unreal type system integration
- ⚡ **Async Operations** - Non-blocking HTTP requests with delegates

## Requirements

- Unreal Engine 5.0 or later (tested with UE 5.3)
- Windows, macOS, or Linux development environment
- AGL backend services running

## Installation

### Method 1: Plugin Directory (Recommended)

1. Copy the `AGL` folder to your project's `Plugins` directory:
   ```
   YourProject/
   └── Plugins/
       └── AGL/
           ├── AGL.uplugin
           ├── Source/
           └── ...
   ```

2. Regenerate Visual Studio project files (right-click `.uproject` → Generate Visual Studio project files)

3. Open your project in Unreal Editor

4. Enable the plugin: Edit → Plugins → Search for "AGL" → Check the box → Restart

### Method 2: Engine Plugins Directory

1. Copy the `AGL` folder to your engine's `Plugins` directory:
   ```
   UE_5.3/Engine/Plugins/AGL/
   ```

2. Restart Unreal Editor

3. The plugin will be available in all projects

### Verify Installation

1. Open your project
2. Go to Edit → Plugins
3. Search for "AGL"
4. Verify it shows "Enabled"

## Quick Start

### C++ Setup

1. Add the plugin to your project's `.Build.cs` file:

```csharp
PublicDependencyModuleNames.AddRange(new string[] {
    "Core",
    "CoreUObject",
    "Engine",
    "AGL"  // Add this line
});
```

2. Include the AGL headers in your code:

```cpp
#include "AGLClient.h"
#include "AGLTypes.h"
```

3. Initialize the client:

```cpp
// Create and initialize AGL client
UAGLClient* AGLClient = NewObject<UAGLClient>();

FAGLConfig Config;
Config.ApiKey = TEXT("your-api-key");
Config.ApiBaseUrl = TEXT("https://api.yourgame.com");
Config.EmotionServiceUrl = TEXT("https://emotion.yourgame.com");
Config.DialogueServiceUrl = TEXT("https://dialogue.yourgame.com");
Config.MemoryServiceUrl = TEXT("https://memory.yourgame.com");

AGLClient->Initialize(Config);
AGLClient->SetPlayerId(TEXT("player-123"));
AGLClient->SetGameId(TEXT("my-game"));
```

4. Use the services:

```cpp
// Analyze emotion
FAGLEmotionRequest EmotionRequest;
EmotionRequest.EventType = EAGLEventType::Victory;
EmotionRequest.Data.Add(TEXT("mvp"), TEXT("true"));
EmotionRequest.Data.Add(TEXT("winStreak"), TEXT("5"));

FOnEmotionAnalysisComplete OnEmotionComplete;
OnEmotionComplete.BindLambda([](bool bSuccess, const FAGLEmotionResponse& Response)
{
    if (bSuccess)
    {
        UE_LOG(LogTemp, Log, TEXT("Emotion: %s, Intensity: %f"),
            *UEnum::GetValueAsString(Response.Emotion),
            Response.Intensity);
    }
});

AGLClient->GetEmotionService()->AnalyzeEmotion(EmotionRequest, OnEmotionComplete);

// Generate dialogue
FAGLDialogueRequest DialogueRequest;
DialogueRequest.EventType = EAGLEventType::Victory;
DialogueRequest.Emotion = EAGLEmotionType::Excited;
DialogueRequest.Persona = EAGLPersona::Cheerful;
DialogueRequest.PlayerId = TEXT("player-123");

FOnDialogueGenerationComplete OnDialogueComplete;
OnDialogueComplete.BindLambda([](bool bSuccess, const FAGLDialogueResponse& Response)
{
    if (bSuccess)
    {
        UE_LOG(LogTemp, Log, TEXT("Dialogue: %s"), *Response.Dialogue);
    }
});

AGLClient->GetDialogueService()->GenerateDialogue(DialogueRequest, OnDialogueComplete);
```

### Blueprint Setup

1. Create a Blueprint class that extends from Actor or GameInstance

2. Add AGL Client as a variable:
   - Variable Type: `AGL Client` (Object Reference)
   - Category: `AGL`

3. Initialize in BeginPlay or Init:

![Blueprint Initialization](docs/images/bp-init.png)

```
Event BeginPlay
  → Construct Object from Class (Class: AGL Client)
  → Set AGLClient variable
  → Initialize (Config: [ApiKey, URLs])
  → Set Player ID
  → Set Game ID
```

4. Call AGL services:

![Blueprint Usage](docs/images/bp-usage.png)

```
On Player Victory
  → Get Emotion Service
  → Create Victory Request (Helper)
  → Analyze Emotion
    → On Complete: Store Emotion Result

  → Get Dialogue Service
  → Generate Dialogue (EventType, Emotion, Persona)
    → On Complete: Display Dialogue in UI
```

## API Reference

### UAGLClient

Main client class for interacting with AGL services.

#### Methods

**Initialize(Config)**
- Initializes the client with configuration
- Parameters: `FAGLConfig Config`

**SetPlayerId(PlayerId)**
- Sets the current player ID
- Parameters: `FString PlayerId`

**SetGameId(GameId)**
- Sets the current game ID
- Parameters: `FString GameId`

**GetEmotionService()**
- Returns: `UAGLEmotionService*`

**GetDialogueService()**
- Returns: `UAGLDialogueService*`

**GetMemoryService()**
- Returns: `UAGLMemoryService*`

### UAGLEmotionService

Service for analyzing player emotions.

#### Methods

**AnalyzeEmotion(Request, OnComplete)**
- Analyzes emotion for a game event
- Parameters:
  - `FAGLEmotionRequest Request`
  - `FOnEmotionAnalysisComplete OnComplete`

**Helper Functions**:
- `CreateVictoryRequest(bIsMVP, WinStreak)` → `FAGLEmotionRequest`
- `CreateDefeatRequest(LossStreak)` → `FAGLEmotionRequest`
- `CreateAchievementRequest(Rarity)` → `FAGLEmotionRequest`
- `CreateKillRequest(KillCount, bIsLegendary)` → `FAGLEmotionRequest`

#### Event Types

- `Victory` - Player won a match/game
- `Defeat` - Player lost a match/game
- `Kill` - Player eliminated an opponent
- `Death` - Player was eliminated
- `Achievement` - Player unlocked an achievement
- `LevelUp` - Player gained a level
- `Loot` - Player obtained loot
- `SessionStart` - Player started a session
- `SessionEnd` - Player ended a session

#### Emotion Types

- Positive: `Happy`, `Excited`, `Amazed`, `Proud`, `Satisfied`, `Cheerful`, `Grateful`
- Negative: `Sad`, `Disappointed`, `Frustrated`, `Angry`, `Worried`, `Tired`
- Neutral: `Neutral`

### UAGLDialogueService

Service for generating dynamic NPC dialogue.

#### Methods

**GenerateDialogue(Request, OnComplete)**
- Generates dialogue for a game event
- Parameters:
  - `FAGLDialogueRequest Request`
  - `FOnDialogueGenerationComplete OnComplete`

#### Persona Types

- `Cheerful` - Enthusiastic, positive, energetic
- `Cool` - Calm, collected, understated
- `Cute` - Sweet, playful, endearing

### UAGLMemoryService

Service for managing player memories.

#### Methods

**CreateMemory(PlayerId, Request, OnComplete)**
- Creates a new memory
- Parameters:
  - `FString PlayerId`
  - `FAGLCreateMemoryRequest Request`
  - `FOnMemoryCreated OnComplete`

**SearchMemories(PlayerId, Request, OnComplete)**
- Searches memories using semantic similarity
- Parameters:
  - `FString PlayerId`
  - `FAGLSearchMemoriesRequest Request`
  - `FOnMemorySearchComplete OnComplete`

**GetContext(PlayerId, Request, OnComplete)**
- Gets relevant memories for current context
- Parameters:
  - `FString PlayerId`
  - `FAGLGetContextRequest Request`
  - `FOnGetMemoriesComplete OnComplete`

**GetMemories(PlayerId, Limit, Offset, OnComplete)**
- Gets recent memories
- Parameters:
  - `FString PlayerId`
  - `int32 Limit` (default: 10)
  - `int32 Offset` (default: 0)
  - `FOnGetMemoriesComplete OnComplete`

#### Memory Types

- `Achievement` - Significant accomplishments
- `Milestone` - Important progress markers
- `FirstTime` - First-time experiences
- `Dramatic` - Dramatic moments
- `Conversation` - Notable conversations
- `Event` - General events
- `Observation` - Observations about the player

## Usage Examples

### Example 1: Match Victory with Companion Reaction

```cpp
void AMyGameMode::OnMatchVictory(APlayerController* Player, bool bWasMVP, int32 WinStreak)
{
    // Create emotion request using helper
    FAGLEmotionRequest EmotionRequest = UAGLEmotionService::CreateVictoryRequest(
        bWasMVP,
        WinStreak
    );

    // Analyze emotion
    FOnEmotionAnalysisComplete OnEmotionComplete;
    OnEmotionComplete.BindLambda([this, Player](bool bSuccess, const FAGLEmotionResponse& EmotionResponse)
    {
        if (!bSuccess) return;

        // Update companion animation based on emotion
        UpdateCompanionAnimation(EmotionResponse.Emotion, EmotionResponse.Intensity);

        // Generate dialogue
        FAGLDialogueRequest DialogueRequest;
        DialogueRequest.EventType = EAGLEventType::Victory;
        DialogueRequest.Emotion = EmotionResponse.Emotion;
        DialogueRequest.Persona = EAGLPersona::Cheerful;
        DialogueRequest.PlayerId = AGLClient->GetPlayerId();

        FOnDialogueGenerationComplete OnDialogueComplete;
        OnDialogueComplete.BindLambda([this](bool bSuccess, const FAGLDialogueResponse& DialogueResponse)
        {
            if (bSuccess)
            {
                // Display dialogue in UI
                ShowCompanionDialogue(DialogueResponse.Dialogue);
            }
        });

        AGLClient->GetDialogueService()->GenerateDialogue(DialogueRequest, OnDialogueComplete);

        // Create memory if significant
        if (bWasMVP || WinStreak >= 3)
        {
            FAGLCreateMemoryRequest MemoryRequest;
            MemoryRequest.Type = EAGLMemoryType::Achievement;
            MemoryRequest.Content = FString::Printf(TEXT("Victory%s with %d win streak"),
                bWasMVP ? TEXT(" as MVP") : TEXT(""),
                WinStreak);
            MemoryRequest.Emotion = UEnum::GetValueAsString(EmotionResponse.Emotion);
            MemoryRequest.Importance = bWasMVP ? 9 : 7;

            FOnMemoryCreated OnMemoryCreated;
            OnMemoryCreated.BindLambda([](bool bSuccess, const FAGLMemory& Memory)
            {
                UE_LOG(LogTemp, Log, TEXT("Memory created: %s"), *Memory.Id);
            });

            AGLClient->GetMemoryService()->CreateMemory(
                AGLClient->GetPlayerId(),
                MemoryRequest,
                OnMemoryCreated
            );
        }
    });

    AGLClient->GetEmotionService()->AnalyzeEmotion(EmotionRequest, OnEmotionComplete);
}

void AMyGameMode::UpdateCompanionAnimation(EAGLEmotionType Emotion, float Intensity)
{
    // Play appropriate animation montage
    FString AnimationName;
    switch (Emotion)
    {
        case EAGLEmotionType::Excited:
            AnimationName = TEXT("Celebrate");
            break;
        case EAGLEmotionType::Happy:
            AnimationName = TEXT("Cheer");
            break;
        case EAGLEmotionType::Proud:
            AnimationName = TEXT("Victory");
            break;
        default:
            AnimationName = TEXT("Idle_Happy");
            break;
    }

    // Play montage with intensity as playback rate
    if (CompanionCharacter && CompanionCharacter->GetMesh())
    {
        UAnimInstance* AnimInstance = CompanionCharacter->GetMesh()->GetAnimInstance();
        if (AnimInstance)
        {
            UAnimMontage* Montage = CompanionAnimations.FindRef(AnimationName);
            if (Montage)
            {
                AnimInstance->Montage_Play(Montage, 0.5f + Intensity * 0.5f);
            }
        }
    }
}
```

### Example 2: Personalized Greeting Using Memories

```cpp
void AMyGameMode::OnPlayerLogin(APlayerController* Player, const FString& PlayerId)
{
    AGLClient->SetPlayerId(PlayerId);

    // Search for recent significant memories
    FAGLSearchMemoriesRequest SearchRequest;
    SearchRequest.Query = TEXT("achievement victory milestone");
    SearchRequest.Limit = 3;

    FOnMemorySearchComplete OnSearchComplete;
    OnSearchComplete.BindLambda([this, PlayerId](bool bSuccess, const TArray<FAGLMemorySearchResult>& Results)
    {
        if (!bSuccess) return;

        // Build context from memories
        TMap<FString, FString> Context;
        if (Results.Num() > 0)
        {
            FString RecentAchievements;
            for (int32 i = 0; i < Results.Num(); i++)
            {
                RecentAchievements += Results[i].Memory.Content;
                if (i < Results.Num() - 1)
                {
                    RecentAchievements += TEXT(", ");
                }
            }
            Context.Add(TEXT("recentAchievements"), RecentAchievements);
            Context.Add(TEXT("lastEmotion"), Results[0].Memory.Emotion);
        }

        // Generate personalized greeting
        FAGLDialogueRequest GreetingRequest;
        GreetingRequest.EventType = EAGLEventType::SessionStart;
        GreetingRequest.Emotion = EAGLEmotionType::Cheerful;
        GreetingRequest.Persona = EAGLPersona::Cheerful;
        GreetingRequest.PlayerId = PlayerId;
        GreetingRequest.Context = Context;

        FOnDialogueGenerationComplete OnDialogueComplete;
        OnDialogueComplete.BindLambda([this](bool bSuccess, const FAGLDialogueResponse& Response)
        {
            if (bSuccess)
            {
                ShowCompanionDialogue(Response.Dialogue);
            }
        });

        AGLClient->GetDialogueService()->GenerateDialogue(GreetingRequest, OnDialogueComplete);
    });

    AGLClient->GetMemoryService()->SearchMemories(PlayerId, SearchRequest, OnSearchComplete);
}
```

### Example 3: Achievement System Integration

```cpp
void AMyPlayerController::OnAchievementUnlocked(const FAchievementData& Achievement)
{
    // Create achievement emotion request
    FAGLEmotionRequest EmotionRequest = UAGLEmotionService::CreateAchievementRequest(
        Achievement.Rarity  // "common", "epic", or "legendary"
    );
    EmotionRequest.Data.Add(TEXT("achievementId"), Achievement.Id);
    EmotionRequest.Data.Add(TEXT("achievementName"), Achievement.Name);

    FOnEmotionAnalysisComplete OnComplete;
    OnComplete.BindLambda([this, Achievement](bool bSuccess, const FAGLEmotionResponse& Response)
    {
        if (!bSuccess) return;

        // Generate companion reaction
        FAGLDialogueRequest DialogueRequest;
        DialogueRequest.EventType = EAGLEventType::Achievement;
        DialogueRequest.Emotion = Response.Emotion;
        DialogueRequest.Persona = EAGLPersona::Cute;
        DialogueRequest.PlayerId = AGLClient->GetPlayerId();
        DialogueRequest.Context.Add(TEXT("achievementName"), Achievement.Name);
        DialogueRequest.Context.Add(TEXT("rarity"), Achievement.Rarity);

        FOnDialogueGenerationComplete OnDialogueComplete;
        OnDialogueComplete.BindLambda([this, Response](bool bSuccess, const FAGLDialogueResponse& DialogueResponse)
        {
            if (bSuccess)
            {
                ShowAchievementNotification(Response.Emotion, DialogueResponse.Dialogue);
            }
        });

        AGLClient->GetDialogueService()->GenerateDialogue(DialogueRequest, OnDialogueComplete);

        // Create memory
        FAGLCreateMemoryRequest MemoryRequest;
        MemoryRequest.Type = EAGLMemoryType::Achievement;
        MemoryRequest.Content = FString::Printf(TEXT("Unlocked: %s"), *Achievement.Name);
        MemoryRequest.Emotion = UEnum::GetValueAsString(Response.Emotion);
        MemoryRequest.Importance = Achievement.Rarity == TEXT("legendary") ? 10 :
                                    Achievement.Rarity == TEXT("epic") ? 7 : 5;
        MemoryRequest.Context.Add(TEXT("achievementId"), Achievement.Id);
        MemoryRequest.Context.Add(TEXT("rarity"), Achievement.Rarity);

        FOnMemoryCreated OnMemoryCreated;
        OnMemoryCreated.BindLambda([](bool bSuccess, const FAGLMemory& Memory) {});

        AGLClient->GetMemoryService()->CreateMemory(
            AGLClient->GetPlayerId(),
            MemoryRequest,
            OnMemoryCreated
        );
    });

    AGLClient->GetEmotionService()->AnalyzeEmotion(EmotionRequest, OnComplete);
}
```

## Configuration

### Development Environment

For local development, configure the SDK to use localhost:

```cpp
FAGLConfig Config;
Config.ApiKey = TEXT("dev-api-key");
Config.ApiBaseUrl = TEXT("http://localhost:3000");
Config.EmotionServiceUrl = TEXT("http://localhost:8000");
Config.DialogueServiceUrl = TEXT("http://localhost:8001");
Config.MemoryServiceUrl = TEXT("http://localhost:3002");
Config.Timeout = 30.0f;
```

### Production Environment

For production, use your deployed service URLs:

```cpp
FAGLConfig Config;
Config.ApiKey = TEXT("prod-api-key-from-server");
Config.ApiBaseUrl = TEXT("https://api.yourgame.com");
Config.EmotionServiceUrl = TEXT("https://emotion.yourgame.com");
Config.DialogueServiceUrl = TEXT("https://dialogue.yourgame.com");
Config.MemoryServiceUrl = TEXT("https://memory.yourgame.com");
Config.Timeout = 30.0f;
```

### Using Config Files

Store configuration in DefaultGame.ini or custom config file:

```ini
[/Script/AGL.AGLClient]
ApiKey="your-api-key"
ApiBaseUrl="https://api.yourgame.com"
EmotionServiceUrl="https://emotion.yourgame.com"
DialogueServiceUrl="https://dialogue.yourgame.com"
MemoryServiceUrl="https://memory.yourgame.com"
Timeout=30.0
```

Load in code:

```cpp
FAGLConfig Config;
GConfig->GetString(TEXT("/Script/AGL.AGLClient"), TEXT("ApiKey"), Config.ApiKey, GGameIni);
GConfig->GetString(TEXT("/Script/AGL.AGLClient"), TEXT("ApiBaseUrl"), Config.ApiBaseUrl, GGameIni);
// ... load other settings
```

## Error Handling

All service methods are asynchronous and use delegates. Check the `bSuccess` parameter:

```cpp
FOnEmotionAnalysisComplete OnComplete;
OnComplete.BindLambda([](bool bSuccess, const FAGLEmotionResponse& Response)
{
    if (bSuccess)
    {
        // Handle successful response
        UE_LOG(LogTemp, Log, TEXT("Emotion: %s"), *UEnum::GetValueAsString(Response.Emotion));
    }
    else
    {
        // Handle error
        UE_LOG(LogTemp, Error, TEXT("Failed to analyze emotion"));
        // Show fallback dialogue or animation
    }
});
```

### Common Error Scenarios

- **Network Error**: Service unreachable, check URLs and network connection
- **Authentication Error**: Invalid API key
- **Timeout**: Request took too long, increase timeout or check service health
- **Invalid Request**: Check request parameters

## Performance Considerations

### Caching
- AGL services implement intelligent caching
- Similar requests return cached results (indicated by `bCacheHit`)
- Cache hits have zero cost and minimal latency

### Cost Optimization
- Rule-based emotion analysis costs $0
- Template-based dialogue generation costs $0
- ML/LLM methods used only when necessary
- Set `bForceML` and `bForceLLM` to `false` for cost savings

### Threading
- All HTTP requests are non-blocking
- Callbacks execute on the game thread
- No additional threading management needed

## Troubleshooting

### Plugin Not Showing in Editor

1. Verify `.uplugin` file is in correct location
2. Regenerate Visual Studio project files
3. Rebuild project
4. Check Plugins window (Edit → Plugins)

### Compilation Errors

1. Ensure plugin is added to `.Build.cs`
2. Check Unreal Engine version compatibility (5.0+)
3. Verify all dependencies are present (Http, Json, JsonUtilities)

### Runtime Errors

1. Check service URLs are correct and accessible
2. Verify API key is valid
3. Check Unreal logs for HTTP error details
4. Test services directly using curl or Postman

### HTTP Request Failures

1. Enable verbose logging: `LogHttp` category
2. Check firewall/antivirus settings
3. Verify SSL certificates (for HTTPS)
4. Test with local services first

## Platform Support

Tested platforms:
- ✅ Windows (Win64)
- ✅ Linux
- ✅ macOS
- ⚠️ Android (untested but should work)
- ⚠️ iOS (untested but should work)
- ❌ Consoles (requires testing and possibly custom HTTP module)

## Blueprint Examples

See `Content/Examples/` for Blueprint example projects demonstrating:
- Basic emotion analysis
- Dialogue generation
- Memory management
- Companion character integration
- UI integration

## License

Proprietary - AGL Team

## Support

For issues, questions, or feature requests, contact the AGL team.

## Version History

### 0.1.0 (Current)
- Initial release
- Core emotion, dialogue, and memory services
- Blueprint and C++ support
- Helper functions for common operations
