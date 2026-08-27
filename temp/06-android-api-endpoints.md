# Specification 06: Android Driver API Contracts & Schemas

## 1. Authentication Endpoint

### `POST /api/v1/auth/login`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "email": "driver.ali@school.ir",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "access_token": "eyJhbGciOi...",
  "expires_in": 86400,
  "user": {
    "id": "usr-driver-1",
    "email": "driver.ali@school.ir",
    "full_name": "علی راننده",
    "role": "DRIVER",
    "tenant_id": "tenant-school-tehran-1"
  }
}
```

---

## 2. Driver Manifest Endpoint

### `GET /api/v1/attendance/manifest?shift_id={shift_id}`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "tenant_id": "tenant-school-tehran-1",
  "manifest": {
    "shift_id": "shift-101",
    "service_id": "srv-vanak-1",
    "route_name": "مسیر ونک - تجریش",
    "driver_name": "علی راننده",
    "total_students": 15,
    "students": [
      {
        "student_id": "std-1",
        "first_name": "آرش",
        "last_name": "محمدی",
        "grade": "دوم ابتدایی",
        "attendance_status": "NOT_RECORDED",
        "parent_phones": ["09121112233"]
      }
    ]
  }
}
```

---

## 3. Real-Time Single Attendance Ingestion

### `POST /api/v1/attendance/events`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "student_id": "std-1",
  "service_id": "srv-vanak-1",
  "event_type": "PICKED_UP",
  "client_generated_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_timestamp": "2026-08-27T07:15:00.000Z"
}
```
- **Responses**:
  - `201 Created`: Event accepted and committed to Transactional Outbox.
  - `200 OK`: Idempotent replay of previously accepted UUID.
  - `409 Conflict`: Invalid state machine transition (`{"error": "INVALID_STATE_TRANSITION"}`).

---

## 4. Offline Batch Sync Ingestion

### `POST /api/v1/sync/batch`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "device_id": "driver-samsung-a54",
  "batch_id": "bch-20260827-001",
  "events": [
    {
      "student_id": "std-1",
      "service_id": "srv-vanak-1",
      "event_type": "PICKED_UP",
      "client_generated_id": "550e8400-e29b-41d4-a716-446655440000",
      "client_timestamp": "2026-08-27T07:15:00.000Z"
    }
  ]
}
```
- **Response `200 OK` (Partial Success Matrix)**:
```json
{
  "success": true,
  "summary": {
    "total_received": 1,
    "created_count": 1,
    "duplicate_count": 0,
    "conflict_count": 0,
    "error_count": 0
  },
  "results": [
    {
      "client_generated_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "created",
      "event_id": "evt-908"
    }
  ]
}
```
