# لاگ رفع خطاهای بیلد اندروید (Android Build Fix Log)

این سند لاگ تمامی اصلاحات انجام‌شده در پروژه‌های کاتلین/اندروید بر اساس بازخوردها و خطاهای دریافتی را ثبت می‌کند.

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
