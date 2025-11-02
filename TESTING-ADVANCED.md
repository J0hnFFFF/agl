# 🧪 Advanced Testing Guide

Comprehensive Python-based testing suite for AGL Monolith service.

---

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
# Install test dependencies
pip install -r scripts/requirements.txt
```

### 2. Start Service

```bash
# Terminal 1
npm run dev:monolith
```

### 3. Run Tests

```bash
# Terminal 2 - Basic tests
python scripts/test-suite.py

# With performance tests
python scripts/test-suite.py --performance

# Custom iterations for performance
python scripts/test-suite.py --performance --iterations 1000

# Test different URL
python scripts/test-suite.py --url http://your-server:3000
```

---

## 📊 Test Suite Features

### ✅ Basic Functionality Tests
- Health check
- Game creation
- Player management
- API response validation

### 🎭 Emotion Analysis Tests
- All emotion types (excited, sad, frustrated, etc.)
- All event types (victory, death, achievement, etc.)
- Emotion intensity and confidence validation
- Context-aware emotion detection

### 💬 Dialogue Generation Tests
- Multi-language support (Chinese, English, Japanese)
- All character personas (cheerful, serious, playful)
- Template vs LLM source validation
- Dialogue quality checks

### 🧠 Memory System Tests
- Single memory storage
- Multiple memory operations
- Memory retrieval and search
- Importance scoring validation

### 🔄 Integration Tests
- Complete game workflow
- End-to-end scenarios
- Multi-step operations
- Real-world usage simulation

### ⚡ Performance Tests
- Response time benchmarks
- Throughput testing
- Latency measurements
- Performance regression detection

---

## 📖 Usage Examples

### Basic Test Run

```bash
python scripts/test-suite.py
```

**Output:**
```
==============================================================
🎮 AGL Monolith Advanced Test Suite
==============================================================

📋 BASIC FUNCTIONALITY TESTS

▶ Health Check
  Status: ok
  Service: AGL Monolith
  ✓ Passed (0.023s)

▶ Create Game
  Game ID: abc123
  Name: Test Game 10:30:15
  ✓ Passed (0.045s)

...

📊 TEST SUMMARY
==============================================================
Total Tests: 15
Passed: 15
Total Duration: 2.34s
==============================================================
✅ ALL TESTS PASSED!
```

### Performance Testing

```bash
python scripts/test-suite.py --performance --iterations 500
```

**Output:**
```
⚡ PERFORMANCE TESTS
==============================================================

▶ Emotion Performance (500 requests)
  Iterations: 500
  Average: 12.34ms
  Min: 8.12ms
  Max: 45.67ms
  ✓ Passed (6.172s)

▶ Dialogue Performance (500 requests)
  Iterations: 500
  Average: 15.23ms
  Min: 10.34ms
  Max: 52.11ms
  ✓ Passed (7.615s)
```

### Custom Server URL

```bash
# Test production server
python scripts/test-suite.py --url https://api.yourdomain.com

# Test staging
python scripts/test-suite.py --url https://staging.yourdomain.com
```

---

## 🎯 Test Categories

### 1. Health & Connectivity

```bash
# Tests basic service availability
- GET /health
- Service status validation
- Database connectivity
```

### 2. Game Management

```bash
# Tests game lifecycle
- POST /api/games (Create)
- GET /api/games/:id (Retrieve)
- Game validation and constraints
```

### 3. Player Management

```bash
# Tests player operations
- POST /api/players (Create)
- Player-game relationships
- Character persona validation
```

### 4. Emotion Analysis

```bash
# Tests emotion detection
- All event types:
  * player.victory
  * player.death
  * player.achievement
  * player.level_up
  * combat.start
  * combat.boss_defeated
  * player.item_acquired

- Emotion validation:
  * excited, happy, confident
  * sad, frustrated, angry
  * curious, surprised, neutral
```

### 5. Dialogue Generation

```bash
# Tests dialogue system
- Languages: zh (Chinese), en (English), ja (Japanese)
- Personas: cheerful, serious, playful
- Emotions: All 14 emotion types
- Quality validation
```

### 6. Memory System

```bash
# Tests memory operations
- Store single memory
- Store multiple memories
- Search and retrieval
- Importance-based filtering
```

### 7. Integration Workflows

```bash
# Tests complete scenarios
- Full game session:
  1. Create game
  2. Create player
  3. Game start
  4. Multiple events
  5. Dialogue generation
  6. Memory storage
  7. Memory retrieval
