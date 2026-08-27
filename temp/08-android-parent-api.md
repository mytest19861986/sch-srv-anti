# Specification 08: Android Parent API Contracts & Schemas

## 1. Authentication

### `POST /api/v1/auth/login`
- **Request Body**:
```json
{
  "email": "parent.reza@gmail.com",
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
    "id": "usr-parent-10",
    "email": "parent.reza@gmail.com",
    "full_name": "رضا محمدی",
    "role": "PARENT",
    "tenant_id": "school_alpha"
  }
}
```

---

## 2. Parent Children List

### `GET /api/v1/parent/children`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "tenant_id": "school_alpha",
  "children": [
    {
      "child_id": "std-1",
      "first_name": "آرش",
      "last_name": "محمدی",
      "grade": "دوم ابتدایی",
      "school_name": "دبستان مهر آفرین",
      "service_name": "سرویس شماره ۴ - ونک",
      "driver_name": "علی رضایی"
    }
  ]
}
```

---

## 3. Child Live Status

### `GET /api/v1/parent/children/:id/status`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "status": {
    "child_id": "std-1",
    "state": "PICKED_UP",
    "last_updated": "2026-08-27T07:25:00.000Z",
    "driver_name": "علی رضایی",
    "service_name": "سرویس شماره ۴",
    "eta_minutes": 15
  }
}
```

---

## 4. Child Attendance Timeline

### `GET /api/v1/parent/children/:id/timeline?date=2026-08-27`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "events": [
    {
      "event_id": "evt-1",
      "event_type": "PICKED_UP",
      "timestamp": "2026-08-27T07:15:00.000Z",
      "title": "سوار سرویس شد",
      "description": "دانش‌آموز در ایستگاه منزل سوار ون شد.",
      "driver_name": "علی رضایی"
    },
    {
      "event_id": "evt-2",
      "event_type": "DROPPED_OFF",
      "timestamp": "2026-08-27T07:45:00.000Z",
      "title": "پیاده شد (مدرسه)",
      "description": "دانش‌آموز سالم به مدرسه تحویل گردید.",
      "driver_name": "علی رضایی"
    }
  ]
}
```

---

## 5. FCM Device Token Registration

### `POST /api/v1/parent/devices/register`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Request Body**:
```json
{
  "token": "fcm_device_token_sample_abc123",
  "platform": "ANDROID"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Device token registered successfully"
}
```
