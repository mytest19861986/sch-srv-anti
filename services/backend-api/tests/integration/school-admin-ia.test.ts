import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { AuditService } from '../../src/modules/super-admin/audit.service.js';

describe('Order #31: School Admin IA Redesign & Tenant-Scoped Endpoints', () => {
  let app: any;
  let baseUrl: string;
  let schoolAdminToken: string;
  let driverToken: string;

  beforeEach(async () => {
    const userRepo = new InMemoryUserRepository();
    const auditService = new AuditService();

    const built = buildApp({
      userRepository: userRepo,
      auditService: auditService,
      logger: false
    });
    app = built.app;

    const hash = await built.authService.hashPassword('Demo@1234');

    // Register School Admin
    await userRepo.create({
      id: 'school-admin-demo',
      tenantId: 'tenant-school-mehr',
      email: 'school-admin@demo.ir',
      passwordHash: hash,
      role: 'SCHOOL_ADMIN',
      fullName: 'مدیر مدرسه دمو',
      isActive: 'true'
    });

    // Register Driver
    await userRepo.create({
      id: 'driver-demo',
      tenantId: 'tenant-school-mehr',
      email: 'driver@demo.ir',
      passwordHash: hash,
      role: 'DRIVER',
      fullName: 'راننده دمو',
      isActive: 'true'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    const adminLogin = await built.authService.login('school-admin@demo.ir', 'Demo@1234');
    schoolAdminToken = adminLogin.access_token;

    const driverLogin = await built.authService.login('driver@demo.ir', 'Demo@1234');
    driverToken = driverLogin.access_token;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. should allow School Admin to retrieve students list with tenant isolation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/students`, {
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.items).toBeDefined();
    expect(body.total).toBeDefined();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].tenantId).toBe('tenant-school-mehr');
  });

  it('2. should reject Driver with 403 Forbidden on admin endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/students`, {
      headers: { authorization: `Bearer ${driverToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.error).toBe('FORBIDDEN');
  });

  it('3. should provide parents and drivers lists to School Admin', async () => {
    const resParents = await fetch(`${baseUrl}/api/v1/admin/parents`, {
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });
    expect(resParents.status).toBe(200);
    const parents = await resParents.json() as any;
    expect(parents.total).toBeDefined();
    expect(parents.items.length).toBeGreaterThan(0);

    const resDrivers = await fetch(`${baseUrl}/api/v1/admin/drivers`, {
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });
    expect(resDrivers.status).toBe(200);
    const drivers = await resDrivers.json() as any;
    expect(drivers.total).toBeDefined();
  });

  it('4. should provide events report with hourly distribution', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/events?date=2026-08-27`, {
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.hourlyDistribution).toBeDefined();
    expect(body.hourlyDistribution['07:00']).toBeDefined();
  });

  it('5. should provide audit logs and notification logs for the school tenant', async () => {
    const resAudit = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });
    expect(resAudit.status).toBe(200);

    const resNotif = await fetch(`${baseUrl}/api/v1/admin/notification-logs`, {
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });
    expect(resNotif.status).toBe(200);
    const notifs = await resNotif.json() as any;
    expect(notifs.items).toBeDefined();
  });
});
