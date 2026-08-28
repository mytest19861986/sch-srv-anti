# Business Logic Inventory — ServiceYar Pre-Pilot Audit (Domain Scan #26)

**Target System**: ServiceYar (سامانه یکپارچه مدیریت سرویس و حمل و نقل دانش‌آموزی)
**Architecture**: Modular Monolith (Fastify/Bun + PostgreSQL), Next.js Dashboards, Kotlin Jetpack Compose Mobile Apps.
**Scope**: 6 Core Business Logic Domains analyzed for Pre-Pilot Logic Audit.

---

## 1. Domain 1: Parent↔Student Relationships (M:N Relations & IA)
- **Primary Files**:
  - `services/backend-api/src/modules/admin/admin.controller.ts`
  - `apps/school-web/app/students/page.tsx`
  - `apps/school-web/app/parents/page.tsx`
  - `apps/school-web/app/students/[id]/page.tsx`
  - `apps/school-web/app/parents/[id]/page.tsx`
- **Key Functions & Endpoints**:
  - `GET /api/v1/admin/students`: Enriches each student record with `parents: Array<{ id, full_name, phone, relationship }>`.
  - `GET /api/v1/admin/parents`: Enriches each parent record with `students: Array<{ id, first_name, last_name, fullName, grade, status }>` and `childrenCount`.
  - `POST /api/v1/admin/students` & `PATCH /api/v1/admin/students/:id`: Bi-directional link updates (`parentIds` synced to `studentIds`).
  - `POST /api/v1/admin/parents` & `PATCH /api/v1/admin/parents/:id`: Bi-directional link updates (`studentIds` synced to `parentIds`).
- **Claimed Invariants & Business Rules**:
  1. **M:N Cardinality**: A student may have 0, 1, or N linked legal parents/guardians. A parent may have 0, 1, or N children.
  2. **Multi-Parent Badge & Direct Dial**: If a student has >1 parent, UI shows multi-parent badge (`۲ والد`) and exposes a modal to call/SMS each parent separately (`tel:` and `sms:`).
  3. **Bi-directional Consistency**: Linking parent $P_1$ to student $S_1$ immediately updates both $S_1.parentIds$ and $P_1.studentIds$.
  4. **Tenant-Scoped Phone Uniqueness**: Parent phone numbers must be unique within the same tenant.
  5. **Soft-Delete Cascade Protection**: Deleting a student does not delete the parent record, but removes the student reference from the parent's `studentIds`.

---

## 2. Domain 2: Notification Routing & Fan-Out Rules
- **Primary Files**:
  - `services/backend-api/src/modules/notification/notification.service.ts`
  - `services/backend-api/src/modules/notification/outbox-worker.service.ts`
  - `apps/parent-android/app/src/main/java/ir/serviceyar/parent/notification/ParentNotificationHelper.kt`
- **Key Functions & Endpoints**:
  - `NotificationService.processOutboxItem(event)`: Fetches linked parents for the student and routes FCM push + SMS alerts.
  - `OutboxWorkerService.start(intervalMs)`: Polls pending outbox records, dispatches notifications, handles exponential backoff and retries (max 5 retries).
  - `ParentNotificationHelper.parseFCMMessage(payload)`: Translates event type (`PICKED_UP`, `DROPPED_OFF`, `ABSENT`) to Persian localized alerts.
- **Claimed Invariants & Business Rules**:
  1. **Fan-Out Rule**: When an attendance event (`PICKED_UP` or `DROPPED_OFF`) occurs for student $S$, notifications are dispatched to **all** active linked parents in $S.parentIds$.
  2. **Decoupled Outbox Execution**: The driver's attendance recording API responds in $<50\text{ ms}$ immediately after persisting to DB and Transactional Outbox; FCM dispatch runs asynchronously.
  3. **Duplicate Suppression**: Duplicate events matching `client_generated_id` do not create duplicate outbox entries.
  4. **Absence Reflection**: Emergency absence reports submitted by parents immediately update the manifest and trigger notification acknowledgment to parent and driver.

---

## 3. Domain 3: Attendance Event Validation & State Machine
- **Primary Files**:
  - `services/backend-api/src/modules/attendance/attendance.service.ts`
  - `services/backend-api/src/modules/attendance/dto/record-attendance.dto.ts`
  - `services/backend-api/tests/integration/event-lifecycle-statemachine.test.ts`
- **Key Functions & Endpoints**:
  - `POST /api/v1/attendance/events`: Records student pickup/drop-off.
  - `recordAttendanceWithOutbox()`: Enforces strict state machine transitions and audit logging.
