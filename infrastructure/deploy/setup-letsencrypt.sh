#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
    echo "Usage: ./setup-letsencrypt.sh <domain.ir> <admin-email@domain.ir>"
    exit 1
fi

echo "🔐 [Let's Encrypt] Obtaining SSL certificate for $DOMAIN..."

mkdir -p /etc/letsencrypt/live/$DOMAIN /var/www/certbot

docker run -it --rm \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
    -v "/var/www/certbot:/var/www/certbot" \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "www.$DOMAIN" -d "admin.$DOMAIN"

echo "✅ SSL Certificate successfully acquired for $DOMAIN!"
echo "🔄 Reloading Nginx container..."
docker exec serviceyar_nginx_prod nginx -s reload || true
