# لاگ رفع خطاهای بیلد اندروید (Android Build Fix Log)

این سند لاگ تمامی اصلاحات انجام‌شده در پروژه‌های کاتلین/اندروید بر اساس بازخوردها و خطاهای دریافتی را ثبت می‌کند.

> [!IMPORTANT]
> **دستورالعمل الزامی پس از آپدیت سورس‌کد:**  
> پس از هر `git pull`، حتماً `./demo.sh` (یا `python launcher.py`) دوباره اجرا شود تا آخرین تغییرات سرور اعمال گردد.

---

### 📋 جدول تاریخچه اصلاحات (Fix History)

| شناسه ردیف | تاریخ | خطا | علت | رفع | وضعیت نهایی |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **FIX-001** | 2026-08-29 | ارتقای تطابق با Android 14 و Gradle 8.6 | نیازمندی به استانداردهای مدرن | بررسی پرمیشن‌ها، exported flags و تنظیم سازگاری با Java 17 | ✅ **VERIFIED** |
| **FIX-002** | 2026-08-29 | خطای Script compilation error در WorkManager | ارجاع با کاراکتر خط تیره | اصلاح سینتکس `libs.androidx.work.runtime.ktx` در `build.gradle.kts` | ✅ **VERIFIED** |
| **FIX-003** | 2026-08-29 | AndroidX not enabled + OutOfMemoryError + Wrapper missing + namespace mismatch | gradle.properties نبود، تنظیمات در wrapper بودند، namespace≠پکیج | ایجاد gradle.properties، پاکسازی wrapper، تفکیک namespace/applicationId | ✅ **VERIFIED** |
| **FIX-004** | 2026-08-29 | اتصال به سرور محلی در Pilot خانگی | هاردکد بودن آدرس و بلاک شدن HTTP | افزودن آدرس سرور قابل تنظیم + cleartext traffic + ApiClient داینامیک | ✅ **VERIFIED** |
| **FIX-007** | 2026-08-29 | بلاک شدن ترافیک HTTP در برخی نسخه‌های اندروید | نبود پیکربندی امنیت شبکه | ایجاد network_security_config.xml + اتصال به AndroidManifest + لاگ دیباگ | ✅ **VERIFIED** |
| **FIX-008** | 2026-08-29 | ابهام در تشخیص خطاهای اتصال و URL واقعی | عدم وجود ابزار تست درون‌برنامه‌ای | افزودن جعبه تشخیص اتصال + پیش‌چک سلامت `/health/live` + برچسب FIX-008 در UI | ✅ **VERIFIED** |
| **FIX-009** | 2026-08-29 | کرش یا خطای پارس پس از لاگین | عدم تطابق کلیدهای tenant_id/tenantId و فیلدهای غیر Nullable | افزودن tenant_id و tenantId در روت و DTOها + نال‌سیفی SharedPreferences + تفکیک خطاها | ✅ **VERIFIED** |
| **FIX-010** | 2026-08-29 | عدم تطابق برخی مسیرهای API اپ با بک‌اند | تفاوت نام فیلدها و مسیرهای ثبت رویداد و والدین | تطبیق کامل روت‌های راننده و والدین + پاس شدن ۱۰۰٪ تست قرارداد Order 86 | ✅ **VERIFIED** |
| **FIX-011** | 2026-08-29 | تضمین رندر مانیفست و تایملاین در سرور زنده | نیاز به داده‌های داینامیک و نشان بیلد زنده | افزودن `build: FIX-011` به `/health/live` + به‌روزرسانی برچسب نسخه UI + راهنمای ری‌استارت بعد git pull | ✅ **VERIFIED** |

---

### 📝 قالب ثبت خطاهای جدید (Template for New Fixes):
```markdown
### [FIX-XXX] - تاریخ: YYYY/MM/DD
- **پروژه:** driver-android / parent-android
- **متن خام خطا:** `...`
- **ریشه‌یابی:** ...
- **فایل‌های تغییر یافته:** ...
- **کامیت شناسه:** ...
```
