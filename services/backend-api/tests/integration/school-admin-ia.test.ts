import { describe, it, expect, beforeEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { AuthService, InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';

describe('Order #31: School Admin IA Redesign & Tenant-Scoped Endpoints', () => {
  let app: any;
  let schoolAdminToken: string;
  let driverToken: string;

  beforeEach(async () => {
    const userRepo = new InMemoryUserRepository();
    const authService = new AuthService(userRepo);

    // Get School Admin Token
    const adminLogin = await authService.login('school-admin@demo.ir', 'Demo@1234');
    schoolAdminToken = adminLogin.access_token;

    // Get Driver Token
    const driverLogin = await authService.login('driver@demo.ir', 'Demo@1234');
    driverToken = driverLogin.access_token;

    const built = buildApp({
      userRepository: userRepo,
    });
    app = built.app;
  });

  it('1. should allow School Admin to retrieve students list with tenant isolation', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/students',
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.items).toBeDefined();
    expect(body.total).toBe(145);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].tenantId).toBe('tenant-school-mehr');
  });

  it('2. should reject Driver with 403 Forbidden on admin endpoints', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/students',
      headers: { authorization: `Bearer ${driverToken}` },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('3. should provide parents and drivers lists to School Admin', async () => {
    const resParents = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/parents',
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });
    expect(resParents.statusCode).toBe(200);
    const parents = JSON.parse(resParents.body);
    expect(parents.total).toBe(130);

    const resDrivers = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/drivers',
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });
    expect(resDrivers.statusCode).toBe(200);
    const drivers = JSON.parse(resDrivers.body);
    expect(drivers.total).toBe(8);
  });

  it('4. should provide events report with hourly distribution', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/events?date=2026-08-27',
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.hourlyDistribution).toBeDefined();
    expect(body.hourlyDistribution['07:00']).toBe(120);
    expect(body.total).toBe(440);
  });

  it('5. should provide audit logs and notification logs for the school tenant', async () => {
    const resAudit = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/audit-logs',
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });
    expect(resAudit.statusCode).toBe(200);

    const resNotif = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/notification-logs',
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });
    expect(resNotif.statusCode).toBe(200);
    const notifs = JSON.parse(resNotif.body);
    expect(notifs.items.length).toBeGreaterThan(0);
  });
});
