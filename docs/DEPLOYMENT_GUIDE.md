# راهنمای جامع استقرار در محیط عملیاتی (Production Deployment Guide)

این راهنما گام‌به‌گام نحوه استقرار پلتفرم «سرویس یار» را بر روی سرورهای ابری (Hetzner CX32، ابر آروان یا هر سرور لینوکس ابری) شرح می‌دهد.

---

## ۱. پیش‌نیازهای سرور (Server Prerequisites)

- **سیستم‌عامل**: Ubuntu 22.04 LTS / 24.04 LTS
- **حداقل مشخصات سخت‌افزاری**:
  - حداقل (پایلوت تک‌مدرسه تا ۲۰۰ دانش‌آموز): ۲ vCPU / ۴GB RAM / ۴۰GB SSD
  - پیشنهادی (عملیاتی تا ۵ مدرسه): ۴ vCPU / ۸GB RAM / ۸۰GB NVMe (Hetzner CX32)
- **ابزارهای نصب‌شده**:
  ```bash
  sudo apt update && sudo apt install -y curl git ufw
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```

---

## ۲. دریافت سورس‌کد و تنظیم متغیرهای محیطی

```bash
# کلون مخزن رسمی
git clone https://github.com/mytest19861986/sch-srv-anti.git /opt/serviceyar
cd /opt/serviceyar

# ایجاد فایل پیکربندی عملیاتی
cp .env.production.example infrastructure/deploy/.env.production
nano infrastructure/deploy/.env.production
```

مقادیر زیر را در فایل `.env.production` مقداردهی کنید:
- `DOMAIN`: دامنه نهایی (مثلاً `serviceyar.ir` یا `madresehyar.ir`)
- `DB_PASSWORD`: کلمه عبور قوی دیتابیس
- `JWT_SECRET`: کلید رمزنگاری ۶۴ کاراکتری
- `FIREBASE_SERVICE_ACCOUNT_KEY`: محتوای کلید JSON سرویس Firebase

---

## ۳. تنظیم DNS در پنل دامنه (NIC.ir / Cloudflare)

در پنل مدیریت DNS، رکوردهای زیر را به IP سرور خود متصل کنید:
- `A` رکورد: `@` -> `YOUR_SERVER_IP`
- `A` رکورد: `www` -> `YOUR_SERVER_IP`
- `A` رکورد: `admin` -> `YOUR_SERVER_IP`

---

## ۴. اجرای اسکریپت استقرار و فعال‌سازی SSL

```bash
cd /opt/serviceyar/infrastructure/deploy

# اعطای مجوز اجرا
chmod +x deploy.sh setup-letsencrypt.sh backup-db.sh

# اجرای استقرار کانتینرها
./deploy.sh .env.production

# صدور و نصب گواهی امنیتی رایگان Let's Encrypt
./setup-letsencrypt.sh yourdomain.ir admin@yourdomain.ir
```

---

## ۵. پشتیبان‌گیری خودکار روزانه (Automated Daily Backups)

افزودن دستور پشتیبان‌گیری به crontab سیستم:
```bash
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/serviceyar/infrastructure/deploy/backup-db.sh >> /var/log/serviceyar-backup.log 2>&1") | crontab -
```

---

## ۶. بررسی و پایش سلامت سیستم (Health Checks)

- **بررسی سلامت API**: `https://yourdomain.ir/api/v1/health/live`
- **پایش زنده صف**: `https://yourdomain.ir/api/v1/health/queue-metrics`
- **پنل مدرسه**: `https://yourdomain.ir`
- **پنل راهبری کلان**: `https://yourdomain.ir/admin`
