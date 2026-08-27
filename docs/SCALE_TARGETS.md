# Scale Targets & Performance Goals

## 1. System Scale Projections
- **Concurrent Drivers / Vehicles**: 10,000+ active services.
- **Concurrent Students Monitored**: 100,000+ students.
- **Peak Event Ingestion Rate**: 5,000 requests/second during peak school pickup and drop-off windows (7:00-8:30 AM & 1:00-3:00 PM).

## 2. Latency & Reliability SLOs
- **Attendance Event Ingestion Latency**: P95 < 50ms, P99 < 150ms.
- **Idempotency Guarantee**: Exactly-once processing guarantee for duplicate network retries.
- **Outbox Relay Latency**: Event published to broker within < 500ms of DB commit.
- **System Availability**: 99.95% uptime during operational transit windows.

## 3. Data Integrity & Partitioning
- Tenant and service level logical/physical partitioning.
- High-write write-ahead logs with PostgreSQL / TimescaleDB for time-series attendance tracking.
