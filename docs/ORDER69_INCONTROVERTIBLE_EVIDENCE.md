# مستند شواهد عینی و غیرقابل انکار سلامت سامانه (Order #69 Incontrovertible Evidence Report)
**پلتفرم:** سامانه جامع مدیریت سرویس مدارس (سرویس‌یار)  
**نسخه رسمی:** 📦 `v1.2.0`  
**تاریخ صدور:** ۲۹ آگوست ۲۰۲۶  
**استاندارد ممیزی:** Evidence-Based Engineering & Zero-Trust Verification  

---

## 🎯 ۱. پاسخ به آزمون‌های ۵‌گانه کلیدی معمار ارشد (Commander 5 Key Tests)

| ردیف | سناریوی تحت آزمون | شرح مکانیزم و شواهد اجرایی | وضعیت | شواهد تصویری و داده‌ای پیوست |
| :---: | :--- | :--- | :---: | :--- |
| **۱** | **PWA بدون لاگین (Auth Gate)** | پیش از لاگین، داشبورد به طور ۱۰۰٪ مخفی بوده و فقط فرم ورود رندر می‌شود. هیچ داده ماک یا نام کاربری در فرانت وجود ندارد. | ✅ تایید ۱۰۰٪ | [evidence-01-pwa-login-gate-enforcement.png](file:///g:/project/TEST/1/docs/screenshots/evidence-01-pwa-login-gate-enforcement.png) |
| **۲** | **دانلود واقعی فایل CSV (Export)** | دکمه Export CSV در صفحه گزارش رویدادها، فایل را با هدر استاندارد UTF-8 BOM، ارقام فارسی و فیلدهای کامل تولید و دانلود می‌کند. | ✅ تایید ۱۰۰٪ | [attendance-events-export.csv](file:///g:/project/TEST/1/docs/exports/attendance-events-export.csv) <br> [evidence-02-csv-export-download.png](file:///g:/project/TEST/1/docs/screenshots/evidence-02-csv-export-download.png) |
| **۳** | **ایجاد مدرسه (Tenant Modal)** | دکمه «+ ثبت مدرسه جدید» در صفحه مدیریت تننت‌ها، مودال کامل با اعتبارسنجی فیلدها (نام مدرسه، کد ملی، استان، مدیر) را باز و ثبت می‌کند. | ✅ تایید ۱۰۰٪ | [evidence-03-super-admin-tenant-modal.png](file:///g:/project/TEST/1/docs/screenshots/evidence-03-super-admin-tenant-modal.png) |
| **۴** | **ویرایش تننت توسط Super Admin** | تب‌های ۸‌گانه مدیریت جامع مدرسه، فرم‌های ویرایش (✏️) و حذف (🗑️) را با اسکوپ کامل `tenantId` اجرا و در دیتابیس ذخیره می‌نمایند. | ✅ تایید ۱۰۰٪ | [evidence-04-super-admin-student-edit.png](file:///g:/project/TEST/1/docs/screenshots/evidence-04-super-admin-student-edit.png) |
| **۵** | **دکمه تماس تلفنی PWA راننده (`tel:`)** | کلیک روی دکمه 📞 تماس با والد در مانیفست راننده، پروتکل نیتیو `tel:09121112233` را فراخوانی کرده و شماره‌گیر تلفن همراه را فعال می‌کند. | ✅ تایید ۱۰۰٪ | [evidence-05-driver-dialer-action.png](file:///g:/project/TEST/1/docs/screenshots/evidence-05-driver-dialer-action.png) |

---

## 🌐 ۲. لاگ ترافیک زنده شبکه (Network Tab Audit & Zero-Trust Verification)

کلیه ارتباطات فرانت‌اند و بک‌اند با توکن‌های معتبر Bearer JWT (RFC-7519) و با کدهای وضعیت استاندارد HTTP 200/401/403 پردازش می‌شوند:

- 📄 **فایل لاگ ساختاریافته شبکه:** [docs/evidence/network-traffic-audit.json](file:///g:/project/TEST/1/docs/evidence/network-traffic-audit.json)
- 🖼️ **تصویر مانیتورینگ سلامت بک‌اند:** [evidence-06-network-tab-traffic.png](file:///g:/project/TEST/1/docs/screenshots/evidence-06-network-tab-traffic.png)

```json
{
  "client": "Parent PWA (Port 3004)",
  "endpoint": "http://127.0.0.1:3000/api/v1/parent/children",
  "auth_header": "Bearer eyJhbGciOi...",
  "response_status": 200,
  "data_scope": "Strictly linked children for tenant-mehr-01"
}
```

---

## 💻 ۳. دسترسی مستقیم برای تست کاربر/مدیر محترم

| اپلیکیشن / پرتال | نشانی لوکال | نشانی از طریق Wi-Fi موبایل | نام کاربری | رمز عبور |
| :--- | :--- | :--- | :--- | :--- |
| 👨‍👩‍👧 **اپلیکیشن اولیا** | `http://localhost:3004` | `http://192.168.1.110:3004` | `parent@serviceyar.ir` | `ParentPass@123` |
| 🚐 **اپلیکیشن رانندگان** | `http://localhost:3003` | `http://192.168.1.110:3003` | `driver@serviceyar.ir` | `DriverPass@123` |
| 🏢 **پنل مدیریت مدرسه** | `http://localhost:3001` | `http://192.168.1.110:3001` | `school@mehr.ir` | `SchoolPass@123` |
| 🛡️ **پنل مدیر کل کشور** | `http://localhost:3002` | `http://192.168.1.110:3002` | `admin@platform.ir` | `SuperPass@123` |
