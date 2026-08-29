import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';

describe('CORS & Preflight Regression Tests (Order #70 Quality Gate)', () => {
  let appInstance: any;
  let baseUrl: string;

  beforeAll(async () => {
    const { app } = buildApp({
      startWorker: false,
      logger: false
    });
    appInstance = app;
    await appInstance.listen({ port: 0, host: '127.0.0.1' });
    const addressInfo = appInstance.server.address();
    baseUrl = `http://127.0.0.1:${addressInfo.port}`;
  });

  afterAll(async () => {
    await appInstance.close();
  });

  it('should handle OPTIONS preflight request with 204 status and CORS headers', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://192.168.1.110:3004',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://192.168.1.110:3004');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
  });

  it('should include CORS headers on normal API responses from Wi-Fi origins', async () => {
    const res = await fetch(`${baseUrl}/health/live`, {
      method: 'GET',
      headers: {
        'Origin': 'http://192.168.1.110:3003'
      }
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://192.168.1.110:3003');
  });
});
