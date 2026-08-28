#!/usr/bin/env bash
# Production Wire-up Automation Kit for Linux / CI/CD
# Usage: ./scripts/wireup-setup.sh <domain> <host_ip> [provider] [admin_email]
# Example: ./scripts/wireup-setup.sh madresehyar.ir 5.22.133.45 arvancloud

set -euo pipefail

DOMAIN="${1:-madresehyar.ir}"
HOST_IP="${2:-5.22.133.45}"
PROVIDER="${3:-arvancloud}"
ADMIN_EMAIL="${4:-admin@${DOMAIN}}"

echo "=========================================================="
echo "  🚀 Launching Production Wire-up Kit (Order #55)        "
echo "  Domain: $DOMAIN | IP: $HOST_IP | Provider: $PROVIDER   "
echo "=========================================================="

export DOMAIN="$DOMAIN"
export HOST_IP="$HOST_IP"
export HOSTING_PROVIDER="$PROVIDER"
export ADMIN_EMAIL="$ADMIN_EMAIL"

bun run scripts/wireup-setup.ts

echo "✅ Wire-up configuration files generated successfully!"
