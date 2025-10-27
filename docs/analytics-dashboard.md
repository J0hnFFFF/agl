# Analytics Dashboard

## Overview

The Analytics Dashboard provides comprehensive monitoring and insights into your AGL platform usage, including game events, AI service performance, costs, and player engagement metrics.

## Features

### 📊 Core Analytics
- **Game Usage Statistics** - Track events, players, and engagement
- **Service Performance** - Monitor latency and throughput
- **Cost Tracking** - Real-time AI service cost monitoring
- **Emotion Distribution** - Analyze player emotional states
- **Dialogue Statistics** - Template vs LLM usage ratios
- **Memory Operations** - Track memory creation and searches

### ⏱️ Time-Series Data
- **Hourly Analytics** - Real-time monitoring (last 24-72 hours)
- **Daily Analytics** - Historical trends and patterns
- **Custom Date Ranges** - Flexible time period analysis

### 💰 Cost Management
- **Service-Level Costs** - Break down by Emotion, Dialogue, Memory services
- **Daily Cost Trends** - Track spending over time
- **Budget Monitoring** - Stay within ML/LLM budgets
- **Cost Per Request** - Average costs analysis

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Analytics System                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────┐      ┌──────────────┐              │
│  │ Service       │─────→│ ServiceMetric│              │
│  │ Metrics       │      │   Table      │              │
│  │ Collection    │      └──────────────┘              │
│  └───────────────┘              │                       │
│                                  │                       │
│  ┌───────────────┐              ↓                       │
│  │  Aggregation  │      ┌──────────────┐              │
│  │  Tasks        │─────→│ DailyAnalytics│              │
│  │  (Cron Jobs)  │      │ HourlyAnalytics│             │
│  └───────────────┘      └──────────────┘              │
│                                  │                       │
│                                  ↓                       │
│  ┌───────────────┐      ┌──────────────┐              │
│  │   Analytics   │──────│  REST API    │              │
│  │   Service     │      │  Endpoints   │              │
│  └───────────────┘      └──────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Data Collection

### Automatic Metrics Collection

All service operations automatically record metrics:

```typescript
// Example: Emotion service records metrics after analysis
await analyticsService.recordMetric({
  service: ServiceType.EMOTION,
  operation: 'analyze_emotion',
  playerId: 'player-123',
  gameId: 'game-123',
  latencyMs: 50,
  statusCode: 200,
  method: 'rule',
  cost: 0,
  metadata: {
    emotion: 'happy',
    intensity: 0.9,
  },
});
```

### Tracked Metrics

- **Latency** - Response time in milliseconds
- **Status Code** - HTTP status (200, 400, 500, etc.)
- **Method** - Detection method (rule/ml/template/llm/cached)
- **Cost** - API cost in USD
- **Metadata** - Additional context data

## Data Aggregation

### Hourly Aggregation

Runs every hour to aggregate data from the previous hour:
- Total events and requests
- Average latency
- Error counts
- Total costs
- Unique players

### Daily Aggregation

Runs at midnight to aggregate the previous day's data:
- Comprehensive statistics
- Method distribution (rule/ml, template/llm)
- Emotion distribution
- Cost breakdown
- Player engagement metrics

## API Endpoints

### GET /analytics/games/:gameId

Get daily analytics for a specific game.

**Query Parameters**:
- `startDate` (optional) - Start date (ISO 8601)
- `endDate` (optional) - End date (ISO 8601)

**Example**:
```bash
curl http://localhost:3000/analytics/games/game-123?startDate=2025-01-01&endDate=2025-01-31 \
  -H "X-API-Key: your-api-key"
```

