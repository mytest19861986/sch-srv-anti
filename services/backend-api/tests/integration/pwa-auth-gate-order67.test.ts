import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { FastifyInstance } from 'fastify';

describe('Order #67 Quality Gate: Strict Auth Gate & Real API Integration for PWAs', () => {
  let app: FastifyInstance;
  let baseUrl: string;
  let driverToken: string;
  let parentToken: string;
  let student1Id: string;
  let student2Id: string;

  beforeAll(async () => {
    const built = buildApp({
      logger: false,
      startWorker: false
    });
    app = built.app;

    const tenantId = 'tenant-school-mehr';

    // 1. Seed Users
    const driverPass = await built.authService.hashPassword('DriverPass@123');
    const parentPass = await built.authService.hashPassword('ParentPass@123');

    await built.userRepository.create({
      id: 'usr-driver-67',
      tenantId,
      email: 'driver@serviceyar.ir',
      passwordHash: driverPass,
      fullName: 'مرتضی نوری',
      role: 'DRIVER',
      isActive: 'true'
    });

    await built.userRepository.create({
      id: 'usr-parent-67',
      tenantId,
      email: 'parent@serviceyar.ir',
      passwordHash: parentPass,
      fullName: 'محمد احمدی',
      role: 'PARENT',
      isActive: 'true'
    });

    // 2. Seed Domain Entities
    const parentDomain = await built.domainRepository.createParent({
      id: 'parent-67',
      tenantId,
      userId: 'usr-parent-67',
      phoneNumber: '09121112233'
    });

    const driverDomain = await built.domainRepository.createDriver({
      id: 'driver-67',
      tenantId,
      userId: 'usr-driver-67',
      licenseNumber: '۳۳ع۴۵۶-۱۱'
    });

    const std1 = await built.domainRepository.createStudent({
      id: 'std-67-1',
      tenantId,
      firstName: 'علی',
      lastName: 'احمدی',
      grade: 'پایه پنجم'
    });
    student1Id = std1.id;

    const std2 = await built.domainRepository.createStudent({
      id: 'std-67-2',
      tenantId,
      firstName: 'سارا',
      lastName: 'احمدی',
      grade: 'پایه سوم'
    });
    student2Id = std2.id;

    await built.domainRepository.linkStudentParent(tenantId, std1.id, parentDomain.id);
    await built.domainRepository.linkStudentParent(tenantId, std2.id, parentDomain.id);

    const route = await built.domainRepository.createRoute({
      id: 'route-67',
      tenantId,
      name: 'مسیر ۱ — کارگر شمالی و فاطمی',
      direction: 'TO_SCHOOL'
    });

    await built.domainRepository.assignStudentToRoute(tenantId, route.id, std1.id);
    await built.domainRepository.assignStudentToRoute(tenantId, route.id, std2.id);

    const service = await built.domainRepository.createService({
      id: 'srv-67',
      tenantId,
      routeId: route.id
    });

    const shift = await built.domainRepository.createShift({
      id: 'shift-67',
      tenantId,
      serviceId: service.id,
      startTime: new Date(),
      status: 'ACTIVE'
    });

    await built.domainRepository.assignDriverToShift(tenantId, driverDomain.id, shift.id);

    await app.listen({ port: 0, host: '127.0.0.1' });
    const addr: any = app.server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Auth Gate: Unauthenticated requests to driver manifest or parent children are rejected with 401', async () => {
    const resDriver = await fetch(`${baseUrl}/api/v1/attendance/manifest`);
    expect(resDriver.status).toBe(401);

    const resParent = await fetch(`${baseUrl}/api/v1/parent/children`);
    expect(resParent.status).toBe(401);
  });

  it('2. Login Gate: Rejects wrong password with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'driver@serviceyar.ir',
        password: 'WrongPassword'
      })
    });
    expect(res.status).toBe(401);
  });

  it('3. Driver Login & Real Manifest: Driver authenticates and fetches live student manifest', async () => {
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'driver@serviceyar.ir',
        password: 'DriverPass@123'
      })
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json() as any;
    expect(loginBody.token || loginBody.access_token).toBeDefined();
    expect(loginBody.user.role).toBe('DRIVER');
    driverToken = loginBody.token || loginBody.access_token;

    const manifestRes = await fetch(`${baseUrl}/api/v1/attendance/manifest`, {
      headers: {
        authorization: `Bearer ${driverToken}`
      }
    });
    expect(manifestRes.status).toBe(200);
    const manifestBody = await manifestRes.json() as any;
    expect(manifestBody.manifest.route.name).toBe('مسیر ۱ — کارگر شمالی و فاطمی');
    expect(manifestBody.manifest.students.length).toBe(2);
    expect(manifestBody.manifest.students[0].first_name).toBe('علی');
  });

  it('4. Parent Login & Child Isolation: Parent authenticates and retrieves strictly their own linked children', async () => {
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'parent@serviceyar.ir',
        password: 'ParentPass@123'
      })
    });
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json() as any;
    expect(loginBody.token || loginBody.access_token).toBeDefined();
    expect(loginBody.user.role).toBe('PARENT');
    parentToken = loginBody.token || loginBody.access_token;

    const childrenRes = await fetch(`${baseUrl}/api/v1/parent/children`, {
      headers: {
        authorization: `Bearer ${parentToken}`
      }
    });
    expect(childrenRes.status).toBe(200);
    const childrenBody = await childrenRes.json() as any;
    expect(childrenBody.children.length).toBe(2);
    expect(childrenBody.children[0].firstName).toBe('علی');
    expect(childrenBody.children[1].firstName).toBe('سارا');
  });

  it('5. End-to-End Live Workflow: Driver records PICKED_UP and Parent receives updated real status', async () => {
    const recordRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${driverToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        student_id: student1Id,
        event_type: 'PICKED_UP',
        service_id: 'srv-67',
        client_generated_id: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        client_timestamp: new Date().toISOString(),
        location: { lat: 35.72, lng: 51.39 }
      })
    });
    expect([200, 201]).toContain(recordRes.status);

    // Parent queries child status
    const statusRes = await fetch(`${baseUrl}/api/v1/parent/children/${student1Id}/status`, {
      headers: {
        authorization: `Bearer ${parentToken}`
      }
    });
    expect(statusRes.status).toBe(200);
    const statusBody = await statusRes.json() as any;
    expect(statusBody.current_status).toBe('IN_TRANSIT');
    expect(statusBody.last_event.event_type).toBe('PICKED_UP');

    // Parent queries child timeline
    const timelineRes = await fetch(`${baseUrl}/api/v1/parent/children/${student1Id}/timeline`, {
      headers: {
        authorization: `Bearer ${parentToken}`
      }
    });
    expect(timelineRes.status).toBe(200);
    const timelineBody = await timelineRes.json() as any;
    expect(timelineBody.timeline.length).toBeGreaterThanOrEqual(1);
    expect(timelineBody.timeline[0].event_type).toBe('PICKED_UP');
  });

  it('6. Absence Reporting: Parent submits absence report and Driver manifest reflects it', async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const absenceRes = await fetch(`${baseUrl}/api/v1/parent/absence-reports`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${parentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        child_id: student2Id,
        date: todayStr,
        reason: 'سرماخوردگی فصلی'
      })
    });
    expect(absenceRes.status).toBe(201);

    // Driver fetches manifest again
    const manifestRes = await fetch(`${baseUrl}/api/v1/attendance/manifest`, {
      headers: {
        authorization: `Bearer ${driverToken}`
      }
    });
    expect(manifestRes.status).toBe(200);
    const manifestBody = await manifestRes.json() as any;
    const std2Manifest = manifestBody.manifest.students.find((s: any) => s.student_id === student2Id);
    expect(std2Manifest).toBeDefined();
    expect(std2Manifest.reported_absent).toBe(true);
    expect(std2Manifest.attendance_status).toBe('ABSENT');
  });
});
