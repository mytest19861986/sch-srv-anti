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
| **ADR-012** | Time-based Range Partitioning for High-Volume Attendance Events | ✅ Approved | Triggers at 20M records or 50GB storage. Monthly range partitioning with zero-downtime dual-write swap. |
| **ADR-013** | Queue Evolution from PostgreSQL Outbox to Redis BullMQ / Message Broker | ✅ Approved | Database queue handles up to 2,000 EPS. Beyond 500K users / 2,000 EPS, migrates cleanly to BullMQ/Kafka without altering domain API. |
| **ADR-014** | Read Replica Routing for School Dashboards and Parent Status Queries | ✅ Approved | High read volumes (>1,500 QPS) route to PostgreSQL Read Replicas, isolating critical driver write ingestion pipeline. |
