import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';

describe('Order #15: Parent Device Tokens & Flag-Driven Notification Adapters', () => {
  let appInstance: ReturnType<typeof buildApp>;
  let baseUrl: string;
  let parentToken: string;
  const tenantId = 'school-token-tenant';
  const parentId = 'parent-reza';

  beforeEach(async () => {
    appInstance = buildApp({ enableRateLimit: false });
    await appInstance.app.listen({ port: 0, host: '127.0.0.1' });
    const address = appInstance.app.server.address();
    const port = typeof address === 'object' && address ? address.port : 3000;
    baseUrl = `http://127.0.0.1:${port}`;

    // Seed Parent User
    const authService = appInstance.authService;
    const passwordHash = await authService.hashPassword('Parent123!');

    await appInstance.userRepository.create({
      id: parentId,
      tenantId,
      email: 'reza.parent@school.ir',
      passwordHash,
      fullName: 'رضا والد',
      role: 'PARENT',
      isActive: 'true'
    });

    // Seed domain parent & student
    appInstance.domainRepository.parents.set(parentId, {
      id: parentId,
      tenantId,
      userId: parentId,
      phoneNumber: '09121112233'
    });

    appInstance.domainRepository.students.set('student-arash', {
      id: 'student-arash',
      tenantId,
      firstName: 'آرش',
      lastName: 'والد',
      grade: '3A',
      schoolId: 'school-main'
    });

    appInstance.domainRepository.studentParents.add(`${tenantId}:student-arash:${parentId}`);

    // Login Parent
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'reza.parent@school.ir', password: 'Parent123!' })
    });
    const loginData = await loginRes.json() as any;
    parentToken = loginData.access_token;
  });

  afterEach(async () => {
    await appInstance.app.close();
  });

  it('1. should register a new device token with 201 Created', async () => {
    const regRes = await fetch(`${baseUrl}/api/v1/parent/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({
        token: 'fcm-device-token-samsung-s23-ultra-xyz',
        platform: 'ANDROID'
      })
    });

    expect(regRes.status).toBe(201);
    const body = await regRes.json() as any;
    expect(body.success).toBe(true);
    expect(body.device_id).toBeDefined();
    expect(body.platform).toBe('ANDROID');
  });

  it('2. should idempotently update lastUsedAt on re-registration without creating duplicates', async () => {
    const token = 'fcm-device-token-unique-idempotent';

    // First register
    const res1 = await fetch(`${baseUrl}/api/v1/parent/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({ token, platform: 'IOS' })
    });
    const data1 = await res1.json() as any;
    const deviceId1 = data1.device_id;

    // Second register
    const res2 = await fetch(`${baseUrl}/api/v1/parent/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({ token, platform: 'IOS' })
    });
    const data2 = await res2.json() as any;
    const deviceId2 = data2.device_id;

    expect(deviceId1).toBe(deviceId2);
    const allTokens = await appInstance.deviceTokenRepository.getAllTokens();
    expect(allTokens.filter(t => t.token === token).length).toBe(1);
  });

  it('3. should deregister device token with 200 OK', async () => {
    const regRes = await fetch(`${baseUrl}/api/v1/parent/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({ token: 'fcm-token-to-delete', platform: 'ANDROID' })
    });
    const data = await regRes.json() as any;
    const deviceId = data.device_id;

    // Deregister
    const delRes = await fetch(`${baseUrl}/api/v1/parent/devices/${deviceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${parentToken}` }
    });

    expect(delRes.status).toBe(200);
    const delBody = await delRes.json() as any;
    expect(delBody.success).toBe(true);

    // Second delete returns 404
    const delRes2 = await fetch(`${baseUrl}/api/v1/parent/devices/${deviceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    expect(delRes2.status).toBe(404);
  });

  it('4. should auto-prune dead tokens during notification dispatch', async () => {
    // Register one valid token and one dead token
    await appInstance.deviceTokenRepository.registerToken(tenantId, parentId, 'valid-token-123', 'ANDROID');
    await appInstance.deviceTokenRepository.registerToken(tenantId, parentId, 'dead_fcm_token_456', 'ANDROID');

    // Configure notification service mock to report dead token
    appInstance.notificationService.mockAdapter.mockDeadTokens = ['dead_fcm_token_456'];

    // Dispatch notification
    await appInstance.notificationService.dispatchAttendanceNotification(
      tenantId,
      'student-arash',
      'PICKED_UP',
      new Date().toISOString()
    );

    // Verify dead token was pruned
    const tokens = await appInstance.deviceTokenRepository.getTokensForParents(tenantId, [parentId]);
    expect(tokens.some(t => t.token === 'dead_fcm_token_456')).toBe(false);
    expect(tokens.some(t => t.token === 'valid-token-123')).toBe(true);
  });

  it('5. should support runtime adapter switching between MockAdapter and FcmAdapter', async () => {
    expect(appInstance.notificationService.adapter.name).toBe('MockAdapter');

    appInstance.notificationService.setAdapter('fcm');
    expect(appInstance.notificationService.adapter.name).toBe('FcmAdapter');

    appInstance.notificationService.setAdapter('mock');
    expect(appInstance.notificationService.adapter.name).toBe('MockAdapter');
  });
});
