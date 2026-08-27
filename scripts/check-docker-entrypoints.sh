#!/usr/bin/env bash
# ==============================================================================
# 🛡️ Docker Entrypoint & CMD Fast-Fail Regression Guard (Order #24)
# ==============================================================================
set -e

echo "🔍 Checking all Dockerfile CMD and Entrypoint target files in repository..."

ERRORS=0

# 1. Check Backend API Dockerfile -> src/server.ts
if [ -f "services/backend-api/Dockerfile" ]; then
  if grep -q "src/server.ts" "services/backend-api/Dockerfile"; then
    if [ -f "services/backend-api/src/server.ts" ]; then
      echo "  ✅ services/backend-api/Dockerfile: src/server.ts exists."
    else
      echo "  ❌ ERROR: services/backend-api/src/server.ts not found on filesystem!"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo "  ❌ ERROR: services/backend-api/Dockerfile must target src/server.ts"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ❌ ERROR: services/backend-api/Dockerfile is missing!"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check Outbox Worker Dockerfile -> src/worker.ts
if [ -f "services/backend-api/Dockerfile.worker" ]; then
  if grep -q "src/worker.ts" "services/backend-api/Dockerfile.worker"; then
    if [ -f "services/backend-api/src/worker.ts" ]; then
      echo "  ✅ services/backend-api/Dockerfile.worker: src/worker.ts exists."
    else
      echo "  ❌ ERROR: services/backend-api/src/worker.ts not found on filesystem!"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo "  ❌ ERROR: services/backend-api/Dockerfile.worker must target src/worker.ts"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ❌ ERROR: services/backend-api/Dockerfile.worker is missing!"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check School Web Dockerfile
if [ -f "apps/school-web/Dockerfile" ] && [ -f "apps/school-web/package.json" ]; then
  echo "  ✅ apps/school-web/Dockerfile and package.json exist."
else
  echo "  ❌ ERROR: apps/school-web Dockerfile or package.json is missing!"
  ERRORS=$((ERRORS + 1))
fi

# 4. Check Super Admin Web Dockerfile
if [ -f "apps/super-admin-web/Dockerfile" ] && [ -f "apps/super-admin-web/package.json" ]; then
  echo "  ✅ apps/super-admin-web/Dockerfile and package.json exist."
else
  echo "  ❌ ERROR: apps/super-admin-web Dockerfile or package.json is missing!"
  ERRORS=$((ERRORS + 1))
fi

if [ $ERRORS -gt 0 ]; then
  echo "❌ Total Entrypoint Validation Errors: $ERRORS"
  exit 1
fi

echo "🎉 All Dockerfile EntryPoints verified successfully! (0 Errors)"
exit 0
