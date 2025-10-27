# Monitoring Setup Guide

## Overview

AGL platform uses Prometheus for metrics collection and Grafana for visualization and alerting.

## Architecture

```
┌──────────────────────────────────────────────────┐
│              AGL Services                         │
│  ┌─────────┐  ┌─────────┐  ┌────────────┐       │
│  │   API   │  │ Emotion │  │  Dialogue  │       │
│  │ Service │  │ Service │  │  Service   │       │
│  └────┬────┘  └────┬────┘  └──────┬─────┘       │
│       │            │                │             │
│       └────────────┴────────────────┘             │
│                    │ /metrics                     │
│                    ▼                              │
│       ┌────────────────────────┐                 │
│       │     Prometheus         │                 │
│       │  - Scrapes metrics     │                 │
│       │  - Stores time series  │                 │
│       │  - Evaluates alerts    │                 │
│       └───────────┬────────────┘                 │
│                   │                               │
│       ┌───────────▼────────────┐                 │
│       │       Grafana          │                 │
│       │  - Dashboards          │                 │
│       │  - Alerts              │                 │
│       │  - Visualization       │                 │
│       └────────────────────────┘                 │
└──────────────────────────────────────────────────┘
```

## Quick Start

### Using Docker Compose

```bash
# Start monitoring stack
cd infrastructure/monitoring
docker-compose up -d

# Access services
# Grafana: http://localhost:3003 (admin/admin)
# Prometheus: http://localhost:9090
```

### Docker Compose Configuration

Create `infrastructure/monitoring/docker-compose.yml`:

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: agl-prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts:/etc/prometheus/alerts
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    ports:
      - "9090:9090"
    networks:
      - agl-network

  grafana:
    image: grafana/grafana:latest
    container_name: agl-grafana
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3003:3000"
    networks:
      - agl-network
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    container_name: agl-alertmanager
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
    ports:
      - "9093:9093"
    networks:
      - agl-network

  # Exporters
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: agl-postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://user:pass@postgres:5432/agl?sslmode=disable"
    ports:
      - "9187:9187"
    networks:
      - agl-network

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: agl-redis-exporter
    environment:
      REDIS_ADDR: "redis:6379"
    ports:
      - "9121:9121"
    networks:
      - agl-network

volumes:
  prometheus-data:
  grafana-data:

networks:
  agl-network:
    external: true
```

## Metrics Exposed

### API Service Metrics

```
# HTTP requests
http_requests_total{method, path, status}
http_request_duration_seconds{method, path}

# Database
db_connections_active
db_queries_total
db_query_duration_seconds

# Cache
cache_hits_total
cache_misses_total
cache_operations_total
```

### Emotion Service Metrics

```
# Requests
emotion_requests_total{method}  # rule, ml, cached
emotion_request_duration_seconds
emotion_cost_usd

# ML usage
emotion_ml_rate
emotion_ml_requests_total
```

### Dialogue Service Metrics

```
# Requests
dialogue_requests_total{method}  # template, llm, cached
dialogue_request_duration_seconds
dialogue_cost_usd

# LLM usage
dialogue_llm_rate
dialogue_llm_requests_total
```

### Memory Service Metrics

```
# Operations
memory_operations_total{operation}  # create, search, get
memory_operation_duration_seconds

# Vector search
memory_search_latency_seconds
memory_embedding_latency_seconds
```

## Grafana Dashboards

### 1. Overview Dashboard

**Panels**:
- Request rate (requests/sec)
- Error rate (%)
- P95 latency
- Active users
- Total cost (daily)

### 2. Service Health Dashboard

**Panels**:
- Service uptime
- Error rates by service
- Latency distribution
- Request throughput

### 3. Cost Monitoring Dashboard

**Panels**:
- Daily cost trend
- Cost by service
- ML/LLM usage rate
- Budget remaining

### 4. Database Dashboard

**Panels**:
- Connection pool usage
- Query latency
- Slow queries count
- Cache hit rate

### 5. System Resources Dashboard

**Panels**:
- CPU usage
- Memory usage
- Disk I/O
- Network traffic

## Alert Configuration

### Alertmanager Setup

Create `infrastructure/monitoring/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    # Critical alerts
    - match:
        severity: critical
      receiver: 'critical'
      continue: true

    # Cost alerts
    - match:
        alertname: DailyCostExceeded
      receiver: 'cost-team'

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#agl-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'critical'
    slack_configs:
      - channel: '#agl-critical'
        title: 'CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'

  - name: 'cost-team'
    email_configs:
      - to: 'cost-team@agl.com'
        subject: 'Cost Alert: {{ .GroupLabels.alertname }}'
