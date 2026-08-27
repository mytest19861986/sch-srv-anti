import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { AuditService } from '../../src/modules/super-admin/audit.service.js';
import { SuperAdminService } from '../../src/modules/super-admin/super-admin.service.js';

describe('Vertical Slice 8: Super Admin Platform Management & Audit Logging', () => {
  let app: any;
  let userRepo: InMemoryUserRepository;
  let auditService: AuditService;
  let superAdminService: SuperAdminService;
  let baseUrl: string;

  let superAdminToken: string;
  let schoolAdminToken: string;

  beforeEach(async () => {
    const domainRepo = new InMemoryDomainRepository();
    const queueService = new InMemoryOutboxQueueService();
    const attendanceRepo = new InMemoryAttendanceRepository(queueService);
    userRepo = new InMemoryUserRepository();
    auditService = new AuditService();

    const built = buildApp({
      attendanceRepository: attendanceRepo,
      userRepository: userRepo,
      domainRepository: domainRepo,
      queueService: queueService,
      auditService: auditService,
      startWorker: false,
      logger: false
    });

    app = built.app;
    superAdminService = built.superAdminService;

    const hash = await built.authService.hashPassword('password123');

    // 1. Seed Super Admin
    await userRepo.create({
      id: 'super-admin-root',
      tenantId: 'platform-root',
      email: 'root@fleetplatform.com',
      passwordHash: hash,
      fullName: 'Super Admin Officer',
      role: 'SUPER_ADMIN'
    });

    // 2. Seed Regular School Admin
    await userRepo.create({
      id: 'school-admin-1',
      tenantId: 'school-101',
      email: 'admin@school101.com',
      passwordHash: hash,
      fullName: 'School Admin 101',
      role: 'SCHOOL_ADMIN'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Login Super Admin
    const saRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'root@fleetplatform.com', password: 'password123' })
    });
    superAdminToken = (await saRes.json() as any).access_token;

    // Login School Admin
    const scRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@school101.com', password: 'password123' })
    });
    schoolAdminToken = (await scRes.json() as any).access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  it('1. should reject SCHOOL_ADMIN from accessing Super Admin endpoints with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
      headers: { Authorization: `Bearer ${schoolAdminToken}` }
    });
    expect(res.status).toBe(403);
    const body: any = await res.json();
    expect(body.error).toBe('FORBIDDEN');
  });

  it('2. should execute full lifecycle: Create Tenant -> Create User -> Role Change -> Audit Log Verification', async () => {
    // 1. Create Tenant
    const createTenantRes = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        id: 'school-shiraz-high',
        name: 'Shiraz Premier High School'
      })
    });
    expect(createTenantRes.status).toBe(201);
    const tenantBody: any = await createTenantRes.json();
    expect(tenantBody.tenant.id).toBe('school-shiraz-high');

    // 2. Create User
    const createUserRes = await fetch(`${baseUrl}/api/v1/super-admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        id: 'driver-ali-1',
        tenant_id: 'school-shiraz-high',
        email: 'ali.driver@shiraz.com',
        password: 'password123',
        full_name: 'Ali Rostami',
        role: 'DRIVER'
      })
    });
    expect(createUserRes.status).toBe(201);

    // 3. Promote Driver to School Admin (Role Change)
    const roleChangeRes = await fetch(`${baseUrl}/api/v1/super-admin/users/driver-ali-1/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        role: 'SCHOOL_ADMIN'
      })
    });
    expect(roleChangeRes.status).toBe(200);
    const roleBody: any = await roleChangeRes.json();
    expect(roleBody.user.role).toBe('SCHOOL_ADMIN');

    // 4. Soft Delete Tenant
    const softDelRes = await fetch(`${baseUrl}/api/v1/super-admin/tenants/school-shiraz-high`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(softDelRes.status).toBe(200);
    const softDelBody: any = await softDelRes.json();
    expect(softDelBody.tenant.isActive).toBe('false');

    // 5. Query Audit Logs and Verify Recorded Actions
    const auditRes = await fetch(`${baseUrl}/api/v1/super-admin/audit-logs`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(auditRes.status).toBe(200);
    const auditBody: any = await auditRes.json();
    expect(auditBody.logs.length).toBe(4);

    const roleLog = auditBody.logs.find((l: any) => l.action === 'ROLE_CHANGE');
    expect(roleLog).toBeDefined();
    expect(roleLog.changes.previousRole).toBe('DRIVER');
    expect(roleLog.changes.newRole).toBe('SCHOOL_ADMIN');

    const deleteLog = auditBody.logs.find((l: any) => l.action === 'DELETE');
    expect(deleteLog).toBeDefined();
    expect(deleteLog.changes.action).toBe('SOFT_DELETE');
  });

  it('3. should serve Platform Overview report fast under 100ms', async () => {
    const start = Date.now();
    const res = await fetch(`${baseUrl}/api/v1/super-admin/reports/platform-overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.metrics.system_status).toBe('HEALTHY');
    expect(elapsed).toBeLessThan(100);
  });
});
