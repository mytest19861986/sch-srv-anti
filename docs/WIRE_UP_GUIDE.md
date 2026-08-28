# راهنمای جامع اتصال و راه‌اندازی نهایی (Final Wire-up Guide)

این سند راهنمای جامع و گام‌به‌گام اتصال پلتفرم «سرویس یار» به سرویس‌های ابری خارجی (Firebase، فضای ذخیره‌سازی S3، دامنه ملی و گواهی امنیتی SSL) و چک‌لیست نهایی ورود به پایلوت است.

---

## 📌 بخش ۱: سرویس پوش‌نوتیفیکیشن Firebase (Firebase Cloud Messaging)

سیستم ارسال اعلان‌های زنده وضعیت دانش‌آموزان به اولیا و رانندگان از پروتکل استاندارد FCM استفاده می‌کند.

### مراحل فعال‌سازی:
1. **ایجاد پروژه در کنسول گوگل**:
   - به [Firebase Console](https://console.firebase.google.com) رفته و پروژه جدیدی بسازید (مثلاً `serviceyar-prod`).
2. **فعال‌سازی Firebase Cloud Messaging**:
   - از منوی تنظیمات پروژه (`Project Settings`)، به تب `Cloud Messaging` بروید.
3. **تولید کلید Service Account**:
   - به تب `Service accounts` رفته و روی دکمه **Generate new private key** کلیک کنید.
   - یک فایل JSON دانلود می‌شود (شامل `project_id`، `client_email` و `private_key`).
4. **تنظیم در متغیر محیطی بک‌اند**:
   - تمام محتوای فایل JSON را به صورت یک‌خطی در فایل `.env.production` قرار دهید:
     ```env
     NOTIFICATION_ADAPTER=fcm
     FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"serviceyar-prod",...}'
     ```
5. **اعتبارسنجی ارسال**:
   - با اجرای تست یکپارچگی یا ایجاد یک رویداد حضور/غیاب، پیام در لاگ به صورت `[FcmAdapter] Dispatched push notification` ثبت می‌شود.

---

## 📌 بخش ۲: فضای ذخیره‌سازی ابری فایل‌ها (S3 Compatible Storage)

تصاویر پروفایل، مدارک رانندگان، قراردادها و مستندات خودرو در فضای امن ابری S3 ذخیره می‌شوند.

### ارائه‌دهندگان پیشنهادی:
- **ابر آروان (ArvanCloud)**: دیتاسنتر داخلی، پینگ زیر ۲۰ms، پشتیبانی از ارز ریال.
- **MinIO**: سلف‌هاست روی همان سرور (در صورت نیاز به استقلال کامل).
- **Amazon S3 / Hetzner Storage Box**: ذخیره‌سازی ابری بین‌المللی.

### مراحل پیکربندی در ابر آروان یا MinIO:
1. ایجاد باکت جدید با نام `serviceyar-prod-media` با دسترسی خصوصی (Private).
2. دریافت کلیدهای `Access Key` و `Secret Key`.
3. تنظیم در فایل `.env.production`:
   ```env
   STORAGE_TYPE=s3
   S3_BUCKET=serviceyar-prod-media
   S3_ACCESS_KEY=YourAccessKeyId
   S3_SECRET_KEY=YourSecretKey
   S3_ENDPOINT=https://s3.ir-tbz-sh1.arvanstorage.ir
   S3_REGION=us-east-1
   ```

---

## 📌 بخش ۳: ثبت دامنه، تنظیم DNS و صدور گواهی SSL

### ۱. ثبت دامنه در سامانه ایرنیک (NIC.ir):
- دامنه منتخب (مثلاً `madresehyar.ir` یا `serviceyar.ir`) را در سامانه ایرنیک جستجو و ثبت نمایید.
- رابط‌های مجاز (Administrative / Technical Contact) را روی شناسه خود قرار دهید.

### ۲. تنظیم رکوردهای DNS (در کلودفلر یا ابر آروان یا میزبان دامنه):
- **رکورد A اصلی**: `@` -> `IP_سرور_شما`
- **رکورد A پنل راهبری**: `admin` -> `IP_سرور_شما`
- **رکورد A زیردامنه**: `www` -> `IP_سرور_شما`

### ۳. صدور گواهی امنیتی SSL رایگان (Let's Encrypt):
پس از انتشار DNS، اسکریپت خودکار زیر را روی سرور اجرا نمایید:
```bash
cd /opt/serviceyar/infrastructure/deploy
./setup-letsencrypt.sh madresehyar.ir admin@madresehyar.ir
```
گواهی SSL به طور خودکار دریافت، در Nginx بارگذاری و قابلیت تمدید خودکار فعال می‌شود.

---

## 📌 بخش ۴: چک‌لیست ۱۰ موردی آمادگی برای پایلوت (Pre-Pilot Checklist)

قبل از ارائه اپلیکیشن و پنل به مدرسه پایلوت، این ۱۰ مرحله باید کنترل و تأیید شوند:

| ردیف | شرح بررسی | وضعیت |
|---|---|---|
| **۱** | سلامت سرویس بک‌اند (`/health/live` و `/health/ready` پاسخ ۲۰۰ می‌دهند) | 🟩 تأیید |
| **۲** | فعال بودن ایزولاسیون چندمستاجری و اعتبارسنجی نقش‌ها (Zero-Trust) | 🟩 تأیید |
| **۳** | اتصال امن HTTPS بر روی تمام اندپوینت‌ها با گواهی SSL معتبر | 🟩 تأیید |
| **۴** | خروجی پشتیبان خودکار دیتابیس در مسیر `/var/backups/serviceyar` | 🟩 تأیید |
| **۵** | تنظیم نام و برند تجاری در `config/branding.ts` و فایل‌های راهنما | 🟩 تأیید |
| **۶** | تست موفق لاگین مدیر مدرسه با نقش `SCHOOL_ADMIN` و مسدودسازی دسترسی به سایر مدارس | 🟩 تأیید |
| **۷** | تست ثبت مانیفست راننده و کارکرد آفلاین اپلیکیشن اندروید راننده | 🟩 تأیید |
| **۸** | تست دریافت اعلان تغییر وضعیت دانش‌آموز در اپلیکیشن اولیا | 🟩 تأیید |
| **۹** | تست ایجاد و دانلود گزارش CSV لیست دانش‌آموزان با هدر UTF-8 BOM | 🟩 تأیید |
| **۱۰** | آزمون بار و ظرفیت‌سنجی بالای ۷۰۰ درخواست در ثانیه | 🟩 تأیید |

---

## 📌 بخش ۵: برنامه بازگشت اضطراری (Rollback Plan)

در صورت بروز خطای بحرانی در محیط عملیاتی، فرآیند بازگشت به این صورت اجرا می‌شود:
1. **بازگشت به ایمیج پایدار قبلی**:
   ```bash
   docker compose -f docker-compose.prod.yml rollback || docker compose -f docker-compose.prod.yml up -d --build
   ```
2. **بازیابی دیتابیس از آخرین فایل پشتیبان**:
   ```bash
   gunzip -c /var/backups/serviceyar/school_transport_backup_YYYYMMDD.sql.gz | docker exec -i serviceyar_pg_primary_prod psql -U school_user -d school_transport
   ```
3. **بررسی لاگ‌های رویدادها**:
   ```bash
   docker logs -f --tail=100 serviceyar_backend_api_prod
   ```
