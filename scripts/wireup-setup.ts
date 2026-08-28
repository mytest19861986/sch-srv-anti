/**
 * Production Wire-up Automation Kit (Order #55)
 * Project: School Transport Management System (سامانه مدیریت سرویس مدرسه)
 * Generates production configs, DNS zones, Nginx templates, and .env.production
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface WireupConfig {
  domain: string;
  hostIp: string;
  provider: 'arvancloud' | 'liara' | 'hetzner' | 'custom';
  adminEmail: string;
}

export function generateJwtSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function runWireupSetup(config: WireupConfig) {
  const rootDir = process.cwd();
  console.log('\n' + '='.repeat(80));
  console.log('  🚀 PRODUCTION WIRE-UP KIT ENGINE (ORDER #55)');
  console.log(`  Target Domain: ${config.domain}`);
  console.log(`  Host Public IP: ${config.hostIp}`);
  console.log(`  Cloud Provider: ${config.provider}`);
  console.log(`  Admin Email: ${config.adminEmail}`);
  console.log('='.repeat(80) + '\n');

  // 1. Generate .env.production
  const jwtSecret = generateJwtSecret();
  const dbPassword = generateJwtSecret().substring(0, 24);
  const outboxApiKey = generateJwtSecret().substring(0, 32);

  const envProductionContent = `# ==============================================================================
# Production Environment Variables for ${config.domain}
# Generated automatically by Wire-up Kit (Order #55)
# ==============================================================================

NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Base URLs
DOMAIN_NAME=${config.domain}
PUBLIC_API_URL=https://api.${config.domain}
PUBLIC_SCHOOL_WEB_URL=https://school.${config.domain}
PUBLIC_SUPER_ADMIN_URL=https://admin.${config.domain}

# Security & Authentication
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=86400s
REFRESH_TOKEN_EXPIRES_IN=604800s

# Database Configuration (PostgreSQL Production)
DATABASE_URL=postgres://school_prod_user:${dbPassword}@postgres-db:5432/school_transport_prod
POSTGRES_DB=school_transport_prod
POSTGRES_USER=school_prod_user
POSTGRES_PASSWORD=${dbPassword}

# Rate Limiting & Abuse Defense
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW_MS=60000

# Push Notifications & Outbox Worker
NOTIFICATION_ADAPTER=mock
OUTBOX_BATCH_SIZE=50
OUTBOX_POLL_INTERVAL_MS=3000
OUTBOX_INTERNAL_API_KEY=${outboxApiKey}

# CORS Allowed Origins
CORS_ORIGINS=https://${config.domain},https://school.${config.domain},https://admin.${config.domain},https://api.${config.domain}
`;

  fs.writeFileSync(path.join(rootDir, '.env.production'), envProductionContent, 'utf-8');
  console.log('✅ Generated .env.production with secure random secrets.');

  // 2. Generate DNS Setup Guide (docs/DNS_SETUP.md)
  const dnsSetupContent = `# 🌐 راهنمای جامع تنظیم رکوردهای DNS دامنه (${config.domain})
**پروژه:** سامانه جامع مدیریت سرویس مدرسه (MadresehYar / ServiceYar)  
**دامنه اصلی:** \`${config.domain}\`  
**آدرس آی‌پی سرور (Host IP):** \`${config.hostIp}\`  
**ارائه‌دهنده میزبانی / ابری:** \`${config.provider.toUpperCase()}\`  

---

## ۱. جدول رکوردهای DNS الزامی (DNS Zone Records)
لطفاً رکوردهای زیر را در پنل مدیریت دامنه خود (مانند ابر آروان، کلودفلر، یا پنل DNS دامنه در ایرنیک) وارد نمایید:

| ردیف | نوع رکورد (Type) | نام رکورد (Name / Host) | مقدار (Value / Target) | TTL | توضیحات |
| :---: | :---: | :--- | :--- | :--- | :--- |
| **۱** | **A** | \`@\` (یا ${config.domain}) | \`${config.hostIp}\` | Auto / 300s | دامنه اصلی پرتال |
| **۲** | **A** | \`api\` | \`${config.hostIp}\` | Auto / 300s | اندپوینت بک‌اند API |
| **۳** | **A** | \`school\` | \`${config.hostIp}\` | Auto / 300s | پنل وب مدارس |
| **۴** | **A** | \`admin\` | \`${config.hostIp}\` | Auto / 300s | پنل وب سوپر ادمین |
| **۵** | **CNAME** | \`www\` | \`${config.domain}\` | Auto / 300s | هدایت آدرس با www |
| **۶** | **TXT** | \`@\` | \`v=spf1 ip4:${config.hostIp} ~all\` | 3600s | رکورد امنیتی ارسال ایمیل (SPF) |
| **۷** | **TXT** | \`_dmarc\` | \`v=DMARC1; p=none; sp=none; rua=mailto:${config.adminEmail}\` | 3600s | رکورد محافظت امنیتی ایمیل (DMARC) |

---

## ۲. مراحل ثبت و فعال‌سازی در سامانه ایرنیک (NIC.ir)
1. وارد پنل کاربری خود در وب‌سایت [ایرنیک (nic.ir)](https://www.nic.ir) شوید.
2. به بخش **«دامنه‌های من»** رفته و دامنه \`${config.domain}\` را انتخاب نمایید.
3. در بخش **«سامانه نام دامنه (DNS)»**، کارگزاران نام (Name Servers) سرویس‌دهنده خود را وارد کنید:
   - **ابر آروان (ArvanCloud):** \`ns1.arvancdn.ir\` و \`ns2.arvancdn.ir\`
   - **لیارا (Liara):** \`ns1.liara.zone\` و \`ns2.liara.zone\`
   - **کلودفلر (Cloudflare):** نیم‌سرورهای اختصاصی داده‌شده در داشبورد کلودفلر
4. پس از ذخیره، معمولاً بین ۲ تا ۱۲ ساعت زمان لازم است تا رکوردهای دامنه در سراسر شبکه کشوری فعال شوند.

---

## ۳. بررسی صحت انتشار DNS (Verification)
جهت بررسی انتشار صحیح رکوردها در ترمینال:
\`\`\`bash
# بررسی رکورد دامنه اصلی
nslookup ${config.domain}

# بررسی ساب‌دامین API
nslookup api.${config.domain}

# بررسی ساب‌دامین مدرسه
nslookup school.${config.domain}
\`\`\`
یا اسکریپت خودکار اعتبارسنجی را اجرا کنید:
\`\`\`bash
bun run scripts/wireup-final-check.ts
\`\`\`
`;

  fs.writeFileSync(path.join(rootDir, 'docs', 'DNS_SETUP.md'), dnsSetupContent, 'utf-8');
  console.log('✅ Generated docs/DNS_SETUP.md');

  // 3. Generate Nginx Production Configuration
  const nginxProdContent = `# ==============================================================================
# Nginx Reverse Proxy Configuration for ${config.domain}
# High-Performance, SSL-Terminated & Zero-Trust Hardened
# ==============================================================================

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 25M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Rate Limiting Zones
    limit_req_zone $binary_remote_addr zone=api_rate_limit:10m rate=40r/s;
    limit_req_zone $binary_remote_addr zone=auth_rate_limit:10m rate=5r/s;

    # Upstream Clusters
    upstream backend_cluster {
        server backend-api:3000 max_fails=3 fail_timeout=10s;
        keepalive 32;
    }

    upstream school_web_cluster {
        server school-web:3001;
        keepalive 16;
    }

    upstream super_admin_cluster {
        server super-admin-web:3002;
        keepalive 16;
    }

    # -------------------------------------------------------------
    # HTTP to HTTPS Global Redirect
    # -------------------------------------------------------------
    server {
        listen 80;
        server_name ${config.domain} www.${config.domain} api.${config.domain} school.${config.domain} admin.${config.domain};

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # -------------------------------------------------------------
    # 1. API Backend (api.${config.domain})
    # -------------------------------------------------------------
    server {
        listen 443 ssl http2;
        server_name api.${config.domain};

        ssl_certificate /etc/letsencrypt/live/${config.domain}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${config.domain}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            limit_req zone=api_rate_limit burst=20 nodelay;
            proxy_pass http://backend_cluster;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_read_timeout 30s;
        }

        location /api/v1/auth/ {
            limit_req zone=auth_rate_limit burst=5 nodelay;
            proxy_pass http://backend_cluster;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }

    # -------------------------------------------------------------
    # 2. School Web Panel (school.${config.domain} & ${config.domain})
    # -------------------------------------------------------------
    server {
        listen 443 ssl http2;
        server_name school.${config.domain} ${config.domain} www.${config.domain};

        ssl_certificate /etc/letsencrypt/live/${config.domain}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${config.domain}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        location / {
            proxy_pass http://school_web_cluster;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }

    # -------------------------------------------------------------
    # 3. Super Admin Panel (admin.${config.domain})
    # -------------------------------------------------------------
    server {
        listen 443 ssl http2;
        server_name admin.${config.domain};

        ssl_certificate /etc/letsencrypt/live/${config.domain}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${config.domain}/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        location / {
            proxy_pass http://super_admin_cluster;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }
}
`;

  fs.writeFileSync(path.join(rootDir, 'infrastructure', 'deploy', 'nginx-production.conf'), nginxProdContent, 'utf-8');
  console.log('✅ Generated infrastructure/deploy/nginx-production.conf');

  // 4. Generate SSL Helper Script
  const sslScriptContent = `#!/usr/bin/env bash
# Let's Encrypt SSL Certificate Setup for ${config.domain}
set -euo pipefail

DOMAIN="${config.domain}"
EMAIL="${config.adminEmail}"

echo "🔐 Requesting multi-domain SSL Certificate for $DOMAIN..."
mkdir -p /etc/letsencrypt/live/$DOMAIN /var/www/certbot

docker run -it --rm \\
    -v "/etc/letsencrypt:/etc/letsencrypt" \\
    -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \\
    -v "/var/www/certbot:/var/www/certbot" \\
    certbot/certbot certonly --webroot \\
    --webroot-path=/var/www/certbot \\
    --email "$EMAIL" --agree-tos --no-eff-email \\
    -d "$DOMAIN" -d "www.$DOMAIN" -d "api.$DOMAIN" -d "school.$DOMAIN" -d "admin.$DOMAIN"

echo "✅ SSL Certificate successfully acquired!"
docker exec serviceyar_nginx_prod nginx -s reload || true
`;

  fs.writeFileSync(path.join(rootDir, 'infrastructure', 'deploy', 'setup-ssl.sh'), sslScriptContent, 'utf-8');
  console.log('✅ Generated infrastructure/deploy/setup-ssl.sh');

  console.log('\n' + '='.repeat(80));
  console.log('  🎉 WIRE-UP CONFIGURATION GENERATION COMPLETE');
  console.log(`  All production files customized for ${config.domain} at ${config.hostIp}`);
  console.log('='.repeat(80) + '\n');
}

// Auto-run if executed directly
const domain = process.env.DOMAIN || process.argv[2] || 'madresehyar.ir';
const hostIp = process.env.HOST_IP || process.argv[3] || '5.22.133.45';
const provider = (process.env.HOSTING_PROVIDER || process.argv[4] || 'arvancloud') as any;
const adminEmail = process.env.ADMIN_EMAIL || process.argv[5] || `admin@${domain}`;

runWireupSetup({ domain, hostIp, provider, adminEmail });

