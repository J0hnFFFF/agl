# AGL API Documentation

## Overview

The AGL API provides RESTful endpoints for managing games, players, and companion characters. All API requests should be authenticated using an API key.

## Implementation Status

This document describes the complete API specification. Below is the current implementation status:

### ✅ Implemented (Phase 1)
- Authentication endpoints (register, login, verify)
- Full game CRUD operations (list, create, get, update, delete)
- Player management endpoints (list, create/get, get details, update)
- Character personas (list)
- Health check endpoint

### ✅ Implemented (Phase 2)
- **Memory Service** - Semantic memory with vector search ✨
  - Get player memories (paginated, filtered)
  - Create memories with auto importance scoring
  - Semantic similarity search
  - Context retrieval for dialogue
  - Memory importance updates
  - Memory cleanup

### 🚧 In Development (Phase 2)
- Event submission endpoint
- Analytics endpoints

### 📋 Planned (Phase 3)
- Advanced analytics
- Webhook support
- Batch operations

> **Note**: All endpoints are documented below. Endpoints marked with 🚧 are planned but not yet implemented.

## Base URL

```
Production: https://api.agl.com/api/v1
Development: http://localhost:3000/api/v1
```

## Authentication

All API requests (except registration and login) require an API key in the header:

```http
X-API-Key: agl_your_api_key_here
```

## Rate Limiting

- **Free Tier**: 10,000 requests/month
- **Standard Tier**: 100,000 requests/month
- **Pro Tier**: 1,000,000 requests/month
- **Enterprise Tier**: Custom limits

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9500
X-RateLimit-Reset: 1640995200
```

## Response Format

All responses follow this format:

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-25T12:00:00Z"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2025-10-25T12:00:00Z"
  }
}
```

## HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Endpoints

### Health Check

#### ✅ `GET /health`

Check service health status.

**Status**: Implemented
**No authentication required**

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T12:00:00Z",
  "service": "api-service"
}
```

---

### Authentication

#### ✅ `POST /auth/register`

Register a new client account and receive an API key.

**Status**: Implemented

**Request:**
```json
{
  "name": "My Game Studio",
  "email": "contact@mystudio.com",
  "password": "secure_password_123"
}
```

**Response:**
```json
{
  "client": {
    "id": "uuid",
    "name": "My Game Studio",
    "email": "contact@mystudio.com",
    "tier": "FREE"
  },
  "apiKey": "agl_abc123...",
  "token": "jwt_token..."
}
```

#### ✅ `POST /auth/login`

Login to existing account.

**Status**: Implemented

**Request:**
```json
{
  "email": "contact@mystudio.com",
  "password": "secure_password_123"
}
```

**Response:**
```json
{
  "client": {
    "id": "uuid",
    "name": "My Game Studio",
    "email": "contact@mystudio.com",
    "tier": "FREE"
  },
  "apiKey": "agl_abc123...",
  "token": "jwt_token..."
}
```

#### ✅ `POST /auth/verify`

Verify an API key.

**Status**: Implemented

**Request:**
```json
{
  "apiKey": "agl_abc123..."
}
```

**Response:**
```json
{
  "valid": true,
  "client": {
    "id": "uuid",
    "name": "My Game Studio",
    "tier": "FREE"
  }
}
```

---

### Games

#### ✅ `GET /games`

List all games for the authenticated client.

**Status**: Implemented

**Headers:**
```http
X-API-Key: agl_your_api_key
```

**Response:**
```json
[
  {
    "id": "game_uuid",
    "name": "My Awesome Game",
    "description": "A great MOBA game",
    "isActive": true,
    "createdAt": "2025-10-25T12:00:00Z",
    "client": {
      "name": "My Game Studio",
      "email": "contact@mystudio.com"
    }
  }
]
```

#### ✅ `POST /games`

Create a new game.

**Status**: Implemented

**Headers:**
```http
X-API-Key: agl_your_api_key
```

**Request:**
```json
{
  "clientId": "client_uuid",
  "name": "My Awesome Game",
  "description": "A great MOBA game",
  "config": {
    "defaultPersona": "cheerful",
    "emotionSensitivity": 0.8
  }
}
```

**Response:**
```json
{
  "id": "game_uuid",
  "name": "My Awesome Game",
  "description": "A great MOBA game",
  "isActive": true,
  "createdAt": "2025-10-25T12:00:00Z"
}
```

#### ✅ `GET /games/:gameId`

Get details of a specific game.

**Status**: Implemented

**Response:**
```json
{
  "id": "game_uuid",
  "name": "My Awesome Game",
  "description": "A great MOBA game",
  "config": {
    "defaultPersona": "cheerful",
    "emotionSensitivity": 0.8
  },
  "isActive": true,
  "stats": {
    "totalPlayers": 1500,
    "activePlayersToday": 320,
    "totalEvents": 45000
  },
  "createdAt": "2025-10-25T12:00:00Z"
}
```

#### ✅ `PATCH /games/:gameId`

Update game configuration.

**Status**: Implemented

**Request:**
```json
{
  "name": "My Awesome Game v2",
  "config": {
    "emotionSensitivity": 0.9
  }
}
```

#### ✅ `DELETE /games/:gameId`

Deactivate a game (soft delete).

**Status**: Implemented

**Response:**
```json
{
  "success": true,
  "message": "Game deactivated"
}
```

---

### Players

#### ✅ `GET /games/:gameId/players`

List all players in a game.

**Status**: Implemented

**Query Parameters:**
- `limit` (default: 50, max: 100)
- `offset` (default: 0)
- `sortBy` (default: createdAt)
- `order` (asc/desc, default: desc)

**Response:**
```json
{
  "players": [
    {
      "id": "player_uuid",
      "externalId": "player_12345",
      "characterPersona": "cheerful",
      "createdAt": "2025-10-25T12:00:00Z",
      "stats": {
        "totalEvents": 250,
        "totalMemories": 15
      }
    }
  ],
  "pagination": {
    "total": 1500,
    "limit": 50,
    "offset": 0
  }
}
```

#### ✅ `POST /games/:gameId/players`

Create or get a player.

**Status**: Implemented

**Request:**
```json
{
  "externalId": "player_12345",
  "characterPersona": "cheerful",
  "preferences": {
    "language": "zh-CN",
    "voiceEnabled": true
  }
}
```

**Response:**
```json
{
  "id": "player_uuid",
  "externalId": "player_12345",
  "characterPersona": "cheerful",
  "preferences": {
    "language": "zh-CN",
    "voiceEnabled": true
  },
  "createdAt": "2025-10-25T12:00:00Z"
}
```

#### ✅ `GET /players/:playerId`

Get player details including recent memories.

**Status**: Implemented

**Response:**
```json
{
  "id": "player_uuid",
  "externalId": "player_12345",
  "characterPersona": "cheerful",
  "stats": {
    "totalEvents": 250,
    "totalMemories": 15,
    "lastActive": "2025-10-25T11:30:00Z"
  },
  "recentMemories": [
    {
      "id": "memory_uuid",
      "type": "achievement",
      "content": "玩家使用亚索达成五杀",
      "emotion": "excited",
      "importance": 0.9,
      "createdAt": "2025-10-25T10:00:00Z"
    }
  ]
}
```

#### ✅ `PATCH /players/:playerId`

Update player preferences.

**Status**: Implemented

**Request:**
```json
{
  "characterPersona": "cool",
  "preferences": {
    "voiceEnabled": false
  }
}
```

---

### Memories

#### ✅ `GET /players/:playerId/memories`

Get paginated list of player memories.

**Status**: Implemented (Phase 2)

**Base URL**: `http://localhost:3002` (Memory Service)

