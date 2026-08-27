import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';

describe('Order #42-REV: Super Admin Full Cross-Tenant Override Suite', () => {
  let app: any;
  let baseUrl: string;
  let authService: any;
  let domainRepo: InMemoryDomainRepository;
  let userRepo: InMemoryUserRepository;
  let superAdminToken: string;
  let schoolAdminTokenSchoolA: string;
  let schoolAdminTokenSchoolB: string;

  beforeEach(async () => {
    domainRepo = new InMemoryDomainRepository();
    const queueService = new InMemoryOutboxQueueService();
    const attendanceRepo = new InMemoryAttendanceRepository(queueService);
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
    authService = built.authService;

    const hash = await authService.hashPassword('SuperPass@123');

    // Register Super Admin
    await userRepo.create({
      id: 'super-admin-root',
      email: 'root@platform.ir',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      tenantId: 'system',
      fullName: 'مدیر ارشد پلتفرم',
      isActive: 'true'
    });

    // Register School Admin for School A
    await userRepo.create({
      id: 'admin-a',
      email: 'admin@school-a.ir',
      passwordHash: hash,
      role: 'SCHOOL_ADMIN',
      tenantId: 'school-a',
      fullName: 'مدیر مدرسه الف',
      isActive: 'true'
    });

    // Register School Admin for School B
    await userRepo.create({
      id: 'admin-b',
      email: 'admin@school-b.ir',
      passwordHash: hash,
      role: 'SCHOOL_ADMIN',
      tenantId: 'school-b',
      fullName: 'مدیر مدرسه ب',
      isActive: 'true'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    const resSA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'root@platform.ir', password: 'SuperPass@123' })
    });
    superAdminToken = (await resSA.json() as any).access_token;

    const resA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school-a.ir', password: 'SuperPass@123' })
    });
    schoolAdminTokenSchoolA = (await resA.json() as any).access_token;

    const resB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school-b.ir', password: 'SuperPass@123' })
    });
    schoolAdminTokenSchoolB = (await resB.json() as any).access_token;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. should allow Super Admin to create, view, edit and delete student in any school with ?tenantId=', async () => {
    // Super Admin creates student in school-a
    const createRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        first_name: 'سامان',
        last_name: 'طهماسبی',
        grade: 'پایه پنجم',
        tenantId: 'school-a'
      })
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json() as any;
    expect(created.tenantId).toBe('school-a');
    expect(created.fullName).toBe('سامان طهماسبی');

    // Super Admin views students in school-a
    const listRes = await fetch(`${baseUrl}/api/v1/admin/students?tenantId=school-a`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    expect(listRes.status).toBe(200);
    const list = await listRes.json() as any;
    expect(list.items.some((s: any) => s.id === created.id)).toBe(true);

    // Super Admin patches student in school-a
    const patchRes = await fetch(`${baseUrl}/api/v1/admin/students/${created.id}?tenantId=school-a`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ grade: 'پایه ششم (اصلاح شده)' })
    });
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json() as any;
    expect(patched.grade).toBe('پایه ششم (اصلاح شده)');

    // Super Admin soft deletes student in school-a
    const delRes = await fetch(`${baseUrl}/api/v1/admin/students/${created.id}?tenantId=school-a`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    expect(delRes.status).toBe(200);
  });

  it('2. should strictly deny School Admin from overriding tenantId (403)', async () => {
    // School Admin B tries to pass ?tenantId=school-a
    const res = await fetch(`${baseUrl}/api/v1/admin/students?tenantId=school-a`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${schoolAdminTokenSchoolB}` }
    });
    expect(res.status).toBe(403);
  });

  it('3. should allow Super Admin to manage Drivers and Vehicles across tenants', async () => {
    // Super Admin creates vehicle in school-b
    const vehRes = await fetch(`${baseUrl}/api/v1/admin/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        plate: '۸۸ ج ۹۹۹ ایران ۷۷',
        model: 'ون بنز ویتو',
        capacity: 12,
        tenantId: 'school-b'
      })
    });
    expect(vehRes.status).toBe(201);
    const veh = await vehRes.json() as any;
    expect(veh.tenantId).toBe('school-b');

    // Super Admin creates driver in school-b
    const drvRes = await fetch(`${baseUrl}/api/v1/admin/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        full_name: 'ناصر راننده',
        phone: '09123331100',
        license_no: 'ب-۵۵۴۴۳۳',
        vehicle_id: veh.id,
        tenantId: 'school-b'
      })
    });
    expect(drvRes.status).toBe(201);
    const drv = await drvRes.json() as any;
    expect(drv.tenantId).toBe('school-b');
  });
});
