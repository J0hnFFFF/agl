# STT Service - Speech-to-Text Recognition

**OpenAI Whisper API Integration with Cost Optimization**

Part of AGL (AI Game Companion Engine) Phase 5 implementation.

---

## 🎯 Features

- **Multi-Language Support**: Chinese (zh-CN), English (en-US), Japanese (ja-JP), Korean (ko-KR)
- **Voice Activity Detection (VAD)**: Automatically removes silence to reduce API costs by 20-50%
- **Result Caching**: 7-day cache to avoid redundant API calls
- **Budget Management**: Daily budget enforcement with alerts at 80% and 95%
- **Cost Tracking**: Real-time cost monitoring and statistics
- **Multiple Audio Formats**: mp3, wav, m4a, webm, mp4, mpeg, mpga

---

## 📦 Installation

### Prerequisites

- Python 3.11+
- Redis (for caching)
- OpenAI API Key

### Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="sk-..."
export REDIS_HOST="localhost"
export REDIS_PORT="6379"
export DAILY_STT_BUDGET="30.0"  # USD

# Run service
uvicorn app:app --host 0.0.0.0 --port 8004 --reload
```

---

## 🚀 Quick Start

### Basic Transcription

```bash
# Transcribe audio file
curl -X POST http://localhost:8004/transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "audio_data": "<base64-encoded-audio>",
    "format": "mp3",
    "language": "zh-CN",
    "enable_vad": true
  }'
```

### File Upload

```bash
# Upload audio file directly
curl -X POST http://localhost:8004/transcribe/file \
  -F "file=@audio.mp3" \
  -F "language=zh-CN" \
  -F "enable_vad=true"
```

### Response Example

```json
{
  "text": "你好，我是AI助手",
  "language": "zh-CN",
  "confidence": 0.98,
  "duration_seconds": 2.5,
  "method": "stt",
  "cost": 0.00025,
  "cache_hit": false,
  "latency_ms": 452.3,
  "audio_size_bytes": 48000,
  "vad_applied": true
}
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | Required | OpenAI API key |
| `STT_SERVICE_PORT` | `8004` | Service port |
| `STT_ENABLED` | `true` | Enable/disable STT |
| `WHISPER_MODEL` | `whisper-1` | Whisper model to use |
| `VAD_ENABLED` | `true` | Enable Voice Activity Detection |
| `VAD_AGGRESSIVENESS` | `2` | VAD aggressiveness (0-3) |
| `STT_CACHE_ENABLED` | `true` | Enable result caching |
| `STT_CACHE_TTL` | `604800` | Cache TTL (7 days) |
| `DAILY_STT_BUDGET` | `30.0` | Daily budget in USD |
| `MAX_COST_PER_REQUEST` | `1.0` | Max cost per request |
| `MAX_AUDIO_SIZE_MB` | `25` | Max audio file size |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |

---

## 📡 API Endpoints

### `POST /transcribe`

Transcribe speech from base64-encoded audio.

**Request:**
```json
{
  "audio_data": "string",  // Base64-encoded audio
  "format": "mp3",         // Audio format
  "language": "zh-CN",     // Optional language code
  "enable_vad": true       // Enable VAD
}
```

**Response:**
```json
{
  "text": "string",
  "language": "string",
  "confidence": 0.98,
  "duration_seconds": 2.5,
  "method": "stt",
  "cost": 0.00025,
  "cache_hit": false,
  "latency_ms": 452.3,
  "audio_size_bytes": 48000,
  "vad_applied": true
}
```

### `POST /transcribe/file`

Transcribe speech from uploaded file.

**Request (multipart/form-data):**
- `file`: Audio file
- `language`: Optional language code
- `enable_vad`: Enable VAD (default: true)

### `GET /health`

Health check endpoint.

### `GET /languages`

List supported languages.

### `GET /stats`

Get service statistics (cache, cost, VAD).

### `POST /cache/clear`

Clear transcription cache.

---

## 💰 Cost Optimization

### Voice Activity Detection (VAD)

VAD automatically removes silence from audio before sending to Whisper API:

- **Typical savings**: 20-50% cost reduction
- **Aggressiveness levels**:
  - `0`: Least aggressive (keeps more audio)
  - `1`: Moderate
  - `2`: Balanced (default)
  - `3`: Most aggressive (removes more)

### Caching

Results are cached for 7 days:

- **Cache hit**: ~10ms latency, $0 cost
- **Cache miss**: ~500ms latency, ~$0.006/min cost

### Budget Management

Daily budget enforcement with proactive alerts:

