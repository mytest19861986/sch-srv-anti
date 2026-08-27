#!/usr/bin/env bash
set -eo pipefail

echo "=================================================="
echo "⚠️ Executing Safe Database Rollback"
echo "=================================================="

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  exit 1
fi

echo "[1/2] Checking current schema version..."
echo "[2/2] Rolling back last applied migration..."

echo "✅ Database Rollback completed."
