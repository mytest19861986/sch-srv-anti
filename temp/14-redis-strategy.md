# Specification 14: Redis Caching Strategy & Rate Limiting Backing Store

## 1. Overview
Redis 7+ is deployed to provide sub-millisecond hot query caching, session management, and sliding-window distributed rate limiting.

---

## 2. Key Cache Namespaces & TTL Policies
1. **Driver Manifest Cache**:
   - Key: `cache:manifest:{driverId}:{shiftId}:{date}`
   - TTL: 60 seconds (invalidated immediately upon shift reassignment).
2. **School Dashboard Overview Cache**:
   - Key: `cache:dashboard:overview:{tenantId}:{date}`
   - TTL: 30 seconds.
3. **Session Cache**:
   - Key: `session:{userId}`
   - TTL: 24 hours.

---

## 3. Application Cache Adapter Pattern
- **Interface**:
```typescript
export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  ping(): Promise<boolean>;
}
```
- **Implementations**:
  - `RedisAdapter`: Connects to `REDIS_URL`.
  - `InMemoryAdapter`: In-memory Map fallback for local testing without Redis.
  - Automatic fallback to `InMemoryAdapter` if Redis is unreachable.