```

---

## 🔧 Advanced Usage

### Test Specific Categories

Edit `test-suite.py` to run only specific tests:

```python
# In main():
suite.run_test("Health Check", suite.test_health_check)
suite.run_test("Emotion: Victory", suite.test_emotion_victory)
# Comment out tests you don't need
```

### Custom Test Cases

Add your own test methods:

```python
def test_custom_scenario(self) -> Dict:
    """Test custom game scenario"""
    # Your test logic here
    payload = {...}
    response = self.session.post(f"{self.base_url}/api/...", json=payload)

    return {
        'passed': response.status_code == 200,
        'details': response.json()
    }

# Then add to run_basic_tests():
self.run_test("Custom Scenario", self.test_custom_scenario)
```

### Save Test Results

```bash
# Save output to file
python scripts/test-suite.py > test-results.txt 2>&1

# Save with timestamp
python scripts/test-suite.py > "test-results-$(date +%Y%m%d-%H%M%S).txt" 2>&1
```

---

## 📊 Performance Benchmarks

### Expected Performance

| Endpoint | Expected | Good | Excellent |
|----------|----------|------|-----------|
| Health Check | <50ms | <20ms | <10ms |
| Emotion Analysis | <100ms | <50ms | <20ms |
| Dialogue Generation | <150ms | <80ms | <30ms |
| Memory Storage | <100ms | <50ms | <20ms |
| Memory Retrieval | <150ms | <80ms | <30ms |

### Performance Test Options

```bash
# Quick test (100 iterations)
python scripts/test-suite.py --performance

# Standard test (500 iterations)
python scripts/test-suite.py --performance --iterations 500

# Load test (1000+ iterations)
python scripts/test-suite.py --performance --iterations 2000

# Stress test (5000+ iterations)
python scripts/test-suite.py --performance --iterations 5000
```

---

## 🐛 Debugging Failed Tests

### View Detailed Errors

The test suite shows detailed error information:

```
▶ Create Game
  ✗ Exception: HTTP 500

❌ FAILED TESTS:
  • Create Game
    Error: HTTP 500
```

### Check Service Logs

```bash
# Look at service terminal for errors
# Common issues:
- Database constraints
- Missing API keys
- Invalid request format
```

### Test Individual Endpoints

```bash
# Test manually with curl
curl -X POST http://localhost:3000/api/emotion/analyze \
  -H "Content-Type: application/json" \
  -d '{"eventType":"player.victory","data":{}}'
```

---

## 📈 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test AGL Service

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          npm install
          pip install -r scripts/requirements.txt

      - name: Start service
        run: npm run dev:monolith &

      - name: Wait for service
        run: sleep 10

      - name: Run tests
        run: python scripts/test-suite.py
```

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running tests before commit..."
npm run dev:monolith &
SERVICE_PID=$!

sleep 5

python scripts/test-suite.py --basic-only

TEST_RESULT=$?
kill $SERVICE_PID

exit $TEST_RESULT
```

---

## 🔄 Continuous Testing

### Watch Mode

```bash
# Use watchdog to auto-run tests on file changes
pip install watchdog

# Create watch script
watchmedo shell-command \
  --patterns="*.ts;*.py" \
  --recursive \
  --command='python scripts/test-suite.py' \
  services/monolith/src
```

### Scheduled Testing

```bash
# Cron job to run tests every hour
0 * * * * cd /path/to/agl && python scripts/test-suite.py > /var/log/agl-tests.log 2>&1
```

---

## 📚 Related Documentation

- [Quick Testing](./TESTING-QUICKSTART.md) - Manual testing guide
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [API Documentation](./docs/api/README.md) - API reference
- [Performance Guide](./docs/performance-optimization.md) - Optimization tips

---

## 💡 Tips & Best Practices

### 1. Run Tests Regularly

```bash
# Before committing code
python scripts/test-suite.py

# Before deploying
python scripts/test-suite.py --performance
```

### 2. Monitor Performance Trends

Track average response times over time:

```bash
# Save results with timestamp
python scripts/test-suite.py --performance >> performance-log.txt
```

### 3. Test Different Scenarios

```python
# Create scenario-specific tests
test_tutorial_flow()
test_pvp_match()
test_boss_battle()
test_social_interaction()
```

### 4. Use Version Control

```bash
# Tag tests with versions
git tag -a v1.0-tests -m "Test suite v1.0"
```

---

## 🆘 Getting Help

If tests fail consistently:

1. **Check service logs** - Look for errors in terminal
2. **Reset database** - Run `.\scripts\reset-db.ps1`
3. **Verify dependencies** - Run `pip install -r scripts/requirements.txt`
4. **Check connectivity** - Ensure service is running
5. **Review recent changes** - Check what code changed

---

**Happy Testing! 🧪✨**
