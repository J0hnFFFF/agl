# Emotion Recognition System

## Overview

The AGL Emotion Recognition System uses a **hybrid detection approach** combining rule-based analysis with ML classification. It analyzes game events and player context to determine the emotional state of companion characters, enabling dynamic, context-aware responses that feel natural and engaging.

## Architecture

The emotion system uses a **hybrid strategy** with automatic fallback:

```
┌─────────────────────────────────────────────┐
│         Emotion Detection Service           │
├─────────────────────────────────────────────┤
│                                             │
│  Request → Cache Check (30min TTL)          │
│              ↓                              │
│         Rule-Based Analysis                 │
│         (Fast, Free, Reliable)              │
│              ↓                              │
│    Confidence >= 0.8?                       │
│         /        \                          │
│       Yes        No                         │
│        ↓          ↓                         │
│   Use Rule   Check Budget                   │
│   Result      ($5/day)                      │
│                 ↓                           │
│            ML Classification                │
│         (Claude API, Accurate)              │
│                 ↓                           │
│          Response + Cache                   │
│                                             │
└─────────────────────────────────────────────┘
```

### System Components

1. **Rule-Based Analyzer** (Primary)
   - Maps event types to base emotions
   - Context-aware adjustments
   - Fast (< 5ms), free, reliable
   - Confidence scoring

2. **ML Classifier** (Fallback)
   - Claude API (Haiku model)
   - Used when rule confidence < 0.8
   - Higher accuracy for ambiguous cases
   - Cost: ~$0.0003 per request

3. **Smart Caching**
   - 30-minute TTL
   - Groups similar events
   - Reduces repeated costs

4. **Cost Management**
   - Daily budget ($5)
   - Usage rate limits (15% target)
   - Real-time tracking

5. **Action Mapping**
   - Converts emotions to character animations

## Supported Emotions

The system supports 14 distinct emotional states:

| Emotion | Description | Typical Intensity | Character Action |
|---------|-------------|-------------------|------------------|
| `happy` | General happiness, joy | 0.7-0.9 | smile |
| `excited` | High energy excitement | 0.8-1.0 | cheer |
| `amazed` | Surprise, awe | 0.9-1.0 | surprised_jump |
| `proud` | Pride in achievement | 0.8-0.9 | proud_pose |
| `satisfied` | Contentment, accomplishment | 0.6-0.8 | nod |
| `cheerful` | Light-hearted, friendly | 0.6-0.7 | wave |
| `grateful` | Thankfulness | 0.7-0.8 | thank |
| `sad` | Sadness, loss | 0.6-0.8 | comfort |
| `disappointed` | Let down, unmet expectations | 0.6-0.7 | sigh |
| `frustrated` | Annoyance, irritation | 0.5-0.8 | encourage |
| `angry` | Anger, betrayal | 0.7-0.9 | calm_down |
| `worried` | Concern, anxiety | 0.6-0.7 | concerned |
| `tired` | Exhaustion, fatigue | 0.5-0.7 | rest |
| `neutral` | No strong emotion | 0.4-0.6 | idle |

## Event Type Mapping

### Combat Events

| Event Type | Base Emotion | Intensity | Notes |
|------------|--------------|-----------|-------|
| `player.victory` | happy | 0.9 | Player won the match |
| `player.defeat` | sad | 0.7 | Player lost the match |
| `player.kill` | satisfied/excited | 0.7-0.95 | Varies by kill count |
| `player.death` | disappointed/frustrated | 0.6-0.8 | Intensity increases with death streak |
| `player.assist` | satisfied | 0.6 | Assisted teammate in kill |
| `player.teamvictory` | happy | 0.85 | Team-based victory |
| `player.teamdefeat` | disappointed | 0.6 | Team-based loss |

### Achievement Events

| Event Type | Base Emotion | Intensity | Notes |
|------------|--------------|-----------|-------|
| `player.achievement` | happy/excited/amazed | 0.7-1.0 | Varies by rarity (common/epic/legendary) |
| `player.levelup` | happy/proud | 0.7-0.9 | Higher for milestone levels (50+) |

### Social Events

| Event Type | Base Emotion | Intensity | Notes |
|------------|--------------|-----------|-------|
| `player.revived` | grateful | 0.75 | Revived by teammate |
| `player.savedally` | proud | 0.8 | Successfully saved teammate |
| `player.betrayed` | angry | 0.8 | Betrayed by teammate |

