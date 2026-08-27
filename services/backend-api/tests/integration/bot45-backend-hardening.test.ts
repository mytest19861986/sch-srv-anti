import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';

describe('Bot #45: Backend Hardening, CSV Export & Queue Metrics Suite', () => {
  let app: any;
  let baseUrl: string;
  let authService: any;
  let domainRepo: InMemoryDomainRepository;
  let userRepo: InMemoryUserRepository;
  let schoolAdminToken: string;

  beforeEach(async () => {
    domainRepo = new InMemoryDomainRepository();
    const queueService = new InMemoryOutboxQueueService();
    const attendanceRepo = new InMemoryAttendanceRepository(queueService);
    userRepo = new InMemoryUserRepository();

    const built = buildApp({
      attendanceRepository: attendanceRepo,
      userRepository: userRepo,
      domainRepository: domainRepo,
      queueService: queueService,
      startWorker: false,
      logger: false
    });
    app = built.app;
    authService = built.authService;

    const hash = await authService.hashPassword('SchoolPass@123');

    await userRepo.create({
      id: 'admin-school-hardened',
      email: 'admin@school-hardened.ir',
      passwordHash: hash,
      role: 'SCHOOL_ADMIN',
      tenantId: 'school-hardened',
      fullName: 'مدیر مدرسه آزمایشی',
      isActive: 'true'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    const resLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school-hardened.ir', password: 'SchoolPass@123' })
    });
    schoolAdminToken = (await resLogin.json() as any).access_token;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. should export students as UTF-8 CSV with Persian BOM header', async () => {
    // 1. Create a student first
    await fetch(`${baseUrl}/api/v1/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminToken}`
      },
      body: JSON.stringify({
        first_name: 'آرش',
        last_name: 'صادقی',
        grade: 'پایه دوم',
        national_code: '0019283746'
      })
    });

    // 2. Request CSV Export
    const res = await fetch(`${baseUrl}/api/v1/admin/export/students`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${schoolAdminToken}` }
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text).toContain('آرش');
    expect(text).toContain('صادقی');
    expect(text).toContain('پایه دوم');
    expect(text).toContain('شناسه,نام,نام خانوادگی');
  });

  it('2. should serve queue performance metrics under /health/queue-metrics', async () => {
    const res = await fetch(`${baseUrl}/health/queue-metrics`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.status).toBe('HEALTHY');
    expect(data.queue_name).toBe('transactional_outbox_queue');
    expect(typeof data.average_latency_ms).toBe('number');
    expect(data.backpressure_status).toBe('NOMINAL');
  });
});
