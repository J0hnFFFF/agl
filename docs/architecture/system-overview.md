# System Architecture Overview

## Executive Summary

AGL (AI Game Companion Engine) is a cloud-based SaaS platform that provides emotional, intelligent companion characters for games. The system uses a microservices architecture with event-driven communication and hybrid AI processing (rule-based + ML + LLM).

## Architecture Principles

1. **Scalability First** - Horizontal scaling via Kubernetes and stateless services
2. **Cost Optimization** - Hybrid AI approach (90% templates, 10% LLM)
3. **Low Latency** - Local processing for instant feedback, cloud for intelligence
4. **Graceful Degradation** - Offline mode with cached responses
5. **Security** - API key auth, rate limiting, data encryption

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  (Unity/Unreal/Web Games)                               │
└────────────┬─────────────────────────────────┬──────────┘
             │                                 │
             │ HTTPS/REST                      │ WebSocket
             │                                 │
┌────────────▼─────────────────────────────────▼──────────┐
│                   Edge/CDN Layer                         │
│  Cloudflare / AWS CloudFront                            │
│  - DDoS Protection                                       │
│  - SSL Termination                                       │
│  - Geographic Distribution                               │
└────────────┬─────────────────────────────────┬──────────┘
             │                                 │
┌────────────▼─────────────────────────────────▼──────────┐
│                 API Gateway Layer                        │
│  Kong / AWS ALB / Nginx                                 │
│  - Authentication                                        │
│  - Rate Limiting                                         │
│  - Request Routing                                       │
│  - Load Balancing                                        │
└────────────┬─────────────────────────────────┬──────────┘
             │                                 │
             │                                 │
     ┌───────▼────────┐               ┌───────▼────────┐
     │  API Services  │               │   Realtime     │
     │   (Node.js)    │               │   Gateway      │
     │                │               │  (Socket.IO)   │
     │ - Auth         │               │                │
     │ - User Mgmt    │               │ - WebSocket    │
     │ - Config       │               │ - Pub/Sub      │
     └───────┬────────┘               └───────┬────────┘
             │                                │
             └────────────┬───────────────────┘
                          │
                  ┌───────▼────────┐
                  │ Message Queue  │
                  │  (Redis)       │
                  │                │
                  │ - Streams      │
                  │ - Pub/Sub      │
                  └───────┬────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌────▼─────┐
    │ Emotion   │   │ Dialogue  │   │ Memory   │
    │ Service   │   │ Service   │   │ Service  │
    │ (Python)  │   │ (Python)  │   │ (Node.js)│
    │           │   │           │   │          │
    │ - Rules   │   │ - LLM     │   │ - Cache  │
    │ - ML      │   │ - Template│   │ - Vector │
    └─────┬─────┘   └─────┬─────┘   └────┬─────┘
          │               │              │
          └───────────────┴──────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌────▼─────┐
    │PostgreSQL │   │  Redis    │   │  Qdrant  │
    │           │   │           │   │          │
    │ - Users   │   │ - Cache   │   │ - Vectors│
    │ - Games   │   │ - Sessions│   │ - Memory │
    │ - Events  │   │ - Queue   │   │ - Search │
    └───────────┘   └───────────┘   └──────────┘
