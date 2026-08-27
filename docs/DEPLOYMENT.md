# Production Deployment Architecture & Environment Specifications
**Project:** School Transportation Management System (سامانه مدیریت سرویس مدرسه)  
**Phase:** 17 - Deployment Architecture & CI/CD (دستور کار اجرایی شماره ۱۳)  
**Date:** 2026-08-27  

---

## ۱. معماری کلی استقرار (Deployment Topology)
سیستم از تفکیک کامل لایه دریافت API از کارگران پس‌زمینه (Outbox Workers) در بستر کانتینری Kubernetes بهره می‌برد:

```
                  [ Ingress / TLS Termination ]
                                |
                 +--------------+--------------+
                 |                             |
     [ Backend API Pods (2..20) ]    [ Prometheus HPA Engine ]
                 |                             |
      +----------+----------+        (CPU / P99 Latency / Queue Lag)
      |                     |                  |
[ PostgreSQL Primary ]  [ Read Replica ]  [ Outbox Workers (2..32) ]
      |
[ Transactional Outbox ] ---- (SKIP LOCKED) ----+
```

---

## ۲. محیط‌ها (Environments)
1. **Staging (`school-transport-staging`):**
   - اهداف: تست‌های صحت عملکرد، بار آزمایشی و ارزیابی سازگاری Migration قبل از پروداکشن.
   - منابع: ۲ پاد API، ۲ کارگر Outbox، ۱ دیتابیس مشترک با تفکیک اسکیما.
2. **Production (`school-transport-prod`):**
   - اهداف: سرویس‌دهی بدون وقفه (High Availability 99.95%) به مدارس، رانندگان و والدین.
   - منابع: ۴ پاد پایه با HPA تا ۲۰ پاد، ۴ کارگر پایه با HPA تا ۳۲ کارگر، Primary DB با Read Replica و سیستم بکاپ خودکار.

---

## ۳. مدیریت سکرت‌ها و متغیرهای حساس (Secrets Management)
- هیچ سکرت واقعی (کلمه عبور پایگاه داده، کلید `JWT_SECRET`، توکن‌های FCM و نوتیفیکیشن) در کدهای منبع یا لاگ‌ها ذخیره نمی‌شود.
- متغیرها از طریق **Kubernetes Secrets** یا **HashiCorp Vault / AWS Secrets Manager** تزریق می‌گردند.
- نمونه متغیرها در فایل `.env.example` مستند شده است.

---

## ۴. استراتژی استقرار و بازگشت به عقب (Zero-Downtime Rolling Update & Rollback)
1. **استقرار بدون قطعی (RollingUpdate):** با تنظیم `maxSurge: 1` و `maxUnavailable: 0`، ابتدا پاد جدید بالا آمده، پروب `readinessProbe` را پاس کرده و سپس پادهای قدیمی حذف می‌شوند.
2. **استراتژی بازگشت فوری (Instant Rollback):**
   ```bash
   # بازگردانی به نسخه پایدار قبلی در کوبرنتیز
   kubectl rollout undo deployment/backend-api -n school-transport-prod
   kubectl rollout undo deployment/outbox-worker -n school-transport-prod
   ```
