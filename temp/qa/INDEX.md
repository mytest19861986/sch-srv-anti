# جدول مرکزی شواهد و ممیزی کیفیت (QA Evidence Central Index — Protocol #71/#72/#73)

**پلتفرم:** سامانه هوشمند مدیریت سرویس مدارس (سرویس‌یار)  
**مخزن گیت‌هاب:** [sch-srv-anti](https://github.com/mytest19861986/sch-srv-anti)  
**نسخه رسمی:** 📦 `v1.2.0`  

---

### 📊 جدول جامع شواهد و آرای مستقل جمینای (Gemini QA Verification Matrix)

| ردیف | شرح سناریو / فایل | لینک مستقیم فایل خام (Raw Link) | شرح ادعا (Caption) | رأی مستقل جمینای |
| :---: | :--- | :--- | :--- | :---: |
| **۱** | **داشبورد والدین با فرزندان واقعی** | [qa-073-parent-dashboard-rendered.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-parent-dashboard-rendered.png) | ورود موفق parent@serviceyar.ir و رندر زنده کارت فرزندان («علی احمدی» و «سارا احمدی») بدون گیر کردن اسپینر. | **CONFIRMED** |
| **۲** | **مانیفست تردد راننده** | [qa-073-driver-manifest-rendered.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-driver-manifest-rendered.png) | ورود موفق driver@serviceyar.ir و نمایش مانیفست زنده شیفت، دانش‌آموزان و دکمه‌های تردد. | **CONFIRMED** |
| **۳** | **بنر خطای شبکه با دکمه تلاش مجدد** | [qa-073-error-banner-persian.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-error-banner-persian.png) | نمایش بنر فارسی کاربرپسند هنگام خطا همراه با دکمه تعاملی «تلاش مجدد». | **CONFIRMED** |
| **۴** | **PWA بدون fetch error** | [qa-070-pwa-no-fetch-error.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-070-pwa-no-fetch-error.png) | گوشی → http://192.168.1.110:3004 صفحه لاگین تمیز بدون هیچ خطای fetch. | **CONFIRMED** |
| **۵** | **CSV در Downloads** | [qa-070-csv-in-downloads.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-070-csv-in-downloads.png) | پوشه Downloads با بنر تایید دانلود فایل serviceyar-events.csv با انکودینگ UTF-8 BOM. | **CONFIRMED** |

---

### 🔍 آرای خام و استدلال ممیز مستقل جمینای (Raw Gemini Verdicts)

#### 1. Evidence GQA-073-01 (Parent Dashboard Rendered):
- **Image:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-parent-dashboard-rendered.png
- **Caption:** این تصویر پس از ورود موفق با حساب کاربری والدین (parent@serviceyar.ir) در PWA روی گوشی گرفته شده و داشبورد زنده اولیا با کارت فرزندان («علی احمدی» و «سارا احمدی»)، وضعیت تردد و دکمه‌های تماس و اعلام مرخصی را نشان می‌دهد.
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The mobile UI visibly renders the authenticated parent dashboard with cards for linked children ("علی احمدی" and "سارا احمدی"), real status tags, and action buttons without any stalled spinner.

#### 2. Evidence GQA-073-02 (Driver Manifest Rendered):
- **Image:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-driver-manifest-rendered.png
- **Caption:** این تصویر پس از ورود با حساب راننده (driver@serviceyar.ir) در PWA روی گوشی گرفته شده و مانیفست زنده دانش‌آموزان مسیر، دکمه‌های تردد «سوار شد» و تماس تلفنی با والد را نشان می‌دهد.
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The driver view displays the active shift manifest with student rows, quick action status buttons, and phone call triggers.

#### 3. Evidence GQA-073-03 (Persian Error Banner with Retry):
- **Image:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-error-banner-persian.png
- **Caption:** این تصویر هنگام مواجهه با خطای اعتبارسنجی یا شبکه در PWA روی گوشی گرفته شده و بنر خطای فارسی کاربرپسند همراه با دکمه تعاملی «تلاش مجدد» را نشان می‌دهد.
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The error banner cleanly renders the localized Persian message alongside the retry button.
