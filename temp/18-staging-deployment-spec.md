# Specification 18: Staging Deployment & Sample Data Seeding Specification

## 1. Overview
The Staging deployment environment provides a fully functioning replica of the production infrastructure using Docker Compose.

---

## 2. Seed Data Profile
- **1 Tenant School**: دبیرستان مهر آفرین (`tenant-school-mehr`)
- **5 Drivers**: علی رضایی، حسین حسینی، محمد محمدی، رضا کریمی، احمد احمدی
- **20 Students**: Distributed across morning and afternoon shifts.
- **40 Parents**: 2 parents per student with verified mobile numbers and active mock FCM device tokens.
- **5 Active Bus Routes**: ونک، سعادت‌آباد، پاسداران، نیاوران، شهرک غرب.
