# 02 - Notification Contract & Device Token Management

## 1. Device Token Registration API
- **Endpoint:** `POST /api/v1/parent/devices/register`
- **Auth:** `PARENT` Role required with `tenantId` scope.
- **Request Body:**
  ```json
  {
    "token": "fcm_device_token_string_here",
    "platform": "ANDROID" // or "IOS" | "WEB"
  }
  ```
- **Response:** `201 Created` with device token record.

## 2. Device Token Deregistration API
- **Endpoint:** `DELETE /api/v1/parent/devices/:deviceId`
- **Auth:** `PARENT` Role required (caller must own the device record).
- **Response:** `200 OK` `{ "success": true }`

## 3. Database Schema: `device_tokens`
```sql
CREATE TABLE IF NOT EXISTS device_tokens (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    parent_id VARCHAR(64) NOT NULL,
    token TEXT NOT NULL,
    platform VARCHAR(16) NOT NULL, -- 'ANDROID', 'IOS', 'WEB'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_parent_token UNIQUE (parent_id, token)
);
```

## 4. Multi-cast Notification Flow
When an attendance event is dispatched by Outbox Worker:
1. Find all parent IDs linked to the student.
2. Query active device tokens for those parents.
3. Call `NotificationAdapter.send(tokens, payload)`.
4. If FCM reports invalid/unregistered tokens (`messaging/invalid-registration-token` or `messaging/registration-token-not-registered`), automatically prune dead tokens from `device_tokens`.
