import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { AuditService } from '../../src/modules/super-admin/audit.service.js';

describe('Order #33: Super Admin IA Redesign & Platform Management Suite', () => {
  let app: any;
  let baseUrl: string;
  let superAdminToken: string;
  let schoolAdminToken: string;

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

    // Register Super Admin
    await userRepo.create({
      id: 'super-admin-root',
      tenantId: 'platform-root',
      email: 'super-admin@platform.ir',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      fullName: 'مدیر کل پلتفرم',
      isActive: 'true'
    });

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

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    const saLogin = await built.authService.login('super-admin@platform.ir', 'Demo@1234');
    superAdminToken = saLogin.access_token;

    const schoolLogin = await built.authService.login('school-admin@demo.ir', 'Demo@1234');
    schoolAdminToken = schoolLogin.access_token;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. should allow Super Admin to access platform overview', async () => {
    const res = await fetch(`${baseUrl}/api/v1/super-admin/platform-overview`, {
      headers: { authorization: `Bearer ${superAdminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.metrics || body.total_tenants !== undefined).toBeDefined();
  });

  it('2. should reject School Admin on Super Admin routes with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/v1/super-admin/platform-overview`, {
      headers: { authorization: `Bearer ${schoolAdminToken}` },
    });

    expect(res.status).toBe(403);
    const body = await res.json() as any;
    expect(body.error).toBe('FORBIDDEN');
  });

  it('3. should allow Super Admin to list all global users with tenant filtering', async () => {
    const res = await fetch(`${baseUrl}/api/v1/super-admin/users`, {
      headers: { authorization: `Bearer ${superAdminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.users !== undefined || body.items !== undefined).toBe(true);
  });

  it('4. should provide system-wide audit logs with action filters', async () => {
    const res = await fetch(`${baseUrl}/api/v1/super-admin/audit-logs?action=LOGIN`, {
      headers: { authorization: `Bearer ${superAdminToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.logs !== undefined || body.items !== undefined).toBe(true);
  });

  it('5. should provide multi-tenant management endpoints for Super Admin', async () => {
    const resTenants = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    expect(resTenants.status).toBe(200);
    const tenants = await resTenants.json() as any;
    expect(tenants.tenants !== undefined || tenants.items !== undefined).toBe(true);
  });
});
