# جدول مرکزی شواهد و ممیزی کیفیت (QA Evidence Central Index — Protocol #71-#78)

**پلتفرم:** سامانه هوشمند مدیریت سرویس مدارس (سرویس‌یار)  
**مخزن گیت‌هاب:** [sch-srv-anti](https://github.com/mytest19861986/sch-srv-anti)  
**نسخه رسمی:** 📦 `v1.2.0`  

---

### 📊 جدول جامع مستندات فنی و راهنماهای استقرار (Technical Matrix)

| ردیف | شرح مستند / شواهد | لینک مستقیم فایل خام (Raw Link) | شرح و هدف سند | وضعیت |
| :---: | :--- | :--- | :--- | :---: |
| **۱** | **راهنمای بیلد با Android Studio** | [ANDROID_STUDIO_BUILD_GUIDE.md](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/ANDROID_STUDIO_BUILD_GUIDE.md) | راهنمای گام‌به‌گام بیلد نیتیو APK برای راننده و والدین، رفع خطاهای رایج و تنظیمات JDK 17. | ✅ **CONFIRMED** |
| **۲** | **لاگ رفع خطاهای بیلد اندروید** | [ANDROID_BUILD_FIXLOG.md](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/ANDROID_BUILD_FIXLOG.md) | پروتکل ثبت و رله خطاهای دریافتی از محیط بیلد کلاینت و اصلاحات اعمال‌شده. | ✅ **CONFIRMED** |
| **۳** | **گزارش Dry-Run پروداکشن** | [PROD_DRYRUN_REPORT.md](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/PROD_DRYRUN_REPORT.md) | شبیه‌سازی کامل استک پروداکشن (Fastify + Nginx SSL + Multi-Tenancy DB + Redis) با نتیجه ALL GREEN. | ✅ **CONFIRMED** |
| **۴** | **ران‌بوک ۶۰ دقیقه‌ای استقرار** | [PROD_DEPLOYMENT_RUNBOOK_60MIN.md](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/PROD_DEPLOYMENT_RUNBOOK_60MIN.md) | راهنمای کامل استقرار از خرید سرور ابری (2C/4G) تا لانچ دامنه و فعال‌سازی SSL. | ✅ **CONFIRMED** |
| **۵** | **خروجی تست دارایی‌ها (curl & PNG Check)** | [qa-075-curl-assets-output.txt](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-075-curl-assets-output.txt) | پاسخ HTTP 200 برای دارایی‌ها و اعتبارسنجی باینری امضای PNG آیکون‌ها. | ✅ **CONFIRMED** |

---

### 🛡️ سیاست رسمی بسته‌های اندروید (Android APK Policy):
- سورس‌کدهای پروژه‌های اندروید در `apps/driver-android` و `apps/parent-android` به صورت کامل و ۱۰۰٪ استاندارد جهت کامپایل مستقیم با Android Studio آماده‌سازی گردیده‌اند.
