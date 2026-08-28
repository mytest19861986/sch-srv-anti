#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"

echo "========================================================"
echo "🚀 [ServiceYar] Production Zero-Downtime Deployment"
echo "========================================================"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Error: Environment configuration file $ENV_FILE not found."
    echo "💡 Please copy .env.production.example to .env.production and configure."
    exit 1
fi

echo "📋 Loading environment from $ENV_FILE..."
set -a
source "$ENV_FILE"
set +a

echo "📦 Pulling base images and building release containers..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" build --parallel

echo "🔄 Starting core data services (PostgreSQL & Redis)..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d postgres-primary postgres-replica redis

echo "⏳ Waiting for database health check..."
until docker exec serviceyar_pg_primary_prod pg_isready -U "${DB_USER:-school_user}" -d "${DB_NAME:-school_transport}" > /dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " ✓ Database is ready."

echo "🚀 Deploying Backend API and Worker..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d backend-api outbox-worker

echo "🚀 Deploying Web Dashboards (School Web & Super Admin)..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d school-web super-admin-web

echo "🛡️ Deploying Nginx Edge Gateway..."
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d nginx

echo "🩺 Performing health verification..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/health/live" || true)

if [[ "$HTTP_CODE" == "200" ]]; then
    echo "✅ [ServiceYar Production] Deployment completed successfully! (Health check: 200 OK)"
else
    echo "⚠️ Warning: Backend health check returned HTTP $HTTP_CODE. Check docker logs."
fi

echo "========================================================"
echo "🌐 Production URL: https://${DOMAIN:-serviceyar.ir}"
echo "========================================================"
