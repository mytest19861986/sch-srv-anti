import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { DashboardService } from '../../src/modules/dashboard/dashboard.service.js';

describe('Vertical Slice 6: School Dashboard Read Model & Live Aggregation', () => {
  let app: any;
  let attendanceRepo: InMemoryAttendanceRepository;
  let userRepo: InMemoryUserRepository;
  let domainRepo: InMemoryDomainRepository;
  let queueService: InMemoryOutboxQueueService;
  let dashboardService: DashboardService;
  let outboxWorker: any;
  let baseUrl: string;
  let adminToken: string;
  let driverToken: string;

  const today = new Date().toISOString().split('T')[0];

  beforeEach(async () => {
    domainRepo = new InMemoryDomainRepository();
    queueService = new InMemoryOutboxQueueService();
    attendanceRepo = new InMemoryAttendanceRepository(queueService);
    userRepo = new InMemoryUserRepository();
    dashboardService = new DashboardService(domainRepo, attendanceRepo);

    const built = buildApp({
      attendanceRepository: attendanceRepo,
      userRepository: userRepo,
      domainRepository: domainRepo,
      queueService: queueService,
      dashboardService: dashboardService,
      startWorker: false,
      logger: false
    });

    app = built.app;
    outboxWorker = built.outboxWorker;

    const hash = await built.authService.hashPassword('password123');

    // 1. Seed School Admin & Driver
    await userRepo.create({
      id: 'admin-1',
      tenantId: 'school-tehran-1',
      email: 'admin@tehran1.school.com',
      passwordHash: hash,
      fullName: 'School Admin',
      role: 'SCHOOL_ADMIN'
    });

    await userRepo.create({
      id: 'driver-1',
      tenantId: 'school-tehran-1',
      email: 'driver@tehran1.school.com',
      passwordHash: hash,
      fullName: 'Driver Tehran',
      role: 'DRIVER'
    });

    // 2. Seed Route, Service & 5 Students
    const route = await domainRepo.createRoute({
      id: 'route-north-1',
      tenantId: 'school-tehran-1',
      name: 'Vanak - Tajrish Route',
      direction: 'TO_SCHOOL'
    });

    const service = await domainRepo.createService({
      id: 'service-vanak-1',
      tenantId: 'school-tehran-1',
      routeId: route.id,
      name: 'Morning Bus #101'
    });

    for (let i = 1; i <= 5; i++) {
      const student = await domainRepo.createStudent({
        id: `student-v${i}`,
        tenantId: 'school-tehran-1',
        firstName: `Student${i}`,
        lastName: `Tehrani`,
        grade: '5th'
      });
      await domainRepo.assignStudentToRoute('school-tehran-1', route.id, student.id);
    }

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Login Admin
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@tehran1.school.com', password: 'password123' })
    });
    adminToken = (await adminRes.json() as any).access_token;

    // Login Driver
    const driverRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@tehran1.school.com', password: 'password123' })
    });
    driverToken = (await driverRes.json() as any).access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. should update daily summary incrementally via worker and serve fast overview & live-services', async () => {
    // Record 5 attendance events (3 PICKED_UP, 2 DROPPED_OFF)
    const events = [
      { student_id: 'student-v1', event_type: 'PICKED_UP', client_generated_id: '11111111-0000-0000-0000-000000000001' },
      { student_id: 'student-v2', event_type: 'PICKED_UP', client_generated_id: '11111111-0000-0000-0000-000000000002' },
      { student_id: 'student-v3', event_type: 'PICKED_UP', client_generated_id: '11111111-0000-0000-0000-000000000003' },
      { student_id: 'student-v1', event_type: 'DROPPED_OFF', client_generated_id: '11111111-0000-0000-0000-000000000004' },
      { student_id: 'student-v2', event_type: 'DROPPED_OFF', client_generated_id: '11111111-0000-0000-0000-000000000005' }
    ];

    for (const ev of events) {
      await fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        },
        body: JSON.stringify({
          student_id: ev.student_id,
          service_id: 'service-vanak-1',
          event_type: ev.event_type,
          client_generated_id: ev.client_generated_id,
          client_timestamp: new Date().toISOString()
        })
      });
    }

    // Process Outbox Batch (Worker updates incremental aggregates)
    const batchRes = await outboxWorker.processBatch();
    expect(batchRes.processedCount).toBe(5);

    // Query Dashboard Overview
    const overviewRes = await fetch(`${baseUrl}/api/v1/dashboard/overview?date=${today}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(overviewRes.status).toBe(200);
    const overview: any = await overviewRes.json();
    expect(overview.success).toBe(true);
    expect(overview.summary.total_services).toBe(1);
    expect(overview.summary.total_students).toBe(5);
    expect(overview.summary.total_picked_up).toBe(3);
    expect(overview.summary.total_dropped_off).toBe(2);
    expect(overview.summary.total_pending).toBe(2); // 5 total - 3 picked up = 2 pending
    expect(overview.is_stale).toBe(false);

    // Query Live Services list
    const liveRes = await fetch(`${baseUrl}/api/v1/dashboard/live-services?date=${today}&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(liveRes.status).toBe(200);
    const liveBody: any = await liveRes.json();
    expect(liveBody.services.length).toBe(1);
    expect(liveBody.services[0].service_name).toBe('Morning Bus #101');
    expect(liveBody.services[0].picked_up_count).toBe(3);
    expect(liveBody.services[0].dropped_off_count).toBe(2);
  });

  it('2. should indicate stale data with is_stale: true when summary has not been updated for > 30s', async () => {
    // Increment summary then artificially set updatedAt to 40 seconds ago
    await dashboardService.incrementDailySummary(
      'school-tehran-1',
      'service-vanak-1',
      'PICKED_UP',
      new Date()
    );

    const fortySecondsAgo = new Date(Date.now() - 40 * 1000);
    dashboardService.setSummaryUpdatedAt('school-tehran-1', today, 'service-vanak-1', fortySecondsAgo);

    const overviewRes = await fetch(`${baseUrl}/api/v1/dashboard/overview?date=${today}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const overview: any = await overviewRes.json();
    expect(overview.is_stale).toBe(true);
    expect(overview.data_freshness_seconds).toBeGreaterThanOrEqual(35);
  });

  it('3. should provide detailed service breakdown with individual student statuses', async () => {
    // Record student 1 picked up
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: 'student-v1',
        service_id: 'service-vanak-1',
        event_type: 'PICKED_UP',
        client_generated_id: '22222222-1111-0000-0000-000000000001',
        client_timestamp: new Date().toISOString()
      })
    });

    const detailRes = await fetch(`${baseUrl}/api/v1/dashboard/service-detail/service-vanak-1?date=${today}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(detailRes.status).toBe(200);
    const detail: any = await detailRes.json();
    expect(detail.success).toBe(true);
    expect(detail.service.id).toBe('service-vanak-1');
    expect(detail.students.length).toBe(5);

    const s1 = detail.students.find((s: any) => s.student_id === 'student-v1');
    const s2 = detail.students.find((s: any) => s.student_id === 'student-v2');
    expect(s1.status).toBe('PICKED_UP');
    expect(s2.status).toBe('PENDING');
  });
});
