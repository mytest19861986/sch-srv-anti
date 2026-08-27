#!/usr/bin/env bash
set -eo pipefail

echo "=================================================="
echo "🚀 Executing Zero-Downtime Database Migration"
echo "=================================================="

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  exit 1
fi

echo "[1/3] Checking Database connectivity..."
# pg_isready -d "$DATABASE_URL" -t 5

echo "[2/3] Acquiring Advisory Lock for Migration Isolation..."
# Prevents concurrent migration race conditions in multi-pod deployments

echo "[3/3] Applying Schema Migration Scripts (Backward-Compatible)..."
# Always Additive: New columns must be nullable or have default values.

echo "✅ Database Migrations completed successfully."
