#!/usr/bin/env bash
# Secret & PII Scanning Utility for CI/CD and Pre-Commit Hooks
set -e

echo "🔍 Running Automated Secret and Security Scanner..."

PATTERNS=(
    "password\s*=\s*['\"][^'\"]+['\"]"
    "jwt_secret\s*=\s*['\"][^'\"]+['\"]"
    "BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY"
    "ghp_[A-Za-z0-9_]{36}"
    "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
)

FOUND=0

for PATTERN in "${PATTERNS[@]}"; do
    MATCHES=$(git grep -EI "$PATTERN" -- ':!*.env.example' ':!tests/**' ':!scripts/**' 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
        echo "❌ High Risk Secret Pattern Detected: $PATTERN"
        echo "$MATCHES"
        FOUND=1
    fi
done

if [ $FOUND -eq 0 ]; then
    echo "✅ Zero secrets found in repository source code."
    exit 0
else
    echo "❌ Secret scan failed! Remove leaked credentials before commit."
    exit 1
fi
