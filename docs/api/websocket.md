# WebSocket API Documentation

## Overview

The AGL WebSocket API provides real-time bidirectional communication between your game and the companion service. All game events are sent via WebSocket, and companion responses are received in real-time.

## Connection

### Endpoint

```
Production: wss://realtime.agl.com
Development: ws://localhost:3001
```

### Authentication

Connect with authentication parameters:

```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    apiKey: 'agl_your_api_key',
    playerId: 'player_uuid'
  },
  transports: ['websocket', 'polling']
});
```

### Connection Events

#### `connect`

Emitted when successfully connected to the server.

```javascript
socket.on('connect', () => {
  console.log('Connected to AGL Realtime Gateway');
});
```

#### `connected`

Emitted after successful authentication with server details.

```javascript
socket.on('connected', (data) => {
  console.log('Authenticated:', data);
  // {
  //   message: 'Connected to AGL Realtime Gateway',
  //   playerId: 'player_uuid',
  //   timestamp: 1698765432000
  // }
});
```

#### `disconnect`

Emitted when disconnected from server.

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### `connect_error`

Emitted on connection error (e.g., authentication failed).

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

---

## Client → Server Events

### `game_event`

Send a game event to be processed by the AI services.

**Emit:**
```javascript
socket.emit('game_event', {
  id: 'optional_event_id',
  type: 'player.victory',
  data: {
    killCount: 15,
    survivalTime: 1800,
    mvp: true
  },
  context: {
    playerHealth: 85,
    playerLevel: 12,
    inCombat: false,
    sceneId: 'summoners_rift'
  }
});
```

**Event Types:**

| Event Type | Description | Required Data |
|------------|-------------|---------------|
| `player.victory` | Player won the game | `killCount`, `survivalTime` |
| `player.defeat` | Player lost the game | `survivalTime`, `reason` |
| `player.kill` | Player killed an enemy | `enemyType`, `method` |
| `player.death` | Player died | `killedBy`, `deathCount` |
| `player.levelup` | Player leveled up | `newLevel`, `skillUnlocked` |
| `player.achievement` | Achievement unlocked | `achievementId`, `rarity` |
| `player.item_acquired` | Acquired new item | `itemId`, `rarity` |
| `player.skill_used` | Used a skill | `skillId`, `target` |
| `player.milestone` | Reached milestone | `milestoneType`, `value` |
| `player.idle` | Player idle for long time | `idleDuration` |

**Context Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `playerHealth` | number | Current health (0-100) |
| `playerMana` | number | Current mana (0-100) |
| `playerLevel` | number | Current level |
| `inCombat` | boolean | Is player in combat |
| `sceneId` | string | Current scene/map identifier |
| `teamStatus` | string | Team status (winning/losing/neutral) |

**Acknowledgment:**

Server will respond with `event_ack`:

```javascript
socket.on('event_ack', (data) => {
  console.log('Event received:', data.eventId);
});
```

---

### `chat_message`

Send a chat message to the companion for direct conversation.

**Emit:**
```javascript
socket.emit('chat_message', {
  message: 'How should I play this match?',
  context: {
    playerLevel: 12,
    currentMatch: 'ranked'
  }
});
```

**Response:** Server will process the message and respond via `companion_dialogue` event.

---

## Server → Client Events

### `companion_action`

Received when the companion reacts to a game event.

**Listen:**
```javascript
socket.on('companion_action', (data) => {
  console.log('Companion action:', data);
  // Update UI with companion's reaction
  updateCompanionEmotion(data.emotion);
  showDialogueBubble(data.dialogue);
  playAnimation(data.action);
});
```

**Data Structure:**
```javascript
{
  emotion: 'excited',      // Current emotion
  dialogue: '太强了！！！完全碾压！',  // Dialogue to display
  action: 'cheer',         // Animation to play
  timestamp: 1698765432000 // Event timestamp
}
```

**Emotion Types:**
- `happy` - General happiness
- `excited` - High excitement
- `sad` - Sadness/disappointment
- `frustrated` - Frustration
- `relieved` - Relief after tension
- `neutral` - Neutral state
- `surprised` - Surprise
- `concerned` - Concern/worry

**Action Types:**
- `smile` - Simple smile animation
- `cheer` - Cheering animation
- `dance` - Victory dance
- `cry` - Crying animation
- `comfort` - Comforting gesture
- `encourage` - Encouraging gesture
- `think` - Thinking pose
- `idle` - Idle animation

---

### `companion_dialogue`

Received as a response to `chat_message`.

**Listen:**
```javascript
socket.on('companion_dialogue', (data) => {
  console.log('Companion says:', data.dialogue);
  displayChatMessage(data);
});
```

**Data Structure:**
```javascript
{
  dialogue: '现在局势对我们有利，建议稳扎稳打',
  emotion: 'calm',
  timestamp: 1698765432000
}
```

---

### `companion_memory`

Special event when companion recalls a past memory.

**Listen:**
```javascript
socket.on('companion_memory', (data) => {
  console.log('Companion remembers:', data);
});
```

**Data Structure:**
```javascript
{
  memoryType: 'achievement',
  content: '记得上次你用亚索拿五杀吗？',
  dialogue: '你今天能再创辉煌吗？',
  relatedEvent: {
    type: 'player.achievement',
    date: '2025-10-20T10:00:00Z'
  },
  timestamp: 1698765432000
}
```