### Resource/Loot Events

| Event Type | Base Emotion | Intensity | Notes |
|------------|--------------|-----------|-------|
| `player.lootlegendary` | excited | 0.95 | Found legendary item |
| `player.lootepic` | happy | 0.8 | Found epic item |
| `player.loot` | satisfied | 0.6 | Found common item |
| `player.outofresources` | worried | 0.65 | Running low on resources |

### Quest Events

| Event Type | Base Emotion | Intensity | Notes |
|------------|--------------|-----------|-------|
| `player.questcomplete` | satisfied | 0.75 | Completed quest |
| `player.questfailed` | disappointed | 0.65 | Failed quest |

### Skill/Combo Events

| Event Type | Base Emotion | Intensity | Notes |
|------------|--------------|-----------|-------|
| `player.skillcombo` | satisfied/excited | 0.75-0.95 | Varies by combo length |

### Session Events

| Event Type | Base Emotion | Intensity | Notes |
|------------|--------------|-----------|-------|
| `player.sessionstart` | cheerful | 0.7 | Starting new game session |
| `player.sessionend` | neutral/tired | 0.5-0.6 | Ending session |
| `player.timeout` | frustrated | 0.7 | Connection timeout |

## Context-Aware Adjustments

The system adjusts base emotions based on various contextual factors:

### Player Health

**When health < 20%:**
- Positive emotions (happy, excited, satisfied) → **intensity × 0.8**
- Negative emotions (worried, frustrated) → **intensity × 1.2**

**Example:**
```
Base: happy (0.8) + Low Health → happy (0.64) "but health is critical"
```

### Combat State

**When in combat:**
- All non-combat emotions → **intensity × 1.1**

**Example:**
```
Base: satisfied (0.7) + In Combat → satisfied (0.77) "in combat"
```

### Win/Loss Streaks

**Win streak ≥ 3:**
- Positive emotions → **intensity × 1.2**, confidence = 0.95

**Loss streak ≥ 3:**
- Negative emotions → **intensity × 1.3**, confidence = 0.95

**Example:**
```
Base: happy (0.8) + Win Streak (5) → happy (0.96) "win streak: 5"
```

### Difficulty Level

**Hard/Nightmare difficulty:**
- Positive emotions → **intensity × 1.25**, confidence = 0.9

**Example:**
```
Base: satisfied (0.7) + Hard Mode → satisfied (0.88) "on hard difficulty"
```

### MVP Status

**When player is MVP:**
- Positive emotions → **intensity × 1.3**, confidence = 0.95

**Example:**
```
Base: happy (0.8) + MVP → happy (1.0) "MVP!"
```

## API Request/Response

### Request Format

```json
POST /analyze

{
  "type": "player.kill",
  "data": {
    "killCount": 3,
    "isLegendary": false,
    "mvp": true,
    "winStreak": 5
  },
  "context": {
    "playerHealth": 85,
    "playerLevel": 12,
    "inCombat": true
  }
}
```

### Response Format

**Rule-based Response**:
```json
{
  "emotion": "excited",
  "intensity": 1.0,
  "action": "cheer",
  "confidence": 0.95,
  "reasoning": "Multi-kill (3) (win streak: 5) (MVP!) (in combat)",
  "method": "rule",
  "cost": 0.0,
  "cache_hit": false,
  "latency_ms": 2.5
}
```

**ML-based Response** (when rule confidence < 0.8):
```json
{
  "emotion": "amazed",
  "intensity": 0.92,
  "action": "surprised_jump",
  "confidence": 0.88,
  "reasoning": "传奇成就解锁，玩家第一次达成这个成就",
  "method": "ml",
  "cost": 0.0003,
  "cache_hit": false,
  "latency_ms": 450.2
}
```

**Cached Response**:
```json
{
  "emotion": "excited",
  "intensity": 1.0,
  "action": "cheer",
  "confidence": 0.95,
  "reasoning": "Multi-kill (3) (win streak: 5) (MVP!) (in combat)",
  "method": "cached",
  "cost": 0.0,
  "cache_hit": true,
  "latency_ms": 0.8
}
```

### Response Fields

- `emotion` (string): Detected emotion from 14 supported types
- `intensity` (float): Emotion strength (0.0-1.0)
- `action` (string): Suggested character animation
- `confidence` (float): Detection confidence (0.0-1.0)
- `reasoning` (string): Explanation of detection logic
- `method` (string): Detection method used ("rule", "ml", or "cached")
- `cost` (float): API cost in USD ($0 for rule and cache)
- `cache_hit` (boolean): Whether result came from cache
- `latency_ms` (float): Processing time in milliseconds

