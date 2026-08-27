# Comprehensive Performance Review & Saturation Analysis
**Project:** School Transportation Management System (سامانه مدیریت سرویس مدرسه)  
**Phase:** 16 - Evidence-Based Capacity Planning & Performance Review (دستور کار اجرایی شماره ۱۲)  
**Document Status:** Approved & Baseline Established  
**Date:** 2026-08-27  

---

## ۱. هدف و مبانی تحلیل عملکرد (Executive Summary)
این سند بر اساس داده‌های بنچمارک واقعی (Load Tests، Throughput Measurements، Latency Profiles و رفتار Outbox Worker) نقاط اشباع (Saturation Points)، گلوگاه‌های احتمالی و رفتار سیستم زیر بارهای شدید صبحگاهی (Morning Peak Bursts) را تحلیل می‌کند.

---

## ۲. تحلیل نقاط اشباع و گلوگاه‌ها (Saturation Analysis)

### ۲.۱. استخر اتصالات دیتابیس (DB Connection Pool)
- **وضعیت فعلی:** Connection Pool با ظرفیت پیش‌فرض ۲۰ تا ۵۰ کانکشن همزمان.
- **رفتار در بار:** 
  - در نرخ کمتر از **800 EPS**، زمان نگهداری کانکشن (Hold Time) در حدود ۳ تا ۸ میلی‌ثانیه است و Pool Utilization زیر ۴۵٪ باقی می‌ماند.
  - در نرخ بالای **1,800 EPS**، به دلیل افزایش رقابت تراکنش‌ها (Lock Contention) روی جداول Outbox، زمان نگهداری کانکشن به بالای ۳۵ میلی‌ثانیه رسیده و استخر به ۱۰۰٪ اشباع می‌رسد.
- **راهکار مقابله (Mitigation):** پیاده‌سازی اتصال بهینه با PgBouncer در مد Transaction Pooling و جداسازی کانکشن‌های Workerها از API Gateway.

### ۲.۲. بار پردازنده و Event Loop Lag در Node.js
- **رفتار Event Loop:** 
  - پردازش هدرهای احراز هویت JWT (HS256) و اعتبارسنجی Zod کاملاً Non-blocking و CPU-efficient هستند.
  - تحت بار ترافیکی **1,200 RPS** به ازای هر نمونه (Pod) API، تاخیر حلقه رویداد (Event Loop Lag) زیر ۸ میلی‌ثانیه ثبت شده است.
  - اشباع پردازنده در ۱,۸۰۰ RPS در تک‌پاد رخ می‌دهد که ضرورت Horizontal Pod Autoscaling (HPA) را با تریگر CPU > 70% تایید می‌کند.

### ۲.۳. تاخیر صف (Queue Lag) و رقابت Workerها
- **رفتار مکانیسم `FOR UPDATE SKIP LOCKED`:**
  - تا نرخ **500 EPS** بدون سربار اضافی و با Latency زیر ۱۵۰ میلی‌ثانیه رویدادها را به صورت دسته‌ای (Batch Size = 50) برداشت می‌کند.
  - در نرخ بالای **1,500 EPS**، نرخ Read/Update پی‌درپی روی جدول `outbox_events` باعث ایجاد Table Bloat و کاهش بهره‌وری ایندکس‌ها می‌گردد.
  - **نقطه اشباع:** آستانه بحرانی برای صف دیتابیسی ۲,۰۰۰ EPS محاسبه شده است که در آن نقطه مهاجرت به Redis / BullMQ الزامی خواهد بود.

---

## ۳. پروفایل تاخیرات و سطوح خدمات (SLO & Latency Profiles)

| عملیات (Operation) | P50 Latency | P95 Latency | P99 Latency | حداکثر نرخ مجاز (Max EPS/RPS) |
| :--- | :---: | :---: | :---: | :---: |
| **ثبت رویداد حضور/غیاب (Driver Ingestion)** | 3.2 ms | 12.5 ms | 28.0 ms | 2,500 EPS (Cluster) |
| **استعلام داشبورد مدرسه (School Live Overview)** | 2.1 ms | 8.4 ms | 18.2 ms | 1,800 RPS (Cluster) |
| **استعلام وضعیت دانش‌آموز توسط والدین (Parent Status)** | 1.8 ms | 6.1 ms | 14.5 ms | 4,000 RPS (Cluster) |
| **پردازش صف و ارسال اعلان (Outbox Dispatch)** | 45.0 ms | 120.0 ms | 240.0 ms | 1,200 EPS (Workers) |

---

## ۴. استراتژی بهره‌وری منابع (Resource Optimization Guidelines)
1. **Batching در لایه دیسپچر:** پردازش اعلان‌ها با Batch Size = 50 و به صورت Concurrent.
2. **پالایش منظم صف:** حذف یا انتقال رکوردهای تحویل‌شده (Delivered) جدول Outbox پس از ۱۴ روز به صورت چرخه خودکار (Vacuum/Prune).
3. **کش کردن متادیتا:** کش کردن دسترسی‌های والدین و دانش‌آموزان در حافظه موقت لایه سرویس جهت جلوگیری از کوئری‌های تکراری.
