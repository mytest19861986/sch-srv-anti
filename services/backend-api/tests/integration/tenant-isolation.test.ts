import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';

describe('Vertical Slice 2: Multi-Tenant Isolation & Role-Based Access Control (RBAC)', () => {
  let app: any;
  let attendanceRepo: InMemoryAttendanceRepository;
  let userRepo: InMemoryUserRepository;
  let baseUrl: string;

  let driverTokenA: string;
  let driverTokenB: string;
  let parentTokenA: string;

  beforeEach(async () => {
    attendanceRepo = new InMemoryAttendanceRepository();
    userRepo = new InMemoryUserRepository();

    const built = buildApp({
      attendanceRepository: attendanceRepo,
      userRepository: userRepo,
      logger: false
    });
    app = built.app;

    // Seed Driver A for School A (tenant_school_a)
    const hash = await built.authService.hashPassword('password123');
    await userRepo.create({
      id: 'driver-a-id',
      tenantId: 'tenant_school_a',
      email: 'driver.a@school-a.com',
      passwordHash: hash,
      fullName: 'Driver School A',
      role: 'DRIVER'
    });

    // Seed Driver B for School B (tenant_school_b)
    await userRepo.create({
      id: 'driver-b-id',
      tenantId: 'tenant_school_b',
      email: 'driver.b@school-b.com',
      passwordHash: hash,
      fullName: 'Driver School B',
      role: 'DRIVER'
    });

    // Seed Parent A for School A (tenant_school_a)
    await userRepo.create({
      id: 'parent-a-id',
      tenantId: 'tenant_school_a',
      email: 'parent.a@school-a.com',
      passwordHash: hash,
      fullName: 'Parent School A',
      role: 'PARENT'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Login Driver A
    const loginResA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.a@school-a.com', password: 'password123' })
    });
    const bodyA: any = await loginResA.json();
    driverTokenA = bodyA.access_token;

    // Login Driver B
    const loginResB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.b@school-b.com', password: 'password123' })
    });
    const bodyB: any = await loginResB.json();
    driverTokenB = bodyB.access_token;

    // Login Parent A
    const loginResParent = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'parent.a@school-a.com', password: 'password123' })
    });
    const bodyParent: any = await loginResParent.json();
    parentTokenA = bodyParent.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. should successfully login and generate valid JWT with tenant context', () => {
    expect(driverTokenA).toBeDefined();
    expect(driverTokenB).toBeDefined();
    expect(parentTokenA).toBeDefined();
  });

  it('2. should reject unauthenticated requests with 401 Unauthorized', async () => {
    const response = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'student-1',
        service_id: 'service-1',
        event_type: 'PICKED_UP',
        client_generated_id: '11111111-1111-1111-1111-111111111111',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(response.status).toBe(401);
    const body: any = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });

  it('3. should allow Driver A to record attendance scoped to tenant_school_a', async () => {
    const payload = {
      student_id: 'student-a-101',
      service_id: 'service-a-1',
      event_type: 'PICKED_UP',
      client_generated_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      client_timestamp: new Date().toISOString()
    };

    const response = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverTokenA}`
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(201);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.client_generated_id).toBe(payload.client_generated_id);

    // Verify event in DB is tagged with tenant_school_a
    const tenantEvents = await attendanceRepo.getAttendanceEventsByTenant('tenant_school_a');
    expect(tenantEvents.length).toBe(1);
    expect(tenantEvents[0].tenantId).toBe('tenant_school_a');
  });

  it('4. should block cross-tenant IDOR attack with 403 Forbidden when Driver A specifies tenant_school_b', async () => {
    const payload = {
      student_id: 'student-b-999',
      service_id: 'service-b-1',
      event_type: 'PICKED_UP',
      client_generated_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      client_timestamp: new Date().toISOString(),
      tenant_id: 'tenant_school_b' // Malicious cross-tenant injection
    };

    const response = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverTokenA}` // Belongs to School A
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(403);
    const body: any = await response.json();
    expect(body.error).toBe('FORBIDDEN');
    expect(body.message).toContain('Cross-tenant data access violation');
  });

  it('5. should enforce RBAC: reject PARENT role from recording attendance with 403 Forbidden', async () => {
    const payload = {
      student_id: 'student-a-101',
      service_id: 'service-a-1',
      event_type: 'PICKED_UP',
      client_generated_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      client_timestamp: new Date().toISOString()
    };

    const response = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentTokenA}` // Parent role
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(403);
    const body: any = await response.json();
    expect(body.error).toBe('FORBIDDEN');
  });

  it('6. should ensure strict multi-tenant query isolation between School A and School B', async () => {
    // Record event in School A
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverTokenA}`
      },
      body: JSON.stringify({
        student_id: 'student-a-1',
        service_id: 'service-a-1',
        event_type: 'PICKED_UP',
        client_generated_id: '11111111-2222-3333-4444-555555555555',
        client_timestamp: new Date().toISOString()
      })
    });

    // Record event in School B
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverTokenB}`
      },
      body: JSON.stringify({
        student_id: 'student-b-1',
        service_id: 'service-b-1',
        event_type: 'PICKED_UP',
        client_generated_id: '66666666-7777-8888-9999-000000000000',
        client_timestamp: new Date().toISOString()
      })
    });

    // Query as Driver A -> Must only see School A's 1 event
    const resA = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverTokenA}` }
    });
    const bodyA: any = await resA.json();
    expect(bodyA.count).toBe(1);
    expect(bodyA.events[0].studentId).toBe('student-a-1');

    // Query as Driver B -> Must only see School B's 1 event
    const resB = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverTokenB}` }
    });
    const bodyB: any = await resB.json();
    expect(bodyB.count).toBe(1);
    expect(bodyB.events[0].studentId).toBe('student-b-1');
  });
});
