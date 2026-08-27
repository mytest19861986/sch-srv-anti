# 🚌 School Transport Platform (سامانه جامع مدیریت سرویس مدارس)

An enterprise-grade, offline-first, multi-tenant school transport management platform built with high throughput event-sourcing principles, Zero-Trust multi-tenancy, and decoupled asynchronous notifications.

---

## ⚡ Quick Demo Launch (اجرای دمو فقط با Docker Desktop)

> [!NOTE]
> **تنها پیش‌نیاز سیستم**: نرم‌افزار **Docker Desktop**.  
> نصب Node.js، Bun یا هیچ وابستگی دیگری روی سیستم میزبان نیاز نیست (تمام سرویس‌ها، دیتابیس‌ها و داشبوردها به صورت کانتینری در داکر اجرا می‌شوند).

### 🚀 نحوه اجرا در ویندوز (Git Bash) / مک / لینوکس:

```bash
# 1. دریافت آخرین تغییرات مخزن
git clone https://github.com/mytest19861986/sch-srv-anti.git
cd sch-srv-anti

# 2. اجرای تک‌دستوری دمو
./demo.sh
```

---

### 📱 درگاه‌های دسترسی به وب و سرویس‌ها:

| سرویس / داشبورد | نشانی مرورگر (URL) | پورت | وضعیت |
| :--- | :--- | :--- | :--- |
| 🏫 **داشبورد مدیریت مدرسه (School Web)** | [http://localhost:3001](http://localhost:3001) | `3001` | ✅ کانتینری‌شده |
| 🏢 **پنل راهبری مرکزی (Super Admin)** | [http://localhost:3002](http://localhost:3002) | `3002` | ✅ کانتینری‌شده |
| 🛡️ **درگاه ارتباطی Nginx Reverse Proxy** | [http://localhost:80](http://localhost:80) | `80` | ✅ لود بالانسر |
| 🚀 **سرویس مستقیم Backend API** | [http://localhost:3000](http://localhost:3000) | `3000` | ✅ Fastify / Bun |
| 📦 **شبیه‌ساز ذخیره‌سازی ابری LocalStack** | [http://localhost:4567](http://localhost:4567) | `4567` | ✅ S3 Emulator |

---

### 🔑 اطلاعات ورود کاربران دمو (فقط برای تست محلی):

| نقش کاربری | نام کاربری (Email) | کلمه عبور | دسترسی‌ها |
| :--- | :--- | :--- | :--- |
| 🛡️ **Super Admin** | `super-admin@platform.ir` | `Demo@1234` | مدیریت کل مدارس، کاربران، تننت‌ها و لاگ‌ها |
| 🏫 **School Admin** | `school-admin@demo.ir` | `Demo@1234` | مانیتورینگ زنده سرویس‌ها، غیبت‌ها و بنر Stale |
| 🚐 **Driver** | `driver@demo.ir` | `Demo@1234` | دریافت مانیفست و ثبت سوار/پیاده شدن |
| 👨‍👩‍👧 **Parent** | `parent@demo.ir` | `Demo@1234` | مشاهده تایم‌لاین زنده و وضعیت فرزندان |

---

### ⏹️ دستورات مدیریت دمو:
- **توقف سرویس‌ها**: `./demo.sh stop`
- **ریست کامل دیتابیس و کانتینرها**: `./demo.sh reset`

---

## 🧪 تست و اعتبارسنجی خودکار

```bash
# تست اعتبارسنجی لاگین ۴ کاربر دمو و پروب‌های سلامت (۸ تست)
bun test tests/e2e/demo-verification.test.ts

# تست جامع سناریوهای سرتاسری E2E (۸ تست)
bun test tests/e2e/e2e-scenarios.test.ts

# تست‌های یکپارچگی بک‌اند (۵۲ تست)
bun test services/backend-api

# تست‌های پکیج‌های اشتراکی مونو‌ریپو (۷ تست)
bun test packages/i18n packages/auth packages/api-client
```

---

## 📚 مستندات کامل مهندسی
- 📖 [راهنمای جامع اتصال اعتبارنامه‌های واقعی (Wire-Up Guide)](docs/WIRE_UP_GUIDE.md)
- 📋 [چک‌لیست تحویل نهایی پلتفرم (Handoff Checklist)](docs/HANDOFF_CHECKLIST.md)
- 🚀 [مستندات استقرار Production و SRE Runbooks](docs/DEPLOYMENT.md)
