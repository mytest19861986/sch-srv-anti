# 🚌 School Transportation Management System (سامانه جامع مدیریت سرویس مدارس)

یک پلتفرم ماژولار با معماری **Modular Monolith** و قابلیت اطمینان بالا (High Availability) جهت مدیریت حضور و غیاب، مانیفست شیفت‌های رانندگان، اعلان‌های لحظه‌ای به اولیا و داشبورد مدارس در مقیاس چندمستاجری (Multi-Tenant).

---

## 🏗️ معماری کلی و تکنولوژی‌ها
- **زبان و محیط اجرا:** TypeScript / Node.js / Bun Runtime
- **پایگاه داده اصلی:** PostgreSQL (با Transactional Outbox و آماده‌سازی برای پارتیشن‌بندی)
- **مکانیزم صف رویدادها:** Database-backed Queue (`FOR UPDATE SKIP LOCKED`) با مسیر مهاجرت به Redis BullMQ / Kafka
- **احراز هویت و ایزولاسیون:** JWT، RBAC سفت‌وسخت و Zero-Trust Multi-Tenancy
- **اورکستریشن و استقرار:** Docker Multi-stage، Kubernetes (Kustomize Base/Overlays) و Prometheus Custom Metrics HPA

---

## 🚀 راهنمای سریع راه‌اندازی (Quick Start)

### ۱. پیش‌نیازها
- نصب Bun (یا Node.js v20+)
- نصب Docker و Docker Compose (اختیاری برای دیتابیس)

### ۲. نصب وابستگی‌ها و بیلد پروژه
```bash
cd services/backend-api
bun install
bun run build
```

### ۳. اجرای تست‌های یکپارچگی و تست نفوذ امنیتی
```bash
bun test
```

### ۴. اجرای سرویس در محیط محلی
```bash
bun run src/index.ts
```

---

## 📚 مستندات کامل سیستم (Documentation Index)

| سند | شرح محتوا |
| :--- | :--- |
| 🏛️ **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** | معماری تفصیلی سیستم، جریان داده‌ها و ماژول‌ها |
| 🛡️ **[SECURITY_REVIEW_REPORT.md](docs/SECURITY_REVIEW_REPORT.md)** | گزارش ارزیابی امنیتی، تست نفوذ IDOR/BOLA و ماتریس تهدیدات |
| 📊 **[PERFORMANCE_REVIEW.md](docs/PERFORMANCE_REVIEW.md)** | تحلیل عملکرد، نقاط اشباع و پروفایل‌های Latency |
| 📈 **[CAPACITY_PLAN.md](docs/CAPACITY_PLAN.md)** | طرح تکامل ظرفیت، تئوری صف M/M/c و رشد ذخیره‌سازی تا ۱M+ |
| 🧪 **[TESTING.md](docs/TESTING.md)** | نتایج تست‌های بار، یکپارچگی و سناریوهای آزمایشی |
| 🚢 **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** | راهنمای استقرار کانتینری، کوبرنتیز و محیط‌ها |
| 🚨 **[RUNBOOKS.md](docs/RUNBOOKS.md)** | راهنماهای عملیاتی SRE برای بحران‌های ترافیک صبحگاهی و صف |
| 📝 **[DECISIONS.md](docs/DECISIONS.md)** | ثبت کلیه تصمیمات معماری (ADR-001 تا ADR-014) |
| ⚠️ **[KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md)** | فرضیات، محدودیت‌های فنی فعلی و نقشه راه آینده |
| 📜 **[CHANGELOG.md](CHANGELOG.md)** | تاریخچه تغییرات تمام دستور کارهای اجرایی |

---

## 🔒 استانداردهای امنیتی
- **Zero-Trust Multi-Tenancy:** تمامی درخواست‌ها بر اساس `tenantId` موجود در توکن JWT اعتبارسنجی می‌شوند.
- **Append-Only Auditing:** رکوردهای لاگ‌های حسابرسی غیرقابل دستکاری و حذف هستند.
- **PII & Secret Redaction:** هیچ پسورد یا داده هویتی حساسی در لاگ‌های ساختاریافته نشت نمی‌کند.
