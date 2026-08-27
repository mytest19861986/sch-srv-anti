# Production Deployment & Infrastructure Runbook

## 1. Overview & Architecture Topology
The School Transport Platform is designed as a modular, high-resilience, multi-tenant system with the following infrastructure layers:
- **Nginx Reverse Proxy & Load Balancer**: Handles SSL termination, gzip compression, and rate limiting with smart burst buckets (100 r/s for attendance, 50 r/s for sync, 5 r/m for auth).
- **Backend API Cluster**: Fastify / Bun / Node.js stateless workers.
- **Transactional Outbox Worker**: Decoupled asynchronous notification dispatcher.
- **PostgreSQL 16 High-Availability Cluster**: Primary (Read/Write) with Streaming Replication to Read Replica.
- **Redis 7+ In-Memory Cache**: Sub-millisecond session caching and hot query acceleration with fallback.
- **S3 / LocalStack Storage**: Object storage for CSV/Excel attendance exports and audit archives.

---

## 2. Local Stack Execution (Docker Compose)
To start the entire production-grade stack locally:
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

---

## 3. Kubernetes Deployment (K8s)
Apply base manifests:
```bash
kubectl apply -k infrastructure/k8s/base/
```

---

## 4. Disaster Recovery & Replication Lag Thresholds
- If Read Replica lag exceeds **5 seconds**, `DatabaseRouter` automatically diverts all queries to the Primary database.
- Redis disconnect triggers automatic fallback to in-memory cache without service interruption.
