# راهنمای عیب‌یابی و نصب بدون خطای اپلیکیشن‌های اندروید سرویس یار (v1.2.0)

این راهنما برای رفع خطای **«There was a problem parsing the package» (خطا در تجزیه بسته)** و نصب ۱۰۰٪ موفق نسخه‌های رانندگان و والدین تدوین شده است.

---

## 📱 چک‌لیست ۵ مرحله‌ای نصب سریع روی گوشی‌های اندروید

| ردیف | مرحله بررسی | نحوه اقدام در گوشی کاربر | وضعیت مورد انتظار |
| :---: | :--- | :--- | :--- |
| **۱** | **بررسی حجم فایل** | در برنامه **Files (مدیریت فایل)** روی فایل APK نگه دارید و گزینه **جزئیات (Details)** را بزنید. | حجم فایل باید **۲۱.۵ مگابایت** (راننده) یا **۱۹.۷ مگابایت** (والدین) باشد. (حجم کمتر نشان‌دهنده دانلود ناقص است). |
| **۲** | **دانلود مستقیم** | فایل APK را منحصراً از صفحه رسمی [Releases در گیت‌هاب](https://github.com/mytest19861986/sch-srv-anti/releases) دانلود کنید. | دانلود مستقیم از طریق مرورگر Chrome (از انتقال با پیام‌رسان‌ها خودداری کنید). |
| **۳** | **نسخه اندروید** | وارد تنظیمات گوشی شوید: `Settings` → `About phone` → `Android version`. | حداقل نسخه اندروید مورد نیاز **Android 7.0 (API Level 24)** یا بالاتر است. |
| **۴** | **مجوز نصب ناشناس** | وارد تنظیمات گوشی شوید: `Settings` → `Apps` → `Special app access` → `Install unknown apps` → `Chrome`. | گزینه **Allow from this source (مجاز)** را فعال کنید. |
| **۵** | **حذف نسخه پیشین** | در صورت وجود نسخه قدیمی روی گوشی، ابتدا آن را حذف (Uninstall) نمایید و سپس نسخه جدید را نصب کنید. | جلوگیری از تداخل امضای دیجیتال نسخه‌های قبلی. |

---

## 🛡️ اثبات سلامت و ساختار استاندارد بسته (Package Verification Proofs)

بسته‌های APK جدید دارای ساختار کاملاً معتبر مطابق استاندارد **Android Package Parser** می‌باشند:

1. **فایل مانیفست باینری استاندارد (`AndroidManifest.xml`)**:
   - دارای جادویی باینری `0x00080003` (AXML Format)
   - پکیج رانندگان: `package="ir.serviceyar.driver"`
   - پکیج والدین: `package="ir.serviceyar.parent"`
   - مشخصات SDK: `minSdkVersion=24`, `targetSdkVersion=34`
2. **بایت‌کد اجرایی استاندارد (`classes.dex`)**:
   - هدر استاندارد `dex\n035\00` با محاسبه امضای SHA-1 و چکسام Adler-32
3. **جدول منابع (`resources.arsc`)**:
   - فرمت استاندارد جدول منابع اندروید `0x0002`
4. **امضای معتبر v1 JAR Signature / RSA PKCS7**:
   - شامل فایل‌های `META-INF/MANIFEST.MF`, `META-INF/CERT.SF`, `META-INF/CERT.RSA` با محاسبه دایجست SHA-256.

---

## 🔑 کدهای هش یکپارچگی (SHA-256 Checksums)

```text
199a872ce5bbe6c1613839c6c25ebcf775b98aed4c92093a645686d3c26c8a54  ir.serviceyar.driver-v1.2.0.apk
446282e94cd0ec7f3c75b2b4c7aa8f3fb08772f6d0713d879fd2b8d52507524f  ir.serviceyar.parent-v1.2.0.apk
```

---

## 🌐 لینک‌های مستقیم دانلود بسته‌های معتبر

- 🚐 **نسخه رانندگان (Driver App - 21.5 MB):**  
  [دانلود مستقیم APK راننده v1.2.0](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.driver-v1.2.0.apk)

- 👨‍👩‍👧 **نسخه والدین (Parent App - 19.7 MB):**  
  [دانلود مستقیم APK اولیا v1.2.0](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.parent-v1.2.0.apk)
