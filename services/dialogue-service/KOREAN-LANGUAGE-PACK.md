# Korean Language Pack for AGL Dialogue Service

Comprehensive Korean (한국어) dialogue templates for AI game companions.

## Overview

The Korean language pack provides 300+ authentic Korean game dialogue templates covering all game events, emotions, and companion personas. Designed specifically for Korean gaming culture with appropriate slang, emoticons, and formality levels.

## Statistics

```
Total Templates: 300+
Unique Combinations: 80+
Event Types: 15+
Emotions: 12+
Personas: 5
```

## Supported Features

### Event Types (15+)

| Event Type | Description | Example Scenarios |
|------------|-------------|-------------------|
| `player.victory` | Player wins match/battle | Match victory, domination |
| `player.defeat` | Player loses match/battle | Match loss, close defeat |
| `player.levelup` | Player gains level | Level milestone reached |
| `player.achievement` | Achievement unlocked | Rare achievement obtained |
| `player.loot` | Item/loot acquired | Rare item drop, chest opened |
| `player.queststart` | Quest begins | New quest accepted |
| `player.questcomplete` | Quest completed | Quest objectives finished |
| `combat.start` | Combat begins | Battle initiation |
| `combat.critical` | Critical hit landed | Perfect attack execution |
| `combat.neardeath` | Low health warning | Critical health status |
| `companion.summon` | Companion summoned | Player calls companion |
| `idle.chatter` | Idle conversation | Waiting for action |
| `player.sessionstart` | Game session begins | Player logs in |
| `player.sessionend` | Game session ends | Player logs out |
| `player.winstreak` | Winning streak | Multiple consecutive wins |
| `player.losestreak` | Losing streak | Multiple consecutive losses |
| `player.mvp` | MVP award received | Best player in match |
| `player.firstwin` | First ever victory | First time winning |
| `player.return` | Player returns after absence | Coming back after break |

### Emotions (12+)

| Emotion | Usage | Example Context |
|---------|-------|-----------------|
| `happy` | General happiness | Victory, success |
| `excited` | High excitement | Amazing play, rare drop |
| `proud` | Pride and satisfaction | Achievement earned |
| `confident` | Self-assurance | Battle start, challenge |
| `sad` | Disappointment | Defeat, failure |
| `disappointed` | Mild sadness | Close loss |
| `frustrated` | Annoyance | Repeated failures |
| `worried` | Concern | Low health, danger |
| `determined` | Resolve | Comeback attempt |
| `neutral` | Calm state | Idle, waiting |
| `cheerful` | Upbeat mood | General positivity |
| `curious` | Interest | New discovery |

### Personas (5)

#### 1. Cheerful (밝은)
- **Characteristics**: Enthusiastic, supportive, optimistic
- **Language Style**: Friendly, lots of exclamation marks, encouragement
- **Example**: "와! 이겼어요! ✨"

#### 2. Cool (쿨한)
- **Characteristics**: Calm, collected, professional
- **Language Style**: Short sentences, matter-of-fact, minimal emotion
- **Example**: "승리. 예상대로야."

#### 3. Cute (귀여운)
- **Characteristics**: Adorable, playful, affectionate
- **Language Style**: Uses ~ tilde, aegyo expressions, emoticons
- **Example**: "야호~ 이겼어요! 최고예요! 💕"

#### 4. Serious (진지한)
- **Characteristics**: Professional, tactical, mission-focused
- **Language Style**: Formal, strategic language, military-like
- **Example**: "승리했습니다. 훌륭한 전략이었습니다."

#### 5. Mysterious (신비로운)
- **Characteristics**: Enigmatic, philosophical, mystical
- **Language Style**: Poetic, fate/destiny references, cryptic
- **Example**: "운명이 당신 편이었군요..."

## Usage

### Basic Usage

```python
from src.templates_ko import get_random_ko_dialogue

# Get random Korean dialogue
dialogue = get_random_ko_dialogue(
    event_type="player.victory",
    emotion="happy",
    persona="cheerful"
)
print(dialogue)  # "와! 이겼어요! ✨"
```

### With Template Manager (Multi-Language)

```python
from src.templates_i18n import TemplateManager

# Initialize with Korean as default
manager = TemplateManager(default_language="ko")

# Get dialogue (uses Korean by default)
dialogue = manager.get_dialogue(
    event_type="player.victory",
    emotion="happy",
    persona="cheerful"
)

# Get dialogue in specific language
korean_dialogue = manager.get_dialogue(
    event_type="player.victory",
    emotion="happy",
    persona="cool",
    language="ko"
)
```

### Dynamic Language Switching

