# Evidence-Based Capacity Plan & Scaling Evolution Matrix
**Project:** School Transportation Management System (سامانه مدیریت سرویس مدرسه)  
**Phase:** 16 - Scalability Finalization & Capacity Planning (دستور کار اجرایی شماره ۱۲)  
**Target Scale:** 1,000,000+ Active Students | 2,000,000+ Daily Events  
**Date:** 2026-08-27  

---

## ۱. تخمین رشد داده و حجم ذخیره‌سازی (Data Growth Estimation)

### ۱.۱. محاسبات ریاضی Footprint داده‌ها:
- **تعداد دانش‌آموزان فعال:** ۱,۰۰۰,۰۰۰ نفر
- **تعداد رویداد منطقی روزانه:** ۲ رویداد در روز به ازای هر دانش‌آموز = **۲,۰۰۰,۰۰۰ رویداد/روز**
- **حجم هر رویداد منطقی (شامل Attendance + Outbox + Audit + ایندکس‌ها + 15% Slack):**
  - جدول `attendance_events`: ۲۸۰ بایت دیتا + ۱۸۰ بایت ایندکس = ۴۶۰ بایت
  - جدول `outbox_events`: ۳۲۰ بایت دیتا + ۲۰۰ بایت ایندکس = ۵۲۰ بایت
  - جدول `audit_logs`: ۲۸۰ بایت دیتا + ۱۶۰ بایت ایندکس = ۴۴۰ بایت
  - **مجموع با ۱۵٪ سربار عملیاتی (Page Slack/Bloat):** $۱۴۲۰ \times ۱.۱۵ = ۱,۶۳۳ \text{ Bytes/Event}$

### ۱.۲. جدول رشد حجم ذخیره‌سازی:
| دوره زمانی | رویدادهای منطقی | حجم داده (Decimal) | حجم داده (Binary) | استراتژی ذخیره‌سازی |
| :--- | :---: | :---: | :---: | :--- |
| **روزانه (Daily)** | 2,000,000 | 3.27 GB | 3.04 GiB | PostgreSQL Hot Storage |
| **ماهانه (30 Days)** | 60,000,000 | 97.98 GB | 91.25 GiB | PostgreSQL Hot Storage |
| **سال تحصیلی (9 Months / 270 Days)** | 540,000,000 | 881.82 GB | 821.26 GiB | PostgreSQL Partitioned |
| **سال تقویمی (12 Months / 365 Days)** | 730,000,000 | 1.192 TB | 1.084 TiB | Hot + Warm Tiering |

> **نکته بهینه‌سازی حیاتی (Outbox Pruning):** با اعمال سیاست نگهداری ۱۴ روزه برای رکوردهای تحویل‌شده Outbox (`status = DELIVERED`)، حجم ذخیره‌سازی سالانه دیتابیس عملیاتی به **۷۷۲ گیگابایت** کاهش می‌یابد.

---

## ۲. استراتژی آرشیو و ذخیره‌سازی سرد (Cold Storage & Archiving)
- **داده‌های ۰ تا ۱۲ ماه:** در پارتیشن‌های ماهانه PostgreSQL به صورت Hot/Warm نگهداری می‌شوند.
- **داده‌های بالای ۱۲ ماه:** 
  1. استخراج داده‌ها به فرمت فشرده **Parquet** بر اساس ستون‌های زمانی و شناسه تننت (`year=YYYY/month=MM/tenant_bucket=XX`).
  2. رمزنگاری با الگوریتم AES-256 و انتقال به Object Storage (MinIO / S3 Glacier).
  3. اعمال سیاست چرخه عمر (Lifecycle Policy) برای حذف امن داده‌ها پس از پایان مهلت قانونی (مثلاً ۵ سال).

---

