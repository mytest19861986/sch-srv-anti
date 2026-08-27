import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { loadTestConfig } from './load-test-config.js';

describe('Load Test: Attendance Write Critical Path', () => {
  let app: any;
  let baseUrl: string;
  let driverToken: string;

  beforeEach(async () => {
    const userRepo = new InMemoryUserRepository();
    const built = buildApp({
      userRepository: userRepo,
      startWorker: true,
      logger: false
    });

    app = built.app;

    const hash = await built.authService.hashPassword('password123');
    await userRepo.create({
      id: 'driver-load-tester',
      tenantId: 'school-load-tenant',
      email: 'driver.load@school.com',
      passwordHash: hash,
      fullName: 'Driver Load Tester',
      role: 'DRIVER'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.load@school.com', password: 'password123' })
    });
    driverToken = (await loginRes.json() as any).access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should sustain high-throughput attendance writes with average latency under 10ms per request', async () => {
    const totalRequests = 50;
    const latencies: number[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let idx = 0; idx < totalRequests; idx++) {
      const start = performance.now();
      try {
        const res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${driverToken}`
          },
          body: JSON.stringify({
            student_id: `student-${idx}`,
            service_id: 'service-1',
            event_type: 'PICKED_UP',
            client_generated_id: `00000000-0000-0000-0000-${String(idx).padStart(12, '0')}`,
            client_timestamp: new Date().toISOString()
          })
        });

        const elapsed = performance.now() - start;
        latencies.push(elapsed);

        if (res.status === 201) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (err) {
        failureCount++;
      }
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    expect(successCount).toBe(totalRequests);
    expect(failureCount).toBe(0);
    expect(avg).toBeLessThan(15); // Average execution under 15ms
    expect(p95).toBeLessThan(loadTestConfig.thresholds.p95LatencyMs);

    // Verify metrics snapshot endpoint
    const metricsRes = await fetch(`${baseUrl}/health/metrics`);
    expect(metricsRes.status).toBe(200);
    const metrics: any = await metricsRes.json();
    expect(metrics.attendance.success_total).toBeGreaterThanOrEqual(totalRequests);
  });
});
