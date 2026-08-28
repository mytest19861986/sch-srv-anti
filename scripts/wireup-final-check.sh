#!/usr/bin/env bash
# Production Wire-up Final Check Runner for Linux / CI/CD
# Usage: ./scripts/wireup-final-check.sh

set -e

echo "=========================================================="
echo "  🔍 Running Wire-up Final Quality Gate Verification     "
echo "=========================================================="

bun run scripts/wireup-final-check.ts

echo "✅ All Wire-up pre-flight checks passed: 100% Ready for Live Traffic."
