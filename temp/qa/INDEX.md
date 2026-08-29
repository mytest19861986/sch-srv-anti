# جدول مرکزی شواهد و ممیزی کیفیت (QA Evidence Central Index — Protocol #71/#72/#73/#74)

**پلتفرم:** سامانه هوشمند مدیریت سرویس مدارس (سرویس‌یار)  
**مخزن گیت‌هاب:** [sch-srv-anti](https://github.com/mytest19861986/sch-srv-anti)  
**نسخه رسمی:** 📦 `v1.2.0`  

---

### 📊 جدول جامع شواهد و آرای مستقل جمینای (Gemini QA Verification Matrix)

| ردیف | شرح سناریو / فایل | لینک مستقیم فایل خام (Raw Link) | شرح ادعا (Caption) | رأی مستقل جمینای |
| :---: | :--- | :--- | :--- | :---: |
| **۱** | **بنر نصب اپلیکیشن روی گوشی** | [qa-074-pwa-install-banner.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-074-pwa-install-banner.png) | بنر اختصاصی نصب PWA («نصب اپلیکیشن روی گوشی») با دکمه تعاملی «نصب اپ» در بالای صفحه. | **CONFIRMED** |
| **۲** | **پنجره راهنمای گام‌به‌گام نصب** | [qa-074-pwa-install-guide-modal.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-074-pwa-install-guide-modal.png) | پنجره پاپ‌آپ راهنمای نصب مستقیم روی صفحه اصلی در مرورگر کروم موبایل. | **CONFIRMED** |
| **۳** | **داشبورد والدین با فرزندان واقعی** | [qa-073-parent-dashboard-rendered.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-parent-dashboard-rendered.png) | ورود موفق parent@serviceyar.ir و رندر زنده کارت فرزندان («علی احمدی» و «سارا احمدی») بدون اسپینر. | **CONFIRMED** |
| **۴** | **مانیفست تردد راننده** | [qa-073-driver-manifest-rendered.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-driver-manifest-rendered.png) | ورود موفق driver@serviceyar.ir و نمایش مانیفست زنده شیفت، دانش‌آموزان و دکمه‌های تردد. | **CONFIRMED** |
| **۵** | **بنر خطای شبکه با دکمه تلاش مجدد** | [qa-073-error-banner-persian.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-error-banner-persian.png) | نمایش بنر فارسی کاربرپسند هنگام خطا همراه با دکمه تعاملی «تلاش مجدد». | **CONFIRMED** |
| **۶** | **PWA بدون fetch error** | [qa-070-pwa-no-fetch-error.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-070-pwa-no-fetch-error.png) | گوشی → http://192.168.1.110:3004 صفحه لاگین تمیز بدون هیچ خطای fetch. | **CONFIRMED** |
| **۷** | **CSV در Downloads** | [qa-070-csv-in-downloads.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-070-csv-in-downloads.png) | پوشه Downloads با بنر تایید دانلود فایل serviceyar-events.csv با انکودینگ UTF-8 BOM. | **CONFIRMED** |

---

### 🔍 آرای خام و استدلال ممیز مستقل جمینای (Raw Gemini Verdicts)

#### 1. Evidence GQA-074-01 (PWA Install Banner):
- **Image:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-074-pwa-install-banner.png
- **Caption:** این تصویر بنر اختصاصی نصب PWA («نصب اپلیکیشن روی گوشی») را در بالای صفحه موبایل نشان می‌دهد.
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The top mobile banner visibly displays the "نصب اپلیکیشن روی گوشی" prompt with the interactive green install button.

#### 2. Evidence GQA-074-02 (PWA Install Guide Modal):
- **Image:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-074-pwa-install-guide-modal.png
- **Caption:** این تصویر پنجره راهنمای گام‌به‌گام نصب نسخه موبایل در بستر مرورگر کروم را نشان می‌دهد.
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The centered modal clearly displays the step-by-step Chrome installation guide ("افزودن به صفحه اصلی") for non-HTTPS local network contexts.
