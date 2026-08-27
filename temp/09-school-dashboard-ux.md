# Specification 09: School Web Dashboard Architecture & UX

## 1. Overview & Information Architecture (IA)
The School Web Dashboard is designed for school operators and administrators to monitor school transport operations in real-time, inspect service punctuality, view individual student boarding/drop-off status, and resolve exceptions.

---

## 2. Key Pages & Components

### 2.1. Overview Page (`/overview`)
- **KPI Summary Cards**:
  - مجموع کل دانش‌آموزان سرویس (Total Assigned)
  - سوار شده در مسیر (Picked Up)
  - تحویل شده به مدرسه / منزل (Dropped Off)
  - در انتظار سوار شدن (Pending)
  - غایب ثبت شده (Absent)
- **Data Freshness Banner**: Automatic detection of `is_stale: true` with dynamic elapsed seconds calculation.
- **Auto-Refresh Toggle**: Option to poll `/api/v1/dashboard/overview` every 30 seconds.

### 2.2. Live Services Table (`/live-services`)
- Table with columns: نام مسیر / سرویس, نام راننده, شماره تماس راننده, درصد تکمیل سفر, وضعیت زنده, آخرین رویداد ثبت شده.
- Filter by status (در حال سفر, تکمیل شده, هنوز شروع نشده).
- Clickable row navigating to Service Detail.

### 2.3. Service Detail (`/services/[id]`)
- Service Header with route metadata and driver assignment.
- Student Roster table with photo, full name, pickup/drop-off stop, current state badge, and parent contact.
- Ability for operators to record `ABSENT` or perform `CORRECTED` actions with required 10-char reason.

### 2.4. Logs & Compliance (`/audit-logs`, `/notifications`)
- Read-only table of SMS/Push notifications sent for this school.
- Audit trail of student record modifications.
