# Specification 11: Web Dashboards API Contracts & Schemas

## 1. School Dashboard Endpoints

### `GET /api/v1/dashboard/overview?date=YYYY-MM-DD`
- **Response**:
```json
{
  "success": true,
  "summary": {
    "date": "2026-08-27",
    "total_students": 120,
    "picked_up_count": 85,
    "dropped_off_count": 70,
    "pending_count": 30,
    "absent_count": 5,
    "is_stale": false,
    "last_updated": "2026-08-27T07:45:00.000Z"
  }
}
```

### `GET /api/v1/dashboard/live-services?date=YYYY-MM-DD&page=1&limit=10`
- **Response**:
```json
{
  "success": true,
  "services": [
    {
      "service_id": "srv-1",
      "route_name": "مسیر ونک",
      "driver_name": "علی رضایی",
      "driver_phone": "09121112233",
      "total_students": 15,
      "picked_up_count": 10,
      "dropped_off_count": 8,
      "status": "IN_PROGRESS"
    }
  ]
}
```

---

## 2. Super Admin Endpoints

### `GET /api/v1/super-admin/overview`
- **Response**:
```json
{
  "success": true,
  "metrics": {
    "total_tenants": 12,
    "total_students": 3400,
    "total_drivers": 180,
    "total_events_today": 6200
  }
}
```

### `GET /api/v1/super-admin/tenants`
- **Response**:
```json
{
  "success": true,
  "tenants": [
    {
      "id": "tenant-school-tehran-1",
      "name": "مدرسه مهر آفرین",
      "code": "sch_mehr",
      "is_active": true,
      "created_at": "2026-01-15T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/v1/super-admin/tenants`
- **Request Body**: `{"name": "مدرسه البرز", "code": "sch_alborz"}`

### `DELETE /api/v1/super-admin/tenants/:id`
- **Response**: `{"success": true, "message": "Tenant soft-deleted successfully"}`
