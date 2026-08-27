# Specification 15: PostgreSQL Streaming Replication & DB Router Design

## 1. Overview
To handle read-heavy parent queries and live school dashboard monitoring without locking transactional attendance ingestion, the database layer employs PostgreSQL 16 Streaming Replication.

---

## 2. Database Router Logic (`DatabaseRouter`)
- **Write Operations** (`INSERT`, `UPDATE`, `DELETE`): ALWAYS directed to `DATABASE_URL` (Primary).
- **Read Operations** (`SELECT` on dashboard overview, parent timelines, manifest):
  - Directed to `DATABASE_REPLICA_URL` when `USE_READ_REPLICA=true`.
  - Fallback to Primary if replica lag exceeds 5 seconds or replica pool is down.

---

## 3. Replication Configuration
- Primary: `wal_level = replica`, `max_wal_senders = 10`, `wal_keep_size = 1GB`.
- Replica: `hot_standby = on`.
