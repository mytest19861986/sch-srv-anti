import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';

describe('Vertical Slice 7: Parent App API, Child Timeline & IDOR Prevention', () => {
  let app: any;
  let attendanceRepo: InMemoryAttendanceRepository;
  let userRepo: InMemoryUserRepository;
  let domainRepo: InMemoryDomainRepository;
  let queueService: InMemoryOutboxQueueService;
  let outboxWorker: any;
  let baseUrl: string;

  let parentTokenA: string;
  let parentTokenB: string;
  let driverToken: string;

  const today = new Date().toISOString().split('T')[0];

  beforeEach(async () => {
    domainRepo = new InMemoryDomainRepository();
    queueService = new InMemoryOutboxQueueService();
    attendanceRepo = new InMemoryAttendanceRepository(queueService);
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
    outboxWorker = built.outboxWorker;

    const hash = await built.authService.hashPassword('password123');

    // 1. Seed Users (Driver, Parent A, Parent B)
    await userRepo.create({
      id: 'driver-u1',
      tenantId: 'school-alborz',
      email: 'driver@alborz.school.com',
      passwordHash: hash,
      fullName: 'School Driver',
      role: 'DRIVER'
    });

    await userRepo.create({
      id: 'user-parent-a',
      tenantId: 'school-alborz',
      email: 'parent.a@family.com',
      passwordHash: hash,
      fullName: 'Parent A (Reza)',
      role: 'PARENT'
    });

    await userRepo.create({
      id: 'user-parent-b',
      tenantId: 'school-alborz',
      email: 'parent.b@family.com',
      passwordHash: hash,
      fullName: 'Parent B (Saeed)',
      role: 'PARENT'
    });

    // 2. Domain Entities: Parents & Students
    const parentA = await domainRepo.createParent({
      id: 'parent-rec-a',
      tenantId: 'school-alborz',
      userId: 'user-parent-a',
      phoneNumber: '+989121111111',
      fcmToken: 'fcm-a'
    });

    const parentB = await domainRepo.createParent({
      id: 'parent-rec-b',
      tenantId: 'school-alborz',
      userId: 'user-parent-b',
      phoneNumber: '+989122222222',
      fcmToken: 'fcm-b'
    });

    const childA1 = await domainRepo.createStudent({
      id: 'student-a1',
      tenantId: 'school-alborz',
      firstName: 'Kian',
      lastName: 'Rezaei',
      grade: '3rd'
    });

    const childA2 = await domainRepo.createStudent({
      id: 'student-a2',
      tenantId: 'school-alborz',
      firstName: 'Ava',
      lastName: 'Rezaei',
      grade: '1st'
    });

    const childB1 = await domainRepo.createStudent({
      id: 'student-b1',
      tenantId: 'school-alborz',
      firstName: 'Mahan',
      lastName: 'Saeedi',
      grade: '4th'
    });

    // Link Parent A to Child A1 and Child A2
    await domainRepo.linkStudentParent('school-alborz', childA1.id, parentA.id);
    await domainRepo.linkStudentParent('school-alborz', childA2.id, parentA.id);

    // Link Parent B to Child B1
    await domainRepo.linkStudentParent('school-alborz', childB1.id, parentB.id);

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Login users
    const resA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'parent.a@family.com', password: 'password123' })
    });
    parentTokenA = (await resA.json() as any).access_token;

    const resB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'parent.b@family.com', password: 'password123' })
    });
    parentTokenB = (await resB.json() as any).access_token;

    const resD = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@alborz.school.com', password: 'password123' })
    });
    driverToken = (await resD.json() as any).access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. should allow Parent A to list their own children and strictly only their children', async () => {
    const response = await fetch(`${baseUrl}/api/v1/parent/children`, {
      headers: { Authorization: `Bearer ${parentTokenA}` }
    });

    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.children.length).toBe(2);

    const ids = body.children.map((c: any) => c.id);
    expect(ids).toContain('student-a1');
    expect(ids).toContain('student-a2');
    expect(ids).not.toContain('student-b1');
  });

  it('2. should prevent IDOR attack: Parent A querying Parent B child status receives 403 Forbidden', async () => {
    const response = await fetch(`${baseUrl}/api/v1/parent/children/student-b1/status`, {
      headers: { Authorization: `Bearer ${parentTokenA}` } // Parent A attempting to access Child B
    });

    expect(response.status).toBe(403);
    const body: any = await response.json();
    expect(body.error).toBe('FORBIDDEN');
    expect(body.message).toContain('IDOR prevented');
  });

  it('3. should provide accurate real-time child status and paginated timeline', async () => {
    // Record PICKED_UP event for child A1
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: 'student-a1',
        service_id: 'service-1',
        event_type: 'PICKED_UP',
        client_generated_id: '77777777-1111-0000-0000-000000000001',
        client_timestamp: new Date().toISOString()
      })
    });

    // Check Child A1 Status -> IN_TRANSIT
    const statusRes = await fetch(`${baseUrl}/api/v1/parent/children/student-a1/status`, {
      headers: { Authorization: `Bearer ${parentTokenA}` }
    });

    expect(statusRes.status).toBe(200);
    const statusBody: any = await statusRes.json();
    expect(statusBody.current_status).toBe('IN_TRANSIT');
    expect(statusBody.last_event.event_type).toBe('PICKED_UP');

    // Check Timeline
    const timelineRes = await fetch(`${baseUrl}/api/v1/parent/children/student-a1/timeline?date=${today}&page=1&limit=10`, {
      headers: { Authorization: `Bearer ${parentTokenA}` }
    });

    expect(timelineRes.status).toBe(200);
    const timelineBody: any = await timelineRes.json();
    expect(timelineBody.timeline.length).toBe(1);
    expect(timelineBody.timeline[0].event_type).toBe('PICKED_UP');
  });

  it('4. should process event via Outbox Worker and show notification log in Parent notifications', async () => {
    // Record event
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: 'student-a1',
        service_id: 'service-1',
        event_type: 'DROPPED_OFF',
        client_generated_id: '77777777-2222-0000-0000-000000000002',
        client_timestamp: new Date().toISOString()
      })
    });

    // Process Outbox Worker batch
    await outboxWorker.processBatch();

    // Check Parent A's notifications endpoint
    const notifRes = await fetch(`${baseUrl}/api/v1/parent/notifications?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${parentTokenA}` }
    });

    expect(notifRes.status).toBe(200);
    const notifBody: any = await notifRes.json();
    expect(notifBody.notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifBody.notifications[0].title).toContain('Kian Rezaei');
    expect(notifBody.notifications[0].status).toBe('sent');
  });
});
