# Specification 17: End-to-End (E2E) Test Scenarios Specification

## 1. Overview
The E2E test suite verifies the end-to-end integration across all system components: Mobile Clients (Driver & Parent), Web Dashboards (School & Super Admin), Backend API, Outbox Worker, Database, Redis, and Object Storage.

---

## 2. Eight Critical E2E Scenarios
1. **Scenario 1: Happy Path Driver**: Driver login → fetch assigned manifest → record `PICKED_UP` → verify transactional outbox row → verify worker fan-out to parent notification.
2. **Scenario 2: Offline-First Driver Sync**: Driver collects attendance offline (3 events) → network reconnects → sends `/api/v1/sync/batch` → receives partial success (`created`, `duplicate`, `conflict`).
3. **Scenario 3: Parent Deep Link & Live Timeline**: Parent receives FCM payload → launches app via deep link `schapp://parent/child/{id}/status` → fetches live child timeline.
4. **Scenario 4: School Dashboard Stale Data Indicator**: Background worker delay simulated (>30s) → Dashboard returns `is_stale: true` → UI renders `<StaleDataBanner />`.
5. **Scenario 5: Super Admin Tenant Provisioning**: Super Admin creates new tenant school → assigns school admin → verifies audit trail log.
6. **Scenario 6: Cross-Tenant IDOR & Privilege Escalation Defense**: Driver A (School Alpha) attempts to query manifest of School Beta or Parent endpoints → rejected with `403 Forbidden` / `404 Not Found`.
7. **Scenario 7: Event Lifecycle Correction & Audit**: School Admin issues `CORRECTED` status with valid 15-char reason → previous event amended → before/after audit snapshot created.
8. **Scenario 8: Graceful Degradation & Queue Drain**: Outbox worker killed → API continues ingesting punches with zero data loss → Worker restarted → Outbox queue completely drains.