```python
from src.templates_i18n import get_dialogue

# Korean companion
ko_dialogue = get_dialogue("player.victory", "happy", "cheerful", language="ko")

# English companion
en_dialogue = get_dialogue("player.victory", "happy", "cool", language="en")

# Switch based on player preference
player_language = "ko"  # From player settings
dialogue = get_dialogue("player.victory", "happy", "cheerful", language=player_language)
```

## Example Dialogues

### Victory Scenarios

**Cheerful Persona (밝은)**
```
- "와! 이겼어요! ✨"
- "대박! 정말 멋진 경기였어요!"
- "승리! 정말 잘했어요! 🎉"
- "해냈어요! 정말 대단해요!"
```

**Cool Persona (쿨한)**
```
- "괜찮네. 이겼어."
- "승리. 예상대로야."
- "잘했어."
- "좋은 플레이였어."
```

**Cute Persona (귀여운)**
```
- "야호~ 이겼어요! 최고예요! 💕"
- "와~ 너무 기뻐요! 우리가 해냈어요!"
- "완전 멋져요~ 최고예요!"
```

### Defeat Scenarios

**Cheerful Persona (밝은)**
```
- "괜찮아요, 다음에는 이길 거예요!"
- "이런 날도 있는 거예요! 다시 도전해요!"
- "괜찮아요! 모든 패배는 교훈이에요!"
```

**Cool Persona (쿨한)**
```
- "이번엔 운이 없었어."
- "패배. 분석하고 개선하자."
- "다음 기회에 만회해."
```

**Cute Persona (귀여운)**
```
- "으흥... 괜찮아요! 다음엔 잘할 거예요!"
- "힘내요~! 우린 할 수 있어요!"
```

### Level Up

```
Cheerful: "레벨업! 점점 강해지고 있어요!"
Cool: "레벨업. 진행 중."
Cute: "레벨업~! 야호~!"
Serious: "레벨 상승을 확인했습니다."
Mysterious: "새로운 힘이 깨어났어요..."
```

### Achievement Unlocked

```
Cheerful: "업적 달성! 축하해요!"
Cool: "업적 언락. 인상적이야."
Cute: "야호~ 업적!! 정말 자랑스러워요~!"
Serious: "업적 달성을 확인했습니다."
Mysterious: "운명의 증표를 얻었군요..."
```

## Cultural Considerations

### Korean Gaming Slang

The templates use authentic Korean gaming expressions:

- **대박** (daebak) - "Awesome/Amazing"
- **ㅇㅇ** (shortened affirmation)
- **ㅋㅋ** (laughter)
- **와** (wa) - "Wow"
- **꺀** (kkya) - Cute exclamation
- **짱** (jjang) - "The best"

### Emoticons and Symbols

Korean gaming culture frequently uses:

- **~** (tilde) - Adds cuteness/softness to sentences
- **✨** - Sparkle for emphasis
- **💕** - Heart for affection
- **🎉** - Celebration

### Formality Levels

Templates use appropriate formality:

- **-요/-어요** endings for friendly formality
- **-다** endings for casual cool persona
- **~** additions for cute persona
- **-습니다** for serious/professional tone

### Sentence Structure

Korean templates follow natural Korean sentence patterns:

- Subject-Object-Verb order
- Appropriate particles (이/가, 을/를, 은/는)
- Natural Korean expressions vs. direct translations
- Context-appropriate honorifics

## Template Statistics by Category

### Victory Templates (50+)
- Cheerful: 20 variations
- Cool: 15 variations
- Cute: 18 variations
- Serious: 8 variations
- Mysterious: 6 variations

### Defeat Templates (30+)
- Sad: 15 variations
- Disappointed: 12 variations
- Frustrated: 10 variations

### Combat Templates (25+)
- Combat start: 8 variations
- Critical hits: 7 variations
- Near death: 10 variations

### Progression Templates (35+)
- Level up: 15 variations
- Achievement: 12 variations
- Loot: 8 variations

### Social Templates (40+)
- Session start: 10 variations
- Session end: 10 variations
- Idle chatter: 15 variations
- Companion summon: 5 variations

### Special Situations (30+)
- Win streak: 6 variations
- Lose streak: 6 variations
- MVP: 6 variations
- First win: 4 variations
- Return: 4 variations
- Quest start: 5 variations
- Quest complete: 8 variations

## Testing

### Run Korean Template Tests

```bash
# All Korean template tests
pytest tests/test_templates_ko.py -v

# Specific test class
pytest tests/test_templates_ko.py::TestKoreanTemplates -v

# Coverage test
pytest tests/test_templates_ko.py --cov=src.templates_ko
```

### Run Integration Tests

```bash
# Multi-language integration tests
pytest tests/test_i18n_integration.py -v

# Full test suite
pytest tests/ -v
```

### Test Statistics

```
Korean Template Tests: 50+ tests
Integration Tests: 50+ tests
Total Test Coverage: 100+ tests
Coverage: 95%+
```

