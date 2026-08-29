# جدول مرکزی شواهد و ممیزی کیفیت (QA Evidence Central Index — Protocol #71-#75)

**پلتفرم:** سامانه هوشمند مدیریت سرویس مدارس (سرویس‌یار)  
**مخزن گیت‌هاب:** [sch-srv-anti](https://github.com/mytest19861986/sch-srv-anti)  
**نسخه رسمی:** 📦 `v1.2.0`  

---

### 📊 جدول جامع شواهد و آرای مستقل جمینای (Gemini QA Verification Matrix)

| ردیف | شرح سناریو / فایل | لینک مستقیم فایل خام (Raw Link) | شرح ادعا (Caption) | رأی مستقل جمینای |
| :---: | :--- | :--- | :--- | :---: |
| **۱** | **خروجی خام تست دارایی‌ها (curl & PNG Check)** | [qa-075-curl-assets-output.txt](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-075-curl-assets-output.txt) | بازرسی خروجی واقعی curl و پاسخ HTTP 200 برای تمام دارایی‌ها و اعتبارسنجی باینری امضای PNG آیکون‌ها. | **CONFIRMED** |
| **۲** | **وضعیت فعال Service Worker** | [qa-075-sw-status.txt](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-075-sw-status.txt) | بازرسی وضعیت رجیستری Service Worker با وضعیت `activated`، اسکوپ روت و کانفیگ Standalone. | **CONFIRMED** |
| **۳** | **ممیزی استاندارد PWA Audit** | [qa-075-pwa-audit.json](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-075-pwa-audit.json) | ممیزی کامل انطباق با استانداردهای PWA Installability و عبور از کلیه دروازه‌های کیفیت. | **CONFIRMED** |
| **۴** | **بنر نصب اپلیکیشن روی گوشی** | [qa-074-pwa-install-banner.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-074-pwa-install-banner.png) | بنر اختصاصی نصب PWA («نصب اپلیکیشن روی گوشی») با دکمه تعاملی «نصب اپ» در بالای صفحه. | **CONFIRMED** |
| **۵** | **داشبورد والدین با فرزندان واقعی** | [qa-073-parent-dashboard-rendered.png](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-073-parent-dashboard-rendered.png) | ورود موفق parent@serviceyar.ir و رندر زنده کارت فرزندان («علی احمدی» و «سارا احمدی») بدون اسپینر. | **CONFIRMED** |

---

### 🔍 استعلام‌های خام جمینای (Raw Gemini Verdicts)

#### 1. Evidence GQA-075-01 (Curl & PNG Asset Verification):
- **Raw File:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-075-curl-assets-output.txt
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** All manifest and PNG icon assets returned HTTP 200 OK with verified PNG magic byte signatures and exact 192x192 / 512x512 dimensions.

#### 2. Evidence GQA-075-02 (Service Worker Status):
- **Raw File:** https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/temp/qa/qa-075-sw-status.txt
- **Gemini Verdict:** `CONFIRMED`
- **Reason:** The Service Worker is verified with scope `/` and active state `activated`.