```

## Implementing Metrics in Services

### Node.js/NestJS (API Service)

Install dependencies:
```bash
npm install prom-client
```

Create metrics middleware:
```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram, register } from 'prom-client';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private httpRequestsTotal: Counter;
  private httpRequestDuration: Histogram;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;

      this.httpRequestsTotal.inc({
        method: req.method,
        path: req.route?.path || req.path,
        status: res.statusCode,
      });

      this.httpRequestDuration.observe(
        {
          method: req.method,
          path: req.route?.path || req.path,
        },
        duration
      );
    });

    next();
  }
}

// Metrics endpoint
@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics() {
    return register.metrics();
  }
}
```

### Python/FastAPI (Emotion/Dialogue Services)

Install dependencies:
```bash
pip install prometheus-client
```

Add metrics:
```python
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import FastAPI, Response

app = FastAPI()

# Metrics
request_count = Counter(
    'emotion_requests_total',
    'Total emotion requests',
    ['method']
)

request_latency = Histogram(
    'emotion_request_duration_seconds',
    'Emotion request latency',
    buckets=[0.01, 0.05, 0.1, 0.5, 1, 2, 5]
)

cost_total = Counter(
    'emotion_cost_usd',
    'Total emotion service cost in USD'
)

@app.middleware("http")
async def track_metrics(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    request_latency.observe(duration)

    return response

@app.get("/metrics")
async def metrics():
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
```

## Monitoring Best Practices

### 1. Metric Naming

Follow Prometheus naming conventions:
- Use `_total` suffix for counters
- Use `_seconds` suffix for durations
- Use snake_case
- Include units in names

### 2. Label Cardinality

**Do**:
- Use labels for important dimensions (service, method, status)
- Keep label values bounded (< 100 unique values)

**Don't**:
- Use user IDs as labels (unbounded)
- Use timestamps as labels
- Create too many label combinations

### 3. Alert Tuning

**Thresholds**:
- Error rate: > 5% for 5 minutes
- Latency p95: > 1 second for 5 minutes
- Cost: > $15/day
- CPU: > 80% for 10 minutes

**Reduce Alert Fatigue**:
- Set appropriate `for` durations
- Group related alerts
- Use severity levels
- Add meaningful descriptions

### 4. Dashboard Design

**Principles**:
- Start with high-level overview
- Drill down into details
- Use consistent time ranges
- Include SLO/SLA indicators

## Querying Metrics

### Useful PromQL Queries

**Request rate (last 5 minutes)**:
```promql
rate(http_requests_total[5m])
```

**Error rate**:
```promql
rate(http_requests_total{status=~"5.."}[5m]) /
rate(http_requests_total[5m])
```

**P95 latency**:
```promql
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[5m])
)
```

**Daily cost**:
```promql
sum(increase(emotion_cost_usd[24h]))
+ sum(increase(dialogue_cost_usd[24h]))
+ sum(increase(memory_cost_usd[24h]))
```

**Cache hit rate**:
```promql
redis_keyspace_hits_total /
(redis_keyspace_hits_total + redis_keyspace_misses_total)
```

## Troubleshooting

### Metrics Not Appearing

1. Check if service is exposing `/metrics` endpoint
2. Verify Prometheus can reach the service
3. Check Prometheus targets: http://localhost:9090/targets
4. Review Prometheus logs for scrape errors

### High Cardinality Issues

**Symptoms**: Prometheus memory usage high, slow queries

**Solutions**:
1. Review labels - remove high-cardinality ones
2. Aggregate metrics before exporting
3. Increase Prometheus memory limit
4. Reduce retention period

### Missing Data Points

**Causes**:
- Scrape failures
- Service restarts
- Network issues

**Solutions**:
- Check scrape interval vs data resolution
- Increase scrape timeout
- Add service discovery for dynamic targets

## Production Checklist

- [ ] Prometheus deployed with persistent storage
- [ ] Grafana deployed with dashboards configured
- [ ] Alert manager configured with notification channels
- [ ] All services exposing `/metrics` endpoint
- [ ] Alerts tested and validated
- [ ] Team trained on dashboard usage
- [ ] On-call rotation established
- [ ] Runbooks created for common alerts
- [ ] Backup and retention policy defined

## Support

For monitoring questions:
- Prometheus docs: https://prometheus.io/docs/
- Grafana docs: https://grafana.com/docs/
- Contact: devops-team@agl.com
