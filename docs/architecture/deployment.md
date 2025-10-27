# Deployment Guide

## Overview

This guide covers deploying the AGL platform to production environments. We support multiple deployment targets, but Kubernetes is the recommended approach for production.

## Deployment Strategies

### Stage 1: Development/Staging (DigitalOcean)
- Single Kubernetes cluster
- Managed databases
- Cost: ~$500/month
- Suitable for: MVP, testing, small user base (<10K MAU)

### Stage 2: Production (AWS/GCP)
- Multi-AZ Kubernetes cluster
- Auto-scaling
- CDN and load balancing
- Cost: ~$2,000+/month
- Suitable for: Production, growing user base (10K-100K+ MAU)

---

## Prerequisites

### Required Accounts
- **Cloud Provider**: AWS, GCP, or DigitalOcean
- **Domain**: Register a domain (e.g., agl.com)
- **SSL Certificate**: Let's Encrypt or cloud provider
- **Container Registry**: Docker Hub, AWS ECR, or GCP GCR

### Required Tools
- `kubectl` - Kubernetes CLI
- `helm` - Kubernetes package manager
- `docker` - Container runtime
- `terraform` (optional) - Infrastructure as Code

### Environment Variables
Store secrets in a secure location (never commit to Git):
- Database credentials
- Redis passwords
- API keys (Anthropic, OpenAI)
- JWT secrets

---

## DigitalOcean Deployment (Recommended for MVP)

### 1. Create Kubernetes Cluster

```bash
# Using doctl CLI
doctl kubernetes cluster create agl-cluster \
  --region nyc1 \
  --version 1.28 \
  --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=3;auto-scale=true;min-nodes=3;max-nodes=10"

# Download kubeconfig
doctl kubernetes cluster kubeconfig save agl-cluster

# Verify connection
kubectl get nodes
```

**Cluster Spec**:
- **Region**: NYC1 (or closest to users)
- **Node Size**: 2 vCPU, 4GB RAM
- **Node Count**: 3-10 (auto-scaling)
- **Monthly Cost**: ~$120-400

### 2. Setup Managed Databases

**PostgreSQL**:
```bash
doctl databases create agl-postgres \
  --engine pg \
  --region nyc1 \
  --size db-s-1vcpu-2gb \
  --version 15

# Get connection details
doctl databases connection agl-postgres

# Create database
doctl databases db create agl-postgres agl_production
```

**Redis**:
```bash
doctl databases create agl-redis \
  --engine redis \
  --region nyc1 \
  --size db-s-1vcpu-2gb

# Get connection details
doctl databases connection agl-redis
```

### 3. Deploy Qdrant (Self-Hosted)

```bash
# Create namespace
kubectl create namespace agl

# Deploy Qdrant
kubectl apply -f infrastructure/k8s/qdrant-deployment.yaml
```

**qdrant-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qdrant
  namespace: agl
spec:
  replicas: 2
  selector:
    matchLabels:
      app: qdrant
  template:
    metadata:
      labels:
        app: qdrant
    spec:
      containers:
      - name: qdrant
        image: qdrant/qdrant:latest
        ports:
        - containerPort: 6333
        - containerPort: 6334
        volumeMounts:
        - name: qdrant-storage
          mountPath: /qdrant/storage
      volumes:
      - name: qdrant-storage
        persistentVolumeClaim:
          claimName: qdrant-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: qdrant-service
  namespace: agl
spec:
  type: ClusterIP
  selector:
    app: qdrant
  ports:
  - port: 6333
    targetPort: 6333
    name: http
  - port: 6334
    targetPort: 6334
    name: grpc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: qdrant-pvc
  namespace: agl
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
```

### 4. Create Kubernetes Secrets

```bash
# Create secrets from environment file
kubectl create secret generic agl-secrets \
  --from-env-file=.env.production \
  --namespace=agl

# Or create manually
kubectl create secret generic agl-secrets \
  --from-literal=DATABASE_URL='postgresql://user:pass@host:5432/db' \
  --from-literal=REDIS_URL='redis://host:6379' \
  --from-literal=ANTHROPIC_API_KEY='sk-ant-xxx' \
  --from-literal=JWT_SECRET='random-string' \
  --namespace=agl
```

### 5. Build and Push Docker Images

```bash
# Login to Docker Hub (or your registry)
docker login

# Build images
docker-compose -f docker-compose.prod.yml build

# Tag images
docker tag agl-api-service:latest your-username/agl-api-service:v1.0.0
docker tag agl-realtime-gateway:latest your-username/agl-realtime-gateway:v1.0.0
docker tag agl-emotion-service:latest your-username/agl-emotion-service:v1.0.0
docker tag agl-dialogue-service:latest your-username/agl-dialogue-service:v1.0.0