**Response**:
```json
[
  {
    "date": "2025-01-01",
    "gameId": "game-123",
    "totalEvents": 1500,
    "uniquePlayers": 250,
    "emotionRequests": 800,
    "emotionRuleCount": 720,
    "emotionMlCount": 60,
    "emotionCachedCount": 20,
    "emotionAvgLatency": 45.2,
    "emotionCost": 0.018,
    "dialogueRequests": 700,
    "dialogueTemplateCount": 630,
    "dialogueLlmCount": 50,
    "dialogueCachedCount": 20,
    "dialogueAvgLatency": 125.5,
    "dialogueCost": 0.025,
    "memoryCreated": 150,
    "memorySearches": 300,
    "memoryAvgLatency": 85.3,
    "memoryCost": 0.003,
    "emotionDistribution": {
      "happy": 350,
      "excited": 200,
      "sad": 100,
      "frustrated": 80,
      "neutral": 70
    },
    "totalCost": 0.046
  }
]
```

### GET /analytics/games/:gameId/usage

Get game usage statistics with summary.

**Query Parameters**:
- `days` (optional, default: 30) - Number of days to analyze

**Example**:
```bash
curl http://localhost:3000/analytics/games/game-123/usage?days=30 \
  -H "X-API-Key: your-api-key"
```

**Response**:
```json
{
  "summary": {
    "totalEvents": 45000,
    "totalPlayers": 7500,
    "emotionRequests": 24000,
    "dialogueRequests": 21000,
    "memoryOperations": 9000,
    "totalCost": 1.38,
    "avgLatency": 78.5
  },
  "dailyStats": [
    {
      "date": "2025-01-01",
      "totalEvents": 1500,
      "uniquePlayers": 250,
      "emotionRequests": 800,
      "dialogueRequests": 700,
      "totalCost": 0.046
    }
  ]
}
```

### GET /analytics/games/:gameId/emotions

Get emotion distribution for a game.

**Query Parameters**:
- `startDate` (optional) - Start date
- `endDate` (optional) - End date

**Example**:
```bash
curl http://localhost:3000/analytics/games/game-123/emotions?startDate=2025-01-01 \
  -H "X-API-Key: your-api-key"
```

**Response**:
```json
{
  "happy": 5200,
  "excited": 3800,
  "amazed": 1200,
  "proud": 2100,
  "satisfied": 4500,
  "cheerful": 1800,
  "grateful": 900,
  "sad": 1500,
  "disappointed": 1200,
  "frustrated": 1100,
  "angry": 400,
  "worried": 800,
  "tired": 600,
  "neutral": 2000
}
```

### GET /analytics/hourly

Get hourly analytics for real-time monitoring.

**Query Parameters**:
- `gameId` (optional) - Filter by game ID
- `hours` (optional, default: 24) - Number of hours to retrieve

**Example**:
```bash
curl "http://localhost:3000/analytics/hourly?gameId=game-123&hours=24" \
  -H "X-API-Key: your-api-key"
```

**Response**:
```json
[
  {
    "hour": "2025-01-26T00:00:00Z",
    "gameId": "game-123",
    "totalEvents": 125,
    "emotionRequests": 65,
    "dialogueRequests": 60,
    "memoryOperations": 25,
    "avgLatency": 82.5,
    "errorCount": 2,
    "totalCost": 0.004
  }
]
```

### GET /analytics/costs

Get comprehensive cost analytics.

**Query Parameters**:
- `startDate` (optional) - Start date
- `endDate` (optional) - End date
- `gameId` (optional) - Filter by game
- `service` (optional) - Filter by service (EMOTION, DIALOGUE, MEMORY)

**Example**:
```bash
curl "http://localhost:3000/analytics/costs?startDate=2025-01-01&endDate=2025-01-31" \
  -H "X-API-Key: your-api-key"
```

**Response**:
```json
{
  "totalCost": 42.56,
  "totalRequests": 85000,
  "costByService": [
    {
      "service": "EMOTION",
      "totalCost": 12.30,
      "averageCost": 0.0005,
      "requestCount": 24600
    },
    {
      "service": "DIALOGUE",
      "totalCost": 28.45,
      "averageCost": 0.0013,
      "requestCount": 21800
    },
    {
      "service": "MEMORY",
      "totalCost": 1.81,
      "averageCost": 0.0001,
      "requestCount": 18100
    }
  ],
  "dailyCost": [
    {
      "date": "2025-01-01",
      "emotionCost": 0.42,
      "dialogueCost": 0.98,
      "memoryCost": 0.06,
      "totalCost": 1.46
    }
  ]
}
```

