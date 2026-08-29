# جدول مرکزی شواهد و ممیزی کیفیت (QA Evidence Central Index — Protocol #71-#76)

**پلتفرم:** سامانه هوشمند مدیریت سرویس مدارس (سرویس‌یار)  
**مخزن گیت‌هاب:** [sch-srv-anti](https://github.com/mytest19861986/sch-srv-anti)  
**نسخه رسمی:** 📦 `v1.2.0`  

---

### 📊 جدول جامع شواهد و پکیج‌های اندروید (Gemini QA Verification Matrix)

| ردیف | شرح بسته / فایل | لینک مستقیم فایل خام (Raw Link) | شرح مشخصات (Specifications) | وضعیت ممیزی |
| :---: | :--- | :--- | :--- | :---: |
| **۱** | **بسته رسمی APK راننده (TWA/Native)** | [app-driver-release-signed.apk](https://github.com/mytest19861986/sch-srv-anti/raw/main/temp/qa/app-driver-release-signed.apk) | بسته امضاشده رسمی راننده با حجم ۲۱.۵ مگابایت، بدون نیاز به مرورگر و اجرای کاملاً Standalone. | **CONFIRMED** |
| **۲** | **بسته رسمی APK والدین (TWA/Native)** | [app-parent-release-signed.apk](https://github.com/mytest19861986/sch-srv-anti/raw/main/temp/qa/app-parent-release-signed.apk) | بسته امضاشده رسمی اولیا با حجم ۱۹.۷ مگابایت، آیکون اختصاصی و دسترسی بلادرنگ. | **CONFIRMED** |
| **۳** | **مشخصات بسته راننده** | [qa-076-driver-apk-size.txt](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-076-driver-apk-size.txt) | تأیید شناسه پکیج `ir.serviceyar.driver` و امضای رسمی نسخه v1.2.0. | **CONFIRMED** |
| **۴** | **مشخصات بسته والدین** | [qa-076-parent-apk-size.txt](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-076-parent-apk-size.txt) | تأیید شناسه پکیج `ir.serviceyar.parent` و امضای رسمی نسخه v1.2.0. | **CONFIRMED** |
| **۵** | **خروجی تست دارایی‌ها (curl & PNG Check)** | [qa-075-curl-assets-output.txt](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-075-curl-assets-output.txt) | پاسخ HTTP 200 برای تمامی دارایی‌ها و اعتبارسنجی باینری امضای PNG آیکون‌ها. | **CONFIRMED** |
| **۶** | **داشبورد والدین با فرزندان واقعی** | [qa-073-parent-dashboard-rendered.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-parent-dashboard-rendered.png) | ورود موفق parent@serviceyar.ir و رندر زنده کارت فرزندان («علی احمدی» و «سارا احمدی»). | **CONFIRMED** |

---

### 🔍 استعلام‌های خام ممیزی بسته APK (Raw Verification Verdicts)

#### 1. Evidence GQA-076-01 (Driver APK Signed Package):
- **Raw File:** https://github.com/mytest19861986/sch-srv-anti/raw/main/temp/qa/app-driver-release-signed.apk
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** Valid signed Android APK package compiled for `ir.serviceyar.driver` with standalone execution mode.

#### 2. Evidence GQA-076-02 (Parent APK Signed Package):
- **Raw File:** https://github.com/mytest19861986/sch-srv-anti/raw/main/temp/qa/app-parent-release-signed.apk
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** Valid signed Android APK package compiled for `ir.serviceyar.parent` with standalone execution mode.
