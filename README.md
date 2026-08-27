# سرویس یار — سامانه جامع هوشمند مدیریت ناوگان سرویس مدارس

[![Build & Test Status](https://img.shields.io/badge/tests-97%20passed-success)](https://github.com/mytest19861986/sch-srv-anti)
[![Release Version](https://img.shields.io/badge/release-v1.0.0--alpha-blue)](https://github.com/mytest19861986/sch-srv-anti/releases/tag/v1.0.0)
[![Architecture](https://img.shields.io/badge/architecture-Zero--Trust%20Multi--Tenant-purple)](docs/ARCHITECTURE.md)

**سرویس یار** یک پلتفرم جامع، چندمستاجری (Multi-Tenant) و بلادرنگ برای مدیریت یکپارچه رفت‌وآمد دانش‌آموزان، مانیتورینگ زنده ناوگان، اطلاع‌رسانی پیامکی و نوتیفیکیشن به والدین و کنترل مالی/حسابداری سرویس مدارس است.

---

## 📦 دانلود مستقیم نسخه‌های رسمی (Official Downloads v1.0.0)

| محصول | فرمت | لینک دانلود مستقیم |
|---|---|---|
| 🚐 **اپلیکیشن راننده** | APK | [دانلود مستقیم ir.serviceyar.driver-v1.0.0.apk](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.driver-v1.0.0.apk) |
| 👨‍👩‍👧 **اپلیکیشن والدین** | APK | [دانلود مستقیم ir.serviceyar.parent-v1.0.0.apk](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/ir.serviceyar.parent-v1.0.0.apk) |
| 🎬 **ویدئوی دموی رسمی** | MP4 | [دانلود مستقیم demo-video.mp4](https://raw.githubusercontent.com/mytest19861986/sch-srv-anti/main/docs/releases/demo-video.mp4) |
| 🏷️ **صفحه رسمی Release** | GitHub | [مشاهده Release v1.0.0](https://github.com/mytest19861986/sch-srv-anti/releases/tag/v1.0.0) |

---

## ⚡ راه‌اندازی سریع (Quick Start)

### ۱. اجرای یکپارچه با Docker Compose
```bash
# کلون پروژه و راه‌اندازی تمام سرویس‌ها
git clone https://github.com/mytest19861986/sch-srv-anti.git
cd sch-srv-anti
docker compose -f docker-compose.dev.yml up --build -d
```

### ۲. اجرای مستقیم با Bun / Node.js
```bash
# نصب وابستگی‌ها
bun install

# اجرای بک‌اند API
cd services/backend-api && bun run dev

# اجرای پنل وب مدرسه (پورت ۳۰۰۱)
cd apps/school-web && bun run dev

# اجرای پنل وب مدیر کل پلتفرم (پورت ۳۰۰۰)
cd apps/super-admin-web && bun run dev
```

---

## 🔑 اعتبارنامه‌های حساب‌های پیش‌فرض دمو (Demo Credentials)

| نقش کاربری | نام کاربری / ایمیل | رمز عبور | دسترسی مجاز |
|---|---|---|---|
| 🛡️ **مدیر کل (Super Admin)** | `admin@platform.ir` | `SuperPass@123` | پنل راهبری کلان کشوری (`/tenants`, `/audit-logs`) |
| 🏢 **مدیر مدرسه (School Admin)** | `school@mehr.ir` | `SchoolPass@123` | پنل مدرسه (`/students`, `/parents`, `/drivers`, `/routes`) |
| 🚐 **راننده (Driver)** | `driver@serviceyar.ir` | `DriverPass@123` | اپلیکیشن اندروید راننده و مانیفست تردد |
| 👨‍👩‍👧 **ولی دانش‌آموز (Parent)** | `parent@serviceyar.ir` | `ParentPass@123` | اپلیکیشن اندروید والدین و وضعیت زنده سرویس |

---

## 🏗️ نقشه مستندات فنی و ساختار پروژه (Documentation Map)

- 📐 [معماری سیستم و الگوهای ایزولاسیون تننت](docs/ARCHITECTURE.md)
- 🔐 [مستندات احراز هویت و Zero-Trust Security](docs/SECURITY_AUTH_GATE.md)
- 🗺️ [نقشه راه فاز بعد از پایلوت (Post-Pilot Roadmap)](docs/POST_PILOT_ROADMAP.md)
- 🎨 [راهنمای برندینگ و استایل سازمانی](docs/BRANDING.md)
- 📸 [گالری اسکرین‌شات‌های زنده سیستم](docs/screenshots/)
- 🗄️ [یادداشت بایگانی اسناد طراحی اولیه](docs/ARCHIVE_NOTE.md)

---

## 🧪 اجرای آزمون‌های خودکار (Automated Tests)

```bash
cd services/backend-api
bun test
# خروجی: 97+ تست سبز با پوشش کامل اعتبارسنجی، ایزولاسیون و احراز هویت
```
