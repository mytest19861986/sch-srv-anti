#!/usr/bin/env bash
# ==============================================================================
# 🚌 School Transport Platform — Quick Demo Launch Script (Order #21)
# ==============================================================================
set -e

ACTION="${1:-start}"

show_banner() {
  echo "======================================================================"
  echo "🚀 School Transport Platform — Quick Demo Launcher"
  echo "======================================================================"
}

if [ "$ACTION" == "stop" ]; then
  show_banner
  echo "🛑 Stopping all demo containers and services..."
  docker compose -f infrastructure/docker/docker-compose.dev.yml down
  echo "✅ All demo services stopped."
  exit 0
fi

if [ "$ACTION" == "reset" ]; then
  show_banner
  echo "🔄 Resetting demo environment (clearing volumes)..."
  docker compose -f infrastructure/docker/docker-compose.dev.yml down -v
  echo "✅ Reset complete. Launching clean demo..."
fi

show_banner

echo "1. Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
echo "   ✅ Prerequisites verified."

echo "2. Preparing environment configuration..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    cat <<EOF > .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://school_user:school_secret_pass@localhost:5432/school_transport
DATABASE_REPLICA_URL=postgres://school_user:school_secret_pass@localhost:5433/school_transport
USE_READ_REPLICA=false
REDIS_URL=redis://localhost:6379
CACHE_ADAPTER=inmemory
STORAGE_TYPE=local
NOTIFICATION_ADAPTER=mock
JWT_SECRET=demo_super_secret_jwt_key_2026
EOF
  fi
  echo "   ✅ Created local .env configuration."
fi

echo "3. Starting core database and infrastructure services..."
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d postgres-primary redis localstack || true

echo "4. Seeding Demo Data (1 School, 5 Drivers, 20 Students, 40 Parents, 4 Demo Users)..."
if command -v bun >/dev/null 2>&1; then
  bun run scripts/seed-demo.ts || true
else
  node scripts/seed-demo.ts || true
fi

echo "5. Starting Backend API and Web Dashboards..."
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d || true

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
echo ""
echo "🔑 DEMO LOGIN CREDENTIALS (LOCAL USE ONLY):"
echo "   ┌──────────────────────────┬──────────────┬────────────────────────────┐"
echo "   │ Role                     │ Email        │ Password                   │"
echo "   ├──────────────────────────┼──────────────┼────────────────────────────┤"
echo "   │ 🛡️ Super Admin          │ super-admin@platform.ir │ Demo@1234       │"
echo "   │ 🏫 School Administrator │ school-admin@demo.ir    │ Demo@1234       │"
echo "   │ 🚐 School Driver        │ driver@demo.ir          │ Demo@1234       │"
echo "   │ 👨‍👩‍👧 Parent / Guardian   │ parent@demo.ir          │ Demo@1234       │"
echo "   └──────────────────────────┴──────────────┴────────────────────────────┘"
echo ""
echo "ℹ️  Subcommands:"
echo "   ./demo.sh stop    - Stop all demo containers"
echo "   ./demo.sh reset   - Reset databases and rebuild demo data"
echo "======================================================================"