```

---

## Component Details

### 1. Client SDK Layer

**Purpose**: Provide easy integration for game developers

**Components**:
- Unity SDK (C#)
- Unreal SDK (C++)
- Web SDK (TypeScript)

**Responsibilities**:
- Event collection from game
- Local rule-based emotion detection (instant feedback)
- WebSocket connection management
- Avatar rendering and animation
- Offline mode with cached dialogues

**Key Features**:
- **Hybrid Processing**: Local rules for instant feedback (<50ms), cloud for intelligence
- **Graceful Degradation**: Works offline with pre-downloaded content
- **Auto-Reconnection**: Handles network interruptions
- **Event Batching**: Reduces network overhead

---

### 2. API Gateway Layer

**Purpose**: Single entry point for all API requests

**Technology**: Kong Gateway / AWS ALB / Nginx

**Responsibilities**:
- **Authentication**: API key validation
- **Rate Limiting**: Token bucket algorithm per API key
- **Request Routing**: Route to appropriate microservice
- **Load Balancing**: Distribute load across service instances
- **SSL Termination**: HTTPS handling
- **CORS Management**: Cross-origin policy enforcement

**Key Metrics**:
- Request latency (P50, P95, P99)
- Error rate per endpoint
- Rate limit violations
- Throughput (requests/second)

---

### 3. API Service (Node.js)

**Purpose**: Business logic and data management

**Technology**: Node.js + NestJS + TypeScript + Prisma

**Endpoints**:
- `/auth/*` - Authentication (register, login, verify)
- `/games/*` - Game management (CRUD operations)
- `/players/*` - Player management
- `/characters/*` - Character persona information
- `/analytics/*` - Usage analytics and insights

**Database Schema** (PostgreSQL):
```sql
clients (id, name, email, api_key, tier, quota, ...)
├─ games (id, client_id, name, config, ...)
   ├─ players (id, game_id, external_id, persona, ...)
      ├─ memories (id, player_id, content, emotion, importance, ...)
      └─ game_events (id, player_id, event_type, data, ...)
```

**Key Features**:
- **Type Safety**: TypeScript + Prisma
- **Validation**: class-validator for request validation
- **Caching**: Redis for API key validation and quota checks
- **Partitioning**: Events table partitioned by month

---

### 4. Realtime Gateway (Socket.IO)

**Purpose**: WebSocket server for bidirectional real-time communication

**Technology**: Node.js + Socket.IO + Redis Adapter

**Key Features**:
- **Horizontal Scaling**: Redis adapter for multi-instance support
- **Room Management**: Players join personal rooms for targeted messaging
- **Auto Reconnection**: Built-in reconnection logic
- **Fallback Transport**: WebSocket → Long Polling

**Message Flow**:
```
Client Event → WebSocket → Realtime Gateway → Redis Pub/Sub → AI Services
AI Response → Redis Pub/Sub → Realtime Gateway → WebSocket → Client
```

**Performance**:
- Support 10,000+ concurrent connections per instance
- <100ms latency for message delivery
- Automatic load balancing across instances

---

### 5. Emotion Service (Python)

**Purpose**: Analyze game events and detect player emotions

**Technology**: Python + FastAPI + scikit-learn

**Processing Pipeline**:
```
Game Event → Rule Engine → (high confidence?) → Return
                ↓
            (low confidence)
                ↓
           ML Classifier → Emotion Result
                ↓
         Emotion Progression → Adjusted Result
```

**Rule Engine**:
- Fast pattern matching for common scenarios
- 85%+ confidence for instant response
- Examples:
  - 3+ consecutive deaths → frustrated
  - 15+ kills in victory → ecstatic
  - First victory after 3 losses → relieved

**ML Classifier**:
- Feature extraction from event + context
- Random Forest / XGBoost model
- Trained on historical player behavior
- Used only when rule confidence <85%

**Emotion Progression**:
- Track emotion history (last 5 minutes)
- Detect patterns (consecutive wins/losses)
- Amplify or dampen emotions based on context

**Performance Target**: <200ms per event

---

### 6. Dialogue Service (Python)

**Purpose**: Generate contextual dialogue for companion characters

**Technology**: Python + FastAPI + Anthropic Claude API

**Strategy**: Cost-Optimized Hybrid Approach

```
Event + Emotion → Is Common Scenario?
                       │
            ┌──────────┴──────────┐
         YES │                   NO │
            ↓                      ↓
    Template Library        LLM Generation
    (fast, free)           (slow, costly)
       90% cases              10% cases
            │                      │
            └──────────┬───────────┘
                       ↓
                  Dialogue Result
```

**Template Library**:
- 1000+ pre-written dialogues
- Organized by (event_type, emotion, persona)
- Randomized selection for variety
- Cost: $0

**LLM Generation** (Claude):
- Only for special moments:
  - Milestones (100th win)
  - Personal records broken
  - Complex context requiring reasoning
- Cached for 1 hour
- Cost: ~$0.003 per generation

**Persona System**:
- **Cheerful**: 活泼开朗，充满正能量
- **Cool**: 冷静沉着，像个导师
- **Cute**: 可爱软萌，说话带撒娇

**Performance Target**:
- Template: <50ms
- LLM: <3s (async, non-blocking)

**Cost Target**: <$0.001 per dialogue average

---

### 7. Memory Service (Node.js)

**Purpose**: Store and retrieve player memories for personalization

**Technology**: Node.js + PostgreSQL + Qdrant Vector DB

**Three-Tier Memory System**:

#### Tier 1: Short-Term Memory (Redis)
- Session-level data
- Last 100 events
- TTL: 1 hour
- Use case: Emotion progression, recent context

#### Tier 2: Long-Term Memory (PostgreSQL)
- Important moments only
- Filtered by importance score (>0.7)
- Persistent storage
- Use case: Milestones, achievements, conversations

#### Tier 3: Semantic Memory (Qdrant)
- Vector embeddings of memories
- Semantic search for relevant memories
- Use case: Contextual recall ("Remember when you...")

**Memory Importance Scoring**:
```python
def calculate_importance(event):
    score = 0.5  # base

    # Milestone events
    if event.type == "achievement": score += 0.3
    if event.data.get("personal_record"): score += 0.2

    # Emotional intensity
    score += event.emotion_intensity * 0.2

    # Rarity (first time events)
    if is_first_occurrence(event): score += 0.3

    return min(score, 1.0)
```

**Memory Recall**:
- Triggered by contextual similarity
- "You're playing the same hero you used for your 5-kill streak last week"
- Adds personality and continuity

---

### 8. Data Storage Layer

#### PostgreSQL
**Usage**: Primary relational data
- Clients, games, players
- Long-term memories
- Event logs (partitioned)

**Configuration**:
- Connection pooling (max 100 connections)
- Read replicas for analytics
- Automated backups (daily)

#### Redis
**Usage**: High-speed cache and message queue

**Use Cases**:
- API key validation cache (TTL: 1 hour)
- Rate limiting (token bucket)
- Short-term player memory (TTL: 1 hour)
- Message queue (Streams)
- WebSocket session data

**Configuration**:
- Persistence: AOF + RDB
- Eviction policy: allkeys-lru
- Max memory: 8GB per instance

#### Qdrant
**Usage**: Vector database for semantic memory search

**Features**:
- 1536-dimensional vectors (OpenAI embeddings)
- Filter by player_id, timestamp, importance
- Fast similarity search (<50ms)

**Indexing**:
- HNSW index for fast approximate search
- Payload index for filtering

---

## Data Flow Examples

### Example 1: Player Victory Event

```
1. Player wins game in Unity
   ↓
2. SDK sends game_event via WebSocket
   {
     type: "player.victory",
     data: { killCount: 15, mvp: true },
     context: { playerLevel: 12, ... }
   }
   ↓
3. Realtime Gateway receives event
   ↓
4. Publish to Redis Stream "game_events"
   ↓
5. Emotion Service consumes event
   - Rule Engine: 15 kills + mvp → excited (confidence: 0.95)
   - Return: { emotion: "excited", action: "cheer" }
   ↓
6. Dialogue Service generates response
   - Check: Is this common? Yes → Use template
   - Return: "太强了！！！完全碾压！"
   ↓
7. Memory Service checks importance
   - Importance: 0.8 (high kill count + mvp)
   - Store in PostgreSQL + Qdrant
   ↓
8. Publish result to Redis "ai_responses"
   {
     playerId: "player_123",
     emotion: "excited",
     dialogue: "太强了！！！完全碾压！",
     action: "cheer"
   }
   ↓
9. Realtime Gateway receives response
   ↓
10. Emit "companion_action" to player's WebSocket
   ↓
11. SDK receives action
   - Update avatar emotion
   - Show dialogue bubble
   - Play cheer animation
```

**Total Latency**: <500ms

---

### Example 2: Player Chat Message

```
1. Player types: "How should I play this match?"
   ↓
2. SDK sends chat_message via WebSocket
   ↓
3. Realtime Gateway → Redis "chat_messages"
   ↓
4. Dialogue Service processes
   - Query recent memories from Qdrant
   - Build context prompt
   - Call Claude API
   - Return: "现在局势对你有利，建议稳扎稳打，保持优势"
   ↓
5. Return via WebSocket → SDK displays in chat UI
```

**Total Latency**: 2-3s (acceptable for chat)

---

## Scaling Strategy

### Horizontal Scaling

**Stateless Services** (easily scalable):
- API Service: 3-10 instances
- Emotion Service: 2-5 instances
- Dialogue Service: 2-5 instances

**Stateful Services** (require coordination):
- Realtime Gateway: Redis adapter for session sharing
- PostgreSQL: Read replicas for queries
- Redis: Cluster mode for high throughput

### Kubernetes Auto-Scaling

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

**PostgreSQL**:
- Vertical: Increase instance size
- Read Replicas: Separate read/write traffic
- Partitioning: Events table partitioned by month
- Connection Pooling: PgBouncer

**Redis**:
- Cluster mode: Sharding across nodes
- Separate instances: Cache vs Queue
- Persistence: RDB snapshots + AOF

---

## Security Architecture

### Authentication & Authorization

**API Key Authentication**:
```
Client → X-API-Key: agl_xxx → API Gateway → Verify in Redis
                                              ↓
                                         (valid?) → Allow
                                              ↓
                                          (invalid) → 401
```

**Rate Limiting**:
- Token bucket algorithm
- Stored in Redis
- Limits:
  - Free: 10,000/month
  - Standard: 100,000/month
  - Pro: 1,000,000/month

### Data Security

**In Transit**:
- TLS 1.3 for all connections
- WSS (WebSocket Secure)
- Certificate pinning in SDKs

**At Rest**:
- PostgreSQL: Encrypted storage
- Redis: Encrypted snapshots
- Qdrant: Encrypted vectors

**Sensitive Data**:
- API keys: SHA-256 hashed
- PII: Encrypted with AES-256
- Logs: Sanitized (no PII)

---

## Monitoring & Observability

### Metrics (Prometheus)

**Business Metrics**:
- API calls per client
- Active WebSocket connections
- Events processed per second
- LLM API cost per request
- Template vs LLM generation ratio

**Technical Metrics**:
- Request latency (P50, P95, P99)
- Error rate per service
- Database connection pool usage
- Redis cache hit rate
- Memory/CPU usage per pod

### Logging (Loki)

**Structured Logs**:
```json
{
  "level": "info",
  "service": "emotion-service",
  "event_type": "player.victory",
  "player_id": "player_123",
  "emotion": "excited",
  "confidence": 0.95,
  "latency_ms": 45,
  "timestamp": "2025-10-25T12:00:00Z"
}
```

### Alerting (Grafana)

**Critical Alerts** (PagerDuty):
- Service down >2 minutes
- Error rate >5% for 5 minutes
- Database connection exhaustion
- Disk usage >90%

**Warning Alerts** (Slack):
- Latency P99 >1s
- LLM cost spike >50%
- Cache hit rate <80%

---

## Disaster Recovery

### Backup Strategy

**PostgreSQL**:
- Daily full backups (retained 30 days)
- Continuous WAL archiving
- Point-in-time recovery capability

**Redis**:
- Hourly RDB snapshots
- AOF for durability
- Replicas in different AZs

**Recovery Objectives**:
- **RTO** (Recovery Time): <1 hour
- **RPO** (Recovery Point): <5 minutes

### High Availability

**Multi-AZ Deployment**:
- Services deployed across 3 availability zones
- Database replicas in separate AZs
- Automatic failover

**Circuit Breaker**:
- LLM API fails → Switch to template-only mode
- Database unreachable → Return cached data
- Redis down → Use in-memory fallback

---

## Cost Optimization

### Current Cost Breakdown (10K MAU)

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| K8s Cluster | $500 | 5 nodes |
| PostgreSQL | $200 | Managed instance |
| Redis | $150 | Managed cache |
| Qdrant | $100 | Self-hosted on K8s |
| LLM API | $1,500 | Claude API calls |
| CDN/Bandwidth | $200 | CloudFlare |
| **Total** | **$2,650** | **$0.27 per MAU** |

### Optimization Strategies

1. **LLM Cost Reduction**:
   - 90% template usage (from 50%)
   - Aggressive caching (1 hour → 24 hours for common scenarios)
   - Batch processing for non-urgent requests

2. **Infrastructure**:
   - Spot instances for non-critical workloads
   - Auto-scaling during off-peak hours
   - Reserved instances for stable load

3. **Data Storage**:
   - Archive old events to S3 Glacier
   - Compress logs before storage
   - Delete low-importance memories after 90 days

**Target**: <$0.20 per MAU at scale (100K+ users)

---

## Future Enhancements

### Phase 2 Features

1. **Voice Synthesis**:
   - Text-to-speech for companion dialogue
   - Lip sync animation
   - Multiple voices per persona

2. **Advanced ML**:
   - Deep learning emotion classifier
   - Player behavior prediction
   - Personalized dialogue fine-tuning

3. **Cross-Game Memory**:
   - Player's companion follows across games
   - Shared memory and personality
   - Unified player profile

4. **Analytics Dashboard**:
   - Real-time metrics for game developers
   - A/B testing companion personas
   - Player engagement insights

### Phase 3 Features

1. **Multi-Modal Input**:
   - Voice commands
   - Camera-based emotion detection
   - Controller vibration patterns

2. **Advanced Personalization**:
   - Fine-tuned LLM per player
   - Dynamic personality evolution
   - Context-aware proactive suggestions

3. **Enterprise Features**:
   - On-premise deployment option
   - White-label solution
   - Custom ML model training

---

## References

- [API Documentation](../api/README.md)
- [WebSocket API](../api/websocket.md)
- [Unity SDK Guide](../sdk/unity.md)
- [Development Guide](./development.md)
- [Deployment Guide](./deployment.md)