## Implementation Details

### Event Data Fields

Different event types support different data fields:

**Kill Events:**
- `killCount` - Number of kills in this event
- `isLegendary` - Whether it's a legendary kill
- `mvp` / `isMVP` - Whether player is MVP

**Death Events:**
- `deathStreak` - Number of consecutive deaths

**Achievement Events:**
- `rarity` - "common" | "epic" | "legendary"

**Level Up Events:**
- `level` - New level number

**Combo Events:**
- `comboLength` - Length of the combo

**Session End Events:**
- `duration` - Session duration in seconds

**Streak Events:**
- `winStreak` - Current win streak
- `lossStreak` - Current loss streak

**Difficulty:**
- `difficulty` - "easy" | "normal" | "hard" | "nightmare"

### Context Fields

The context object provides real-time player state:

- `playerHealth` (0-100) - Current player health percentage
- `playerLevel` (number) - Current player level
- `inCombat` (boolean) - Whether player is in active combat

## ML Classification (Hybrid Strategy)

### Overview

When rule-based analysis has low confidence (< 0.8), the system automatically uses ML classification for more accurate emotion detection. This hybrid approach balances speed, cost, and accuracy.

### When ML is Triggered

ML classification is used when:

1. **Low Rule Confidence** (< 0.8)
   - Unusual event combinations
   - Ambiguous context
   - Edge cases not covered by rules

2. **Budget Constraints**
   - Daily budget: $5.00
   - Target ML usage: ~15% of requests
   - Automatic fallback if budget exceeded

### ML Classification Process

```python
# 1. Rule-based analysis first
rule_result = analyzer.analyze(event_type, data, context)

# 2. Check confidence
if rule_result.confidence < 0.8:
    # 3. Check budget
    if cost_manager.can_use_ml():
        # 4. Use ML (Claude API)
        ml_result = ml_classifier.classify(event_type, data, context)
        return ml_result
    else:
        # 5. Budget exceeded, use rule result
        return rule_result
else:
    return rule_result
```

### ML Prompt Engineering

The ML classifier uses carefully crafted prompts:

```
你是一个游戏情感分析专家。请分析以下游戏事件，并判断玩家最可能的情绪反应。

Event Type: player.achievement
Event Data:
  - rarity: legendary
  - name: Dragon Slayer

Player Context:
  - playerHealth: 100
  - inCombat: false

可选情绪列表：
happy, excited, amazed, proud, satisfied, cheerful, grateful,
sad, disappointed, frustrated, angry, worried, tired, neutral

请以JSON格式回复：
{
  "emotion": "选定的情绪",
  "intensity": 0.0-1.0之间的数值,
  "reasoning": "简短的中文解释",
  "confidence": 0.0-1.0之间的置信度
}
```

### Cost Control

The system enforces strict cost controls:

**Daily Budget Management**:
- Default: $5.00 per day
- Supports ~16,000 ML requests
- Automatic reset at midnight

**Usage Rate Limits**:
- Target: 15% of non-cached requests use ML
- Maximum: 22.5% (15% × 1.5 tolerance)
- Automatic throttling when exceeded

**Real-time Tracking**:
```bash
GET /stats

{
  "cost": {
    "total_cost": 0.45,
    "budget_remaining": 4.55,
    "ml_requests": 150,
    "rule_requests": 850,
    "ml_rate": 15.0,
    "target_ml_rate": 15.0
  }
}
```

### Caching Strategy

The cache reduces ML costs by storing results:

**Cache Key Generation**:
- Includes: event type, stable context (health status, combat state)
- Excludes: exact health values, timestamps, player IDs

**Grouping Examples**:
- Health 10-19% → "critical"
- Health 20-49% → "low"
- Kill count 2-4 → "multi"

**Benefits**:
- 30-40% cache hit rate for common events
- Reduces repeated ML costs
- < 1ms latency for cached responses

## Customization

### Adding New Event Types

To add support for new event types, modify `services/emotion-service/src/rule_analyzer.py`:

```python
def _get_base_emotion(event_type: str, event_data: dict) -> dict:
    # ... existing code ...

    # Add your new event type
    elif event_type == "player.customevent":
        return {
            "emotion": "happy",
            "intensity": 0.8,
            "reasoning": "Custom event triggered"
        }
```

