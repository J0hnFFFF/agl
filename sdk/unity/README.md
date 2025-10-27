# AGL Unity SDK

Unity SDK for integrating AI companion characters powered by AGL (AI Game Companion Engine).

## Features

- **Emotion Analysis** - Detect player emotions from game events
- **Dialogue Generation** - Generate contextual character dialogue
- **Memory Management** - Store and retrieve player memories
- **Easy Integration** - Simple API with Unity-friendly patterns
- **Type Safe** - Full C# models and enums
- **Coroutine-Based** - Async operations using Unity coroutines

## Installation

### Via Unity Package Manager

1. Open Unity Package Manager (`Window > Package Manager`)
2. Click `+` button → `Add package from git URL`
3. Enter: `https://github.com/your-org/agl-sdk.git#upm`

### Manual Installation

1. Copy the `sdk/unity` folder to your Unity project's `Packages` directory
2. Unity will automatically detect and import the package

## Quick Start

### 1. Setup Configuration

Add `AGLClient` component to a GameObject in your scene:

```csharp
using UnityEngine;
using AGL.SDK.Core;

public class GameManager : MonoBehaviour
{
    private AGLClient aglClient;

    void Start()
    {
        // Get or create AGL client
        aglClient = AGLClient.Instance;

        // Set player ID
        aglClient.SetPlayerId("player-123");

        // Check service health
        aglClient.CheckHealth((report) => Debug.Log(report));
    }
}
```

### 2. Configure Settings

Open Unity Editor settings: `Edit > Project Settings > AGL SDK`

Configure your API endpoints:
- **API Key**: Your AGL API key
- **API Base URL**: `http://localhost:3000`
- **Emotion Service URL**: `http://localhost:8000`
- **Dialogue Service URL**: `http://localhost:8001`
- **Memory Service URL**: `http://localhost:3002`

### 3. Analyze Emotions

```csharp
using AGL.SDK.Models;
using AGL.SDK.Services;

// Create emotion request
var request = EmotionService.CreateVictoryRequest(
    isMVP: true,
    winStreak: 5
);

// Analyze emotion
StartCoroutine(aglClient.Emotion.AnalyzeEmotion(
    request,
    (response) =>
    {
        Debug.Log($"Emotion: {response.emotion}");
        Debug.Log($"Intensity: {response.intensity}");
        Debug.Log($"Action: {response.action}");
    },
    (error) => Debug.LogError(error)
));
```

### 4. Generate Dialogue

```csharp
// Create dialogue request
var request = new DialogueRequest(
    "player.victory",
    "happy",
    Persona.Cheerful
);

// Add context
DialogueService.AddWinStreakContext(request, 5);

// Generate dialogue
StartCoroutine(aglClient.Dialogue.GenerateDialogue(
    request,
    (response) =>
    {
        Debug.Log($"Dialogue: {response.dialogue}");
        // Display dialogue in UI
        dialogueText.text = response.dialogue;
    },
    (error) => Debug.LogError(error)
));
```

### 5. Create Memories

```csharp
// Create memory request
var request = new CreateMemoryRequest(
    MemoryType.Achievement,
    "Defeated legendary boss",
    "amazed"
);

// Set importance
MemoryService.SetImportance(request, 0.9f);

// Create memory
StartCoroutine(aglClient.Memory.CreateMemory(
    playerId,
    request,
    (memory) => Debug.Log($"Memory created: {memory.id}"),
    (error) => Debug.LogError(error)
));
```

## Complete Example

See `Samples~/BasicIntegration/BasicExample.cs` for a complete working example.

```csharp
public void OnPlayerVictory(bool isMVP, int winStreak)
{
    // 1. Analyze emotion
    var emotionRequest = EmotionService.CreateVictoryRequest(isMVP, winStreak);

    StartCoroutine(aglClient.Emotion.AnalyzeEmotion(
        emotionRequest,
        (emotionResponse) =>
        {
            // 2. Generate dialogue
            var dialogueRequest = new DialogueRequest(
                "player.victory",
                emotionResponse.emotion,
                Persona.Cheerful
            );

            StartCoroutine(aglClient.Dialogue.GenerateDialogue(
                dialogueRequest,
                (dialogueResponse) =>
                {
                    // Display dialogue
                    ShowDialogue(dialogueResponse.dialogue);

                    // 3. Create memory
                    CreateVictoryMemory(isMVP, winStreak);
                },
                (error) => Debug.LogError(error)
            ));
        },
        (error) => Debug.LogError(error)
    ));
}
```