### GET /analytics/platform

Get platform-wide statistics.

**Query Parameters**:
- `days` (optional, default: 30) - Number of days to analyze

**Example**:
```bash
curl "http://localhost:3000/analytics/platform?days=30" \
  -H "X-API-Key: your-api-key"
```

**Response**:
```json
{
  "activeGames": 15,
  "totalEvents": 128000,
  "totalPlayers": 18500,
  "emotionRequests": 68000,
  "dialogueRequests": 60000,
  "memoryCreated": 12000,
  "memorySearches": 25000,
  "totalCost": 156.80,
  "usage": {
    "emotionRule": 54400,
    "emotionMl": 6800,
    "emotionCached": 6800,
    "dialogueTemplate": 54000,
    "dialogueLlm": 4200,
    "dialogueCached": 1800
  }
}
```

### GET /analytics/metrics

Get raw service metrics with pagination.

**Query Parameters**:
- `startDate` (optional) - Start date
- `endDate` (optional) - End date
- `gameId` (optional) - Filter by game
- `service` (optional) - Filter by service
- `limit` (optional, default: 100) - Page size
- `offset` (optional, default: 0) - Page offset

**Example**:
```bash
curl "http://localhost:3000/analytics/metrics?service=EMOTION&limit=10" \
  -H "X-API-Key: your-api-key"
```

**Response**:
```json
{
  "metrics": [
    {
      "id": 12345,
      "service": "EMOTION",
      "operation": "analyze_emotion",
      "playerId": "player-123",
      "gameId": "game-123",
      "latencyMs": 45,
      "statusCode": 200,
      "method": "rule",
      "cost": 0,
      "metadata": {
        "emotion": "happy",
        "intensity": 0.9
      },
      "createdAt": "2025-01-26T12:30:00Z"
    }
  ],
  "pagination": {
    "total": 68000,
    "limit": 10,
    "offset": 0
  }
}
```

## Usage Patterns

### Daily Monitoring

Track daily performance and costs:

```typescript
// Get yesterday's analytics
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const analytics = await fetch(
  `http://localhost:3000/analytics/games/${gameId}?startDate=${yesterday.toISOString()}`,
  { headers: { 'X-API-Key': apiKey } }
);

const data = await analytics.json();
console.log(`Yesterday's cost: $${data[0].totalCost}`);
console.log(`ML usage rate: ${(data[0].emotionMlCount / data[0].emotionRequests * 100).toFixed(1)}%`);
```

### Real-Time Monitoring

Monitor recent performance:

```typescript
// Get last 6 hours
const hourlyStats = await fetch(
  `http://localhost:3000/analytics/hourly?gameId=${gameId}&hours=6`,
  { headers: { 'X-API-Key': apiKey } }
);

const data = await hourlyStats.json();
const avgLatency = data.reduce((sum, hour) => sum + hour.avgLatency, 0) / data.length;
console.log(`Average latency (6h): ${avgLatency.toFixed(1)}ms`);
```

### Cost Tracking

Monitor costs and set alerts:

```typescript
const costs = await fetch(
  `http://localhost:3000/analytics/costs?startDate=${startOfMonth}`,
  { headers: { 'X-API-Key': apiKey } }
);

const data = await costs.json();

