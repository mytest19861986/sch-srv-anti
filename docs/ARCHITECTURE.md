# System Architecture Document (Final Handoff)
**Project:** School Transportation Management System (سامانه مدیریت سرویس مدرسه)  
**Phase:** 18 - Final Architecture State & Handoff Package (دستور کار اجرایی شماره ۱۴)  
**Status:** Approved & Implemented  
**Date:** 2026-08-27  

---

## ۱. معماری کلی سیستم (High-Level Architecture)
سامانه با الگوی **Modular Monolith** طراحی شده تا پیچیدگی‌های اولیه میکروسرویس‌ها را حذف کرده و در عین حال مرزهای شفاف دامنه‌ای (Domain Boundaries) و قابلیت تکامل مستقل را حفظ کند:

```
[ Driver Mobile App ]      [ Parent Mobile App ]      [ School Web Admin ]
        |                          |                         |
        +--------------------------+-------------------------+
                                   | (HTTPS / REST / JWT)
                                   v
                      +--------------------------+
                      |       API Gateway        |
                      |  - JWT RBAC Context      |
                      |  - Zero-Trust Tenant     |
                      |  - IP Rate Limiting      |
                      +--------------------------+
                                   |
           +-----------------------+-----------------------+
           |                       |                       |
           v                       v                       v
[ Attendance Ingestion ]  [ School Dashboard CQRS ]  [ Parent Children API ]
           |                       ^                       ^
           | (Atomic DB Write)     |                       |
           v                       |                       |
[ PostgreSQL Primary ]             |                       |
   - attendance_events             |                       |
   - outbox_events                 |                       |
   - audit_logs                    |                       |
           |                       |                       |
           | (FOR UPDATE           | (Incremental Update)  | (Push Log)
           |  SKIP LOCKED)         |                       |
           v                       |                       |
+---------------------+            |                       |
| Outbox Worker Pods  |------------+-----------------------+
|  - Fan-out Dispatch |
|  - Parent Push/SMS  |
+---------------------+
```

---

## ۲. ماژول‌های اصلی دامنه (Core Domain Modules)
1. **Attendance Ingestion Module:** دریافت ایونت‌های سوار/پیاده شدن با شناسه کلاینت UUID برای تضمین ۱۰۰٪ Idempotency.
2. **Transactional Outbox Engine:** جداسازی قطعی نوشتن داده از ارسال اعلانات با قابلیت بازیابی خطا و Exponential Backoff.
3. **Offline-First Sync:** دریافت دسته‌ای تا ۲۰۰ رکورد از دستگاه راننده و تفکیک جزئی `created`، `duplicate` و `conflict`.
4. **School Dashboard CQRS-lite:** مدل خواندن بهینه‌شده `attendance_daily_summary` برای پاسخ‌دهی زیر ۱۰ میلی‌ثانیه به مدارس.
5. **Parent Timeline & Anti-IDOR:** استعلام فرزندان اولیا با کنترل‌های سفت‌وسخت امنیتی جهت جلوگیری کامل از آسیب‌پذیری‌های BOLA.
6. **Super Admin Platform Governance:** مدیریت تننت‌ها، نقش‌ها و ثبت لاگ‌های حسابرسی تغییرناپذیر (Immutable Audit Trails).

---

## ۳. شاخص‌های استقرار و قابلیت اطمینان (Reliability & Deployment)
- **Zero-Downtime Rollouts:** کانتینرهای مستقل API و Worker با HPA متریک‌های سفارشی پرومتئوس.
- **Database Partitioning Ready:** پاتیشن‌بندی ماهانه جدول رویدادها بر اساس [ADR-012](DECISIONS.md) در آستانه ۲۰ میلیون رکورد.
- **Queue Evolution Strategy:** مسیر شفاف مهاجرت به Redis / BullMQ در ترافیک بالای ۲,۰۰۰ EPS بر اساس [ADR-013](DECISIONS.md).
