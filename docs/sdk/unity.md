# Unity SDK Integration Guide

## Overview

The AGL Unity SDK allows you to easily integrate AI companion characters into your Unity game. This guide will walk you through installation, configuration, and usage.

## Requirements

- Unity 2021.3 LTS or higher
- .NET Standard 2.1
- Newtonsoft.Json (included in Unity 2020+)

## Installation

### Method 1: Unity Package Manager (Recommended)

1. Open Unity Package Manager (Window > Package Manager)
2. Click the '+' button and select "Add package from git URL"
3. Enter: `https://github.com/agl/unity-sdk.git`
4. Click "Add"

### Method 2: Manual Installation

1. Download the latest `.unitypackage` from [releases](https://github.com/agl/unity-sdk/releases)
2. In Unity, go to Assets > Import Package > Custom Package
3. Select the downloaded `.unitypackage`
4. Click "Import"

### Dependencies

The SDK requires Socket.IO for Unity:

```
https://github.com/itisnajim/SocketIOUnity.git
```

## Quick Start

### 1. Setup Configuration

Create a new ScriptableObject for configuration:

**Assets > Create > AGL > Companion Config**

```csharp
// CompanionConfig.cs (Created automatically)
[CreateAssetMenu(fileName = "CompanionConfig", menuName = "AGL/Companion Config")]
public class CompanionConfig : ScriptableObject
{
    public string apiKey = "agl_your_api_key";
    public string apiUrl = "http://localhost:3000/api/v1";
    public string realtimeUrl = "ws://localhost:3001";
    public string characterPersona = "cheerful";
    public bool enableVoice = false;
    public bool debugMode = true;
}
```

### 2. Add Companion Engine to Scene

Add the `CompanionEngine` component to a GameObject in your scene:

**Create > Empty GameObject** → Name it "CompanionEngine"

Add component: **Add Component > AGL > Companion Engine**

Assign your `CompanionConfig` in the Inspector.

### 3. Setup Avatar Renderer

Add a companion avatar to your scene:

**GameObject > AGL > Companion Avatar**

This creates a GameObject with:
- `CompanionAvatar` component
- `Live2DModel` component (if available)
- `DialogueBubble` component

Configure the avatar in the Inspector:
- Assign Live2D model
- Set position and scale
- Configure animations

### 4. Initialize in Your Game

```csharp
using AGL;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    [SerializeField] private CompanionConfig config;

    void Start()
    {
        // Initialize companion engine
        CompanionEngine.Instance.Initialize(config, OnInitialized);
    }

    void OnInitialized(bool success)
    {
        if (success)
        {
            Debug.Log("Companion engine initialized successfully!");
        }
        else
        {
            Debug.LogError("Failed to initialize companion engine");
        }
    }
}
```

### 5. Send Game Events

```csharp
using AGL;
using System.Collections.Generic;

public class PlayerController : MonoBehaviour
{
    void OnVictory()
    {
        // Send victory event
        CompanionEngine.Instance.SendEvent("player.victory", new Dictionary<string, object>
        {
            { "killCount", killCount },
            { "survivalTime", survivalTime },
            { "mvp", isMVP }
        });
    }

    void OnDeath()
    {
        // Send death event
        CompanionEngine.Instance.SendEvent("player.death", new Dictionary<string, object>
        {
            { "killedBy", killerName },
            { "deathCount", deaths }
        });
    }
}
```

---

## Core Components

### CompanionEngine

Main singleton that manages connection and events.

```csharp
public class CompanionEngine : MonoBehaviour
{
    public static CompanionEngine Instance { get; private set; }

    // Initialize the engine
    public void Initialize(CompanionConfig config, Action<bool> callback);

    // Send game event
    public void SendEvent(string eventType, Dictionary<string, object> data);

    // Chat with companion
    public void SendChatMessage(string message, Action<string> onResponse);

    // Show/hide companion
    public void SetVisible(bool visible, float duration = 0.3f);

    // Change character persona
    public void SetPersona(string persona);

    // Events
    public event Action<CompanionAction> OnCompanionAction;
    public event Action<string> OnDialogue;
    public event Action OnConnected;
    public event Action<string> OnDisconnected;
}
```

### CompanionAvatar

Handles avatar rendering and animations.

```csharp
public class CompanionAvatar : MonoBehaviour
{
    // Set emotion
    public void SetEmotion(EmotionType emotion);

    // Play animation
    public void PlayAnimation(string animationName);

    // Speak (show dialogue + lip sync)
    public void Speak(string text, AudioClip voice = null);

    // Visibility
    public void FadeIn(float duration = 0.3f);
    public void FadeOut(float duration = 0.3f);
}
```

### DialogueBubble

Displays dialogue in a speech bubble.

```csharp
public class DialogueBubble : MonoBehaviour
{
    // Show dialogue
    public void Show(string text, float duration = 3f);

    // Hide dialogue
    public void Hide();

    // Configure appearance
    public void SetStyle(BubbleStyle style);
}
```

---

## Advanced Usage

### Custom Event Context

Automatically send game context with every event:

```csharp
public class AdvancedGameManager : MonoBehaviour
{
    void Start()
    {
        CompanionEngine.Instance.Initialize(config, OnInitialized);

        // Set context provider
        CompanionEngine.Instance.SetContextProvider(GetGameContext);
    }

    Dictionary<string, object> GetGameContext()
    {
        return new Dictionary<string, object>
        {
            { "playerHealth", player.health },
            { "playerMana", player.mana },
            { "playerLevel", player.level },
            { "inCombat", combatManager.isInCombat },
            { "sceneId", SceneManager.GetActiveScene().name },
            { "teamStatus", GetTeamStatus() }
        };
    }

    string GetTeamStatus()
    {
        if (teamScore > enemyScore * 1.2f) return "winning";
        if (enemyScore > teamScore * 1.2f) return "losing";
        return "neutral";
    }
}
```

### Handle Companion Actions

```csharp
public class CompanionController : MonoBehaviour
{
    [SerializeField] private CompanionAvatar avatar;
    [SerializeField] private DialogueBubble bubble;

    void Start()
    {
        // Subscribe to companion actions
        CompanionEngine.Instance.OnCompanionAction += HandleCompanionAction;
    }

    void HandleCompanionAction(CompanionAction action)
    {
        Debug.Log($"Companion: {action.emotion} - {action.dialogue}");

        // Update avatar emotion
        avatar.SetEmotion(action.emotion);

        // Show dialogue
        bubble.Show(action.dialogue);

        // Play animation
        avatar.PlayAnimation(action.action);

        // Play sound effect (optional)
        PlayEmotionSound(action.emotion);
    }

    void PlayEmotionSound(EmotionType emotion)
    {
        switch (emotion)
        {
            case EmotionType.Excited:
                audioSource.PlayOneShot(cheerSound);
                break;
            case EmotionType.Sad:
                audioSource.PlayOneShot(sadSound);
                break;
            // ... more cases
        }
    }

    void OnDestroy()
    {
        CompanionEngine.Instance.OnCompanionAction -= HandleCompanionAction;
    }
}
```

### Interactive Chat

```csharp
public class ChatUI : MonoBehaviour
{
    [SerializeField] private TMP_InputField inputField;
    [SerializeField] private Button sendButton;
    [SerializeField] private TextMeshProUGUI chatHistory;

    void Start()
    {
        sendButton.onClick.AddListener(SendMessage);
    }

    void SendMessage()
    {
        string message = inputField.text;
        if (string.IsNullOrEmpty(message)) return;

        // Add to chat history
        chatHistory.text += $"\nYou: {message}";

        // Send to companion
        CompanionEngine.Instance.SendChatMessage(message, OnResponse);

        inputField.text = "";
    }

    void OnResponse(string response)
    {
        // Add companion response to chat
        chatHistory.text += $"\nCompanion: {response}";
    }
}
```

### Smart Hiding/Showing

Automatically hide companion during intense moments:

```csharp
public class SmartVisibility : MonoBehaviour
{
    [SerializeField] private float checkInterval = 1f;
    private bool wasInCombat = false;

    void Start()
    {
        InvokeRepeating(nameof(CheckVisibility), 1f, checkInterval);
    }

    void CheckVisibility()
    {
        bool inCombat = CombatManager.Instance.isInCombat;

        if (inCombat && !wasInCombat)
        {
            // Entered combat - hide companion
            CompanionEngine.Instance.SetVisible(false);
        }
        else if (!inCombat && wasInCombat)
        {
            // Exited combat - show companion
            CompanionEngine.Instance.SetVisible(true);
        }

        wasInCombat = inCombat;
    }
}
```

### Offline Mode

Gracefully handle network issues:

```csharp
public class OfflineHandler : MonoBehaviour
{
    [SerializeField] private TextMeshProUGUI statusText;
    private bool isOnline = true;

    void Start()
    {
        CompanionEngine.Instance.OnConnected += OnConnected;
        CompanionEngine.Instance.OnDisconnected += OnDisconnected;
    }

    void OnConnected()
    {
        isOnline = true;
        statusText.text = "🟢 Companion Online";
        statusText.color = Color.green;
    }

    void OnDisconnected(string reason)
    {
        isOnline = false;
        statusText.text = "🔴 Companion Offline (Local Mode)";
        statusText.color = Color.red;

        // SDK automatically switches to offline mode
        // with pre-downloaded dialogues
    }
}
```

---

## Avatar Customization

### Using Live2D Models

```csharp
public class Live2DCompanion : MonoBehaviour
{
    [SerializeField] private CubismModel model;
    [SerializeField] private CompanionAvatar avatar;

    void Start()
    {
        // Setup Live2D parameters
        avatar.SetLive2DModel(model);

        // Map emotions to Live2D parameters
        avatar.MapEmotion(EmotionType.Happy, new Dictionary<string, float>
        {
            { "ParamMouthForm", 1.0f },
            { "ParamEyeOpen", 1.0f },
            { "ParamBrowLY", 0.5f }
        });

        avatar.MapEmotion(EmotionType.Sad, new Dictionary<string, float>
        {
            { "ParamMouthForm", -1.0f },
            { "ParamEyeOpen", 0.6f },
            { "ParamBrowLY", -0.5f }
        });
    }
}
```

### Using Custom 3D Models

```csharp
public class Custom3DCompanion : MonoBehaviour
{
    [SerializeField] private Animator animator;
    [SerializeField] private CompanionAvatar avatar;

    void Start()
    {
        // Map animations
        avatar.MapAnimation("smile", "Happy_Idle");
        avatar.MapAnimation("cheer", "Victory_Dance");
        avatar.MapAnimation("cry", "Sad_Idle");

        // Set animator
        avatar.SetAnimator(animator);
    }
}
```

---

## Performance Optimization

### Event Throttling

```csharp
public class ThrottledEvents : MonoBehaviour
{
    private float lastEventTime = 0f;
    private float eventCooldown = 1f; // 1 second cooldown

    void OnKill()
    {
        if (Time.time - lastEventTime < eventCooldown)
        {
            return; // Throttle event
        }

        CompanionEngine.Instance.SendEvent("player.kill", new Dictionary<string, object>
        {
            { "enemyType", enemyType }
        });

        lastEventTime = Time.time;
    }
}
```

### Memory Management

```csharp
void OnDestroy()
{
    // Always cleanup
    if (CompanionEngine.Instance != null)
    {
        CompanionEngine.Instance.Disconnect();
    }
}

void OnApplicationQuit()
{
    // Disconnect on quit
    CompanionEngine.Instance?.Disconnect();
}

void OnApplicationPause(bool pauseStatus)
{
    if (pauseStatus)
    {
        // Pause connection
        CompanionEngine.Instance?.Pause();
    }
    else
    {
        // Resume connection
        CompanionEngine.Instance?.Resume();
    }
}
```

---

## Debugging

### Enable Debug Logs

```csharp
// In CompanionConfig
config.debugMode = true;
```

This will log:
- Connection status
- Events sent/received
- Emotion detection results
- Dialogue generation
- Network errors

### Debug UI

```csharp
public class DebugUI : MonoBehaviour
{
    void OnGUI()
    {
        if (!CompanionConfig.Instance.debugMode) return;

        GUILayout.BeginArea(new Rect(10, 10, 300, 500));
        GUILayout.Label($"Connected: {CompanionEngine.Instance.IsConnected}");
        GUILayout.Label($"Player ID: {CompanionEngine.Instance.PlayerId}");
        GUILayout.Label($"Last Event: {CompanionEngine.Instance.LastEventType}");
        GUILayout.Label($"Latency: {CompanionEngine.Instance.Latency}ms");

        if (GUILayout.Button("Send Test Event"))
        {
            CompanionEngine.Instance.SendEvent("player.victory", new Dictionary<string, object>
            {
                { "killCount", 15 }
            });
        }

        GUILayout.EndArea();
    }
}
```

---

## Example Projects

Full example projects are available in the SDK:

- **Basic Integration** - Simple MOBA-style game
- **Advanced Features** - Chat, memory, customization
- **Offline Mode** - Handling disconnections
- **Live2D Integration** - Using Live2D models

Find them in: `Packages/com.agl.companion/Samples~/`

---

## Troubleshooting

### Companion Not Responding

1. Check API key is valid
2. Verify services are running: `curl http://localhost:3000/api/v1/health`
3. Check console for errors
4. Enable debug mode

### Avatar Not Animating

1. Ensure animator controller is assigned
2. Check animation names match
3. Verify Live2D model is loaded
4. Check for conflicting animation layers

### High Latency

1. Check network connection
2. Verify WebSocket connection is stable
3. Enable event throttling
4. Consider using event batching

---

## API Reference

Full API reference: [https://docs.agl.com/unity-api](https://docs.agl.com/unity-api)

## Support

- Documentation: https://docs.agl.com/unity
- GitHub: https://github.com/agl/unity-sdk
- Discord: https://discord.gg/agl
- Email: unity-support@agl.com