// Alert if daily cost exceeds threshold
const dailyAvg = data.totalCost / 30;
if (dailyAvg > DAILY_BUDGET_LIMIT) {
  console.warn(`Average daily cost ($${dailyAvg}) exceeds limit`);
}
```

## Best Practices

### 1. Regular Monitoring

- Check daily analytics every morning
- Set up automated alerts for cost overruns
- Monitor ML/LLM usage rates to stay within budgets

### 2. Cost Optimization

- Track ML usage rate (target: ~15% for emotions, ~10% for dialogue)
- Monitor cache hit rates
- Identify games with high costs

### 3. Performance Monitoring

- Track average latency trends
- Identify slow operations
- Monitor error rates

### 4. Player Engagement

- Track unique player counts
- Monitor event frequency
- Analyze emotion distribution patterns

### 5. Data Retention

- Hourly data: Retain for 7-30 days
- Daily data: Retain for 1-2 years
- Raw metrics: Retain for 90 days

## Aggregation Schedule

### Hourly Aggregation
- **Schedule**: Every hour at :00
- **Data**: Previous hour (e.g., runs at 15:00 for 14:00-15:00)
- **Use Case**: Real-time monitoring

### Daily Aggregation
- **Schedule**: Every day at midnight (00:00)
- **Data**: Previous day (midnight to midnight)
- **Use Case**: Historical analysis and reporting

## Performance Considerations

### Metrics Collection
- **Overhead**: < 5ms per request
- **Async**: Non-blocking, doesn't affect main flow
- **Failure Handling**: Errors are logged but don't break services

### Aggregation Tasks
- **Hourly**: ~5-10 seconds per game
- **Daily**: ~30-60 seconds per game
- **Database Load**: Read-heavy queries during aggregation

### Query Performance
- **Indexed Queries**: Fast lookups (< 100ms)
- **Aggregations**: Moderate (500ms - 2s)
- **Large Date Ranges**: May be slow (> 5s for 1+ years)

## Troubleshooting

### Missing Data

**Symptoms**: Analytics showing zero or missing data

**Solutions**:
1. Check if aggregation tasks are running:
   ```bash
   # Check logs for aggregation messages
   grep "aggregat" api-service.log
   ```
2. Manually trigger aggregation:
   ```typescript
   await aggregationService.manualAggregation(new Date(), 'daily');
   ```
3. Verify metrics are being recorded:
   ```bash
   psql -d agl -c "SELECT COUNT(*) FROM service_metrics WHERE created_at > NOW() - INTERVAL '1 hour';"
   ```

### High Costs

**Symptoms**: Costs exceeding budget

**Solutions**:
1. Check ML/LLM usage rates
2. Verify cache is working
3. Review special case detection thresholds
4. Consider increasing cache TTL

### Slow Queries

**Symptoms**: Analytics API taking > 5 seconds

**Solutions**:
1. Add date range limits
2. Use indexed fields in filters
3. Query aggregated tables instead of raw metrics
4. Consider adding database indexes

## Integration Examples

### Grafana Dashboard

Export data to Grafana for visualization:

```typescript
// Fetch data in Prometheus format
app.get('/metrics/prometheus', async (req, res) => {
  const stats = await analyticsService.getPlatformStats(1);

  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP agl_total_events Total number of game events
# TYPE agl_total_events counter
agl_total_events ${stats.totalEvents}

# HELP agl_total_cost Total AI service costs in USD
# TYPE agl_total_cost counter
agl_total_cost ${stats.totalCost}

# HELP agl_ml_usage_rate ML usage rate percentage
# TYPE agl_ml_usage_rate gauge
agl_ml_usage_rate ${(stats.usage.emotionMl / stats.emotionRequests * 100)}
  `);
});
```

### Custom Alerts

Set up automated alerts:

```typescript
import { Cron } from '@nestjs/schedule';

@Cron('0 9 * * *') // Every day at 9 AM
async checkDailyCosts() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const analytics = await this.getDailyAnalytics(gameId, {
    startDate: yesterday.toISOString(),
  });

  if (analytics[0].totalCost > DAILY_BUDGET) {
    await this.sendAlert({
      type: 'budget_exceeded',
      cost: analytics[0].totalCost,
      budget: DAILY_BUDGET,
    });
  }
}
```

## Future Enhancements

### Phase 2.1
- Real-time metrics streaming
- Custom alert rules
- Automated reports (email/Slack)
- Data export (CSV/JSON)

### Phase 3
- Machine learning insights
- Predictive cost forecasting
- Anomaly detection
- A/B testing analytics
- Player cohort analysis

## Support

For questions about Analytics:
- Technical documentation: This document
- API reference: `docs/api/README.md`
- Contact: analytics-team@agl.com
