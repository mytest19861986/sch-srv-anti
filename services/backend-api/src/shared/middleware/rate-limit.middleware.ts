import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: FastifyRequest) => string;
  skip?: (req: FastifyRequest) => boolean;
}

export class InMemoryRateLimiter {
  private buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly defaultOptions: RateLimitOptions) {}

  check(key: string, customOptions?: Partial<RateLimitOptions>): { allowed: boolean; remaining: number; resetInMs: number } {
    const opts = { ...this.defaultOptions, ...customOptions };
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = {
        count: 1,
        resetAt: now + opts.windowMs
      };
      this.buckets.set(key, bucket);
      return {
        allowed: true,
        remaining: opts.maxRequests - 1,
        resetInMs: opts.windowMs
      };
    }

    if (bucket.count >= opts.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetInMs: Math.max(0, bucket.resetAt - now)
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: opts.maxRequests - bucket.count,
      resetInMs: Math.max(0, bucket.resetAt - now)
    };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  clear(): void {
    this.buckets.clear();
  }
}

// Pre-configured rate limiters
export const authRateLimiter = new InMemoryRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000 // 5 login attempts per minute per IP
});

export const apiRateLimiter = new InMemoryRateLimiter({
  maxRequests: 1000,
  windowMs: 60 * 1000 // 1000 requests per minute for high-throughput sync
});

export function createRateLimitHook(limiter: InMemoryRateLimiter, options?: Partial<RateLimitOptions>) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (options?.skip && options.skip(req)) {
      return;
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.ip || '127.0.0.1';
    const userId = (req as any).user?.userId || '';
    const key = options?.keyGenerator ? options.keyGenerator(req) : `${ip}:${userId}`;

    const result = limiter.check(String(key), options);

    reply.header('X-RateLimit-Limit', String(options?.maxRequests || 100));
    reply.header('X-RateLimit-Remaining', String(result.remaining));
    reply.header('X-RateLimit-Reset', String(Math.ceil(result.resetInMs / 1000)));

    if (!result.allowed) {
      reply.header('Retry-After', String(Math.ceil(result.resetInMs / 1000)));
      return reply.status(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
  };
}
