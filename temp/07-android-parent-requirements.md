# Specification 07: Android Parent Application Requirements & UX Flows

## 1. Overview & Core Mission
The Parent Android App provides guardians and parents with peace of mind, delivering real-time status updates, trip milestones, and push notifications when their children board or exit school transport services.

---

## 2. Core Functional Requirements

### 2.1. Child Selector & Multi-Child Support
- If a parent has multiple children registered across different grades or schools, the app presents an intuitive top child selector carousel or dropdown.
- Selecting a child immediately switches context for live status, route, and timeline.

### 2.2. Live Trip Status Screen
- Visual, calming status indicators:
  - `IN_SCHOOL`: فرزند در مدرسه حضور دارد.
  - `PICKED_UP`: سوار سرویس شد (در حال حرکت به سمت مقصد).
  - `DROPPED_OFF`: در مقصد پیاده شد و تحویل گردید.
  - `ABSENT`: غیبت ثبت شده برای امروز.
- Displays vehicle driver name, route details, and estimated arrival/drop-off time.

### 2.3. Event Timeline & History
- Chronological timeline showing daily events with exact timestamps and vehicle details.
- Pull-to-Refresh mechanism for real-time synchronization.

### 2.4. Push Notifications & Deep Linking
- Real-time FCM notifications triggered when an attendance event occurs.
- Payload includes `child_id`, `event_type`, `title`, and `body`.
- Tapping a notification launches the app directly into the corresponding child's Live Status or Timeline screen (`schapp://parent/child/{child_id}/status`).

### 2.5. Privacy & Zero-Trust Access
- Parents are strictly scoped to their own linked children (`tenantId` and `parentId` enforcement).
- Driver contact information is masked or channeled through designated communication channels.

---

## 3. UI/UX Specifications
- Calming, reassurance-oriented color palette (Soft Emerald Green, Sky Blue, Warm Neutral Dark surfaces).
- Full Persian RTL layout support via `LocalLayoutDirection provides LayoutDirection.Rtl`.
- Shimmer skeleton loaders during network fetches.
