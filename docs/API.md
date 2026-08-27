# School Bus Fleet Management API Documentation

> **Base URL:** `http://localhost:3000/api/v1`  
> **Architecture:** Modular Monolith with Multi-Tenant Isolation, Transactional Outbox, and CQRS-lite Read Models.

---

## 1. Authentication & Tenant Scope
All protected endpoints require `Authorization: Bearer <JWT_TOKEN>`. The `tenantId` is cryptographically bound inside the JWT claims to prevent IDOR / BOLA attacks.

| Role | Description |
|---|---|
| `SUPER_ADMIN` | Platform-wide root access (Tenants, Users, Audit Logs, Settings) |
| `SCHOOL_ADMIN` | School-level manager (Dashboard, Fleet, Student Manifests) |
| `DRIVER` | Driver on duty (Record Attendance, Batch Sync, Active Shift Manifest) |
| `PARENT` | Guardian (Children Status, Timeline, Notifications) |

---

## 2. API Endpoints Overview

### Health & Observability
- `GET /health/live` — Liveness probe (200 UP)
- `GET /health/ready` — Readiness probe (DB & Outbox responsiveness)
- `GET /health/metrics` — Metrics snapshot (latency, counters, gauges)

### Auth Module (`/api/v1/auth`)
- `POST /login` — Authenticate and receive signed JWT

### Attendance Ingestion (`/api/v1/attendance`)
- `POST /events` — Ingest single attendance event (Idempotent with `client_generated_id`)
- `GET /events` — List tenant attendance events
- `GET /manifest?shift_id=...` — Active driver manifest for assigned shift

### Offline Sync Engine (`/api/v1/sync`)
- `POST /batch` — Batch ingest up to 200 offline events with Partial Success (`created`, `duplicate`, `conflict`)
- `GET /metadata/:deviceId` — Sync status metadata for specific device

### School Dashboard Read Model (`/api/v1/dashboard`)
- `GET /overview?date=YYYY-MM-DD` — Fast aggregated school summary with `data_freshness_seconds` and `is_stale`
- `GET /live-services?date=YYYY-MM-DD&page=1&limit=20` — Paginated per-service live status
- `GET /service-detail/:serviceId?date=YYYY-MM-DD` — Detailed service breakdown with student list

### Parent App (`/api/v1/parent`)
- `GET /children` — List children strictly linked to authenticated parent
- `GET /children/:childId/status` — Live status of child today (`IN_TRANSIT`, `AT_SCHOOL`, `NOT_STARTED`)
- `GET /children/:childId/timeline?date=YYYY-MM-DD` — Paginated attendance event timeline
- `GET /notifications?page=1&limit=20` — History of dispatched push notifications

### Super Admin Platform Management (`/api/v1/super-admin`)
- `GET /tenants` — List all schools
- `POST /tenants` — Create new school tenant
- `PATCH /tenants/:tenantId` — Update school details
- `DELETE /tenants/:tenantId` — Soft-delete school tenant
- `GET /users` — List platform users (with tenant filter)
- `POST /users` — Create user
- `PATCH /users/:userId/role` — Update user role (logged to `audit_log`)
- `PATCH /users/:userId/status` — Enable / disable user
- `GET /audit-logs` — Immutable audit log viewer
- `GET /reports/platform-overview` — Real-time platform health & metrics (<100ms)
- `GET /settings` & `PATCH /settings` — Global configuration parameters
