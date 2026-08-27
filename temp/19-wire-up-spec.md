# Specification 19: Production Wire-up & Real Credential Replacement Specification

## 1. Overview
This specification details how to transition from local mock adapters to live third-party production providers:
1. **Firebase Cloud Messaging (FCM)**:
   - Provide `FIREBASE_SERVICE_ACCOUNT_KEY` JSON file path.
   - Set `NOTIFICATION_ADAPTER=fcm`.
2. **Domain & SSL**:
   - Install Certbot / Let's Encrypt certificates.
   - Bind Nginx to port 443 with TLS 1.3.
3. **SMS OTP Provider**:
   - Set `SMS_PROVIDER_API_KEY` (Kavenegar / Ghasedak).
4. **PostgreSQL & Redis**:
   - Set strong production passwords in Kubernetes Secrets.
