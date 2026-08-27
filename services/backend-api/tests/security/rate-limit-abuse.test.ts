import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { authRateLimiter } from '../../src/shared/middleware/rate-limit.middleware.js';

describe('Security Test Suite: Rate Limiting & Abuse Defense', () => {
  let app: any;
  let baseUrl: string;
  let userRepo: InMemoryUserRepository;

  beforeEach(async () => {
    authRateLimiter.clear();
    userRepo = new InMemoryUserRepository();

    const built = buildApp({
      userRepository: userRepo,
      enableRateLimit: true,
      startWorker: false,
      logger: false
    });

    app = built.app;

    const hash = await built.authService.hashPassword('correct-pass');
    await userRepo.create({
      id: 'target-user',
      tenantId: 'school-1',
      email: 'target@school.com',
      passwordHash: hash,
      fullName: 'Target User',
      role: 'DRIVER'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. should allow up to 5 consecutive login attempts within the time window', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'target@school.com',
          password: 'wrong-pass'
        })
      });
      // 401 Invalid Credentials
      expect(res.status).toBe(401);
      expect(res.headers.get('x-ratelimit-remaining')).toBeDefined();
    }
  });

  it('2. should block 6th login attempt with 429 Too Many Requests and Retry-After header', async () => {
    // Send 5 attempts
    for (let i = 0; i < 5; i++) {
      await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'target@school.com',
          password: 'wrong-pass'
        })
      });
    }

    // 6th attempt (even with correct password) must be blocked by Rate Limiter
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'target@school.com',
        password: 'correct-pass'
      })
    });

    expect(res.status).toBe(429);
    const body: any = await res.json();
    expect(body.error).toBe('Too Many Requests');
    expect(body.message).toContain('Rate limit exceeded');
    expect(res.headers.get('retry-after')).toBeDefined();
  });

  it('3. should isolate rate limit buckets by IP address', async () => {
    // Fill bucket for IP 192.168.1.100
    for (let i = 0; i < 5; i++) {
      await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.100'
        },
        body: JSON.stringify({
          email: 'target@school.com',
          password: 'wrong-pass'
        })
      });
    }

    // 6th attempt from IP 192.168.1.100 -> 429
    const blockedRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.100'
      },
      body: JSON.stringify({ email: 'target@school.com', password: 'wrong-pass' })
    });
    expect(blockedRes.status).toBe(429);

    // Legitimate driver from IP 192.168.1.200 can still login successfully
    const allowedRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.200'
      },
      body: JSON.stringify({ email: 'target@school.com', password: 'correct-pass' })
    });
    expect(allowedRes.status).toBe(200);
  });
});
