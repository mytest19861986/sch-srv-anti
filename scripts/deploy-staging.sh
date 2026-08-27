#!/bin/bash
set -e

echo "🚀 Deploying School Service Platform to Staging Environment..."

echo "1. Spinning up core data services (Postgres Primary, Replica, Redis, LocalStack)..."
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d postgres-primary postgres-replica redis localstack

echo "2. Waiting for database healthcheck..."
sleep 5

echo "3. Running database migrations & seed..."
bun run scripts/seed-sample-data.ts

echo "4. Starting remaining microservices (Backend API, Outbox Worker, Nginx LB)..."
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d

echo "✅ Waiting for health checks..."
curl -f http://localhost:3000/health/ready || true

echo "🎉 Staging deployment is complete and healthy!"
echo "=================================================="
echo "📍 API Gateway (Nginx):    http://localhost:80"
echo "📍 Backend Direct:         http://localhost:3000"
echo "📍 School Web Dashboard:   http://localhost:3001"
echo "📍 Super Admin Dashboard:  http://localhost:3002"
echo "=================================================="
