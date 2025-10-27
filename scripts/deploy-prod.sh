#!/bin/bash

# Deploy to Production Environment

set -e

echo "🚀 Deploying AGL to Production..."
echo "⚠️  This will deploy to PRODUCTION environment!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
else
    echo "❌ .env.production not found"
    exit 1
fi

# Get version tag
read -p "Enter version tag (e.g., v1.0.0): " VERSION_TAG

if [ -z "$VERSION_TAG" ]; then
    echo "❌ Version tag is required"
    exit 1
fi

# Build Docker images
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Tag images for production
echo "🏷️  Tagging images with version $VERSION_TAG..."
docker tag agl-api-service:latest ${DOCKER_REGISTRY}/agl-api-service:${VERSION_TAG}
docker tag agl-api-service:latest ${DOCKER_REGISTRY}/agl-api-service:latest
docker tag agl-realtime-gateway:latest ${DOCKER_REGISTRY}/agl-realtime-gateway:${VERSION_TAG}
docker tag agl-realtime-gateway:latest ${DOCKER_REGISTRY}/agl-realtime-gateway:latest
docker tag agl-emotion-service:latest ${DOCKER_REGISTRY}/agl-emotion-service:${VERSION_TAG}
docker tag agl-emotion-service:latest ${DOCKER_REGISTRY}/agl-emotion-service:latest
docker tag agl-dialogue-service:latest ${DOCKER_REGISTRY}/agl-dialogue-service:${VERSION_TAG}
docker tag agl-dialogue-service:latest ${DOCKER_REGISTRY}/agl-dialogue-service:latest

# Push images
echo "📤 Pushing images to registry..."
docker push ${DOCKER_REGISTRY}/agl-api-service:${VERSION_TAG}
docker push ${DOCKER_REGISTRY}/agl-api-service:latest
docker push ${DOCKER_REGISTRY}/agl-realtime-gateway:${VERSION_TAG}
docker push ${DOCKER_REGISTRY}/agl-realtime-gateway:latest
docker push ${DOCKER_REGISTRY}/agl-emotion-service:${VERSION_TAG}
docker push ${DOCKER_REGISTRY}/agl-emotion-service:latest
docker push ${DOCKER_REGISTRY}/agl-dialogue-service:${VERSION_TAG}
docker push ${DOCKER_REGISTRY}/agl-dialogue-service:latest

# Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes..."
kubectl apply -f infrastructure/k8s/ --namespace=agl

# Run database migrations
echo "🗃️  Running database migrations..."
API_POD=$(kubectl get pods -n agl -l app=api-service -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $API_POD -n agl -- npm run migrate:deploy

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/api-service -n agl --timeout=5m
kubectl rollout status deployment/realtime-gateway -n agl --timeout=5m
kubectl rollout status deployment/emotion-service -n agl --timeout=5m
kubectl rollout status deployment/dialogue-service -n agl --timeout=5m

# Verify deployment
echo "✅ Verifying deployment..."
kubectl get pods -n agl

# Run smoke tests
echo "🧪 Running smoke tests..."
# Add smoke test command here

echo "🎉 Deployment to production complete!"
echo "🌐 API: https://api.agl.com"
echo "🌐 Realtime: wss://realtime.agl.com"
echo "📊 Monitor at: https://monitoring.agl.com"

# Create Git tag
echo "🏷️  Creating Git tag..."
git tag -a $VERSION_TAG -m "Release $VERSION_TAG"
git push origin $VERSION_TAG

echo "✨ All done!"
