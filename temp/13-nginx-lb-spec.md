# Specification 13: Nginx Load Balancer & Traffic Routing Specification

## 1. Overview & Architecture
Nginx serves as the reverse proxy, SSL terminator, and edge rate-limiter for the School Transport Platform. It distributes incoming traffic to upstream backend-api pods while safeguarding critical services from Morning Bursts and DDoS attacks.

---

## 2. Upstream Configuration
- `backend_api_upstream`: Load balances across backend API replicas (`least_conn;`).
- `worker_upstream`: Internal communication routing.

---

## 3. Rate Limiting Zones (Smart Buckets)
To prevent dropping legitimate high-frequency attendance punches from hundreds of drivers simultaneously connecting during the 06:45 - 07:30 peak:
- **Attendance Punch Zone**: `zone=attendance:10m rate=100r/s` with `burst=50 nodelay`.
- **Offline Batch Sync Zone**: `zone=sync:10m rate=50r/s` with `burst=30 nodelay`.
- **Authentication Zone**: `zone=auth:10m rate=5r/m` with `burst=3 nodelay`.

---

## 4. Security & Optimization Directives
- Gzip compression for JSON payloads > 1KB.
- Security Headers: `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `X-XSS-Protection "1; mode=block"`, `Strict-Transport-Security`.
- Health Check Endpoints: `/health/live` and `/health/ready` bypass rate limiting.
