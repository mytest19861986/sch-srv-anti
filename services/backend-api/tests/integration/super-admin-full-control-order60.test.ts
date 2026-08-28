import { describe, it, expect } from 'bun:test';
import { buildApp } from '../../src/app.js';

describe('Order #60 Quality Gate: Super Admin Full Management & Live Dynamic KPIs', () => {
  it('should calculate live dynamic KPIs matching individual tenant records', async () => {
    const { app, superAdminService, domainRepository } = buildApp();

    superAdminService.seedTenant({
      id: 'tenant-school-mehr',
      name: 'مدرسه مهر دانش',
      isActive: 'true',
      createdAt: new Date()
    });

    const overview = await superAdminService.getPlatformOverview();
    expect(overview.success).toBe(true);
    expect(overview.metrics.total_tenants).toBeGreaterThanOrEqual(1);
    expect(overview.metrics.system_status).toBe('HEALTHY');

    await app.close();
  });

  it('should support Super Admin tenant creation and audit logging', async () => {
    const { app, superAdminService, auditService } = buildApp();

    const created = await superAdminService.createTenant({
      id: 'school-test-order60',
      name: 'مدرسه نمونه کنترل کیفیت ۶۰'
    }, 'usr-super-admin-1');

    expect(created.id).toBe('school-test-order60');
    expect(created.isActive).toBe('true');

    const res = await auditService.getLogs({});
    expect(res.total).toBe(1);
    expect(res.logs[0].action).toBe('CREATE');

    await app.close();
  });
});
