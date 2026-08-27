# 22 — School Admin Tenant-Scoped API Contracts

All endpoints require `Authorization: Bearer <token>` and `SCHOOL_ADMIN` or `SCHOOL_OPERATOR` role. All queries are strictly scoped to the caller's `tenantId`.

---

## 1. Entity Lists Endpoints

### `GET /api/v1/admin/students`
- **Query Params**: `page` (default: 1), `limit` (default: 10), `q` (search name/nationalCode)
- **Response**: `{ items: StudentDto[], total: number, page: number, limit: number }`

### `GET /api/v1/admin/parents`
- **Query Params**: `page`, `limit`, `q`
- **Response**: `{ items: ParentDto[], total: number, page: number, limit: number }`

### `GET /api/v1/admin/drivers`
- **Query Params**: `page`, `limit`, `q`
- **Response**: `{ items: DriverDto[], total: number, page: number, limit: number }`

### `GET /api/v1/admin/vehicles`
- **Query Params**: `page`, `limit`, `q`
- **Response**: `{ items: VehicleDto[], total: number, page: number, limit: number }` (View over drivers & vehicle plates)

### `GET /api/v1/admin/routes`
- **Query Params**: `page`, `limit`, `q`
- **Response**: `{ items: RouteDto[], total: number, page: number, limit: number }`

### `GET /api/v1/admin/services`
- **Query Params**: `page`, `limit`, `q`, `status`
- **Response**: `{ items: ServiceDto[], total: number, page: number, limit: number }`

---

## 2. Reports Endpoints

### `GET /api/v1/admin/events`
- **Query Params**: `date` (YYYY-MM-DD), `status`, `page`, `limit`
- **Response**: `{ items: EventRecordDto[], total: number, hourlyDistribution: Record<string, number> }`

### `GET /api/v1/admin/audit-logs`
- **Query Params**: `page`, `limit`
- **Response**: `{ items: TenantAuditLogDto[], total: number }`

### `GET /api/v1/admin/notification-logs`
- **Query Params**: `page`, `limit`
- **Response**: `{ items: NotificationLogDto[], total: number }`
