import { describe, it, expect, beforeEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { AuthService, InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';

describe('Order #33: Super Admin IA Redesign & Platform Management Suite', () => {
  let app: any;
  let superAdminToken: string;
  let schoolAdminToken: string;

  beforeEach(async () => {
    const userRepo = new InMemoryUserRepository();
    const authService = new AuthService(userRepo);

    // Get Super Admin Token
    const saLogin = await authService.login('super-admin@platform.ir', 'Demo@1234');
    superAdminToken = saLogin.access_token;

    // Get School Admin Token
    const schoolLogin = await authService.login('school-admin@demo.ir', 'Demo@1234');
    schoolAdminToken = schoolLogin.access_token;

    const built = buildApp({
      userRepository: userRepo,
    });
    app = built.app;
  });

  it('1. should allow Super Admin to access platform overview', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/super-admin/platform-overview',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.totalTenants).toBeDefined();
    expect(body.activeTenants).toBeDefined();
  });

  it('2. should reject School Admin on Super Admin routes with 403 Forbidden', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/super-admin/platform-overview',
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('3. should allow Super Admin to list all global users with tenant filtering', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/super-admin/users',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.users).toBeDefined();
    expect(body.users.length).toBeGreaterThan(0);
  });

  it('4. should allow Super Admin to read and update platform settings', async () => {
    const getRes = await app.inject({
      method: 'GET',
      url: '/api/v1/super-admin/settings',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    expect(getRes.statusCode).toBe(200);

    const patchRes = await app.inject({
      method: 'PATCH',
      url: '/api/v1/super-admin/settings',
      headers: { authorization: `Bearer ${superAdminToken}` },
      payload: { key: 'rate_limit_per_min', value: 1000 },
    });
    expect(patchRes.statusCode).toBe(200);
  });

  it('5. should provide global audit logs for Super Admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/super-admin/audit-logs',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.logs).toBeDefined();
  });
});
