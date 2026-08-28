import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';

describe('Vertical Slice 1: Attendance Idempotency & Transactional Outbox', () => {
  let app: any;
  let repository: InMemoryAttendanceRepository;
  let userRepo: InMemoryUserRepository;
  let baseUrl: string;
  let authToken: string;

  beforeEach(async () => {
    repository = new InMemoryAttendanceRepository();
    userRepo = new InMemoryUserRepository();
    const built = buildApp({
      attendanceRepository: repository,
      userRepository: userRepo,
      logger: false
    });
    app = built.app;

    const hash = await built.authService.hashPassword('password123');
    await userRepo.create({
      id: 'driver-1',
      tenantId: 'tenant-school-main',
      email: 'driver@school.com',
      passwordHash: hash,
      fullName: 'School Driver',
      role: 'DRIVER'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@school.com', password: 'password123' })
    });
    const loginBody: any = await loginRes.json();
    authToken = loginBody.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('should record a valid attendance event and produce an outbox event', async () => {
    const payload = {
      student_id: 'student-101',
      service_id: 'service-505',
      event_type: 'PICKED_UP',
      client_generated_id: '123e4567-e89b-12d3-a456-426614174000',
      client_timestamp: new Date().toISOString()
    };

    const response = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(201);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.client_generated_id).toBe(payload.client_generated_id);
    expect(body.is_idempotent_replay).toBe(false);

    // Verify Outbox Event created
    const outboxEvents = repository.getOutboxEvents();
    expect(outboxEvents.length).toBe(1);
    expect(outboxEvents[0].status).toBe('pending');
    expect(outboxEvents[0].eventType).toBe('PICKED_UP');
    expect(outboxEvents[0].payload.student_id).toBe('student-101');
    expect(outboxEvents[0].tenantId).toBe('tenant-school-main');
  });

  it('should guarantee idempotency for concurrent requests with identical client_generated_id', async () => {
    const payload = {
      student_id: 'student-202',
      service_id: 'service-707',
      event_type: 'PICKED_UP',
      client_generated_id: '987fcdeb-51a2-43f7-9abc-def012345678',
      client_timestamp: new Date().toISOString()
    };

    // Simulate 5 simultaneous concurrent requests
    const concurrentRequests = Array.from({ length: 5 }).map(() =>
      fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      })
    );

    const responses = await Promise.all(concurrentRequests);

    // All responses must be successful
    for (const res of responses) {
      expect([200, 201]).toContain(res.status);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.client_generated_id).toBe(payload.client_generated_id);
    }

    // Exactly ONE record must exist in attendance events
    const attendanceEvents = repository.getAttendanceEvents();
    expect(attendanceEvents.length).toBe(1);

    // Exactly ONE outbox event must exist (no duplicate side-effects)
    const outboxEvents = repository.getOutboxEvents();
    expect(outboxEvents.length).toBe(1);
  });

  it('should reject invalid payload with schema validation errors', async () => {
    const invalidPayload = {
      student_id: '',
      service_id: 'service-1',
      event_type: 'INVALID_EVENT',
      client_generated_id: 'not-a-uuid',
      client_timestamp: 'invalid-date'
    };

    const response = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify(invalidPayload)
    });

    expect(response.status).toBe(400);
    const body: any = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.details.length).toBeGreaterThan(0);
  });
});
