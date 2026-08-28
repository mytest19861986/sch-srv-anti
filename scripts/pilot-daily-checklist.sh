#!/usr/bin/env bash
# Pilot Day Daily Checklist Runner for Linux / CI/CD
# Usage: ./scripts/pilot-daily-checklist.sh

set -e

echo "=========================================================="
echo "  🚀 Launching Pilot Day Automated Daily Checklist Engine  "
echo "=========================================================="

bun run scripts/pilot-daily-checklist.ts

echo "✅ Pre-Flight Verification Succeeded: All Systems Operational."
