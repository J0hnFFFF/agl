# 🚀 Deployment Guide

Complete guide for deploying AGL from development to production.

---

## 📋 Quick Decision Matrix

| Your Situation | Recommended | Cost | Setup Time |
|---------------|-------------|------|------------|
| 🎓 Learning AGL | Monolith + SQLite | $0 | 1 min |
| 💻 Personal projects | Monolith + SQLite | $0 | 1 min |
| 👥 Small team dev | Microservices + SQLite | $0 | 5 min |
| 🚀 MVP launch | Railway / Render | $5-20/mo | 5 min |
| 📈 Growing product | Cloud VPS | $50-100/mo | 30 min |
| 🏢 Production | Kubernetes | $200+/mo | 1-2 hours |

---

## 🎯 Deployment Options

### 1. Local Development (Monolith)

**Best for**: Learning, prototyping, local testing

```bash
npm run dev:monolith
```

**Features**:
- ✅ Zero configuration (SQLite + in-memory cache)
- ✅ Single command start
- ✅ All features included
- ✅ $0 cost

**Limits**:
- Single machine only
- No horizontal scaling
- SQLite database

📖 **Guide**: [Monolith Quick Start](./QUICKSTART-MONOLITH.md)

---

### 2. VPS Deployment (Simple)

**Best for**: Small projects, MVPs, <1000 users

#### Option A: Deploy Monolith

```bash
# On your VPS (DigitalOcean, Linode, etc.)
git clone https://github.com/J0hnFFFF/agl.git
cd agl

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup and run
cd services/monolith
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "agl" -- start
pm2 startup
pm2 save
```

#### Option B: Deploy with Docker

```bash
# Create Dockerfile
cat > Dockerfile <<EOF
FROM node:20-alpine
WORKDIR /app
COPY services/monolith/package*.json ./
RUN npm ci --production
COPY services/monolith/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
EOF

# Build and run
docker build -t agl-monolith .
docker run -d -p 3000:3000 \
  -v /data/agl:/app/data \
  --restart unless-stopped \
  agl-monolith
```

**Cost**: $5-10/month (1 vCPU, 1GB RAM)

