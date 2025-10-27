# Kubernetes Deployment Configurations

This directory contains Kubernetes manifests for deploying AGL services.

## Quick Start

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Create secrets (replace values first)
kubectl create secret generic agl-secrets \
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=REDIS_URL='redis://...' \
  --from-literal=JWT_SECRET='...' \
  --from-literal=ANTHROPIC_API_KEY='...' \
  --namespace=agl

# Deploy all services
kubectl apply -f .
```

## Files

- `namespace.yaml` - AGL namespace
- `api-service-deployment.yaml` - API service deployment (example)
- Additional service deployments to be added

## Note

This is a basic configuration template. For production:
1. Update image registry paths
2. Configure proper resource limits
3. Add ingress controller
4. Configure persistent volumes
5. Set up monitoring and logging

See [deployment guide](../../docs/architecture/deployment.md) for detailed instructions.