## API Reference

### EmotionService

**Analyze Emotion**:
```csharp
IEnumerator AnalyzeEmotion(
    EmotionRequest request,
    Action<EmotionResponse> onSuccess,
    Action<string> onError
)
```

**Helper Methods**:
- `CreateVictoryRequest(bool isMVP, int winStreak)`
- `CreateDefeatRequest(int lossStreak)`
- `CreateKillRequest(int killCount, bool isLegendary)`
- `CreateAchievementRequest(string rarity)`

### DialogueService

**Generate Dialogue**:
```csharp
IEnumerator GenerateDialogue(
    DialogueRequest request,
    Action<DialogueResponse> onSuccess,
    Action<string> onError
)
```

**Helper Methods**:
- `AddRarityContext(DialogueRequest, string rarity)`
- `AddFirstTimeContext(DialogueRequest, bool isFirstTime)`
- `AddWinStreakContext(DialogueRequest, int streak)`
- `AddDifficultyContext(DialogueRequest, string difficulty)`

### MemoryService

**Create Memory**:
```csharp
IEnumerator CreateMemory(
    string playerId,
    CreateMemoryRequest request,
    Action<Memory> onSuccess,
    Action<string> onError
)
```

**Search Memories**:
```csharp
IEnumerator SearchMemories(
    string playerId,
    SearchRequest request,
    Action<List<SearchResult>> onSuccess,
    Action<string> onError
)
```

**Get Context Memories**:
```csharp
IEnumerator GetContextMemories(
    string playerId,
    ContextRequest request,
    Action<List<Memory>> onSuccess,
    Action<string> onError
)
```

## Models

### EmotionRequest
- `type` - Event type (e.g., "player.victory")
- `data` - Event data (kill count, MVP status, etc.)
- `context` - Player context (health, combat state)

### EmotionResponse
- `emotion` - Detected emotion
- `intensity` - Emotion strength (0-1)
- `action` - Character action to perform
- `confidence` - Detection confidence (0-1)
- `method` - Detection method ("rule" or "ml")

### DialogueRequest
- `event_type` - Event type
- `emotion` - Detected emotion
- `persona` - Character persona (Cheerful, Cool, Cute)
- `context` - Additional context

### DialogueResponse
- `dialogue` - Generated dialogue text
- `method` - Generation method ("template", "llm", "cached")
- `cost` - API cost in USD
- `latency_ms` - Generation time

### CreateMemoryRequest
- `type` - Memory type (Achievement, Combat, Social, etc.)
- `content` - Memory description
- `emotion` - Associated emotion
- `context` - Additional context
- `importance` - Importance score (0-1)

## Best Practices

### 1. Player ID Management
Always set player ID before making requests:
```csharp
aglClient.SetPlayerId("unique-player-id");
```

### 2. Error Handling
Always handle errors in callbacks:
```csharp
StartCoroutine(aglClient.Emotion.AnalyzeEmotion(
    request,
    (response) => { /* Success */ },
    (error) => Debug.LogError($"Error: {error}")
));
```

### 3. Memory Importance
Set appropriate importance for memories:
- **1.0**: Legendary achievements, major milestones
- **0.8-0.9**: Important victories, rare events
- **0.5-0.7**: Standard achievements
- **< 0.5**: Minor events

### 4. Context Usage
Add context to requests for better results:
```csharp
var request = EmotionService.CreateVictoryRequest();
EmotionService.AddHealthContext(request, playerHealth);
EmotionService.AddCombatContext(request, inCombat);
```

### 5. Caching
The services automatically cache responses to reduce costs and latency. Identical requests will return cached results.

## Performance

- **Emotion Analysis**: < 50ms average
- **Dialogue Generation**: < 500ms (template), < 2s (LLM)
- **Memory Operations**: < 100ms

## Troubleshooting

### "Configuration invalid" Error
- Check that API key is set in Project Settings
- Verify all service URLs are correct

### Network Timeout
- Increase timeout in configuration (default: 30s)
- Check that services are running and accessible

### JSON Parsing Error
- Ensure Newtonsoft.Json package is installed
- Verify response format from services

## Examples

See `Samples~/BasicIntegration/` for complete examples:
- Basic emotion and dialogue flow
- Memory creation and search
- UI integration
- Error handling

## Support

- Documentation: `/docs`
- API Reference: `/docs/api/`
- Issues: GitHub Issues
- Email: support@agl.com

## License

Proprietary - All rights reserved
