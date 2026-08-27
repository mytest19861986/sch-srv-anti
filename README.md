# 🚌 School Transport Platform (سامانه جامع مدیریت سرویس مدارس)

An enterprise-grade, offline-first, multi-tenant school transport management platform built with high throughput event-sourcing principles, Zero-Trust multi-tenancy, and decoupled asynchronous notifications.

---

## ⚡ Quick Demo Launch (اجرای فوری دمو با یک دستور)

برای اجرای کامل استک دمو همراه با پایگاه داده، ردیس، داشبورد مدرسه و پنل سوپر ادمین تنها کافیست دستور زیر را اجرا کنید:

```bash
# 1. کلون ریپازیتوری
git clone https://github.com/mytest19861986/sch-srv-anti.git
cd sch-srv-anti

# 2. اجرای تک‌دستوری دمو
./demo.sh
```

### 📱 درگاه‌های دسترسی به وب و API:
- 🏫 **داشبورد مدیریت مدرسه**: [http://localhost:3001](http://localhost:3001)
- 🏢 **پنل راهبری Super Admin**: [http://localhost:3002](http://localhost:3002)
- 🛡️ **درگاه ارتباطی Nginx**: [http://localhost:80](http://localhost:80)
- 🚀 **سرویس مستقیم Backend API**: [http://localhost:3000](http://localhost:3000)

### 🔑 اطلاعات ورود کاربران دمو (فقط محیط لوکال):

| نقش کاربری | نام کاربری (Email) | کلمه عبور |
| :--- | :--- | :--- |
| 🛡️ **Super Admin** | `super-admin@platform.ir` | `Demo@1234` |
| 🏫 **مدیر مدرسه (School Admin)** | `school-admin@demo.ir` | `Demo@1234` |
| 🚐 **راننده سرویس (Driver)** | `driver@demo.ir` | `Demo@1234` |
| 👨‍👩‍👧 **ولی دانش‌آموز (Parent)** | `parent@demo.ir` | `Demo@1234` |

---

## 🧪 تست و اعتبارسنجی خودکار

```bash
# اجرای تست‌های اعتبارسنجی دمو و لاگین واقعی
bun test tests/e2e/demo-verification.test.ts

# اجرای تمامی آزمون‌های سرتاسری E2E (۸ سناریو)
bun test tests/e2e/e2e-scenarios.test.ts

# اجرای آزمون‌های یکپارچگی بک‌اند (۵۲ تست)
bun test services/backend-api

# اجرای آزمون‌های مونو‌ریپو و پکیج‌های وب (۷ تست)
bun test packages/i18n packages/auth packages/api-client
```

---

## 📚 مستندات کامل پلتفرم
- 📖 [راهنمای جامع اتصال اعتبارنامه‌ها (Wire-Up Guide)](docs/WIRE_UP_GUIDE.md)
- 📋 [چک‌لیست تحویل نهایی پلتفرم (Handoff Checklist)](docs/HANDOFF_CHECKLIST.md)
- 🚀 [مستندات استقرار و SRE Runbooks](docs/DEPLOYMENT.md)
