# Scale Targets & Capacity Evolution Matrix
**Project:** School Transportation Management System (سامانه مدیریت سرویس مدرسه)  
**Status:** Baseline Established & Production Ready  
**Date:** 2026-08-27  

---

## ۱. ماتریس تمایز حیاتی (Critical Distinction Matrix)

برای جلوگیری از هرگونه ابهام در تیم‌های توسعه و عملیات آینده، مقادیر تست‌شده از اهداف تئوری آینده به صورت شفاف تفکیک شده‌اند:

| شاخص (Metric) | وضعیت اعتبارسنجی عملی (Verified in Dev/Load Tests) | هدف معماری آینده (Target with Full Multi-Node K8s) | ملاحظات و نیازمندی‌های زیرساختی |
| :--- | :---: | :---: | :--- |
| **نرخ ثبت رویداد تک‌پاد (Single Ingestion RPS)** | **1,220+ RPS** | **5,000+ RPS** | نیاز به فعال‌سازی HPA و حداقل ۴ پاد کلاستر |
| **پردازش دسته‌ای آفلاین (Batch Replay Ingestion)** | **3,870+ Events/sec** | **10,000+ Events/sec** | بهره‌گیری از Transactional Outbox Batching |
| **تاخیر ثبت P99 رویداد (P99 Ingestion Latency)** | **28.0 ms** | **< 50.0 ms** | مستقل از زمان ارسال نوتیفیکیشن‌ها |
| **نرخ ارسال نوتیفیکیشن Outbox (Worker Throughput)** | **120 Events/sec** (تک ورکر) | **1,000+ Events/sec** | مقیاس کارگران به ۳۲ تا ۶۴ کانتینر همزمان |
| **تعداد دانش‌آموزان همزمان (Active Students)** | **10,000 نفر** (شبیه‌سازی شده) | **1,000,000+ نفر** | اعمال Partitioning و Read Replicas بر اساس ADR-012/014 |
| **حجم ذخیره‌سازی داده سالانه** | **~20 GB** (محیط تست) | **~772 GB** (با Outbox Pruning) | انتقال داده‌های بالای ۱۲ ماه به Object Storage |

---

## ۲. فازهای رشد و نقاط عطف (Scaling Milestones)
1. **Day 1 (Launch / 10K Students):**
   - معماری: Single Primary PostgreSQL + 2 API Pods + 2 Outbox Workers
   - صف: دیتابیسی با `FOR UPDATE SKIP LOCKED`
2. **Phase 2 (100K - 500K Students):**
   - معماری: Primary DB + 1 Read Replica + HPA (4-10 Pods)
   - صف: مهاجرت به Redis BullMQ در نرخ بالای ۲,۰۰۰ EPS
3. **Phase 3 (1M+ Students Enterprise):**
   - معماری: Monthly Range Partitioning + 2 Read Replicas + Kafka/RabbitMQ + Parquet S3 Cold Storage
