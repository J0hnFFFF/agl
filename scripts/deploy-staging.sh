#!/bin/bash

# Deploy to Staging Environment

set -e

echo "🚀 Deploying AGL to Staging..."

# Load environment variables
if [ -f .env.staging ]; then
    export $(cat .env.staging | xargs)
else
    echo "❌ .env.staging not found"
    exit 1
fi

# Build Docker images
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Tag images for staging
echo "🏷️  Tagging images..."
docker tag agl-api-service:latest ${DOCKER_REGISTRY}/agl-api-service:staging
docker tag agl-realtime-gateway:latest ${DOCKER_REGISTRY}/agl-realtime-gateway:staging
docker tag agl-emotion-service:latest ${DOCKER_REGISTRY}/agl-emotion-service:staging
docker tag agl-dialogue-service:latest ${DOCKER_REGISTRY}/agl-dialogue-service:staging

# Push images
echo "📤 Pushing images to registry..."
docker push ${DOCKER_REGISTRY}/agl-api-service:staging
docker push ${DOCKER_REGISTRY}/agl-realtime-gateway:staging
docker push ${DOCKER_REGISTRY}/agl-emotion-service:staging
docker push ${DOCKER_REGISTRY}/agl-dialogue-service:staging

# Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes..."
kubectl apply -f infrastructure/k8s/ --namespace=agl-staging

# Run database migrations
echo "🗃️  Running database migrations..."
API_POD=$(kubectl get pods -n agl-staging -l app=api-service -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $API_POD -n agl-staging -- npm run migrate:deploy

# Wait for rollout
echo "⏳ Waiting for rollout to complete..."
kubectl rollout status deployment/api-service -n agl-staging
kubectl rollout status deployment/realtime-gateway -n agl-staging
kubectl rollout status deployment/emotion-service -n agl-staging
kubectl rollout status deployment/dialogue-service -n agl-staging

# Verify deployment
echo "✅ Verifying deployment..."
kubectl get pods -n agl-staging

echo "🎉 Deployment to staging complete!"
echo "🌐 API: https://api-staging.agl.com"
echo "🌐 Realtime: wss://realtime-staging.agl.com"
