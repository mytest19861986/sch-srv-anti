# Production Wire-up & Credential Replacement Guide

## 1. Executive Overview
This guide provides explicit, step-by-step instructions for transitioning from the development/mock environment to live production services with real credentials.

---

## 2. Environment Variables & Secret Configuration Matrix

| Service | Environment Variable | Development Default | Production Target |
| :--- | :--- | :--- | :--- |
| **Notification Engine** | `NOTIFICATION_ADAPTER` | `mock` | `fcm` |
| **Firebase Admin SDK** | `FIREBASE_SERVICE_ACCOUNT_KEY` | `""` | Absolute path to downloaded service account JSON |
| **Primary Database** | `DATABASE_URL` | `postgres://user:pass@localhost:5432/...` | Managed PostgreSQL cluster connection URI |
| **Read Replica** | `DATABASE_REPLICA_URL` | `""` | Managed PostgreSQL Read Replica URI |
| **Read Replica Flag** | `USE_READ_REPLICA` | `false` | `true` (when read traffic > 1,000 QPS) |
| **Redis Cache** | `REDIS_URL` | `redis://localhost:6379` | Managed Redis 7+ cluster connection URI |
| **Object Storage** | `STORAGE_TYPE` | `local` | `s3` |
| **S3 Bucket** | `S3_BUCKET` | `school-transport-assets` | AWS S3 / MinIO production bucket name |
| **JWT Secret** | `JWT_SECRET` | `dev_secret` | 64-character cryptographically random string |

---

## 3. Step-by-Step Replacement Instructions

### 3.1. Firebase Cloud Messaging (FCM)
1. Navigate to [Firebase Console](https://console.firebase.google.com/).
2. Select your project → **Project Settings** → **Service Accounts**.
3. Click **Generate new private key** and download the JSON file.
4. Mount the key into the Kubernetes secret or Docker volume:
   ```bash
   kubectl create secret generic fcm-key --from-file=service-account.json=/path/to/key.json -n school-transport
   ```
5. Set `FIREBASE_SERVICE_ACCOUNT_KEY=/etc/secrets/fcm/service-account.json` and `NOTIFICATION_ADAPTER=fcm`.

### 3.2. Domain Name & TLS/SSL Certificates
1. Point your domain DNS `A` records (e.g. `api.schooltransport.ir`, `app.schooltransport.ir`) to your ingress public IP.
2. In Kubernetes, configure Cert-Manager with Let's Encrypt ClusterIssuer:
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: Certificate
   metadata:
     name: school-tls
     namespace: school-transport
   spec:
     secretName: school-tls-secret
     issuerRef:
       name: letsencrypt-prod
       kind: ClusterIssuer
     dnsNames:
       - api.schooltransport.ir
   ```

### 3.3. Verification Checklist After Wire-up
- [ ] Send test push notification: verify receipt on Android physical device within 2 seconds.
- [ ] Inspect Nginx TLS 1.3 handshake with `curl -I https://api.schooltransport.ir/health/live`.
- [ ] Verify Redis cache hit ratio via `redis-cli info stats`.
- [ ] Verify zero data loss in Transactional Outbox during database primary-replica failover test.
