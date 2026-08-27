# Specification 05: Android Driver Application Requirements & UX State Matrix

## 1. Overview & Core Mission
The Driver Android App is the mission-critical, offline-first edge client in the school transport platform. It enables drivers to record student boardings (`PICKED_UP`) and drop-offs (`DROPPED_OFF`) in real-time or completely disconnected offline environments.

---

## 2. Core Architectural Pillars

### 2.1. Offline-First Guarantee (Local Persistence First)
- **Rule**: Every attendance action MUST be persisted into local Room DB *before* any network attempt.
- **Client Generated UUID**: Every event is minted with a client-side UUID v4 (`client_generated_id`).
- **Immediate Visual Feedback**: UI updates immediately upon local DB write with status `QUEUED` (or `PENDING`).

### 2.2. Intelligent Background Sync (WorkManager & SyncEngine)
- **Batch Processing**: Groups pending events into chunks of up to 200 items and dispatches to `/api/v1/sync/batch`.
- **Exponential Backoff**: In case of transient network failure (e.g. cellular blind spots), retries with exponential backoff ($2^n \times \text{delay}$).
- **Partial Success Handling**:
  - `created` / `duplicate`: Mark local event as `SYNCED`.
  - `conflict`: Mark local event as `CONFLICT` (Amber warning in UI). NEVER delete or discard the event.
  - `error`: Increment `retry_count`, record `server_error_message`, retain in `PENDING` queue.

### 2.3. Security & Multi-Tenancy
- Store JWT access token in `EncryptedSharedPreferences`.
- On `401 Unauthorized` response from backend, flush credentials and transition UI to Login screen.

---

## 3. UI/UX Specifications

### 3.1. Persian RTL & Typography
- Explicit RTL layout via `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl)`.
- Large, high-contrast touch targets (min 48dp, optimized for single-hand / thumb tap while vehicle is safely parked).

### 3.2. Student Item UI State Matrix
| State | Badge Text (Farsi) | Color Indicator | Description |
| :--- | :--- | :--- | :--- |
| `NOT_RECORDED` | در انتظار | Neutral Gray | No action taken yet for this shift. |
| `QUEUED` | در صف ارسال | Blue / Info | Saved in Room DB, awaiting network sync. |
| `SYNCING` | در حال ارسال... | Animated Cyan | Active HTTP batch in-flight. |
| `SYNCED` | همگام‌سازی شد | Emerald Green | Successfully acknowledged by server. |
| `CONFLICT` | تداخل وضعیت | Amber / Orange | Server rejected transition (e.g. student already marked ABSENT). |
| `FAILED` | خطای ارسال | Crimson Red | Max retries exceeded; manual retry available. |

---

## 4. Manifest & Shift Execution Flow
1. Driver logs in with credentials $\to$ receives JWT token with `tenant_id` and driver claims.
2. App fetches active shift manifest via `GET /api/v1/attendance/manifest?shift_id={shift_id}`.
3. Manifest lists all assigned students with their sequence, pickup/drop-off stop, and parent contact numbers.
4. One-Tap Attendance Actions:
   - Green Button: **سوار شد (PICKED_UP)**
   - Blue Button: **پیاده شد (DROPPED_OFF)**
   - Long-Press / Overflow Menu: **گزارش غیبت (ABSENT)**