### Adding New Emotions

1. Add the emotion to `_get_action()` with corresponding action:

```python
def _get_action(emotion: str) -> str:
    action_map = {
        # ... existing emotions ...
        "your_new_emotion": "your_animation",
    }
    return action_map.get(emotion, "idle")
```

2. Use the new emotion in event mappings

### Tuning Context Adjustments

Adjust multipliers in `_adjust_emotion_by_context()`:

```python
# Example: Make health impact more dramatic
if player_health < 20:
    if emotion in ["happy", "excited", "satisfied"]:
        intensity *= 0.6  # Changed from 0.8 to 0.6
```

## Best Practices

### 1. Event Type Naming Convention

Use the format: `player.<action>` or `game.<action>`

Examples:
- `player.victory` ✓
- `player.kill` ✓
- `victory` ✗ (missing prefix)

### 2. Intensity Ranges

- **0.9-1.0**: Extreme emotions (legendary achievements, major events)
- **0.7-0.9**: Strong emotions (victories, defeats, achievements)
- **0.5-0.7**: Moderate emotions (common events, neutral states)
- **< 0.5**: Subtle emotions (background events)

### 3. Confidence Scores

- **0.95**: Very confident (streaks, MVP, special context)
- **0.90**: Confident (difficulty-based achievements)
- **0.85**: Standard confidence (default)
- **< 0.85**: Low confidence (ambiguous events)

### 4. Reasoning Strings

Always provide clear reasoning for debugging:

```python
# Good
"Multi-kill (3) (win streak: 5) (MVP!)"

# Bad
"kill event"
```

### 5. Context Priority

When multiple context factors apply, they stack multiplicatively:

```
base_intensity = 0.8
× 1.2 (win streak)
× 1.25 (hard mode)
× 1.3 (MVP)
= 1.56 → capped at 1.0
```

## Testing

### Example Test Cases

**Test 1: Basic Kill**
```json
Input: {"type": "player.kill", "data": {"killCount": 1}, "context": {}}
Expected: emotion="satisfied", intensity=0.7
```

**Test 2: Multi-Kill with MVP**
```json
Input: {
  "type": "player.kill",
  "data": {"killCount": 3, "mvp": true},
  "context": {"inCombat": true}
}
Expected: emotion="excited", intensity=1.0, confidence=0.95
```

**Test 3: Death with Low Health**
```json
Input: {
  "type": "player.death",
  "data": {"deathStreak": 3},
  "context": {"playerHealth": 15}
}
Expected: emotion="frustrated", intensity=0.96 (0.8 × 1.2)
```

## Performance Considerations

### Rule-Based Analysis
- Evaluation complexity: **O(1)** - constant time lookup
- Context adjustments: **O(1)** - fixed number of checks
- Latency: **< 5ms** per request
- Throughput: **> 10,000 requests/second**
- Cost: **$0**

### ML Classification
- Latency: **300-800ms** per request
- Throughput: **~500 requests/second**
- Cost: **~$0.0003** per request
- Daily capacity: **~16,000 requests** ($5 budget)

### Cached Responses
- Latency: **< 1ms**
- Hit rate: **30-40%** for common events
- Cost: **$0**

### Overall System Performance
- **Average latency**: < 50ms (weighted average)
- **Average cost**: < $0.0001 per request
- **Availability**: 99.9%+ (graceful degradation)
- **Daily budget**: $5.00 (supports mixed workload)

## Future Enhancements

### Phase 2 (Current)
- ✅ **ML-based emotion classifier** - Hybrid rule + ML approach with budget control
- ✅ **Cost management** - Daily budgets, usage rate limits, caching
- ✅ **Confidence scoring** - Automatic ML trigger based on rule confidence

### Phase 2 (Planned)
- Player personality profiles (affects base emotions)
- Temporal smoothing (prevent rapid emotion changes)
- Multi-modal input (text chat sentiment analysis)

### Phase 3 (Planned)
- Transfer learning from player feedback
- Emotion transition animations
- Cultural adaptation (different emotion expressions per region)
- Voice tone analysis integration
- Advanced ML models (fine-tuned for gaming)

## Support

For questions about the emotion system:
- Service README: `services/emotion-service/README.md`
- Technical documentation: `services/emotion-service/src/`
- API reference: `docs/api/README.md`
- Integration guide: `docs/integration-guide.md`
- Contact: emotion-team@agl.com
