# جدول مرکزی شواهد و ممیزی کیفیت (QA Evidence Central Index — Protocol #71/72)

**پلتفرم:** سامانه هوشمند مدیریت سرویس مدارس (سرویس‌یار)  
**مخزن گیت‌هاب:** [sch-srv-anti](https://github.com/mytest19861986/sch-srv-anti)  
**نسخه رسمی:** 📦 `v1.2.0`  

---

### 📊 جدول جامع شواهد و آرای مستقل جمینای (Gemini QA Verification Matrix)

| ردیف | شرح سناریو / فایل | لینک مستقیم فایل خام (Raw Link) | شرح ادعا (Caption) | رأی مستقل جمینای |
| :---: | :--- | :--- | :--- | :---: |
| **۱** | **PWA بدون fetch error** | [qa-070-pwa-no-fetch-error.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-070-pwa-no-fetch-error.png) | گوشی → http://192.168.1.110:3004 باید صفحه لاگین تمیز بدون هیچ خطای fetch نشان دهد. | **CONFIRMED** |
| **۲** | **CSV در Downloads** | [qa-070-csv-in-downloads.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-070-csv-in-downloads.png) | پوشه Downloads با بنر تایید دانلود فایل serviceyar-events.csv با انکودینگ UTF-8 BOM. | **CONFIRMED** |
| **۳** | **ورود موفق به داشبورد والدین** | [qa-072-pwa-login-dashboard-success.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-072-pwa-login-dashboard-success.png) | ورود موفق با parent@serviceyar.ir و رندر زنده فرزندان («علی احمدی» و «سارا احمدی») بدون ماک. | **CONFIRMED** |

---

### 🔍 آرای خام و استدلال ممیز مستقل جمینای (Raw Gemini Verdicts)

#### 1. Evidence GQA-01:
- **Image:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-070-pwa-no-fetch-error.png
- **Caption:** این تصویر پس از باز کردن http://192.168.1.110:3004 روی گوشی گرفته شده و باید صفحه لاگین تمیز بدون هیچ خطای fetch نشان دهد.
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The rendered UI shows a completely clean, responsive Persian login screen with zero error banners, proper branding, and active input controls.

#### 2. Evidence GQA-02:
- **Image:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-070-csv-in-downloads.png
- **Caption:** این تصویر پس از کلیک روی Export CSV گرفته شده و باید صفحه گزارش‌ها با بنر تایید دانلود فایل serviceyar-events.csv در پوشه Downloads را نشان دهد.
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The green success banner confirming the programmatic download of serviceyar-events.csv with UTF-8 BOM is prominently visible on the UI.

#### 3. Evidence GQA-03:
- **Image:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-072-pwa-login-dashboard-success.png
- **Caption:** این تصویر پس از ورود موفق با حساب کاربری والدین در PWA روی گوشی گرفته شده و باید داشبورد اختصاصی اولیا را نشان دهد.
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The mobile UI renders the authenticated parent dashboard with live linked children cards ("علی احمدی" and "سارا احمدی") and real timeline status.