## API Reference

### `get_dialogue_templates_ko()`

Returns the complete Korean dialogue template dictionary.

**Returns:**
- `Dict[tuple, List[str]]` - Dictionary mapping (event_type, emotion, persona) to dialogue list

**Example:**
```python
templates = get_dialogue_templates_ko()
victory_cheerful = templates[("player.victory", "happy", "cheerful")]
```

### `get_random_ko_dialogue(event_type, emotion, persona)`

Gets a random Korean dialogue for the specified parameters.

**Parameters:**
- `event_type` (str) - Event type (e.g., "player.victory")
- `emotion` (str) - Emotion state (e.g., "happy")
- `persona` (str) - Companion persona (e.g., "cheerful")

**Returns:**
- `str` - Random dialogue string from templates (or "..." fallback)

**Example:**
```python
dialogue = get_random_ko_dialogue("player.victory", "happy", "cheerful")
```

### `get_template_stats()`

Gets statistics about the Korean template library.

**Returns:**
- `dict` - Statistics including:
  - `total_templates` - Total number of dialogue strings
  - `total_combinations` - Number of (event, emotion, persona) combinations
  - `unique_event_types` - Number of unique event types
  - `unique_emotions` - Number of unique emotions
  - `unique_personas` - Number of unique personas

**Example:**
```python
stats = get_template_stats()
print(f"Total templates: {stats['total_templates']}")
```

## Performance

### Benchmarks

- **Template retrieval**: < 0.01ms per call
- **100 sequential calls**: < 10ms
- **Language switching**: No performance impact
- **Memory footprint**: ~50KB for all Korean templates

### Caching

Templates are loaded once at import time and cached in memory for fast access.

## Extending the Language Pack

### Adding New Templates

1. Edit `templates_ko.py`
2. Add new (event_type, emotion, persona) combinations
3. Ensure cultural appropriateness
4. Run tests to verify

**Example:**
```python
# Add new event type
("player.newevet", "happy", "cheerful"): [
    "새 이벤트 대사 1",
    "새 이벤트 대사 2",
    "새 이벤트 대사 3",
],
```

### Best Practices

1. **Minimum 3 variations** per combination
2. **Natural Korean** - avoid direct translations
3. **Consistent persona** - maintain character voice
4. **Cultural fit** - use appropriate gaming slang
5. **Length** - keep dialogues under 100 characters
6. **Punctuation** - use Korean punctuation rules
7. **Testing** - add tests for new templates

## Troubleshooting

### Issue: Dialogue returns "..."

**Cause:** Invalid (event_type, emotion, persona) combination

**Solution:** Check that the combination exists in templates
```python
from src.templates_ko import get_dialogue_templates_ko

templates = get_dialogue_templates_ko()
key = ("player.victory", "happy", "cheerful")
if key in templates:
    print("✓ Combination exists")
else:
    print("✗ Combination not found")
```

### Issue: No Korean characters in output

**Cause:** Wrong language selected or fallback to default

**Solution:** Explicitly specify Korean language
```python
dialogue = get_dialogue("player.victory", "happy", "cheerful", language="ko")
```

### Issue: Inconsistent persona style

**Cause:** Mixing personas or missing templates

**Solution:** Verify persona consistency in your code
```python
# Good - consistent persona
manager = TemplateManager(default_language="ko")
d1 = manager.get_dialogue("player.victory", "happy", "cheerful")
d2 = manager.get_dialogue("player.levelup", "excited", "cheerful")

# Bad - mixing personas
d1 = manager.get_dialogue("player.victory", "happy", "cheerful")
d2 = manager.get_dialogue("player.levelup", "excited", "cool")  # Different persona!
```

## Future Enhancements

### Planned Features

- [ ] Regional dialect support (Seoul, Busan, etc.)
- [ ] Generational slang variations (Gen Z vs. Millennial)
- [ ] Seasonal event templates (holidays, festivals)
- [ ] Context-aware templates (time of day, weather)
- [ ] Dynamic template mixing
- [ ] Player name personalization
- [ ] Achievement-based dialogue unlocks

### Community Contributions

Want to contribute more Korean templates?

1. Fork the repository
2. Add templates to `templates_ko.py`
3. Add tests to `test_templates_ko.py`
4. Submit pull request with description
5. Ensure cultural appropriateness review

## License

Copyright © 2024 AGL Team. All rights reserved.

## Support

For issues or questions about the Korean language pack:

- **GitHub Issues**: https://github.com/agl/dialogue-service/issues
- **Discord**: https://discord.gg/agl
- **Email**: support@agl.dev

## Credits

Korean language pack created by the AGL localization team with input from native Korean gamers and linguists.

Special thanks to Korean gaming community for feedback and cultural consultation.
