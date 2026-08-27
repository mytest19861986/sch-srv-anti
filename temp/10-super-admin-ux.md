# Specification 10: Super Admin Web Dashboard Architecture & UX

## 1. Overview & Information Architecture
The Super Admin Web Dashboard is the centralized management portal for platform owners to oversee multi-tenant schools, provision administrators, monitor system-wide metrics, review audit logs, and configure platform parameters.

---

## 2. Core Functional Modules

### 2.1. Platform Overview (`/admin/overview`)
- System-wide KPIs: Total Schools (Tenants), Active Drivers, Registered Parents, Daily Trips Handled, 99.99% SLA Uptime monitor.

### 2.2. School / Tenant Management (`/admin/tenants`)
- Tenant List with columns: School Name, Tenant Code, Contact Person, Subscription Status, Created At, Actions.
- Create / Edit Tenant Modal.
- Soft Delete Tenant action with irreversible warning confirmation.

### 2.3. User & RBAC Management (`/admin/users`)
- Manage users across all schools with role filters (`SUPER_ADMIN`, `SCHOOL_ADMIN`, `SCHOOL_OPERATOR`, `DRIVER`, `PARENT`).
- Role elevation / modification with 2-step confirmation modal.
- Force password reset & revoke active sessions.

### 2.4. Audit Trail Explorer (`/admin/audit-logs`)
- Filterable log table: Tenant filter, Action filter (`CORRECTION`, `DELETE_TENANT`, `ROLE_CHANGE`), Date range.
- JSON Viewer for Before / After snapshots.

### 2.5. Platform Settings (`/admin/settings`)
- Global rate limits, SMS provider settings, FCM credentials toggle, data retention policies.
