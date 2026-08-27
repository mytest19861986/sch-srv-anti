import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';

describe('Vertical Slice 4: Outbox Worker & Async Notification Dispatcher', () => {
  let app: any;
  let attendanceRepo: InMemoryAttendanceRepository;
  let userRepo: InMemoryUserRepository;
  let domainRepo: InMemoryDomainRepository;
  let queueService: InMemoryOutboxQueueService;
  let notificationService: any;
  let outboxWorker: any;
  let baseUrl: string;
  let driverToken: string;

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
      startWorker: false, // We will control worker manually or via start() in specific tests
      logger: false
    });

    app = built.app;
    notificationService = built.notificationService;
    outboxWorker = built.outboxWorker;

    // Seed Driver
    const hash = await built.authService.hashPassword('password123');
    await userRepo.create({
      id: 'driver-u1',
      tenantId: 'tenant-school-1',
      email: 'driver1@school.com',
      passwordHash: hash,
      fullName: 'School Driver 1',
      role: 'DRIVER'
    });

    // Seed Student
    const student = await domainRepo.createStudent({
      id: 'student-99',
      tenantId: 'tenant-school-1',
      firstName: 'Parsa',
      lastName: 'Tehrani',
      grade: '4th'
    });

    // Seed Two Parents for Student 99 (Fan-out target)
    const parentFather = await domainRepo.createParent({
      id: 'parent-father',
      tenantId: 'tenant-school-1',
      userId: 'u-father',
      phoneNumber: '+989121111111',
      fcmToken: 'fcm-token-father-123'
    });

    const parentMother = await domainRepo.createParent({
      id: 'parent-mother',
      tenantId: 'tenant-school-1',
      userId: 'u-mother',
      phoneNumber: '+989122222222',
      fcmToken: 'fcm-token-mother-456'
    });

    await domainRepo.linkStudentParent('tenant-school-1', student.id, parentFather.id);
    await domainRepo.linkStudentParent('tenant-school-1', student.id, parentMother.id);

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Authenticate driver
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver1@school.com', password: 'password123' })
    });
    const loginBody: any = await loginRes.json();
    driverToken = loginBody.access_token;
  });

  afterEach(async () => {
    outboxWorker.stop();
    await app.close();
  });

  it('1. should process pending outbox events and fan-out notifications to all linked parents', async () => {
    // Record PICKED_UP event
    const postRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: 'student-99',
        service_id: 'service-1',
        event_type: 'PICKED_UP',
        client_generated_id: '11111111-1111-1111-1111-111111111111',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(postRes.status).toBe(201);

    // Verify Outbox Record is 'pending' before worker runs
    const initialRecords = queueService.getAllRecords();
    expect(initialRecords.length).toBe(1);
    expect(initialRecords[0].status).toBe('pending');
    expect(initialRecords[0].retryCount).toBe(0);

    // Run Worker Batch
    const result = await outboxWorker.processBatch();
    expect(result.processedCount).toBe(1);
    expect(result.failedCount).toBe(0);

    // Verify Outbox Record status changed to 'processed'
    const processedRecords = queueService.getAllRecords();
    expect(processedRecords[0].status).toBe('processed');
    expect(processedRecords[0].processedAt).toBeDefined();

    // Verify Parent Fan-out (2 notifications dispatched for 2 parents)
    const history = notificationService.getDispatchedHistory();
    expect(history.length).toBe(2);
    expect(history.map((h: any) => h.phoneNumber)).toContain('+989121111111');
    expect(history.map((h: any) => h.phoneNumber)).toContain('+989122222222');
    expect(history[0].eventType).toBe('PICKED_UP');
  });

  it('2. should handle simulated notification failure with exponential backoff and retry increment', async () => {
    // Simulate FCM service failure
    notificationService.shouldSimulateFailure = true;

    const res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: 'student-99',
        service_id: 'service-1',
        event_type: 'DROPPED_OFF',
        client_generated_id: '22222222-2222-2222-2222-222222222222',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(res.status).toBe(201);

    // Run batch with failing external service
    const result = await outboxWorker.processBatch();
    expect(result.processedCount).toBe(0);
    expect(result.failedCount).toBe(1);

    // Verify record remains in queue with retryCount = 1 and lastError
    const records = queueService.getAllRecords();
    expect(records.length).toBe(1);
    expect(records[0].status).toBe('pending');
    expect(records[0].retryCount).toBe(1);
    expect(records[0].lastError).toContain('FCM_SERVICE_UNAVAILABLE');
    expect(records[0].nextRetryAt.getTime()).toBeGreaterThan(Date.now() - 100);

    // Recover external service and re-process after retry time
    notificationService.shouldSimulateFailure = false;
    records[0].nextRetryAt = new Date(Date.now() - 1000); // simulate delay elapsed

    const recoverResult = await outboxWorker.processBatch();
    expect(recoverResult.processedCount).toBe(1);
    expect(records[0].status).toBe('processed');
  });

  it('3. should guarantee Decoupling: API latency remains fast even with simulated notification delay', async () => {
    // Simulate 300ms network delay in notification dispatcher
    notificationService.simulatedLatencyMs = 300;

    // Start background worker
    outboxWorker.start();

    const start = performance.now();
    const response = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: 'student-99',
        service_id: 'service-1',
        event_type: 'PICKED_UP',
        client_generated_id: '33333333-3333-3333-3333-333333333333',
        client_timestamp: new Date().toISOString()
      })
    });
    const duration = performance.now() - start;

    expect(response.status).toBe(201);
    // Ingestion API must respond fast (well under 100ms on local)
    expect(duration).toBeLessThan(100);

    // Wait for background worker to process without blocking client
    await new Promise(resolve => setTimeout(resolve, 450));

    const records = queueService.getAllRecords();
    expect(records.find((r: any) => r.clientGeneratedId === '33333333-3333-3333-3333-333333333333')?.status || records[0].status).toBe('processed');
  });
});
