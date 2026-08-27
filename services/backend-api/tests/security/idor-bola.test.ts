import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { randomUUID } from 'crypto';

describe('Security Penetration Test Suite: IDOR & BOLA Defense', () => {
  let app: any;
  let baseUrl: string;
  let userRepo: InMemoryUserRepository;
  let domainRepo: InMemoryDomainRepository;
  let attendanceRepo: InMemoryAttendanceRepository;
  let authService: any;

  let driverTokenA: string;
  let driverTokenB: string;
  let parentTokenA: string;
  let parentTokenB: string;
  let schoolAdminTokenA: string;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    domainRepo = new InMemoryDomainRepository();
    attendanceRepo = new InMemoryAttendanceRepository();

    const built = buildApp({
      userRepository: userRepo,
      domainRepository: domainRepo,
      attendanceRepository: attendanceRepo,
      startWorker: false,
      logger: false
    });

    app = built.app;
    authService = built.authService;

    const hash = await authService.hashPassword('secret123');

    // Users for School Alpha
    await userRepo.create({
      id: 'driver-alpha-1',
      tenantId: 'school_alpha',
      email: 'driver.alpha@alpha.edu',
      passwordHash: hash,
      fullName: 'Driver Alpha',
      role: 'DRIVER'
    });

    await userRepo.create({
      id: 'parent-alpha-1',
      tenantId: 'school_alpha',
      email: 'parent.alpha@alpha.edu',
      passwordHash: hash,
      fullName: 'Parent Alpha',
      role: 'PARENT'
    });

    await userRepo.create({
      id: 'admin-alpha-1',
      tenantId: 'school_alpha',
      email: 'admin.alpha@alpha.edu',
      passwordHash: hash,
      fullName: 'Admin Alpha',
      role: 'SCHOOL_ADMIN'
    });

    // Users for School Beta
    await userRepo.create({
      id: 'driver-beta-1',
      tenantId: 'school_beta',
      email: 'driver.beta@beta.edu',
      passwordHash: hash,
      fullName: 'Driver Beta',
      role: 'DRIVER'
    });

    await userRepo.create({
      id: 'parent-beta-1',
      tenantId: 'school_beta',
      email: 'parent.beta@beta.edu',
      passwordHash: hash,
      fullName: 'Parent Beta',
      role: 'PARENT'
    });

    // Domain data: Parents
    await domainRepo.createParent({
      id: 'p-alpha-1',
      tenantId: 'school_alpha',
      userId: 'parent-alpha-1',
      phoneNumber: '09121111111'
    });

    await domainRepo.createParent({
      id: 'p-beta-1',
      tenantId: 'school_beta',
      userId: 'parent-beta-1',
      phoneNumber: '09122222222'
    });

    // Domain data: Students
    await domainRepo.createStudent({
      id: 'student-alpha-1',
      tenantId: 'school_alpha',
      firstName: 'Ali',
      lastName: 'Alpha',
      grade: '5'
    });

    await domainRepo.createStudent({
      id: 'student-beta-1',
      tenantId: 'school_beta',
      firstName: 'Reza',
      lastName: 'Beta',
      grade: '6'
    });

    await domainRepo.linkStudentParent('school_alpha', 'student-alpha-1', 'p-alpha-1');
    await domainRepo.linkStudentParent('school_beta', 'student-beta-1', 'p-beta-1');

    await domainRepo.createDriver({
      id: 'd-alpha-1',
      tenantId: 'school_alpha',
      userId: 'driver-alpha-1',
      licenseNumber: 'LIC-A1'
    });

    await domainRepo.createDriver({
      id: 'd-beta-1',
      tenantId: 'school_beta',
      userId: 'driver-beta-1',
      licenseNumber: 'LIC-B1'
    });

    await domainRepo.createShift({
      id: 'shift-beta-1',
      tenantId: 'school_beta',
      serviceId: 'service-beta-1',
      startTime: new Date(),
      status: 'SCHEDULED'
    });

    await domainRepo.assignDriverToShift('school_beta', 'd-beta-1', 'shift-beta-1');

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Generate JWT Tokens
    const loginRes = async (email: string) => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'secret123' })
      });
      const data = await res.json();
      return (data as any).access_token;
    };

    driverTokenA = await loginRes('driver.alpha@alpha.edu');
    driverTokenB = await loginRes('driver.beta@beta.edu');
    parentTokenA = await loginRes('parent.alpha@alpha.edu');
    parentTokenB = await loginRes('parent.beta@beta.edu');
    schoolAdminTokenA = await loginRes('admin.alpha@alpha.edu');
  });

  afterEach(async () => {
    await app.close();
  });

  it('Penetration Attack 1 [BOLA]: Driver of School Alpha attempts to record attendance claiming School Beta tenant context', async () => {
    const res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverTokenA}`,
        'x-tenant-id': 'school_beta' // Malicious header tampering
      },
      body: JSON.stringify({
        student_id: 'student-beta-1',
        service_id: 'service-beta-1',
        event_type: 'PICKED_UP',
        client_generated_id: randomUUID(),
        client_timestamp: new Date().toISOString()
      })
    });

    // Guard must detect token tenant (school_alpha) != requested tenant (school_beta)
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error).toContain('FORBIDDEN');
  });

  it('Penetration Attack 2 [IDOR]: Driver of School Alpha attempts to read Shift Manifest of School Beta', async () => {
    const res = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-beta-1`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${driverTokenA}`
      }
    });

    // Cross-tenant data must NOT be exposed -> 404 Not Found within tenant context
    expect(res.status).toBe(404);
  });

  it('Penetration Attack 3 [IDOR]: Parent Alpha attempts to snoop real-time status of Parent Beta child', async () => {
    const res = await fetch(`${baseUrl}/api/v1/parent/children/student-beta-1/status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${parentTokenA}`
      }
    });

    // Strict parent-student relationship verification must block snoop attempt
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.message).toContain('IDOR prevented');
  });

  it('Penetration Attack 4 [IDOR]: Parent Alpha attempts to snoop historical timeline of Parent Beta child', async () => {
    const res = await fetch(`${baseUrl}/api/v1/parent/children/student-beta-1/timeline?date=2026-08-27`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${parentTokenA}`
      }
    });

    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.message).toContain('IDOR prevented');
  });

  it('Penetration Attack 5 [Privilege Escalation]: School Admin attempts to invoke Super Admin tenant creation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminTokenA}`
      },
      body: JSON.stringify({
        id: 'rogue-school',
        name: 'Rogue School',
        code: 'ROGUE',
        admin_email: 'rogue@rogue.com',
        admin_name: 'Rogue Admin',
        admin_password: 'Password123!'
      })
    });

    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error).toContain('FORBIDDEN');
  });

  it('Penetration Attack 6 [Privilege Escalation]: Driver attempts to query Parent children endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/v1/parent/children`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${driverTokenA}`
      }
    });

    expect(res.status).toBe(403);
  });

  it('Penetration Attack 7 [Mass Assignment / Injection]: Unauthenticated caller attempts SQL/NoSQL injection payload in login', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "' OR 1=1 --",
        password: 'any'
      })
    });

    // Zod validator must reject non-email formatted string with 400 Bad Request
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});