- **Claimed Invariants & Business Rules**:
  1. **Idempotency Guarantee**: Submitting identical `client_generated_id` returns HTTP 200 with original event and `isDuplicate: true` without state transition side-effects.
  2. **Valid Transition**: `NONE` $\rightarrow$ `PICKED_UP` $\rightarrow$ `DROPPED_OFF`.
  3. **Illegal Transitions (HTTP 409 Conflict)**:
     - `DROPPED_OFF` when current state is `NONE` (student not picked up yet).
     - Duplicate `PICKED_UP` when student is already in `PICKED_UP` state.
     - Duplicate `DROPPED_OFF` when student is already in `DROPPED_OFF` state.
     - `ABSENT` if student already has attendance activity today.
  4. **RBAC Transition Guards**: `ABSENT` can only be set by `SCHOOL_ADMIN` or authorized `PARENT` (drivers receive HTTP 403).
  5. **Correction Audit Trail**: `CORRECTED` requires `SCHOOL_ADMIN` role and a reason of at least 10 characters (`correctionReason.length >= 10`), generating an immutable Audit Snapshot.

---

## 4. Domain 4: Offline-First Driver Sync & Conflict Resolution
- **Primary Files**:
  - `services/backend-api/src/modules/attendance/attendance.service.ts` (`processSyncBatch`)
  - `apps/driver-android/app/src/main/java/ir/serviceyar/driver/ui/OfflineSyncManager.kt`
  - `services/backend-api/tests/integration/offline-sync.test.ts`
- **Key Functions & Endpoints**:
  - `POST /api/v1/sync/batch`: Ingests batch of offline recorded attendance events from driver handset.
  - `GET /api/v1/sync/metadata/:deviceId`: Retrieves sync health, last processed timestamp, and conflict count.
- **Claimed Invariants & Business Rules**:
  1. **Batch Size Cap**: Maximum 200 events per batch (rejects $>200$ with HTTP 400).
  2. **Chronological Processing**: Events in offline batch are sorted by `client_timestamp` before state machine evaluation.
  3. **Partial Batch Resilience**: An invalid transition in 1 event marks it as `CONFLICT` in the response array while valid events in the same batch are successfully committed.
  4. **Zero Data-Loss Guarantee**: Handset Room DB keeps un-synced events until HTTP 200 batch response confirms `status: CREATED` or `DUPLICATE`.

---

## 5. Domain 5: Multi-Tenant Zero-Trust RBAC & Cross-Tenant Isolation
- **Primary Files**:
  - `services/backend-api/src/shared/middleware/auth.middleware.ts`
  - `services/backend-api/src/modules/admin/admin.controller.ts`
  - `services/backend-api/src/modules/super-admin/super-admin.controller.ts`
  - `services/backend-api/tests/security/idor-bola.test.ts`
- **Key Functions & Endpoints**:
  - `createAuthMiddleware()` & `requireRole()`: Validates JWT signature, extracts `tenantId`, enforces role permissions.
  - `getEffectiveTenantId(request, reply)`: Enforces tenant isolation for `SCHOOL_ADMIN` while allowing `SUPER_ADMIN` to specify `?tenantId=...` for cross-tenant management.
- **Claimed Invariants & Business Rules**:
  1. **Zero-Trust Tenant Isolation**: Every query and mutation is filtered by `tenantId`. `SCHOOL_ADMIN` of School A cannot read or write data of School B (HTTP 403 / 404).
  2. **Driver Scoping**: `DRIVER` can only access manifests of shifts explicitly assigned to them in their tenant.
  3. **Parent Scoping (IDOR Protection)**: `PARENT` can only submit absence reports and view live locations for their own linked children.
  4. **Super Admin Override**: `SUPER_ADMIN` can operate across all tenants, with all override mutations strictly logged to `AuditService`.

---

## 6. Domain 6: Service/Shift Lifecycle, Daily Read Models & Freshness (`is_stale`)
- **Primary Files**:
  - `services/backend-api/src/modules/dashboard/dashboard.service.ts`
  - `services/backend-api/src/modules/domain/domain.service.ts`
  - `services/backend-api/tests/integration/dashboard-read-model.test.ts`
- **Key Functions & Endpoints**:
  - `GET /api/v1/dashboard/overview?date=YYYY-MM-DD`: Fast aggregate metrics (total students, boarded, dropped off, absent).
  - `GET /api/v1/dashboard/live-services`: Paginated real-time status of all active shifts.
- **Claimed Invariants & Business Rules**:
  1. **Incremental Read Model**: Dashboard summary is incrementally updated via Outbox Worker events rather than full table scans.
  2. **Stale Threshold**: If read-model has not received an update for $>30\text{ seconds}$ during active shift hours, API returns `is_stale: true` to prompt UI refresh.
  3. **Timezone Correctness**: All daily aggregation dates are evaluated with respect to `Asia/Tehran` local date boundaries.
