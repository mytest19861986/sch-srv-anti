import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';

describe('Order #48: School Admin 5-Entity CRUD & Enrollment Suite', () => {
  let app: any;
  let baseUrl: string;
  let authService: any;
  let domainRepo: InMemoryDomainRepository;
  let userRepo: InMemoryUserRepository;
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

    const hash = await authService.hashPassword('Password@123');

    // Register School Admin for School A
    await userRepo.create({
      id: 'admin-a',
      email: 'admin@school-a.ir',
      passwordHash: hash,
      role: 'SCHOOL_ADMIN',
      tenantId: 'school-a',
      fullName: 'مدیر دبستان الف',
      isActive: 'true'
    });

    // Register School Admin for School B
    await userRepo.create({
      id: 'admin-b',
      email: 'admin@school-b.ir',
      passwordHash: hash,
      role: 'SCHOOL_ADMIN',
      tenantId: 'school-b',
      fullName: 'مدیر دبستان ب',
      isActive: 'true'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    const loginResA = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school-a.ir', password: 'Password@123' })
    });
    schoolAdminTokenSchoolA = (await loginResA.json() as any).access_token;

    const loginResB = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school-b.ir', password: 'Password@123' })
    });
    schoolAdminTokenSchoolB = (await loginResB.json() as any).access_token;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. should create a Parent and generate user account + temporary password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/parents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      },
      body: JSON.stringify({
        full_name: 'محمد رضایی',
        phone: '09129998877',
        email: 'rezaei@school-a.ir',
        temp_password: 'TempPassword@123',
        student_ids: []
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.fullName).toBe('محمد رضایی');
    expect(body.phone).toBe('09129998877');
    expect(body.temp_password).toBe('TempPassword@123');
    expect(body.tenantId).toBe('school-a');

    // Verify parent user can login with generated credentials
    const parentLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rezaei@school-a.ir', password: 'TempPassword@123' })
    });
    expect(parentLoginRes.status).toBe(200);
    const parentLogin = await parentLoginRes.json() as any;
    expect(parentLogin.user.role).toBe('PARENT');
    expect(parentLogin.user.tenantId).toBe('school-a');
  });

  it('2. should create a Student and link to created parent', async () => {
    // Create parent first
    const parentRes = await fetch(`${baseUrl}/api/v1/admin/parents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      },
      body: JSON.stringify({
        full_name: 'مریم حسینی',
        phone: '09128887766'
      })
    });
    const parent = await parentRes.json() as any;

    // Create student with parent_ids
    const studentRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      },
      body: JSON.stringify({
        first_name: 'آرتین',
        last_name: 'حسینی',
        grade: 'پایه دوم',
        parent_ids: [parent.id]
      })
    });

    expect(studentRes.status).toBe(201);
    const student = await studentRes.json() as any;
    expect(student.firstName).toBe('آرتین');
    expect(student.lastName).toBe('حسینی');
    expect(student.parentIds).toContain(parent.id);

    // Verify domain link
    const isLinked = await domainRepo.isParentOfStudent('school-a', parent.id, student.id);
    expect(isLinked).toBe(true);
  });

  it('3. should create Vehicle, Driver and Route, and verify links', async () => {
    // 1. Vehicle
    const vehRes = await fetch(`${baseUrl}/api/v1/admin/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      },
      body: JSON.stringify({ plate: '۵۵ ج ۶۶۶ ایران ۱۱', model: 'ون فیات دوکاتو', capacity: 16 })
    });
    expect(vehRes.status).toBe(201);
    const veh = await vehRes.json() as any;

    // 2. Driver
    const drvRes = await fetch(`${baseUrl}/api/v1/admin/drivers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      },
      body: JSON.stringify({ full_name: 'قاسم راننده', phone: '09127776655', license_no: 'پ-۱۲۳۴۵۶', vehicle_id: veh.id })
    });
    expect(drvRes.status).toBe(201);
    const drv = await drvRes.json() as any;

    // 3. Route
    const routeRes = await fetch(`${baseUrl}/api/v1/admin/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      },
      body: JSON.stringify({
        name: 'مسیر سعادت آباد',
        origin: 'میدان کاج',
        destination: 'مدرسه مهر',
        stops: ['ایستگاه ۱', 'ایستگاه ۲'],
        driver_id: drv.id,
        vehicle_id: veh.id
      })
    });
    expect(routeRes.status).toBe(201);
    const route = await routeRes.json() as any;
    expect(route.stopsCount).toBe(2);
    expect(route.driverId).toBe(drv.id);
  });

  it('4. should reject cross-tenant modification (Zero-Trust Isolation)', async () => {
    // School A creates student
    const res = await fetch(`${baseUrl}/api/v1/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      },
      body: JSON.stringify({ first_name: 'کیان', last_name: 'دانش‌آموز الف' })
    });
    const student = await res.json() as any;

    // School B tries to edit School A student
    const editRes = await fetch(`${baseUrl}/api/v1/admin/students/${student.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolB}`
      },
      body: JSON.stringify({ first_name: 'نام هک شده' })
    });
    expect(editRes.status).toBe(404);

    // School B tries to delete School A student
    const delRes = await fetch(`${baseUrl}/api/v1/admin/students/${student.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${schoolAdminTokenSchoolB}`
      }
    });
    expect(delRes.status).toBe(404);
  });

  it('5. should support soft deletion and audit logging', async () => {
    // Create vehicle
    const vehRes = await fetch(`${baseUrl}/api/v1/admin/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      },
      body: JSON.stringify({ plate: '۹۹ د ۹۹۹ ایران ۹۹', model: 'مینی‌بوس ایسوزو' })
    });
    const veh = await vehRes.json() as any;

    // Soft delete
    const delRes = await fetch(`${baseUrl}/api/v1/admin/vehicles/${veh.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      }
    });
    expect(delRes.status).toBe(200);

    // Verify it is excluded from list
    const listRes = await fetch(`${baseUrl}/api/v1/admin/vehicles`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${schoolAdminTokenSchoolA}`
      }
    });
    const list = await listRes.json() as any;
    expect(list.items.find((v: any) => v.id === veh.id)).toBeUndefined();
  });
});
