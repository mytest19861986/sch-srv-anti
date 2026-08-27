import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';

describe('P1 Essentials Suite: Driver One-Touch Call, Parent Absence Report & DB Dump', () => {
  let app: any;
  let baseUrl: string;
  let driverToken: string;
  let parentToken: string;
  let attackerParentToken: string;
  let superAdminToken: string;
  let schoolAdminToken: string;

  beforeEach(async () => {
    const domainRepo = new InMemoryDomainRepository();
    const queueService = new InMemoryOutboxQueueService();
    const attendanceRepo = new InMemoryAttendanceRepository(queueService);
    const userRepo = new InMemoryUserRepository();

    const built = buildApp({
      attendanceRepository: attendanceRepo,
      userRepository: userRepo,
      domainRepository: domainRepo,
      queueService: queueService,
      startWorker: false,
      logger: false
    });
    app = built.app;

    const hash = await built.authService.hashPassword('Demo@1234');
    const tenantId = 'tenant-school-mehr';

    // Seed domain
    await domainRepo.createStudent({
      id: 'student-p1-1',
      tenantId,
      firstName: 'سارا',
      lastName: 'تهرانی',
      grade: 'پایه چهارم'
    });

    const parent = await domainRepo.createParent({
      id: 'parent-p1-1',
      tenantId,
      userId: 'usr-parent-1',
      phoneNumber: '09123456789'
    });

    await domainRepo.linkStudentParent(tenantId, 'student-p1-1', parent.id);

    await domainRepo.createDriver({
      id: 'driver-p1-1',
      tenantId,
      userId: 'usr-driver-1',
      licenseNumber: 'LIC-9988'
    });

    const route = await domainRepo.createRoute({
      id: 'route-p1-1',
      tenantId,
      name: 'مسیر ونک به مدرسه',
      direction: 'TO_SCHOOL'
    });

    await domainRepo.assignStudentToRoute(tenantId, route.id, 'student-p1-1');

    const service = await domainRepo.createService({
      id: 'service-p1-1',
      tenantId,
      routeId: route.id,
      name: 'سرویس ون شماره ۱'
    });

    const shift = await domainRepo.createShift({
      id: 'shift-p1-1',
      tenantId,
      serviceId: service.id,
      startTime: new Date(),
      status: 'ACTIVE'
    });

    await domainRepo.assignDriverToShift(tenantId, 'driver-p1-1', shift.id);

    // Register users
    await userRepo.create({
      id: 'usr-parent-1',
      tenantId,
      email: 'parent@demo.ir',
      passwordHash: hash,
      fullName: 'محمد تهرانی',
      role: 'PARENT',
      isActive: 'true'
    });

    await userRepo.create({
      id: 'usr-driver-1',
      tenantId,
      email: 'driver@demo.ir',
      passwordHash: hash,
      fullName: 'علی راننده',
      role: 'DRIVER',
      isActive: 'true'
    });

    await userRepo.create({
      id: 'usr-parent-attacker',
      tenantId,
      email: 'attacker@demo.ir',
      passwordHash: hash,
      fullName: 'کاربر غیرمجاز',
      role: 'PARENT',
      isActive: 'true'
    });
    await domainRepo.createParent({
      id: 'parent-profile-attacker',
      tenantId,
      userId: 'usr-parent-attacker',
      phoneNumber: '09129999999'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Logins
    const resDriver = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@demo.ir', password: 'Demo@1234' })
    });
    driverToken = (await resDriver.json() as any).access_token;

    const resParent = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'parent@demo.ir', password: 'Demo@1234' })
    });
    parentToken = (await resParent.json() as any).access_token;

    const resAttacker = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'attacker@demo.ir', password: 'Demo@1234' })
    });
    attackerParentToken = (await resAttacker.json() as any).access_token;

    const resSA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'super-admin@platform.ir', password: 'Demo@1234' })
    });
    superAdminToken = (await resSA.json() as any).access_token;

    const resSchool = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'school-admin@demo.ir', password: 'Demo@1234' })
    });
    schoolAdminToken = (await resSchool.json() as any).access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. P1-1: should include contact_phone in Driver Manifest for one-touch dial', async () => {
    const res = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-p1-1`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.manifest.students.length).toBe(1);
    expect(body.manifest.students[0].contact_phone).toBe('09123456789');
    expect(body.manifest.students[0].reported_absent).toBe(false);
  });

  it('2. P1-2: should allow legal parent to submit emergency absence report', async () => {
    const res = await fetch(`${baseUrl}/api/v1/parent/absence-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        child_id: 'student-p1-1',
        date: new Date().toISOString().split('T')[0],
        reason: 'سرماخوردگی دانش‌آموز'
      })
    });

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('ABSENT');
  });

  it('3. P1-2 RBAC: should reject unauthorized parent from reporting absence for other students (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/parent/absence-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${attackerParentToken}`
      },
      body: JSON.stringify({
        child_id: 'student-p1-1',
        date: new Date().toISOString().split('T')[0],
        reason: 'تلاش غیرمجاز'
      })
    });

    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error).toBe('FORBIDDEN');
  });

  it('4. P1-2 Manifest Reflection: Driver Manifest should reflect reported_absent=true', async () => {
    // First parent reports absence
    await fetch(`${baseUrl}/api/v1/parent/absence-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        child_id: 'student-p1-1',
        date: new Date().toISOString().split('T')[0],
        reason: 'کسالت'
      })
    });

    // Driver fetches manifest
    const res = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-p1-1`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.manifest.students[0].reported_absent).toBe(true);
    expect(body.manifest.students[0].attendance_status).toBe('ABSENT');
  });

  it('5. P1-3: should allow Super Admin to trigger DB backup dump and reject School Admin', async () => {
    const saRes = await fetch(`${baseUrl}/api/v1/super-admin/database-dump`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(saRes.status).toBe(200);
    const saBody: any = await saRes.json();
    expect(saBody.dump_id).toBeDefined();
    expect(saBody.status).toBe('COMPLETED');

    const schoolRes = await fetch(`${baseUrl}/api/v1/super-admin/database-dump`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${schoolAdminToken}` }
    });
    expect(schoolRes.status).toBe(403);
  });
});
