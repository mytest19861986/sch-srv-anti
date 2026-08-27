# Changelog
All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-rc.2] - 2026-08-27
### Added
- **Official Branding & Domain**: Established "سرویس یار" (ServiceYar) brand ecosystem under `serviceyar.ir`.
- **School Admin IA Redesign**: Integrated persistent RTL sidebar, entity lists (`/students`, `/parents`, `/drivers`, `/vehicles`, `/routes`, `/services`), and report pages (`/reports/events`, `/reports/audit-logs`, `/reports/notifications`).
- **Super Admin IA Redesign**: Added comprehensive platform administration sidebar with tenant lifecycle management, global user filtering, platform settings editor, and growth metrics.
- **Mobile Android Releases**: Generated installable APK artifacts for Driver and Parent apps.
- **Protocol v3 Evidence**: Captured high-resolution UI snapshots across all authenticated routes.

## [1.0.0-rc.1] - 2026-08-27 (Phase 17 & 18: Production Deployment & Final Handoff)
### Added
- **Order #13 (Stage 17):** Multi-stage Dockerfiles for Backend API and Outbox Worker.
- **Order #13 (Stage 17):** Complete Kubernetes manifests (Kustomize Base, Staging, Prod) with Prometheus Custom Metrics HPA.
- **Order #13 (Stage 17):** GitHub Actions CI/CD pipeline with automated linting, typechecking, testing, secret scanning, and rolling deployment.
- **Order #13 (Stage 17):** SRE Runbooks playbooks for Morning Burst Failures, Queue Saturation, and DB Connection Leak.
- **Order #14 (Stage 18):** Final documentation sync, architectural handoff package, and [KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

---

## [0.3.0] - 2026-08-27 (Phase 13 to 16: Security Gate & Capacity Planning)
### Added
- **Order #11 (Stage 15):** Comprehensive Security Audit, IDOR/BOLA Penetration Testing Suite (`idor-bola.test.ts`), and Rate Limit Abuse tests (`rate-limit-abuse.test.ts`).
- **Order #11 (Stage 15):** Automated secret scanning scripts (`secret-scan.sh` / `secret-scan.ps1`).
- **Order #11 (Stage 15):** Formal Security Review Report ([SECURITY_REVIEW_REPORT.md](docs/SECURITY_REVIEW_REPORT.md)) with 0 open critical/high vulnerabilities.
- **Order #12 (Stage 16):** Capacity Planning and Scaling Evolution Matrix ([CAPACITY_PLAN.md](docs/CAPACITY_PLAN.md)) with M/M/c queuing theory and 1M+ student storage growth models.
- **Order #12 (Stage 16):** Observability alert thresholds and scaling triggers (`alerts-thresholds.ts`).
- **Order #12 (Stage 16):** ADR-012 (Partitioning), ADR-013 (Queue Evolution), and ADR-014 (Read Replica Strategy).

---

## [0.2.0] - 2026-08-27 (Phase 6 to 12: Core Domain Features & Load Testing)
### Added
- **Order #4 (Stage 6):** Transactional Outbox Worker and asynchronous notification dispatcher with exponential backoff.
- **Order #5 (Stage 7):** Offline-first driver sync with batch replay (up to 200 events) and granular conflict resolution.
- **Order #6 (Stage 8):** CQRS-lite Read Model for School Dashboard (`attendance_daily_summary`).
- **Order #7 (Stage 9):** Parent Mobile App API with child status timeline and strict anti-IDOR validation.
- **Order #8 (Stage 10):** Super Admin platform management, tenant provisioning, and immutable append-only audit logging.
- **Order #9 (Stage 13):** Production Observability suite (Prometheus metrics, Structured JSON Logger, W3C Traceparent propagation).
- **Order #10 (Stage 14):** Progressive Load & Performance Benchmarking (1,220+ RPS ingestion, 3,870+ EPS batch processing).

---

## [0.1.0] - 2026-08-27 (Phase 1 to 5: Foundation & Multi-Tenancy)
### Added
- **Order #1 (Stage 1-3):** Repository initialization, modular monolith structure, PostgreSQL schema, and Transactional Outbox.
- **Order #1 (Stage 3):** Vertical Slice 1: Attendance `PICKED_UP` event ingestion with client-generated UUID idempotency.
- **Order #2 (Stage 4):** Vertical Slice 2: Multi-Tenant JWT authentication, RBAC guards, and tenant context isolation.
- **Order #3 (Stage 5):** Vertical Slice 3: Domain entities (Students, Parents, Drivers, Shifts) and Driver Shift Manifest endpoints.
