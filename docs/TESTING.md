# Testing Strategy & Load Test Plan

## 1. Test Pyramid & Coverage
The project enforces 100% automated integration test coverage across all 8 Vertical Slices:

| Suite | File | Tests | Focus |
|---|---|---|---|
| Slice 1 | `attendance-idempotency.test.ts` | 3 | Atomic DB Lock, Idempotent Replays, Outbox Generation |
| Slice 2 | `tenant-isolation.test.ts` | 6 | JWT Verification, Cross-Tenant Guard, RBAC Enforcement |
| Slice 3 | `driver-assignment.test.ts` | 4 | Shift Manifest, Driver Authorization, Attendance Status |
| Slice 4 | `outbox-worker.test.ts` | 3 | Outbox Polling, Parent Fan-Out, Exponential Backoff |
| Slice 5 | `offline-sync.test.ts` | 2 | 200-Event Cap, Partial Success, Chronological Conflict |
| Slice 6 | `dashboard-read-model.test.ts` | 3 | Incremental Summary Aggregation, Staleness Detection |
| Slice 7 | `parent-app.test.ts` | 4 | Parent Children Isolation, IDOR Block, Event Timeline |
| Slice 8 | `super-admin.test.ts` | 3 | Tenant Lifecycle, User Roles, Immutable Audit Logs |
| **Total** | **8 Test Suites** | **28 Tests** | **170 Assertions (100% Passing)** |

---

## 2. Load Testing Strategy

### Critical Path: Attendance Write Ingestion
- **Target Rate:** 1,000 requests/sec peak (Morning Rush 07:00 - 08:30)
- **Target Latency (P95):** < 50ms
- **Target Error Rate:** < 0.01%

### Staged Load Test Scenarios:
1. **Stage 1 (Baseline):** 50 concurrent virtual users (VUs) sending 500 events over 10 seconds.
2. **Stage 2 (Morning Peak Surge):** 200 VUs sending 2,000 events/sec simulating school bell ring.
3. **Stage 3 (Network Reconnection Storm):** 50 drivers simultaneously replaying 100 offline events each (5,000 batch sync events).
