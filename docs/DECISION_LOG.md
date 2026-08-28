# ServiceYar Architectural Decision Log (ADR) — Pre-Pilot Quality Gates

**Project**: ServiceYar (سامانه یکپارچه مدیریت سرویس مدارس)
**Status**: Approved & Enforced
**Last Updated**: 2026-08-28 (Order #53 Pre-Pilot Logic Audit)

---

## ADR-001: Bi-directional Parent↔Student Model & Relation Authority
- **Context**: In Order #52, parent-student relationships were exposed in tables and forms. ChatGPT logic audit highlighted potential ambiguity with concurrent PATCH mutations and multi-school parents.
- **Decision**:
  - The authoritative linkage is maintained in an internal relation store with strict tenant validation (`tenantId` of parent must equal `tenantId` of student).
  - Hydrated JSON responses (`parents: []` on Student, `students: []` on Parent) are projected dynamically on queries.
  - Soft-deleting a student unlinks the student from the parent without deleting the parent entity.
- **Invariants**: `PS-01`, `PS-02`, `PS-03`, `PS-04`, `PS-07`.

---

## ADR-002: Notification Fan-Out & Outbox Delivery Deduplication
- **Context**: When attendance events (`PICKED_UP`, `DROPPED_OFF`) trigger outbox worker jobs, network retries or multiple device tokens could cause duplicate push/SMS notifications to parents.
- **Decision**:
  - Outbox dispatch enforces a composite delivery deduplication key: `(eventId, recipientId, channel)`.
  - Notification dispatch fans out to all active, notification-eligible guardians linked in `parentIds`.
  - API response for attendance recording remains decoupled (<50ms) using the Transactional Outbox pattern.
- **Invariants**: `NT-01`, `NT-02`, `NT-03`, `NT-04`.

---

## ADR-003: Attendance State Machine Scoping by Shift & Service Occurrence
- **Context**: A daily state machine can cause false 409 conflicts if a student is picked up for morning school trip (AM) and subsequently picked up for afternoon return trip (PM) on the same date.
- **Decision**:
  - The state transition validator scopes active states by `(student_id, service_date, service_id/shift_id)`.
  - Allowed sequence per shift: `NONE` $\rightarrow$ `PICKED_UP` $\rightarrow$ `DROPPED_OFF`.
  - Strict RBAC: Drivers cannot record `ABSENT` (HTTP 403); only `SCHOOL_ADMIN` or authorized legal `PARENT` can declare absence.
  - Corrections require `SCHOOL_ADMIN` role and a reason of at least 10 characters, creating an immutable audit log snapshot.
- **Invariants**: `AT-01`, `AT-02`, `AT-05`, `AT-06`.

---

## ADR-004: Offline-First Driver Sync Canonical Contract & Batch Limits
- **Context**: Mobile driver apps need consistent endpoints and deterministic conflict handling during network loss.
- **Decision**:
  - Both `/api/v1/sync/batch` and `/api/v1/sync/events` are supported canonically.
  - Batches are capped at 200 events.
  - Partial batch processing is supported: valid events are committed while conflicting transitions return `status: CONFLICT` with failure reasons.
  - Mobile Room DB retains unsynced records until HTTP 200 confirms individual event receipt.
- **Invariants**: `SY-01`, `SY-02`, `SY-03`, `SY-04`.

---

## ADR-005: Zero-Trust Multi-Tenancy & Super Admin Override Auditing
- **Context**: Multi-tenant security requires non-bypassable tenant isolation at middleware and database query levels.
- **Decision**:
  - `SCHOOL_ADMIN`, `DRIVER`, and `PARENT` are strictly scoped to their JWT `tenant_id`. Any cross-tenant resource access is rejected with HTTP 403/404 without data disclosure.
  - `SUPER_ADMIN` can override tenant context using `?tenantId=...` for cross-school management. Every override read and mutation is recorded in `AuditService`.
- **Invariants**: `RB-01`, `RB-02`, `RB-03`, `RB-04`.
