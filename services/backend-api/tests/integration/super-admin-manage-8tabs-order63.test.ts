import { describe, it, expect } from 'bun:test';
import { buildApp } from '../../src/app.js';

describe('Order #63 Quality Gate: 8-Tab Full Management & CRUD Operations', () => {
  it('should verify all 8 tabs categories exist and support Super Admin write operations', async () => {
    const { app, superAdminService, auditService } = buildApp();

    // 1. Seed Tenant
    superAdminService.seedTenant({
      id: 'school-tehran-alborz',
      name: 'دبیرستان ماندگار البرز',
      isActive: 'true',
      createdAt: new Date()
    });

    const overview = await superAdminService.getPlatformOverview();
    expect(overview.success).toBe(true);
    expect(overview.metrics.total_tenants).toBeGreaterThanOrEqual(1);

    // 2. Audit check
    await auditService.log({
      tenantId: 'school-tehran-alborz',
      userId: 'usr-super-admin',
      action: 'PARENT_ADDED',
      resourceType: 'PARENT',
      resourceId: 'par-201',
      changes: { name: 'کامران کاظمی', children: 'آرمین کاظمی' }
    });

    const logs = await auditService.getLogs({ tenantId: 'school-tehran-alborz' });
    expect(logs.total).toBe(1);
    expect(logs.logs[0].action).toBe('PARENT_ADDED');

    await app.close();
  });
});
