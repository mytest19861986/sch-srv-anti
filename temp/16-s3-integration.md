# Specification 16: S3-Compatible Object Storage & StorageAdapter Specification

## 1. Overview
Object storage is utilized for attendance report exports (CSV / Excel), archived audit trails, and notification attachment files.

---

## 2. Storage Adapter Pattern
- **Interface**:
```typescript
export interface StorageAdapter {
  putObject(key: string, data: Buffer | string, contentType?: string): Promise<string>;
  getObject(key: string): Promise<Buffer>;
  generatePresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
```
- **Implementations**:
  - `S3Adapter`: Uses AWS S3 SDK (compatible with AWS S3, MinIO, and LocalStack).
  - `LocalStorageAdapter`: Persists files to `./uploads/` directory during local development and testing.
