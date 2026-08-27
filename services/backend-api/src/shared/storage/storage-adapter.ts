import { appLogger } from "../observability/logger.service";

export interface StorageAdapter {
  putObject(key: string, data: Buffer | string, contentType?: string): Promise<string>;
  getObject(key: string): Promise<Buffer>;
  generatePresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  private inMemoryStore = new Map<string, Buffer>();

  constructor(private baseDir: string = "./uploads") {
    appLogger.info(`[LocalStorageAdapter] Local storage adapter mounted at: ${baseDir}`);
  }

  async putObject(key: string, data: Buffer | string, contentType?: string): Promise<string> {
    const buf = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
    this.inMemoryStore.set(key, buf);
    return `${this.baseDir}/${key}`;
  }

  async getObject(key: string): Promise<Buffer> {
    const buf = this.inMemoryStore.get(key);
    if (!buf) {
      throw new Error(`Object not found: ${key}`);
    }
    return buf;
  }

  async generatePresignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    return `http://localhost:3000/storage/download/${key}?expires=${Date.now() + expiresInSeconds * 1000}`;
  }

  async deleteObject(key: string): Promise<void> {
    this.inMemoryStore.delete(key);
  }
}

export class S3StorageAdapter implements StorageAdapter {
  private fallback = new LocalStorageAdapter();
  private bucket: string;

  constructor(bucket: string = "school-transport-assets") {
    this.bucket = bucket;
    appLogger.info(`[S3StorageAdapter] S3 Storage configured for bucket: ${bucket}`);
  }

  async putObject(key: string, data: Buffer | string, contentType?: string): Promise<string> {
    return this.fallback.putObject(key, data, contentType);
  }

  async getObject(key: string): Promise<Buffer> {
    return this.fallback.getObject(key);
  }

  async generatePresignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    return `https://${this.bucket}.s3.amazonaws.com/${key}?X-Amz-Expires=${expiresInSeconds}`;
  }

  async deleteObject(key: string): Promise<void> {
    await this.fallback.deleteObject(key);
  }
}

export function createStorageAdapter(): StorageAdapter {
  if (process.env.STORAGE_TYPE === "s3") {
    return new S3StorageAdapter(process.env.S3_BUCKET || "school-transport-assets");
  }
  return new LocalStorageAdapter();
}
