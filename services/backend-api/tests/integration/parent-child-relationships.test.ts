import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';

describe('P0 Quality Gate: Parent-Child Bidirectional Relationship & IA Suite', () => {
  let app: any;
  let baseUrl: string;
  let authService: any;
  let domainRepo: InMemoryDomainRepository;
  let userRepo: InMemoryUserRepository;
  let schoolAdminToken: string;

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

    // Register School Admin
    await userRepo.create({
      id: 'admin-mehr',
      email: 'admin@mehr.ir',
      passwordHash: hash,
      role: 'SCHOOL_ADMIN',
      tenantId: 'tenant-school-mehr',
      fullName: 'مدیر مجتمع آموزشی مهر',
      isActive: 'true'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Login as School Admin
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@mehr.ir',
        password: 'Password@123'
      })
    });
    const loginData = await loginRes.json() as any;
    schoolAdminToken = loginData.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. should return parents[] array inside GET /api/v1/admin/students', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/students`, {
      headers: { Authorization: `Bearer ${schoolAdminToken}` }
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);

    const studentWithParents = data.items.find((s: any) => s.parents && s.parents.length > 0);
    expect(studentWithParents).toBeDefined();
    expect(Array.isArray(studentWithParents.parents)).toBe(true);
    
    const parent = studentWithParents.parents[0];
    expect(parent.full_name).toBeDefined();
    expect(parent.phone).toBeDefined();
    expect(parent.relationship).toBeDefined();
  });

  it('2. should return students[] array inside GET /api/v1/admin/parents', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/parents`, {
      headers: { Authorization: `Bearer ${schoolAdminToken}` }
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);

    const parentWithChildren = data.items.find((p: any) => p.students && p.students.length > 0);
    expect(parentWithChildren).toBeDefined();
    expect(Array.isArray(parentWithChildren.students)).toBe(true);
    expect(parentWithChildren.childrenCount).toBe(parentWithChildren.students.length);

    const child = parentWithChildren.students[0];
    expect(child.first_name || child.fullName).toBeDefined();
    expect(child.grade).toBeDefined();
  });

  it('3. should create a new student linked to existing parent and verify bidirectional linkage', async () => {
    // 1. Create a parent
    const createParentRes = await fetch(`${baseUrl}/api/v1/admin/parents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminToken}`
      },
      body: JSON.stringify({
        full_name: 'مریم ابراهیمی',
        phone: '09199998877',
        relationship: 'مادر'
      })
    });
    expect(createParentRes.status).toBe(201);
    const parent = await createParentRes.json() as any;

    // 2. Create student linked to that parent
    const createStudentRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAdminToken}`
      },
      body: JSON.stringify({
        first_name: 'آرتین',
        last_name: 'ابراهیمی',
        grade: 'پایه دوم',
        parent_ids: [parent.id]
      })
    });
    expect(createStudentRes.status).toBe(201);
    const student = await createStudentRes.json() as any;

    // 3. Fetch student list and verify parent is included
    const stdListRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
      headers: { Authorization: `Bearer ${schoolAdminToken}` }
    });
    const stdData = await stdListRes.json() as any;
    const foundStd = stdData.items.find((s: any) => s.id === student.id);
    expect(foundStd).toBeDefined();
    expect(foundStd.parents.some((p: any) => p.id === parent.id)).toBe(true);

    // 4. Fetch parent list and verify student is included
    const parListRes = await fetch(`${baseUrl}/api/v1/admin/parents`, {
      headers: { Authorization: `Bearer ${schoolAdminToken}` }
    });
    const parData = await parListRes.json() as any;
    const foundPar = parData.items.find((p: any) => p.id === parent.id);
    expect(foundPar).toBeDefined();
    expect(foundPar.students.some((s: any) => s.id === student.id)).toBe(true);
    expect(foundPar.childrenCount).toBeGreaterThanOrEqual(1);
  });
});
