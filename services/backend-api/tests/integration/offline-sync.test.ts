import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { SyncService } from '../../src/modules/sync/sync.service.js';

describe('Vertical Slice 5: Offline-First Driver Sync & Conflict Resolution', () => {
  let app: any;
  let attendanceRepo: InMemoryAttendanceRepository;
  let userRepo: InMemoryUserRepository;
  let domainRepo: InMemoryDomainRepository;
  let queueService: InMemoryOutboxQueueService;
  let syncService: SyncService;
  let baseUrl: string;
  let driverToken: string;

  beforeEach(async () => {
    domainRepo = new InMemoryDomainRepository();
    queueService = new InMemoryOutboxQueueService();
    attendanceRepo = new InMemoryAttendanceRepository(queueService);
    userRepo = new InMemoryUserRepository();
    syncService = new SyncService(attendanceRepo);

    const built = buildApp({
      attendanceRepository: attendanceRepo,
      userRepository: userRepo,
      domainRepository: domainRepo,
      queueService: queueService,
      syncService: syncService,
      startWorker: false,
      logger: false
    });

    app = built.app;

    // Seed Driver
    const hash = await built.authService.hashPassword('password123');
    await userRepo.create({
      id: 'driver-u1',
      tenantId: 'school-offline-tenant',
      email: 'driver.sync@school.com',
      passwordHash: hash,
      fullName: 'Sync Driver',
      role: 'DRIVER'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Login driver
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.sync@school.com', password: 'password123' })
    });
    const loginBody: any = await loginRes.json();
    driverToken = loginBody.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. should process offline batch with partial success: 3 created, 1 duplicate, 1 conflict', async () => {
    // Pre-condition: Student 4 has a modern event recorded at 08:30:00
    const modernTime = new Date('2026-08-27T08:30:00.000Z').toISOString();
    await attendanceRepo.recordAttendanceWithOutbox(
      {
        student_id: 'student-4',
        service_id: 'service-1',
        event_type: 'PICKED_UP',
        client_generated_id: '44444444-0000-0000-0000-000000000000',
        client_timestamp: modernTime
      },
      'school-offline-tenant',
      new Date()
    );

    // Prepare 5 offline events simulated from mobile local SQLite:
    // Event 1: Student 1 Picked Up at 07:15 (New -> Created)
    // Event 2: Student 2 Picked Up at 07:20 (New -> Created)
    // Event 3: Student 3 Picked Up at 07:25 (New -> Created)
    // Event 4: Duplicate client_generated_id of Event 1 (Duplicate -> Duplicate)
    // Event 5: Student 4 at 07:05 (Old offline timestamp < modernTime 08:30 -> Conflict)
    const offlineBatchPayload = {
      device_id: 'driver-handset-samsung-a54',
      events: [
        {
          client_generated_id: '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          student_id: 'student-1',
          service_id: 'service-1',
          event_type: 'PICKED_UP',
          client_timestamp: '2026-08-27T07:15:00.000Z',
          sequence_number: 1
        },
        {
          client_generated_id: '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          student_id: 'student-2',
          service_id: 'service-1',
          event_type: 'PICKED_UP',
          client_timestamp: '2026-08-27T07:20:00.000Z',
          sequence_number: 2
        },
        {
          client_generated_id: '33333333-cccc-cccc-cccc-cccccccccccc',
          student_id: 'student-3',
          service_id: 'service-1',
          event_type: 'PICKED_UP',
          client_timestamp: '2026-08-27T07:25:00.000Z',
          sequence_number: 3
        },
        {
          client_generated_id: '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Duplicate of event 1
          student_id: 'student-1',
          service_id: 'service-1',
          event_type: 'PICKED_UP',
          client_timestamp: '2026-08-27T07:15:00.000Z',
          sequence_number: 4
        },
        {
          client_generated_id: '55555555-eeee-eeee-eeee-eeeeeeeeeeee',
          student_id: 'student-4',
          service_id: 'service-1',
          event_type: 'PICKED_UP',
          client_timestamp: '2026-08-27T07:05:00.000Z', // 07:05 < 08:30 (Conflict)
          sequence_number: 5
        }
      ]
    };

    const response = await fetch(`${baseUrl}/api/v1/sync/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify(offlineBatchPayload)
    });

    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.total_received).toBe(5);
    expect(body.created_count).toBe(3);
    expect(body.duplicate_count).toBe(1);
    expect(body.conflict_count).toBe(1);
    expect(body.error_count).toBe(0);

    // Verify individual item statuses
    const res1 = body.results.find((r: any) => r.sequence_number === 1);
    const res2 = body.results.find((r: any) => r.sequence_number === 2);
    const res3 = body.results.find((r: any) => r.sequence_number === 3);
    const res4 = body.results.find((r: any) => r.sequence_number === 4);
    const res5 = body.results.find((r: any) => r.sequence_number === 5);

    expect(res1.status).toBe('created');
    expect(res2.status).toBe('created');
    expect(res3.status).toBe('created');
    expect(res4.status).toBe('duplicate');
    expect(res5.status).toBe('conflict');
    expect(res5.message).toContain('older than latest recorded state');

    // Verify sync metadata recorded for device
    const metaRes = await fetch(`${baseUrl}/api/v1/sync/metadata/driver-handset-samsung-a54`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    expect(metaRes.status).toBe(200);
    const metaBody: any = await metaRes.json();
    expect(metaBody.metadata.deviceId).toBe('driver-handset-samsung-a54');
    expect(metaBody.metadata.pendingCount).toBe(1); // 1 conflict pending review
  });

  it('2. should reject batch exceeding 200 events limit with 400 Bad Request', async () => {
    // Generate 201 dummy events
    const oversizedEvents = Array.from({ length: 201 }).map((_, i) => ({
      client_generated_id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
      student_id: `student-${i}`,
      service_id: 'service-1',
      event_type: 'PICKED_UP',
      client_timestamp: new Date().toISOString(),
      sequence_number: i + 1
    }));

    const response = await fetch(`${baseUrl}/api/v1/sync/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        device_id: 'driver-device-flood',
        events: oversizedEvents
      })
    });

    expect(response.status).toBe(400);
    const body: any = await response.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.details[0].message).toContain('limit of 200');
  });
});