- **80% threshold**: Warning alert
- **95% threshold**: Critical alert
- **100% threshold**: Requests blocked

---

## 📊 Pricing

**OpenAI Whisper Pricing (2025):**
- $0.006 per minute of audio

**Cost Examples:**
| Audio Length | Original Cost | With VAD (40% savings) |
|--------------|---------------|------------------------|
| 10 seconds   | $0.001        | $0.0006                |
| 30 seconds   | $0.003        | $0.0018                |
| 1 minute     | $0.006        | $0.0036                |
| 5 minutes    | $0.030        | $0.0180                |

**Daily Budget Planning:**
- $30/day budget = ~5,000 minutes of audio
- With 80% cache hit rate = ~25,000 minutes effective capacity

---

## 🧪 Testing

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run specific test
pytest tests/test_api.py::test_transcribe_success -v
```

---

## 🔍 Monitoring

### Key Metrics

- **Cache Hit Rate**: Target >80%
- **Average Latency**:
  - Cached: <20ms
  - STT: <500ms (P95)
- **Daily Cost**: Monitor via `/stats` endpoint
- **VAD Effectiveness**: Reduction percentage

### Grafana Dashboard

Metrics exposed via `/stats` endpoint can be scraped by Prometheus:

- `stt_requests_total{method="stt|cached"}`
- `stt_cost_total`
- `stt_cache_hit_rate`
- `stt_latency_seconds{method="stt|cached"}`

---

## 🚨 Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Budget check failed` | Daily budget exceeded | Wait for reset (UTC 00:00) or increase budget |
| `Audio size exceeds limit` | File > 25MB | Split audio or reduce quality |
| `Whisper API error` | OpenAI API issue | Check API key and quota |
| `Cache unavailable` | Redis connection failed | Check Redis connection |

---

## 🔗 Integration Example

### Voice Dialogue Flow (STT + Dialogue + TTS)

```python
import requests
import base64

# 1. Record audio from user
audio_file = "user_speech.mp3"

# 2. Transcribe with STT Service
with open(audio_file, "rb") as f:
    audio_data = base64.b64encode(f.read()).decode()

stt_response = requests.post("http://localhost:8004/transcribe", json={
    "audio_data": audio_data,
    "format": "mp3",
    "language": "zh-CN",
    "enable_vad": True
})

text = stt_response.json()["text"]
print(f"User said: {text}")

# 3. Generate dialogue response
dialogue_response = requests.post("http://localhost:8001/generate", json={
    "emotion": "interested",
    "context": {"user_input": text},
    "persona": "cheerful",
    "language": "zh-CN"
})

reply_text = dialogue_response.json()["dialogue"]
print(f"AI replies: {reply_text}")

# 4. Synthesize speech with TTS Service
tts_response = requests.post("http://localhost:8003/synthesize", json={
    "text": reply_text,
    "voice": "nova",
    "language": "zh-CN"
})

audio_url = tts_response.json()["audio_url"]
# Play audio to user
```

---

## 📝 Development

### Project Structure

```
stt-service/
├── app.py                 # FastAPI application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── src/
│   ├── __init__.py
│   ├── config.py         # Configuration
│   ├── models.py         # Pydantic models
│   ├── stt_engine.py     # Core STT engine
│   ├── cache.py          # Redis caching
│   ├── cost_tracker.py   # Cost management
│   └── vad.py            # Voice Activity Detection
└── tests/
    ├── __init__.py
    └── test_api.py       # API tests
```

### Adding New Features

1. **Add new language**:
   - Update `supported_languages` in `config.py`
   - Add mapping in `stt_engine.py::_map_language_code()`

2. **Adjust VAD aggressiveness**:
   - Set `VAD_AGGRESSIVENESS` env var (0-3)
   - Higher = more aggressive = more cost savings

3. **Custom caching strategy**:
   - Modify `cache.py::_generate_key()` for custom cache keys
   - Adjust TTL with `STT_CACHE_TTL` env var

---

## 🤝 Contributing

This service is part of AGL Platform Phase 5 implementation.

See main project README for contribution guidelines.

---

## 📄 License

Part of AGL Platform - Proprietary License

---

## 🔗 Related Services

- [Voice Service (TTS)](../voice-service/) - Text-to-speech synthesis
- [Dialogue Service](../dialogue-service/) - AI dialogue generation
- [API Service](../api-service/) - Main REST API gateway

---

**Version**: 1.0.0 (Phase 5)
**Status**: ✅ Production Ready
**Last Updated**: 2025-11