**Query Parameters:**
- `limit` (default: 10, max: 100) - Number of memories to return
- `offset` (default: 0) - Pagination offset
- `type` (optional) - Filter by memory type

**Response:**
```json
[
  {
    "id": "memory-uuid",
    "playerId": "player-uuid",
    "type": "achievement",
    "content": "Defeated legendary dragon boss",
    "emotion": "excited",
    "importance": 0.85,
    "context": {
      "rarity": "legendary",
      "difficulty": "nightmare"
    },
    "createdAt": "2025-10-25T12:00:00Z"
  }
]
```

#### ✅ `POST /players/:playerId/memories`

Create a new memory with automatic importance scoring.

**Status**: Implemented (Phase 2)

**Request:**
```json
{
  "type": "achievement",
  "content": "Defeated legendary dragon boss",
  "emotion": "excited",
  "context": {
    "rarity": "legendary",
    "difficulty": "nightmare",
    "mvp": true
  }
}
```

**Response:**
```json
{
  "id": "memory-uuid",
  "playerId": "player-uuid",
  "type": "achievement",
  "content": "Defeated legendary dragon boss",
  "emotion": "excited",
  "importance": 0.85,
  "context": { ... },
  "createdAt": "2025-10-25T12:00:00Z"
}
```

**Importance Scoring:**
- Base score: 0.5
- Achievement/milestone type: +0.2
- Strong emotions: +0.15
- Rare events (legendary/epic): +0.15
- MVP/special status: +0.1
- Win/loss streak ≥5: +0.1
- Maximum: 1.0

#### ✅ `POST /players/:playerId/memories/search`

Search memories by semantic similarity using vector embeddings.

**Status**: Implemented (Phase 2)

**Request:**
```json
{
  "query": "boss battles I won",
  "limit": 5
}
```

**Response:**
```json
[
  {
    "id": "memory-uuid",
    "playerId": "player-uuid",
    "type": "achievement",
    "content": "Defeated legendary dragon boss",
    "emotion": "excited",
    "importance": 0.85,
    "similarityScore": 0.92,
    "createdAt": "2025-10-25T12:00:00Z"
  }
]
```

**Features:**
- Uses OpenAI text-embedding-3-small (1536 dimensions)
- Qdrant vector database for similarity search
- Results sorted by similarity score
- Filters by minimum importance (0.3)

#### ✅ `POST /players/:playerId/context`

Get contextual memories for dialogue generation.

