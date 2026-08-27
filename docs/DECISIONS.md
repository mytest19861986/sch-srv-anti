# Architecture Decision Records (ADRs)

## Summary of Recorded Decisions

| Number | Decision Title | Status | Impact / Rationale |
|---|---|---|---|
| **ADR-001** | Modular Monolith instead of Microservices on Day 1 | ✅ Approved | Simple operational overhead, strict domain boundaries, fast deployments. |
| **ADR-002** | Transactional Outbox for Decoupling Side-Effects | ✅ Approved | Critical attendance write path is completely decoupled from async notification push services. |
| **ADR-003** | PostgreSQL Primary Database with Partition-Ready Schema | ✅ Approved | Reliable relational consistency with composite tenant partitioning readiness. |
| **ADR-004** | Client-Generated UUID Idempotency | ✅ Approved | Atomic DB deduplication without CPU wastage or duplicate event insertion under retries. |
| **ADR-005** | Strict Multi-Tenant Isolation via JWT Scope and Guards | ✅ Approved | Cross-tenant data leaks and BOLA/IDOR vulnerabilities are blocked at the middleware layer. |
| **ADR-006** | Role-Based Access Control (RBAC) Hierarchy | ✅ Approved | Enforces granular roles: `DRIVER`, `PARENT`, `SCHOOL_ADMIN`, `SUPER_ADMIN`. |
| **ADR-007** | Offline-First Sync with Batch Replay & Partial Success | ✅ Approved | Handsets sync up to 200 events per request with `created`, `duplicate`, and `conflict` granularity. |
| **ADR-008** | CQRS-lite Read Model for School Dashboard | ✅ Approved | Fast pre-aggregated `attendance_daily_summary` updated incrementally by the Outbox Worker. |
| **ADR-009** | Immutable Append-Only Audit Trail | ✅ Approved | Privilege changes, tenant modifications, and security actions are recorded irreversibly. |
| **ADR-010** | Database-Backed Queue with `FOR UPDATE SKIP LOCKED` for Day 1 | ✅ Approved | Eliminates external infrastructure dependencies while ensuring worker concurrency. |
| **ADR-011** | Progressive Load Testing & Backpressure Validation | ✅ Approved | Validated 1,220+ RPS write burst and 3,870+ events/sec batch ingestion with zero data loss and strict decoupled latency. |
