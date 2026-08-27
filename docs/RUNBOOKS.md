# SRE Operational Runbooks & Incident Response Playbook
**Project:** School Transportation Management System (سامانه مدیریت سرویس مدرسه)  
**Phase:** 17 - SRE Runbooks & Reliability Engineering (دستور کار اجرایی شماره ۱۳)  
**Severity Levels:** SEV-1 (Critical Outage), SEV-2 (Degraded Performance), SEV-3 (Warning/Minor)  
**Date:** 2026-08-27  

---

## 🚨 Runbook 1: Morning Burst Failure & Peak Ingestion Latency
- **زمان رخ‌داد معمول:** صبح‌ها بین ساعت ۰۷:۰۰ تا ۰۸:۳۰ (هنگام سوار شدن همزمان دانش‌آموزان به سرویس‌ها)
- **شناسه هشدار مرتبط:** `ALERT-LAT-001` ($P99 > 150 \text{ ms}$ برای ۵ دقیقه)
- **سطح بحران:** **SEV-1** (تأثیر روی ارسال وضعیت لایو و ایجاد تاخیر برای رانندگان)

### ۱. علائم و شواهد (Symptoms)
- افزایش شدید P99 Latency اندپوینت `POST /api/v1/attendance/events` به بالای ۳۰۰ میلی‌ثانیه.
- ایجاد صف در ورودی پادها و خطاهای Timeout کلاینت‌ها (کدهای ۵۰۲ یا ۵۰۴).

### ۲. مراحل عیب‌یابی فوری (Diagnostic Steps)
```bash
# بررسی وضعیت پادهای API و مصرف منابع
kubectl top pods -l app=backend-api -n school-transport-prod

# بررسی وضعیت HPA
kubectl get hpa backend-api-hpa -n school-transport-prod

# بررسی لاگ‌های خطا در پادها
kubectl logs -l app=backend-api -n school-transport-prod --tail=100 | grep "ERROR"
```

### ۳. اقدامات اصلاحی فوری (Immediate Mitigations)
1. **افزایش فوری و دستی تعداد پادهای API:**
   ```bash
   kubectl scale deployment/backend-api --replicas=15 -n school-transport-prod
   ```
2. **فعال‌سازی حالت حفاظت در برابر اضافه بار (Shed Load):** اطمینان از اینکه ریت لیمیتر کلاینت‌های متخلف را مسدود کرده و درخواست‌های غیراورژانسی لاگین متوقف شوند.
3. **بررسی استخر اتصالات دیتابیس (PgBouncer):** در صورت اشباع کانکشن‌ها، ماکسیمم کلاینت مجاز موقتاً افزایش یابد.

---

## 🚨 Runbook 2: Outbox Queue Backlog & Worker Saturation
- **شناسه هشدار مرتبط:** `ALERT-QUE-001` ($\text{Backlog} > 5,000 \text{ events}$) یا `ALERT-QUE-002` ($\text{Age} > 60 \text{ s}$)
- **سطح بحران:** **SEV-2** (تاخیر در رسیدن پیامک و نوتیفیکیشن به اولیا، بدون اختلال در ثبت راننده)

### ۱. علائم و شواهد (Symptoms)
- والدین گزارش می‌دهند که اعلان سوار شدن فرزند با تاخیر ۵ تا ۱۰ دقیقه‌ای به دستشان می‌رسد.
- تعداد رکوردهای با وضعیت `status = 'PENDING'` در جدول `outbox_events` در حال رشد است.

### ۲. مراحل عیب‌یابی فوری (Diagnostic Steps)
```bash
# کوئری تعداد رویدادهای معلق در صف
psql $DATABASE_URL -c "SELECT status, count(*), min(created_at) FROM outbox_events GROUP BY status;"

# بررسی لاگ Workerها و خطاهای ارسال FCM/SMS
kubectl logs -l app=outbox-worker -n school-transport-prod --tail=100
```

### ۳. اقدامات اصلاحی فوری (Immediate Mitigations)
1. **Scale-Out فوری Workerها:**
   ```bash
   kubectl scale deployment/outbox-worker --replicas=16 -n school-transport-prod
   ```
2. **بررسی وضعیت سرویس‌دهنده نوتیفیکیشن خارجی (Third-party SMS/FCM Provider):** در صورت قطعی یا Rate-Limit ارائه‌دهنده پیامک، صف به صورت خودکار با Exponential Backoff رویدادها را نگه می‌دارد؛ کانکشن‌های مسدود ری‌استارت شوند.

---

## 🚨 Runbook 3: DB Connection Pool Exhaustion & Transaction Contention
- **شناسه هشدار مرتبط:** `ALERT-RES-002` ($\text{Utilization} > 85\%$)
- **سطح بحران:** **SEV-1** (افت پاسخ‌دهی سراسری سیستم به دلیل کمبود کانکشن دیتابیس)

### ۱. علائم و شواهد (Symptoms)
- لاگ‌های اپلیکیشن خطای `Timeout acquiring connection from pool` یا `connection limit exceeded` چاپ می‌کنند.

### ۲. مراحل عیب‌یابی فوری (Diagnostic Steps)
```bash
# بررسی کوئری‌های قفل شده یا طولانی
psql $DATABASE_URL -c "SELECT pid, now() - query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 10;"

# بررسی تعداد اتصالات فعال
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### ۳. اقدامات اصلاحی فوری (Immediate Mitigations)
1. **کشتن تراکنش‌های معلق (Stuck Queries):**
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state != 'idle' AND now() - query_start > interval '30 seconds';
   ```
2. **بررسی سلامت PgBouncer و ری‌استارت سریع کانتینر در صورت نشت کانکشن:**
   ```bash
   kubectl rollout restart deployment/backend-api -n school-transport-prod
   ```

---

## مسیر ارجاع (Escalation Path)
1. **سطح ۱ (On-Call SRE / DevOps):** اجرای مراحل تشخیصی و Mitigation اولیه ظرف ۵ دقیقه.
2. **سطح ۲ (Lead Backend Architect):** در صورت عدم رفع نقص ظرف ۱۵ دقیقه، اعمال تصمیمات اضطراری (Failover / Circuit Breaking).
3. **سطح ۳ (CTO / Head of Engineering):** ارتباط با مشتریان و مدارس در حوادث با اثرگذاری گسترده.