# Push images
docker push your-username/agl-api-service:v1.0.0
docker push your-username/agl-realtime-gateway:v1.0.0
docker push your-username/agl-emotion-service:v1.0.0
docker push your-username/agl-dialogue-service:v1.0.0
```

### 6. Deploy Services to Kubernetes

```bash
# Deploy all services
kubectl apply -f infrastructure/k8s/

# Check deployments
kubectl get deployments -n agl

# Check pods
kubectl get pods -n agl

# Check services
kubectl get services -n agl
```

**Example Deployment** (api-service-deployment.yaml):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
  namespace: agl
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
      - name: api-service
        image: your-username/agl-api-service:v1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: agl-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: agl-secrets
              key: REDIS_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: agl-secrets
              key: JWT_SECRET
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
  namespace: agl
spec:
  type: ClusterIP
  selector:
    app: api-service
  ports:
  - port: 3000
    targetPort: 3000
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-service-hpa
  namespace: agl
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

### 7. Setup Ingress (Load Balancer)

```bash
# Install nginx ingress controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Apply ingress rules
kubectl apply -f infrastructure/k8s/ingress.yaml
```

**ingress.yaml**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: agl-ingress
  namespace: agl
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.agl.com
    - realtime.agl.com
    secretName: agl-tls
  rules:
  - host: api.agl.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 3000
  - host: realtime.agl.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: realtime-gateway
            port:
              number: 3001
```

### 8. Setup SSL with Let's Encrypt

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create cluster issuer
kubectl apply -f infrastructure/k8s/cert-issuer.yaml
```

**cert-issuer.yaml**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@agl.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

### 9. Setup DNS

Point your domain to the Load Balancer IP:

```bash
# Get Load Balancer IP
kubectl get svc nginx-ingress-controller -n ingress-nginx

# Add DNS records:
# A record: api.agl.com → Load Balancer IP
# A record: realtime.agl.com → Load Balancer IP
```

### 10. Run Database Migrations

```bash
# Get API service pod name
kubectl get pods -n agl | grep api-service

# Run migrations
kubectl exec -it api-service-xxxxx -n agl -- npm run migrate:deploy
```

---

## AWS Deployment (Production Scale)

### 1. Setup EKS Cluster with Terraform

```hcl
# infrastructure/terraform/main.tf

provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "agl-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_dns_hostnames = true

  tags = {
    Environment = "production"
    Project     = "agl"
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "agl-cluster"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 3
      max_size     = 10

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  tags = {
    Environment = "production"
    Project     = "agl"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "agl-postgres"
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t3.small"
  allocated_storage    = 100
  storage_type         = "gp3"
  db_name              = "agl_production"
  username             = "agl_admin"
  password             = var.db_password
  skip_final_snapshot  = false
  multi_az             = true
  publicly_accessible  = false
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name = aws_db_subnet_group.main.name

  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"

  tags = {
    Environment = "production"
    Project     = "agl"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "agl-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.main.name

  tags = {
    Environment = "production"
    Project     = "agl"
  }
}
```

Deploy with Terraform:
```bash
cd infrastructure/terraform

# Initialize
terraform init

# Plan
terraform plan -out=tfplan

# Apply
terraform apply tfplan
```

### 2. Setup AWS Services

**ECR (Container Registry)**:
```bash
# Create repositories
aws ecr create-repository --repository-name agl/api-service
aws ecr create-repository --repository-name agl/realtime-gateway
aws ecr create-repository --repository-name agl/emotion-service
aws ecr create-repository --repository-name agl/dialogue-service

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag agl-api-service:latest <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/agl/api-service:v1.0.0
docker push <aws-account-id>.dkr.ecr.us-east-1.amazonaws.com/agl/api-service:v1.0.0
```

**Secrets Manager**:
```bash
# Store secrets
aws secretsmanager create-secret \
  --name agl/production/secrets \
  --secret-string file://secrets.json
```

**CloudFront (CDN)**:
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name api.agl.com \
  --default-root-object index.html
```

### 3. Deploy to EKS

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name agl-cluster

# Deploy using Helm
helm install agl-platform ./infrastructure/helm/agl \
  --namespace agl \
  --create-namespace \
  --values infrastructure/helm/agl/values-production.yaml
```

---

## Monitoring & Observability

### 1. Install Prometheus + Grafana

```bash
# Add Prometheus helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
# Default credentials: admin / prom-operator
```

### 2. Install Loki (Logging)

```bash
# Add Loki helm repo
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Loki stack
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false
```

### 3. Setup Alerts

**alert-rules.yaml**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alert-rules
  namespace: monitoring
data:
  alert.rules: |
    groups:
    - name: agl-alerts
      rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: HighLatency
        expr: histogram_quantile(0.99, http_request_duration_seconds_bucket) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "P99 latency is {{ $value }}s"

      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Pod is crash looping"
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
    tags:
      - 'v*'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Run tests
      run: |
        npm install
        npm test

    - name: Build Docker images
      run: |
        docker-compose -f docker-compose.prod.yml build

    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Push images
      run: |
        docker push your-username/agl-api-service:latest
        docker push your-username/agl-realtime-gateway:latest
        docker push your-username/agl-emotion-service:latest
        docker push your-username/agl-dialogue-service:latest

    - name: Deploy to Kubernetes
      uses: azure/k8s-deploy@v4
      with:
        manifests: |
          infrastructure/k8s/api-service-deployment.yaml
          infrastructure/k8s/realtime-gateway-deployment.yaml
          infrastructure/k8s/emotion-service-deployment.yaml
          infrastructure/k8s/dialogue-service-deployment.yaml
        images: |
          your-username/agl-api-service:${{ github.sha }}
          your-username/agl-realtime-gateway:${{ github.sha }}
          your-username/agl-emotion-service:${{ github.sha }}
          your-username/agl-dialogue-service:${{ github.sha }}
        kubectl-version: 'latest'
```

---

## Rollback Strategy

### Rollback Deployment

```bash
# View deployment history
kubectl rollout history deployment/api-service -n agl

# Rollback to previous version
kubectl rollout undo deployment/api-service -n agl

# Rollback to specific revision
kubectl rollout undo deployment/api-service -n agl --to-revision=2

# Check rollout status
kubectl rollout status deployment/api-service -n agl
```

### Database Rollback

```bash
# Rollback migration (Prisma)
cd services/api-service
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Disaster Recovery

### Backup Strategy

**Database Backups**:
```bash
# Automated daily backups (already configured in RDS/Managed DB)

# Manual backup
pg_dump -h <db-host> -U <db-user> agl_production > backup-$(date +%Y%m%d).sql

# Restore from backup
psql -h <db-host> -U <db-user> agl_production < backup-20251025.sql
```

**Redis Backups**:
```bash
# Backup Redis data
kubectl exec -it redis-pod -n agl -- redis-cli SAVE

# Copy backup file
kubectl cp agl/redis-pod:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

**Qdrant Backups**:
```bash
# Backup Qdrant storage
kubectl exec -it qdrant-pod -n agl -- tar czf /tmp/qdrant-backup.tar.gz /qdrant/storage

# Copy backup
kubectl cp agl/qdrant-pod:/tmp/qdrant-backup.tar.gz ./qdrant-backup-$(date +%Y%m%d).tar.gz
```

### Recovery Procedures

1. **Service Down**: Auto-restart by Kubernetes
2. **Database Corrupted**: Restore from most recent backup
3. **Complete Cluster Failure**: Deploy to new cluster from backups
4. **Data Center Outage**: Failover to backup region (if multi-region)

---

## Security Checklist

- [ ] All secrets stored in Secrets Manager / Vault
- [ ] SSL/TLS enabled for all endpoints
- [ ] API keys rotated regularly
- [ ] Database encrypted at rest
- [ ] Network policies configured
- [ ] Pod security policies enabled
- [ ] Resource limits set for all pods
- [ ] RBAC configured for least privilege
- [ ] Vulnerability scanning enabled
- [ ] Audit logging enabled

---

## Post-Deployment Verification

```bash
# Check all services are running
kubectl get pods -n agl

# Check service endpoints
curl https://api.agl.com/api/v1/health
curl https://realtime.agl.com/health

# Check logs
kubectl logs -f deployment/api-service -n agl

# Check metrics
kubectl top pods -n agl
kubectl top nodes

# Run smoke tests
npm run test:smoke -- --env=production
```

---

## Cost Optimization

### Auto-Scaling Policies

- Scale down during off-peak hours
- Use spot instances for non-critical workloads
- Implement pod disruption budgets

### Resource Right-Sizing

```bash
# Analyze resource usage
kubectl top pods -n agl --containers

# Adjust resource requests/limits based on actual usage
```

### Cost Monitoring

- Setup billing alerts
- Track costs per service
- Review unused resources monthly

---

## Support & Troubleshooting

### Common Issues

**Pods not starting**:
```bash
kubectl describe pod <pod-name> -n agl
kubectl logs <pod-name> -n agl
```

**Service unreachable**:
```bash
kubectl get svc -n agl
kubectl describe svc <service-name> -n agl
```

**High latency**:
- Check database connection pool
- Verify Redis is responding
- Check network policies

---

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Terraform Documentation](https://www.terraform.io/docs/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)

## Contact

For deployment support: devops@agl.com
