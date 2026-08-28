#!/usr/bin/env bash
# Let's Encrypt SSL Certificate Setup for madresehyar.ir
set -euo pipefail

DOMAIN="madresehyar.ir"
EMAIL="admin@madresehyar.ir"

echo "🔐 Requesting multi-domain SSL Certificate for $DOMAIN..."
mkdir -p /etc/letsencrypt/live/$DOMAIN /var/www/certbot

docker run -it --rm \
    -v "/etc/letsencrypt:/etc/letsencrypt" \
    -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
    -v "/var/www/certbot:/var/www/certbot" \
    certbot/certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN" -d "school.$DOMAIN" -d "admin.$DOMAIN"

echo "✅ SSL Certificate successfully acquired!"
docker exec serviceyar_nginx_prod nginx -s reload || true
