import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';

describe('Vertical Slice 3: Domain Entities & Driver Manifest Assignment', () => {
  let app: any;
  let attendanceRepo: InMemoryAttendanceRepository;
  let userRepo: InMemoryUserRepository;
  let domainRepo: InMemoryDomainRepository;
  let baseUrl: string;

  let driverTokenSchoolA: string;
  let driverTokenSchoolB: string;

  beforeEach(async () => {
    attendanceRepo = new InMemoryAttendanceRepository();
    userRepo = new InMemoryUserRepository();
    domainRepo = new InMemoryDomainRepository();

    const built = buildApp({
      attendanceRepository: attendanceRepo,
      userRepository: userRepo,
      domainRepository: domainRepo,
      logger: false
    });
    app = built.app;

    const hash = await built.authService.hashPassword('password123');

    // 1. Create Drivers in Auth
    await userRepo.create({
      id: 'driver-user-a',
      tenantId: 'school_a',
      email: 'driver.a@school-a.com',
      passwordHash: hash,
      fullName: 'Driver School A',
      role: 'DRIVER'
    });

    await userRepo.create({
      id: 'driver-user-b',
      tenantId: 'school_b',
      email: 'driver.b@school-b.com',
      passwordHash: hash,
      fullName: 'Driver School B',
      role: 'DRIVER'
    });

    // 2. Setup Domain Entities for School A
    await domainRepo.createDriver({
      id: 'driver-doc-a',
      tenantId: 'school_a',
      userId: 'driver-user-a',
      licenseNumber: 'LIC-A-12345'
    });

    const student1 = await domainRepo.createStudent({
      id: 'student-101',
      tenantId: 'school_a',
      firstName: 'Ali',
      lastName: 'Rezaei',
      grade: '5th'
    });

    const student2 = await domainRepo.createStudent({
      id: 'student-102',
      tenantId: 'school_a',
      firstName: 'Sara',
      lastName: 'Ahmadi',
      grade: '6th'
    });

    // Link Parents (Father & Mother) to Student 1
    const parent1 = await domainRepo.createParent({
      id: 'parent-1',
      tenantId: 'school_a',
      userId: 'user-parent-1',
      phoneNumber: '+989120000001'
    });
    const parent2 = await domainRepo.createParent({
      id: 'parent-2',
      tenantId: 'school_a',
      userId: 'user-parent-2',
      phoneNumber: '+989120000002'
    });
    await domainRepo.linkStudentParent('school_a', student1.id, parent1.id);
    await domainRepo.linkStudentParent('school_a', student1.id, parent2.id);

    // Create Route, Service and Shift in School A
    const routeA = await domainRepo.createRoute({
      id: 'route-a-morning',
      tenantId: 'school_a',
      name: 'North Tehran Line 1',
      direction: 'TO_SCHOOL'
    });

    const serviceA = await domainRepo.createService({
      id: 'service-a-1',
      tenantId: 'school_a',
      routeId: routeA.id,
      name: 'Morning Service 1'
    });

    const shiftA = await domainRepo.createShift({
      id: 'shift-a-1',
      tenantId: 'school_a',
      serviceId: serviceA.id,
      startTime: new Date(),
      status: 'ACTIVE'
    });

    // Assign Students to Route A
    await domainRepo.assignStudentToRoute('school_a', routeA.id, student1.id);
    await domainRepo.assignStudentToRoute('school_a', routeA.id, student2.id);

    // Assign Driver A to Shift A
    await domainRepo.assignDriverToShift('school_a', 'driver-doc-a', shiftA.id);

    // 3. Setup Shift in School B
    await domainRepo.createDriver({
      id: 'driver-doc-b',
      tenantId: 'school_b',
      userId: 'driver-user-b',
      licenseNumber: 'LIC-B-99999'
    });

    const routeB = await domainRepo.createRoute({
      id: 'route-b-morning',
      tenantId: 'school_b',
      name: 'Shiraz Line 2',
      direction: 'TO_SCHOOL'
    });

    const serviceB = await domainRepo.createService({
      id: 'service-b-1',
      tenantId: 'school_b',
      routeId: routeB.id,
      name: 'Morning Service B'
    });

    const shiftB = await domainRepo.createShift({
      id: 'shift-b-1',
      tenantId: 'school_b',
      serviceId: serviceB.id,
      startTime: new Date(),
      status: 'ACTIVE'
    });

    await domainRepo.assignDriverToShift('school_b', 'driver-doc-b', shiftB.id);

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Login Driver A
    const resA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.a@school-a.com', password: 'password123' })
    });
    const bodyA: any = await resA.json();
    driverTokenSchoolA = bodyA.access_token;

    // Login Driver B
    const resB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver.b@school-b.com', password: 'password123' })
    });
    const bodyB: any = await resB.json();
    driverTokenSchoolB = bodyB.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. should allow Driver A to retrieve the active manifest of their assigned shift', async () => {
    const response = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-a-1`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverTokenSchoolA}` }
    });

    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.success).toBe(true);
    expect(body.tenant_id).toBe('school_a');
    expect(body.manifest.shift.id).toBe('shift-a-1');
    expect(body.manifest.route.name).toBe('North Tehran Line 1');
    expect(body.manifest.students.length).toBe(2);

    // Verify Student 1 details & linked parents
    const studentAli = body.manifest.students.find((s: any) => s.student_id === 'student-101');
    expect(studentAli).toBeDefined();
    expect(studentAli.first_name).toBe('Ali');
    expect(studentAli.parent_phones).toEqual(['+989120000001', '+989120000002']);
    expect(studentAli.attendance_status).toBe('NOT_MARKED');
  });

  it('2. should reflect recorded attendance status in the manifest', async () => {
    // Record PICKED_UP for student Ali
    await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverTokenSchoolA}`
      },
      body: JSON.stringify({
        student_id: 'student-101',
        service_id: 'service-a-1',
        event_type: 'PICKED_UP',
        client_generated_id: '55555555-4444-3333-2222-111111111111',
        client_timestamp: new Date().toISOString()
      })
    });

    // Re-fetch manifest
    const response = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-a-1`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverTokenSchoolA}` }
    });

    const body: any = await response.json();
    const studentAli = body.manifest.students.find((s: any) => s.student_id === 'student-101');
    expect(studentAli.attendance_status).toBe('PICKED_UP');
  });

  it('3. should reject Driver A when accessing School B shift with 404/403 (Cross-Tenant Guard)', async () => {
    const response = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-b-1`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverTokenSchoolA}` } // Driver from School A querying Shift from School B
    });

    expect([403, 404]).toContain(response.status);
    const body: any = await response.json();
    expect(body.success).toBe(false);
  });

  it('4. should reject Driver B when accessing an unassigned shift within same school', async () => {
    // Create an unassigned shift in School B
    await domainRepo.createShift({
      id: 'shift-b-unassigned',
      tenantId: 'school_b',
      serviceId: 'service-b-1',
      startTime: new Date(),
      status: 'ACTIVE'
    });

    const response = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-b-unassigned`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${driverTokenSchoolB}` }
    });

    expect(response.status).toBe(403);
    const body: any = await response.json();
    expect(body.error).toBe('FORBIDDEN');
    expect(body.message).toContain('not authorized/assigned');
  });
});
