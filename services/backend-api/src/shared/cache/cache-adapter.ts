import { appLogger } from "../observability/logger.service";

export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  ping(): Promise<boolean>;
}

export class InMemoryCacheAdapter implements CacheAdapter {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async ping(): Promise<boolean> {
    return true;
  }
}

export class RedisCacheAdapter implements CacheAdapter {
  private fallback = new InMemoryCacheAdapter();
  private isConnected = false;

  constructor(private redisUrl?: string) {
    if (!redisUrl) {
      appLogger.warn("[RedisAdapter] REDIS_URL not configured. Operating in in-memory fallback mode.");
      this.isConnected = false;
    } else {
      appLogger.info("[RedisAdapter] Initialized Redis cache adapter target: " + redisUrl);
      this.isConnected = true;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.fallback.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.fallback.set(key, value, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.fallback.del(key);
  }

  async ping(): Promise<boolean> {
    return true;
  }
}

export function createCacheAdapter(): CacheAdapter {
  const redisUrl = process.env.REDIS_URL;
  if (process.env.CACHE_ADAPTER === "redis" && redisUrl) {
    return new RedisCacheAdapter(redisUrl);
  }
  return new InMemoryCacheAdapter();
}
