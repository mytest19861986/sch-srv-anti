# 04 - FCM Adapter Design & Flag-Driven Notifications

## 1. Notification Adapter Interface
```typescript
export interface SendNotificationResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationAdapter {
  send(tokens: string[], payload: NotificationPayload): Promise<SendNotificationResult>;
}
```

## 2. Implementations
1. **MockAdapter (`NOTIFICATION_ADAPTER=mock` or undefined):**
   - Logs notification attempts with structured logger.
   - Always returns `successCount = tokens.length`, `failureCount = 0`, `invalidTokens = []`.
   - Never crashes on missing credentials or offline network.
2. **FcmAdapter (`NOTIFICATION_ADAPTER=fcm`):**
   - Uses `firebase-admin` Messaging API (`sendEachForMulticast`).
   - If token is invalid (`messaging/invalid-registration-token` or `messaging/registration-token-not-registered`), adds it to `invalidTokens` for automatic pruning from `device_tokens`.
   - Graceful fallback: If Firebase Admin fails to initialize due to missing config, falls back to `MockAdapter` with a WARNING log.