**Status**: Implemented (Phase 2)

**Request:**
```json
{
  "currentEvent": "player just defeated raid boss",
  "limit": 5
}
```

**Response:**
```json
[
  {
    "id": "memory-uuid",
    "playerId": "player-uuid",
    "type": "achievement",
    "content": "Defeated legendary dragon boss",
    "emotion": "excited",
    "importance": 0.85,
    "similarityScore": 0.88,
    "createdAt": "2025-10-25T12:00:00Z"
  }
]
```

**Strategy:**
- Combines recent important memories (temporal context)
- Plus semantically similar memories (semantic context)
- Deduplicates and sorts by importance + recency
- Perfect for LLM dialogue generation

#### ✅ `PATCH /memories/:memoryId/importance`

Update memory importance score manually.

**Status**: Implemented (Phase 2)

**Request:**
```json
{
  "importance": 0.9
}
```

**Response:**
```json
{
  "id": "memory-uuid",
  "importance": 0.9,
  "updatedAt": "2025-10-25T12:05:00Z"
}
```

**Validation:**
- Importance must be between 0.0 and 1.0
- Returns 404 if memory not found

#### ✅ `DELETE /players/:playerId/memories/cleanup`

Delete old or unimportant memories.

**Status**: Implemented (Phase 2)

**Query Parameters:**
- `maxAge` (optional) - Maximum age in days
- `minImportance` (default: 0.3) - Delete memories below this score

**Response:**
```json
{
  "success": true,
  "deletedCount": 45
}
```

**Cleanup Strategy:**
- Deletes memories with importance < minImportance
- Optionally filters by age (older than maxAge days)
- Removes from both PostgreSQL and Qdrant
- Recommended: Run weekly with minImportance=0.3

---

### Characters

#### ✅ `GET /characters`

List available companion character personas.

**Status**: Implemented (basic)

**Response:**
```json
{
  "characters": [
    {
      "id": "cheerful",
      "name": "Cheerful Companion",
      "description": "活泼开朗，充满正能量",
      "traits": ["positive", "energetic", "supportive"],
      "preview": {
        "sampleDialogues": [
          "太棒了！你赢了！✨",
          "哇！这局打得真漂亮！"
        ]
      }
    },
    {
      "id": "cool",
      "name": "Cool Mentor",
      "description": "冷静沉着，像个可靠的导师",
      "traits": ["calm", "analytical", "reliable"],
      "preview": {
        "sampleDialogues": [
          "不错的操作。",
          "冷静，分析下局势。"
        ]
      }
    },
    {
      "id": "cute",
      "name": "Cute Assistant",
      "description": "可爱软萌，说话带点撒娇",
      "traits": ["cute", "gentle", "caring"],
      "preview": {
        "sampleDialogues": [
          "哇~ 你好厉害呀！",
          "呜... 没关系的啦~"
        ]
      }
    }
  ]
}
```

---

### Events

#### 🚧 `POST /events`

Send a game event for processing.

**Status**: Planned (use WebSocket for now)

**Headers:**
```http
X-API-Key: agl_your_api_key
```

**Request:**
```json
{
  "playerId": "player_uuid",
  "eventType": "player.victory",
  "data": {
    "killCount": 15,
    "survivalTime": 1800,
    "mvp": true
  },
  "context": {
    "playerHealth": 85,
    "playerLevel": 12,
    "inCombat": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "event_uuid",
  "message": "Event queued for processing"
}
```

**Note:** The actual emotion analysis and dialogue generation happens asynchronously. Results are pushed via WebSocket.

---

### Analytics

#### 🚧 `GET /games/:gameId/analytics`

Get game analytics and insights.

**Status**: Planned

**Query Parameters:**
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `metrics` (comma-separated: events, emotions, dialogues)

**Response:**
```json
{
  "period": {
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-10-31T23:59:59Z"
  },
  "metrics": {
    "totalEvents": 45000,
    "totalPlayers": 1500,
    "activePlayersDaily": 320,
    "emotionDistribution": {
      "happy": 35,
      "excited": 25,
      "sad": 15,
      "frustrated": 10,
      "neutral": 15
    },
    "dialogueStats": {
      "totalGenerated": 38000,
      "templateBased": 34000,
      "llmGenerated": 4000,
      "averageCost": 0.0008
    },
    "topEvents": [
      { "type": "player.victory", "count": 12000 },
      { "type": "player.kill", "count": 8500 },
      { "type": "player.death", "count": 7800 }
    ]
  }
}
```

---

## WebSocket API

See [WebSocket Documentation](./websocket.md) for real-time communication.

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password |
| `AUTH_INVALID_API_KEY` | Invalid or expired API key |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `QUOTA_EXCEEDED` | Monthly quota exceeded |
| `INTERNAL_ERROR` | Server error |

## SDKs

Official SDKs are available for:
- [Unity (C#)](../sdk/unity.md)
- [Unreal (C++)](../sdk/unreal.md)
- [Web (TypeScript)](../sdk/web.md)

## Support

For API support, contact: api-support@agl.com
