import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';

describe('Order #15: Event Lifecycle, State Machine & Audit Verification', () => {
  let appInstance: ReturnType<typeof buildApp>;
  let baseUrl: string;
  let driverToken: string;
  let adminToken: string;
  const tenantId = 'school-statemachine-tenant';

  beforeEach(async () => {
    appInstance = buildApp({ enableRateLimit: false });
    await appInstance.app.listen({ port: 0, host: '127.0.0.1' });
    const address = appInstance.app.server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    baseUrl = `http://127.0.0.1:${port}`;

    // Seed Users
    const authService = appInstance.authService;
    const passwordHash = await authService.hashPassword('Password123!');

    await appInstance.userRepository.create({
      id: 'driver-ali',
      tenantId,
      email: 'ali.driver@school.ir',
      passwordHash,
      fullName: 'علی راننده',
      role: 'DRIVER',
      isActive: 'true'
    });

    await appInstance.userRepository.create({
      id: 'admin-modir',
      tenantId,
      email: 'modir@school.ir',
      passwordHash,
      fullName: 'مدیر مدرسه',
      role: 'SCHOOL_ADMIN',
      isActive: 'true'
    });

    // Login Driver
    const driverLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ali.driver@school.ir', password: 'Password123!' })
    });
    const driverLogin = await driverLoginRes.json() as any;
    driverToken = driverLogin.access_token;

    // Login Admin
    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'modir@school.ir', password: 'Password123!' })
    });
    const adminLogin = await adminLoginRes.json() as any;
    adminToken = adminLogin.access_token;
  });

  afterEach(async () => {
    await appInstance.app.close();
  });

  it('1. Valid State Transition: PICKED_UP -> DROPPED_OFF succeeds', async () => {
    const studentId = 'student-s1';
    const serviceId = 'service-101';

    // 1. PICKED_UP
    const pickRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'PICKED_UP',
        client_generated_id: '99999999-9999-4999-8999-999999990001',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(pickRes.status).toBe(201);
    const pickBody = await pickRes.json() as any;
    expect(pickBody.event_type).toBe('PICKED_UP');

    // 2. DROPPED_OFF
    const dropRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'DROPPED_OFF',
        client_generated_id: '99999999-9999-4999-8999-999999990002',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(dropRes.status).toBe(201);
    const dropBody = await dropRes.json() as any;
    expect(dropBody.event_type).toBe('DROPPED_OFF');
  });

  it('2. Invalid Transition: Duplicate PICKED_UP without DROPPED_OFF returns 409 Conflict', async () => {
    const studentId = 'student-s2';
    const serviceId = 'service-101';

    // First PICKED_UP
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'PICKED_UP',
        client_generated_id: '99999999-9999-4999-8999-999999990003',
        client_timestamp: new Date().toISOString()
      })
    });

    // Second PICKED_UP
    const conflictRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'PICKED_UP',
        client_generated_id: '99999999-9999-4999-8999-999999990004',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(conflictRes.status).toBe(409);
    const conflictBody = await conflictRes.json() as any;
    expect(conflictBody.error).toBe('INVALID_STATE_TRANSITION');
  });

  it('3. Invalid Transition: DROPPED_OFF after DROPPED_OFF returns 409 Conflict', async () => {
    const studentId = 'student-s3';
    const serviceId = 'service-101';

    // 1. Initial Drop off
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'DROPPED_OFF',
        client_generated_id: '99999999-9999-4999-8999-999999990005',
        client_timestamp: new Date().toISOString()
      })
    });

    // 2. Second Drop off without pickup
    const dropRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'DROPPED_OFF',
        client_generated_id: '99999999-9999-4999-8999-999999990006',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(dropRes.status).toBe(409);
    const dropBody = await dropRes.json() as any;
    expect(dropBody.error).toBe('INVALID_STATE_TRANSITION');
  });

  it('4. ABSENT transition by SCHOOL_ADMIN succeeds if no activity today', async () => {
    const studentId = 'student-s4';
    const serviceId = 'service-101';

    const absentRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'ABSENT',
        client_generated_id: '99999999-9999-4999-8999-999999990007',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(absentRes.status).toBe(201);
    const absentBody = await absentRes.json() as any;
    expect(absentBody.event_type).toBe('ABSENT');
  });

  it('5. ABSENT recorded by DRIVER is rejected with 403 Forbidden', async () => {
    const studentId = 'student-s5';
    const serviceId = 'service-101';

    const driverAbsent = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'ABSENT',
        client_generated_id: '99999999-9999-4999-8999-999999990008',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(driverAbsent.status).toBe(403);
  });

  it('6. ABSENT is rejected with 409 Conflict if student already picked up today', async () => {
    const studentId = 'student-s6';
    const serviceId = 'service-101';

    // Picked up
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'PICKED_UP',
        client_generated_id: '99999999-9999-4999-8999-999999990009',
        client_timestamp: new Date().toISOString()
      })
    });

    // Admin tries to mark absent
    const adminAbsent = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'ABSENT',
        client_generated_id: '99999999-9999-4999-8999-999999990010',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(adminAbsent.status).toBe(409);
  });

  it('7. CANCELLED soft-invalidates previous event allowing new PICKED_UP', async () => {
    const studentId = 'student-s7';
    const serviceId = 'service-101';

    // Initial Picked up
    const pickRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'PICKED_UP',
        client_generated_id: '99999999-9999-4999-8999-999999990011',
        client_timestamp: new Date().toISOString()
      })
    });
    const pickData = await pickRes.json() as any;
    const origEventId = pickData.event_id;

    // Cancel event
    const cancelRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'CANCELLED',
        cancelled_event_id: origEventId,
        client_generated_id: '99999999-9999-4999-8999-999999990012',
        client_timestamp: new Date().toISOString()
      })
    });
    expect(cancelRes.status).toBe(201);

    // New PICKED_UP can now succeed
    const newPickRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'PICKED_UP',
        client_generated_id: '99999999-9999-4999-8999-999999990013',
        client_timestamp: new Date().toISOString()
      })
    });
    expect(newPickRes.status).toBe(201);
  });

  it('8. CORRECTED by SCHOOL_ADMIN with >=10 chars reason creates Audit Snapshot', async () => {
    const studentId = 'student-s8';
    const serviceId = 'service-101';

    // Original event
    const origRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'PICKED_UP',
        client_generated_id: '99999999-9999-4999-8999-999999990014',
        client_timestamp: new Date().toISOString()
      })
    });
    const origData = await origRes.json() as any;
    const origId = origData.event_id;

    // Admin correction
    const correctRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: serviceId,
        event_type: 'CORRECTED',
        correction_of_event_id: origId,
        correction_reason: 'Parent called in morning: student was mistakenly picked up by neighbor vehicle',
        client_generated_id: '99999999-9999-4999-8999-999999990015',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(correctRes.status).toBe(201);
    const correctData = await correctRes.json() as any;
    expect(correctData.event_type).toBe('CORRECTED');

    // Verify Audit log
    const auditLogs = await appInstance.auditService.getLogs({ tenantId, page: 1, limit: 10 });
    const correctionAudit = auditLogs.logs.find(l => l.action === 'ATTENDANCE_EVENT_CORRECTED');
    expect(correctionAudit).toBeDefined();
    expect(correctionAudit!.changes?.before?.id).toBe(origId);
    expect(correctionAudit!.changes?.after?.correctionReason).toContain('Parent called in morning');
  });

  it('9. CORRECTED with <10 chars reason is rejected with 400 Bad Request', async () => {
    const correctRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        student_id: 'student-s9',
        service_id: 'service-101',
        event_type: 'CORRECTED',
        correction_of_event_id: 1,
        correction_reason: 'short', // < 10 chars
        client_generated_id: '99999999-9999-4999-8999-999999990016',
        client_timestamp: new Date().toISOString()
      })
    });

    expect(correctRes.status).toBe(400);
  });
});
