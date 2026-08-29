# راهنمای جامع بیلد رسمی اپلیکیشن‌های اندروید با Android Studio
**پلتفرم:** سامانه هوشمند مدیریت سرویس مدارس (سرویس‌یار)  
**نسخه رسمی:** 📦 `v1.2.0`  

---

## 📋 ۱. پیش‌نیازها
1. **نصب Android Studio:** نسخه Iguana / Jellyfish یا جدیدتر از [سایت رسمی توسعه‌دهندگان گوگل](https://developer.android.com/studio).
2. **فضای دیسک:** حداقل ۴ گیگابایت فضای خالی جهت دانلود وابستگی‌های Gradle.
3. **اینترنت آزاد/DNS:** در اولین اجرای پروژه، Gradle نیاز به دانلود وابستگی‌های گوگل و Maven Central دارد. در صورت وجود تحریم شبکه، تنظیم DNS شکن (`178.22.122.100` / `185.51.200.2`) یا الکترو توصیه می‌شود.

---

## 🚀 ۲. مراحل گام‌به‌گام بیلد APK راننده (`driver-android`)

1. برنامه **Android Studio** را باز کنید.
2. از صفحه خوش‌آمدگویی یا منوی بالا گزینه **File ➔ Open** را انتخاب کنید.
3. پوشه پروژه راننده را باز کنید:
   ```text
   G:\project\TEST\1\apps\driver-android
   ```
4. منتظر بمانید تا فرآیند **Gradle Sync** به پایان برسد (در اولین بار ۲ تا ۵ دقیقه طول می‌کشد).
5. از نوار منوی بالای صفحه، روی مسیر زیر کلیک کنید:
   ```text
   Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)
   ```
6. پس از اتمام کامپایل، پیام نوتیفیکیشن آبی رنگ **APK(s) generated successfully** در گوشه پایین ظاهر می‌شود. روی گزینه **locate** کلیک کنید.
7. فایل خروجی تولیدشده در مسیر زیر قرار دارد:
   ```text
   apps\driver-android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## 👨‍👩‍👧 ۳. مراحل بیلد APK والدین (`parent-android`)

1. در Android Studio گزینه **File ➔ Open** را بزنید.
2. پوشه والدین را انتخاب کنید:
   ```text
   G:\project\TEST\1\apps\parent-android
   ```
3. مراحل `Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)` را اجرا کنید.
4. خروجی در مسیر زیر تولید می‌شود:
   ```text
   apps\parent-android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## 🛠️ ۴. جدول خطاهای رایج و راه‌حل‌ها

| کد / نوع خطا | علت اصلی | راه‌حل فوری |
| :--- | :--- | :--- |
| **SDK License not accepted** | لایسنس SDK در سیستم تایید نشده | اجرای `sdkmanager --licenses` در تب Terminal |
| **Connection Timed Out (Maven/Google)** | اختلال دسترسی به سرورهای گوگل | تنظیم DNS شکن روی سیستم‌عامل |
| **Unsupported class file version** | نسخه جاوای متفرقه | در تنظیمات Android Studio: `Settings ➔ Build, Execution, Deployment ➔ Build Tools ➔ Gradle ➔ Gradle JDK` را روی `Embedded JDK 17` قرار دهید. |

---

## 📡 ۵. پروتکل رله خطا به فرمانده (Error Relay Protocol)
اگر در حین Sync یا Build با هرگونه خطایی در تب **Build** یا **Logcat** مواجه شدید:
1. کل متن خطا را کپی نمایید.
2. در چت فرمانده ارسال کنید.
3. معمار ارشد (فرمانده) دستور رفع را صادر کرده، کد بلافاصله اصلاح و کامیت می‌شود و شما با یک `git pull` ساده بیلد نهایی را دریافت خواهید کرد.