---

## Best Practices

### Connection Management

```javascript
// Reconnection configuration
const socket = io('ws://localhost:3001', {
  auth: { apiKey, playerId },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});

// Handle reconnection
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  // Show offline mode UI
});
```

### Event Batching

For high-frequency events (e.g., player position), batch them:

```javascript
let eventQueue = [];

function queueEvent(event) {
  eventQueue.push(event);

  // Send batch every 500ms
  if (eventQueue.length >= 10) {
    flushEventQueue();
  }
}

function flushEventQueue() {
  if (eventQueue.length === 0) return;

  socket.emit('game_event_batch', eventQueue);
  eventQueue = [];
}

setInterval(flushEventQueue, 500);
```

### Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);

  // Graceful degradation
  switchToOfflineMode();
});

socket.on('companion_action', (data) => {
  try {
    updateUI(data);
  } catch (error) {
    console.error('Failed to update UI:', error);
    // Continue gracefully
  }
});
```

### Latency Optimization

```javascript
// Track round-trip latency
let latencyCheckInterval;

socket.on('connect', () => {
  latencyCheckInterval = setInterval(() => {
    const start = Date.now();
    socket.emit('ping', () => {
      const latency = Date.now() - start;
      console.log('Latency:', latency, 'ms');

      if (latency > 1000) {
        console.warn('High latency detected');
      }
    });
  }, 10000); // Check every 10 seconds
});

socket.on('disconnect', () => {
  clearInterval(latencyCheckInterval);
});
```

---

## Example Integration

### Complete Unity Integration

```csharp
using SocketIOClient;
using System.Collections.Generic;
using UnityEngine;

public class CompanionConnection : MonoBehaviour
{
    private SocketIOUnity socket;

    void Start()
    {
        // Connect to WebSocket
        socket = new SocketIOUnity("ws://localhost:3001", new SocketIOOptions
        {
            Auth = new Dictionary<string, string>
            {
                {"apiKey", "agl_your_api_key"},
                {"playerId", "player_12345"}
            },
            Transport = SocketIOClient.Transport.TransportProtocol.WebSocket
        });

        // Setup event listeners
        socket.On("connected", response => {
            Debug.Log("Connected: " + response);
        });

        socket.On("companion_action", response => {
            var data = response.GetValue<CompanionAction>();
            HandleCompanionAction(data);
        });

        socket.Connect();
    }

    // Send game event
    public void SendGameEvent(string eventType, Dictionary<string, object> data)
    {
        socket.Emit("game_event", new {
            type = eventType,
            data = data,
            context = GetGameContext()
        });
    }

    // Handle companion action
    void HandleCompanionAction(CompanionAction action)
    {
        // Update companion emotion
        companionAvatar.SetEmotion(action.emotion);

        // Show dialogue
        dialogueBubble.Show(action.dialogue);

        // Play animation
        companionAvatar.PlayAnimation(action.action);
    }

    Dictionary<string, object> GetGameContext()
    {
        return new Dictionary<string, object>
        {
            {"playerHealth", player.health},
            {"playerLevel", player.level},
            {"inCombat", player.isInCombat}
        };
    }

    void OnDestroy()
    {
        socket?.Disconnect();
        socket?.Dispose();
    }
}
```

---

## Rate Limits

WebSocket connections have the following limits:

- **Maximum concurrent connections per API key**: 1000
- **Maximum events per second**: 100
- **Maximum message size**: 1MB
- **Connection timeout**: 5 minutes idle

Exceeding these limits will result in disconnection with error code `rate_limit_exceeded`.

---

## Testing

### Using Socket.IO Client (Browser Console)

```javascript
// Connect
const socket = io('ws://localhost:3001', {
  auth: {
    apiKey: 'agl_test_key',
    playerId: 'test_player_123'
  }
});

// Listen to all events
socket.onAny((eventName, ...args) => {
  console.log(eventName, args);
});

// Send test event
socket.emit('game_event', {
  type: 'player.victory',
  data: { killCount: 15 },
  context: { playerLevel: 10 }
});
```

### Using wscat (CLI)

```bash
npm install -g wscat

# Connect
wscat -c ws://localhost:3001 \
  -H "Authorization: agl_test_key"

# Send message (paste this after connecting)
{"type":"game_event","data":{"type":"player.victory"}}
```

---

## Troubleshooting

### Connection Fails

1. Check if Realtime Gateway is running: `curl http://localhost:3001/health`
2. Verify API key is valid: `curl -X POST http://localhost:3000/api/v1/auth/verify -d '{"apiKey":"your_key"}'`
3. Check Redis is running: `redis-cli ping`

### Events Not Processing

1. Check Redis Streams: `redis-cli XINFO STREAM game_events`
2. Verify AI services are running: `curl http://localhost:8000/health`
3. Check logs in Realtime Gateway

### High Latency

1. Check network connection
2. Verify Redis is not overloaded
3. Consider enabling WebSocket compression
4. Use event batching for high-frequency events

---

## Support

For WebSocket API support:
- Documentation: https://docs.agl.com/websocket
- GitHub Issues: https://github.com/agl/agl/issues
- Email: support@agl.com