## ۳. تحلیل تئوری صف (Queueing Theory M/M/c) برای Outbox Workerها
- **پیک ترافیک صبحگاهی (Morning Burst):** ۶۰٪ رویدادهای روزانه در بازه ۹۰ دقیقه‌ای صبح رخ می‌دهد ($۱,۲۰۰,۰۰۰ \text{ events} / ۵۴۰۰ \text{ s} \approx ۲۲۲ \text{ EPS}$).
- **سناریوی اوج بار شدید (Stress Burst):** ۸۰٪ کل رویدادها در ۱ ساعت ($۱,۶۰۰,۰۰۰ \text{ events} / ۳۶۰۰ \text{ s} \approx ۴۴۴ \text{ EPS}$).
- **نرخ پردازش هر Worker ($\mu$):** با فرض متوسط زمان ارسال اعلان $S = ۰.۱ \text{ s}$ ($۱۰ \text{ EPS/Worker}$).
- **تعداد بهینه Workerها با بهره‌وری ۷۰٪ ($\rho = ۰.۷$):**
  - در ۲۲۲ EPS: حداقل **۳۲ نمونه Worker همزمان**.
  - در ۴۴۴ EPS: حداقل **۶۴ نمونه Worker همزمان**.
  - در ۱,۰۰۰ EPS (Retry Storm): حداقل **۱۴۳ نمونه Worker همزمان**.

---

## ۴. استراتژی پارتیشن‌بندی بدون Downtime (Zero-Downtime Partitioning)
1. **تریگر فعال‌سازی:** زمانی که جدول `attendance_events` به **۲۰ میلیون رکورد** یا **۵۰ گیگابایت** حجم برسد.
2. **نوع پارتیشن‌بندی:** `RANGE (client_timestamp)` به صورت پارتیشن‌های ماهانه.
3. **مراحل پیاده‌سازی بدون قطعی:**
   - مرحله ۱: ایجاد جدول پارتیشن‌بندی شده جدید (`attendance_events_v2`).
   - مرحله ۲: اتصال ویو و تریگر دوگانه (Dual Write) برای درج همزمان داده‌های جدید در جدول جدید.
   - مرحله ۳: انتقال دسته‌ای داده‌های تاریخی (Historical Migration) در پس‌زمینه در ساعات کم‌بار.
   - مرحله ۴: تغییر نام جدول‌ها (Table Swap) با یک تراکنش چندمیلی‌ثانیه‌ای:
     ```sql
     ALTER TABLE attendance_events RENAME TO attendance_events_legacy;
     ALTER TABLE attendance_events_v2 RENAME TO attendance_events;
     ```

---

## ۵. ماتریس تکامل ظرفیت و مقیاس‌پذیری (Capacity Evolution Matrix)

| فاز رشد (Scale Tier) | دانش‌آموزان | رویداد روزانه | پیک EPS | تعداد API Pods | تعداد Worker Pods | معماری صف | استراتژی دیتابیس |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Day 1 (MVP / Pilot)** | تا 10,000 | 20,000 | < 10 | 2 Pods (HA) | 2 Workers | PostgreSQL Outbox | Single Primary DB (100 GB) |
| **Stage 1 (100K Users)** | 100,000 | 200,000 | 45 | 4 Pods | 8 Workers | PostgreSQL Outbox + Skip Locked | Primary + Dedicated Outbox Vacuum |
| **Stage 2 (500K Users)** | 500,000 | 1,000,000 | 225 | 10 Pods | 32 Workers | Redis (BullMQ Cluster) | Primary + 1 Read Replica + Partitioning |
| **Stage 3 (1M+ Enterprise)** | 1,000,000+ | 2,000,000+ | 450 - 1,000 | 20+ Pods (HPA) | 64-144 Workers | Dedicated RabbitMQ / Kafka | Primary + 2 Read Replicas + Object Cold Storage |

---

## ۶. قوانین و تریگرهای مقیاس‌پذیری خودکار (Autoscaling Triggers)
- **Backend API Pods:** Scale-Out زمانی که $P99 > 150 \text{ ms}$ یا $\text{CPU} > 70\%$ برای مدت ۵ دقیقه مداوم.
- **Outbox Worker Pods:** Scale-Out زمانی که $\text{Queue Lag} > 5,000 \text{ events}$ یا قدیمی‌ترین رویداد در انتظار $> 60 \text{ seconds}$.
- **Read Replicas:** فعال‌سازی و افزایش رپلیکا زمانی که نرخ کوئری‌های خواندن داشبورد $> 1,500 \text{ QPS}$ یا دیسک I/O Primary $> 75\%$.
- **Database Storage Alert:** صدور هشدار زمانی که حجم ذخیره‌سازی به $> 80\%$ ظرفیت پیش‌بینی شده ۶ ماه برسد.
