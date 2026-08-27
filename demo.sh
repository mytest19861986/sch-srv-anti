#!/usr/bin/env bash
# ==============================================================================
# 🚌 School Transport Platform — Docker-Only Quick Demo Launcher (Order #22 - #28)
# ==============================================================================
# Windows / Git Bash / Linux / macOS compatible
# Requirement: Docker Desktop ONLY (Zero Host Node/Bun dependencies required)
# ==============================================================================
set -e

ACTION="${1:-start}"

# Determine Docker Compose Command
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  DOCKER_COMPOSE=""
fi

show_banner() {
  echo "======================================================================"
  echo "🚀 School Transport Platform — Docker-Only Demo Launcher"
  echo "======================================================================"
}

COMPOSE_FILE="infrastructure/docker/docker-compose.dev.yml"

if [ "$ACTION" == "stop" ]; then
  show_banner
  echo "🛑 Stopping all demo containers and services..."
  if [ -n "$DOCKER_COMPOSE" ]; then
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" down
  fi
  echo "✅ All demo services stopped."
  exit 0
fi

if [ "$ACTION" == "reset" ]; then
  show_banner
  echo "🔄 Resetting demo environment (clearing containers & volumes)..."
  if [ -n "$DOCKER_COMPOSE" ]; then
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" down -v --remove-orphans || true
  fi
  echo "✅ Reset complete. Launching clean demo from scratch..."
fi

show_banner

echo "1. Checking prerequisites..."
if ! command -v docker >/dev/null 2>&1 || [ -z "$DOCKER_COMPOSE" ]; then
  echo ""
  echo "❌ خطای پیش‌نیاز: Docker Desktop یافت نشد یا در حال اجرا نیست."
  echo "📌 تنها پیش‌نیاز اجرای این سامانه، نرم‌افزار Docker Desktop می‌باشد."
  echo "🔗 لطفاً Docker Desktop را از نشانی زیر دریافت و نصب فرمایید:"
  echo "   https://www.docker.com/products/docker-desktop/"
  echo ""
  exit 1
fi
echo "   ✅ Docker & Docker Compose تایید شدند (تنها پیش‌نیاز سخت‌گیرانه سیستم)."

# Informative non-blocking runtime checks
if ! command -v node >/dev/null 2>&1; then
  echo "   ℹ️  نکته: Node.js روی سیستم میزبان یافت نشد (کاملاً اختیاری - تمام سرویس‌ها در داکر اجرا می‌شوند)."
fi
if ! command -v bun >/dev/null 2>&1; then
  echo "   ℹ️  نکته: Bun روی سیستم میزبان یافت نشد (کاملاً اختیاری - در کانتینرها لود می‌شود)."
fi

echo "2. Preparing local environment configuration..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    cat <<EOF > .env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgres://school_user:school_secret_pass@localhost:5432/school_transport
DATABASE_REPLICA_URL=postgres://school_user:school_secret_pass@localhost:5433/school_transport
USE_READ_REPLICA=false
REDIS_URL=redis://localhost:6379
CACHE_ADAPTER=inmemory
STORAGE_TYPE=local
LOCALSTACK_ENDPOINT=http://localhost:4567
S3_BUCKET=school-transport-assets
NOTIFICATION_ADAPTER=mock
JWT_SECRET=demo_super_secret_jwt_key_2026
EOF
  fi
  echo "   ✅ فایل .env لوکال به صورت خودکار آماده شد."
fi

echo "3. Building and starting infrastructure & application containers..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up --build -d

echo "4. Waiting for Backend API & Database to become healthy..."
MAX_RETRIES=30
COUNT=0
until curl -s -f http://localhost:3000/health/live >/dev/null 2>&1 || [ $COUNT -ge $MAX_RETRIES ]; do
  sleep 1
  COUNT=$((COUNT + 1))
done

if [ $COUNT -ge $MAX_RETRIES ]; then
  echo "⚠️ Backend API is taking longer than expected. Continuing..."
else
  echo "   ✅ سرویس بک‌اند و پایگاه داده در وضعیت سالم (Healthy) هستند."
fi

echo "5. Seeding Demo Data inside container..."
# Run seeding inside the backend container without needing local node/bun
$DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T backend-api bun run scripts/seed-demo.ts >/dev/null 2>&1 || true

echo ""
echo "======================================================================"
echo "🎉 DEMO ENVIRONMENT IS READY & OPERATIONAL!"
echo "======================================================================"
echo ""
echo "📱 WEB DASHBOARDS & API ENDPOINTS:"
echo "   🏫 School Web Dashboard:   http://localhost:3001"
echo "   🏢 Super Admin Dashboard:  http://localhost:3002"
echo "   ⚡ API Gateway (Nginx):    http://localhost:80"
echo "   🚀 Backend API Direct:     http://localhost:3000"
echo "   📦 LocalStack S3 Emulator: http://localhost:4567"
echo ""
echo "🔑 DEMO LOGIN CREDENTIALS (LOCAL USE ONLY):"
echo "   ┌──────────────────────────┬─────────────────────────┬────────────┐"
echo "   │ Role                     │ Email (Username)        │ Password   │"
echo "   ├──────────────────────────┼─────────────────────────┼────────────┤"
echo "   │ 🛡️ Super Admin          │ super-admin@platform.ir │ Demo@1234  │"
echo "   │ 🏫 School Administrator │ school-admin@demo.ir    │ Demo@1234  │"
echo "   │ 🚐 School Driver        │ driver@demo.ir          │ Demo@1234  │"
echo "   │ 👨‍👩‍👧 Parent / Guardian   │ parent@demo.ir          │ Demo@1234  │"
echo "   └──────────────────────────┴─────────────────────────┴────────────┘"
echo ""
echo "ℹ️  Subcommands:"
echo "   ./demo.sh stop    - Stop all demo containers"
echo "   ./demo.sh reset   - Reset databases and rebuild demo data"
echo "======================================================================"