**Providers**:
- [DigitalOcean](https://digitalocean.com) - $6/mo
- [Linode](https://linode.com) - $5/mo
- [Vultr](https://vultr.com) - $5/mo
- [Hetzner](https://hetzner.com) - €4/mo

---

### 3. Platform-as-a-Service (PaaS)

**Best for**: Fast deployment, automatic scaling, managed infrastructure

#### Option A: Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/agl)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Environment Variables**:
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

**Cost**: $5-20/month
- Free: $5 credit/month
- Hobby: $5/month minimum
- Pro: $20/month

#### Option B: Render

1. Connect GitHub repository
2. Set build command: `cd services/monolith && npm install && npm run build`
3. Set start command: `cd services/monolith && npm start`
4. Add environment variables

**Cost**: $7-25/month

#### Option C: Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

**Cost**: Free tier available, $1.94/month for basic

---

### 4. Serverless Architecture

**Best for**: Global audience, unpredictable traffic, auto-scaling

#### Stack

```
Vercel (API Functions)
    +
Supabase (PostgreSQL + Vector)
    +
Upstash (Redis)
```

#### Setup

**1. Deploy API to Vercel**:
```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

**2. Setup Supabase**:
- Create project at [supabase.com](https://supabase.com)
- Copy connection string
- Run migrations

**3. Setup Upstash Redis**:
- Create database at [upstash.com](https://upstash.com)
- Copy connection string

**Environment Variables**:
```bash
DATABASE_URL=postgresql://...supabase.co:5432/postgres
REDIS_URL=https://...upstash.io
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

**Cost**:
- Vercel: Free (100GB bandwidth) → $20/mo Pro
- Supabase: Free (500MB) → $25/mo Pro
- Upstash: Free (10K requests/day) → $0.20/100K requests

**Total**: $0-45/month

---

### 5. Docker Compose (Production-lite)

**Best for**: Small production, staging environment

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f
```

**Features**:
- All microservices
- PostgreSQL + Redis + Qdrant
- Nginx reverse proxy
- SSL with Let's Encrypt

**Requirements**:
- VPS with 4GB+ RAM
- Docker + Docker Compose installed
- Domain name

📖 **Guide**: [Docker Compose Production](./docs/deployment-docker-compose.md)

**Cost**: $20-40/month (4GB RAM VPS)

---

### 6. Kubernetes (Enterprise)

**Best for**: High availability, auto-scaling, >10K users

#### Quick Deploy

```bash
# Build Docker images
npm run build:docker

# Push to registry
docker tag agl-api J0hnFFFF/agl-api:latest
docker push J0hnFFFF/agl-api:latest

# Deploy to Kubernetes
kubectl apply -f infrastructure/k8s/
```

#### Managed Kubernetes Options

**DigitalOcean Kubernetes** ($200/mo):
```bash
doctl kubernetes cluster create agl-cluster \
  --region nyc1 \
  --node-pool "name=workers;size=s-2vcpu-4gb;count=3"
```

**AWS EKS** ($300/mo):
```bash
eksctl create cluster \
  --name agl-cluster \
  --region us-east-1 \
  --nodegroup-name workers \
  --nodes 3 \
  --node-type t3.medium
```

**GCP GKE** ($250/mo):
```bash
gcloud container clusters create agl-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2
```

#### Features

- ✅ **High Availability**: Multi-replica deployment
- ✅ **Auto-scaling**: HPA based on CPU/memory
- ✅ **Service Discovery**: Native Kubernetes DNS
- ✅ **Rolling Updates**: Zero-downtime deployments
- ✅ **Monitoring**: Prometheus + Grafana included

📖 **Guide**: [Kubernetes Deployment](./docs/deployment-guide.md)

**Cost**: $200-1000/month

---

## 🔄 Migration Path

### Typical Growth Path

```
Stage 1: Development
  Monolith + SQLite ($0)
      ↓
Stage 2: MVP
  Railway + PostgreSQL ($20/mo)
      ↓
Stage 3: Growth
  Docker Compose on VPS ($50/mo)
      ↓
Stage 4: Scale
  Kubernetes ($200+/mo)
```

### Database Migration: SQLite → PostgreSQL

```bash
# 1. Update environment variables
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://user:pass@host:5432/db

# 2. Regenerate Prisma client
cd services/api-service
npx prisma generate

# 3. Run migrations
npx prisma migrate deploy

# 4. Optional: Migrate existing data
# Use pg_dump or custom migration script
```

---

## 💰 Cost Comparison

| Deployment | Infrastructure | LLM API | Total | Users |
|-----------|----------------|---------|-------|-------|
| Local Dev | $0 | $0 | **$0** | N/A |
| VPS Monolith | $5 | $30 | **$35** | <1K |
| Railway | $20 | $100 | **$120** | 1K-10K |
| Serverless | $50 | $200 | **$250** | 10K-50K |
| Kubernetes | $500 | $500 | **$1000** | 50K+ |

*LLM API costs based on 90/10 hybrid strategy with caching*

---

## 📊 Performance Comparison

| Deployment | Response Time | Concurrent Users | Availability |
|-----------|---------------|------------------|--------------|
| Monolith | 10-50ms | 1K | Single point |
| Docker Compose | 20-80ms | 5K | Medium |
| Railway/PaaS | 50-150ms | 10K | High |
| Serverless | 100-300ms | Unlimited | Highest |
| Kubernetes | 10-50ms | 100K+ | Highest |

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change default passwords and secrets
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS/TLS
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use API key authentication
- [ ] Enable database encryption at rest
- [ ] Set up database backups
- [ ] Configure log aggregation
- [ ] Enable monitoring and alerts
- [ ] Review and harden security groups

---

## 📈 Monitoring & Alerts

### Essential Metrics

**Application**:
- Request rate and latency
- Error rate (4xx, 5xx)
- WebSocket connections
- LLM API usage and costs

**Infrastructure**:
- CPU and memory usage
- Disk I/O and space
- Network bandwidth
- Database connections

### Tools

**Monitoring**:
- Prometheus + Grafana (included in K8s)
- Datadog
- New Relic
- Sentry (errors)

**Logs**:
- Loki (with Grafana)
- CloudWatch (AWS)
- Logtail
- Papertrail

📖 **Guide**: [Monitoring Setup](./docs/monitoring-setup.md)

---

## 🔧 Environment Variables

### Required

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Database
DATABASE_PROVIDER=postgresql|sqlite
DATABASE_URL=postgresql://...

# Redis (optional for monolith)
REDIS_URL=redis://localhost:6379

# Qdrant (optional)
QDRANT_URL=http://localhost:6333
```

### Optional

```bash
# Cost Management
DAILY_BUDGET_USD=15.0
ML_USAGE_TARGET=0.15
LLM_USAGE_TARGET=0.10

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=https://...
```

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs -f
pm2 logs agl

# Check ports
netstat -tlnp | grep :3000

# Verify environment variables
printenv | grep DATABASE_URL
```

### High Memory Usage

```bash
# Check memory
docker stats
free -h

# Optimize Node.js
NODE_OPTIONS="--max-old-space-size=2048"
```

### Database Connection Errors

```bash
# Test connection
psql $DATABASE_URL

# Check connection pool
# Increase max connections in Prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  poolTimeout = 60
}
```

### Slow Performance

- Enable Redis caching
- Add database indexes
- Optimize queries with `EXPLAIN`
- Use CDN for static assets
- Enable gzip compression

📖 **Guide**: [Performance Optimization](./docs/performance-optimization.md)

---

## 📚 Next Steps

### Deployment Guides

- [Monolith Quick Start](./QUICKSTART-MONOLITH.md)
- [Docker Compose Production](./docs/deployment-docker-compose.md)
- [Kubernetes Guide](./docs/deployment-guide.md)
- [Monitoring Setup](./docs/monitoring-setup.md)

### Platform-Specific

- [Railway Deployment](./docs/simplified-deployment.md#railway)
- [Render Deployment](./docs/simplified-deployment.md#render)
- [AWS Deployment](./docs/cloud-deployment-aws.md)
- [GCP Deployment](./docs/cloud-deployment-gcp.md)

---

**Choose your deployment path and start building! 🚀**
