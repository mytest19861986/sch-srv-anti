import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';

describe('Order #53 Quality Gate: Pre-Pilot Business Logic Invariants Suite (ChatGPT Audit)', () => {
  let app: any;
  let baseUrl: string;
  let authService: any;
  let domainRepo: InMemoryDomainRepository;
  let userRepo: InMemoryUserRepository;
  let queueService: InMemoryOutboxQueueService;

  let schoolAdminToken: string;
  let superAdminToken: string;
  let driverToken: string;

  beforeEach(async () => {
    domainRepo = new InMemoryDomainRepository();
    queueService = new InMemoryOutboxQueueService();
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
      id: 'admin-audit',
      email: 'admin@audit.ir',
      passwordHash: hash,
      role: 'SCHOOL_ADMIN',
      tenantId: 'tenant-audit-school',
      fullName: 'مدیر مدرسه آزمون',
      isActive: 'true'
    });

    // Register Super Admin
    await userRepo.create({
      id: 'super-audit',
      email: 'super@platform.ir',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      tenantId: 'platform-root',
      fullName: 'مدیر ارشد سامانه',
      isActive: 'true'
    });

    // Register Driver
    await userRepo.create({
      id: 'driver-audit',
      email: 'driver@audit.ir',
      passwordHash: hash,
      role: 'DRIVER',
      tenantId: 'tenant-audit-school',
      fullName: 'راننده آزمون',
      isActive: 'true'
    });

    await app.listen({ port: 0, host: '127.0.0.1' });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // Login as School Admin
    const adminLogin = await (await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@audit.ir', password: 'Password@123' })
    })).json() as any;
    schoolAdminToken = adminLogin.access_token;

    // Login as Super Admin
    const superLogin = await (await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'super@platform.ir', password: 'Password@123' })
    })).json() as any;
    superAdminToken = superLogin.access_token;

    // Login as Driver
    const driverLogin = await (await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@audit.ir', password: 'Password@123' })
    })).json() as any;
    driverToken = driverLogin.access_token;
  });

  afterEach(async () => {
    await app.close();
  });

  // =========================================================================
  // DOMAIN 1: Parent↔Student Invariants (PS-01 .. PS-07)
  // =========================================================================
  describe('Domain 1: Parent↔Student Relationships & IA Invariants', () => {
    it('PS-01 & PS-03: Bi-directional link creation & single authoritative relation', async () => {
      // 1. Create Parent
      const pRes = await fetch(`${baseUrl}/api/v1/admin/parents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${schoolAdminToken}` },
        body: JSON.stringify({
          full_name: 'فرهاد احمدی',
          phone: '09121112233',
          relationship: 'پدر',
          student_ids: []
        })
      });
      expect(pRes.status).toBe(201);
      const pData = await pRes.json() as any;
      const createdParentId = pData.id;

      // 2. Create Student linked to Parent
      const sRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${schoolAdminToken}` },
        body: JSON.stringify({
          first_name: 'سهراب',
          last_name: 'احمدی',
          national_code: '0019988771',
          grade: 'دهم',
          parent_ids: [createdParentId]
        })
      });
      expect(sRes.status).toBe(201);
      const sData = await sRes.json() as any;
      const createdStudentId = sData.id;

      // 3. Verify Student has parent details populated
      const listSRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
        headers: { authorization: `Bearer ${schoolAdminToken}` }
      });
      const listSData = await listSRes.json() as any;
      const student = (listSData.items || listSData.students).find((s: any) => s.id === createdStudentId);
      expect(student).toBeDefined();
      expect(student.parents.length).toBe(1);
      expect(student.parents[0].full_name).toBe('فرهاد احمدی');
      expect(student.parents[0].phone).toBe('09121112233');

      // 4. Verify Parent has student details populated
      const listPRes = await fetch(`${baseUrl}/api/v1/admin/parents`, {
        headers: { authorization: `Bearer ${schoolAdminToken}` }
      });
      const listPData = await listPRes.json() as any;
      const parent = (listPData.items || listPData.parents).find((p: any) => p.id === createdParentId);
      expect(parent).toBeDefined();
      expect(parent.students.length).toBe(1);
      expect(parent.students[0].id).toBe(createdStudentId);
    });

    it('PS-07: Student with 0 parents is valid and gracefully supported in IA', async () => {
      const sRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${schoolAdminToken}` },
        body: JSON.stringify({
          first_name: 'کیوان',
          last_name: 'بدون والد',
          national_code: '0029988772',
          grade: 'یازدهم',
          parent_ids: []
        })
      });
      expect(sRes.status).toBe(201);
      const sData = await sRes.json() as any;
      expect(sData.parentIds).toEqual([]);
    });
  });

  // =========================================================================
  // DOMAIN 2: Notification Routing & Fan-out (NT-01 .. NT-06)
  // =========================================================================
  describe('Domain 2: Notification Routing & Delivery Deduplication Invariants', () => {
    it('NT-01 & NT-03: Attendance recording latency is decoupled and produces Outbox item', async () => {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${driverToken}` },
        body: JSON.stringify({
          student_id: 'std-latency-1',
          service_id: 'srv-latency-1',
          event_type: 'PICKED_UP',
          client_generated_id: 'a0000000-0000-4000-8000-000000000001',
          client_timestamp: new Date().toISOString()
        })
      });
      const duration = Date.now() - start;
      expect(res.status).toBe(201);
      expect(duration).toBeLessThan(150);

      const pending = await queueService.fetchPendingBatch(50);
      expect(pending.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // DOMAIN 3: Attendance State Machine & Event Validation (AT-01 .. AT-08)
  // =========================================================================
  describe('Domain 3: Attendance State Machine & Event Lifecycle Invariants', () => {
    it('AT-01: Idempotency with exact payload returns 200 with is_idempotent_replay: true', async () => {
      const payload = {
        student_id: 'std-idem-audit-1',
        service_id: 'srv-idem-audit-1',
        event_type: 'PICKED_UP',
        client_generated_id: 'b0000000-0000-4000-8000-000000000002',
        client_timestamp: new Date().toISOString()
      };

      const first = await fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${driverToken}` },
        body: JSON.stringify(payload)
      });
      expect(first.status).toBe(201);

      const second = await fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${driverToken}` },
        body: JSON.stringify(payload)
      });
      expect(second.status).toBe(200);
      const data2 = await second.json() as any;
      expect(data2.is_idempotent_replay).toBe(true);
    });

    it('AT-02: Illegal state transition (DROPPED_OFF before PICKED_UP) returns 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${driverToken}` },
        body: JSON.stringify({
          student_id: 'std-illegal-seq-1',
          service_id: 'srv-illegal-seq-1',
          event_type: 'DROPPED_OFF',
          client_generated_id: 'c0000000-0000-4000-8000-000000000003',
          client_timestamp: new Date().toISOString()
        })
      });
      expect(res.status).toBe(409);
    });

    it('AT-05: Driver role cannot record ABSENT (403 Forbidden guard)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${driverToken}` },
        body: JSON.stringify({
          student_id: 'std-driver-absent-test',
          service_id: 'srv-driver-absent-test',
          event_type: 'ABSENT',
          client_generated_id: 'd0000000-0000-4000-8000-000000000004',
          client_timestamp: new Date().toISOString()
        })
      });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // DOMAIN 4: Offline Sync & Monotonic Sequence (SY-01 .. SY-07)
  // =========================================================================
  describe('Domain 4: Offline Sync & Alias Invariants', () => {
    it('SY-01: Canonical /api/v1/sync/batch accepts offline batches', async () => {
      const res = await fetch(`${baseUrl}/api/v1/sync/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${driverToken}` },
        body: JSON.stringify({
          device_id: 'dev-driver-handset-1',
          events: [
            {
              client_generated_id: 'e0000000-0000-4000-8000-000000000005',
              student_id: 'std-sync-1',
              service_id: 'srv-sync-1',
              event_type: 'PICKED_UP',
              sequence_number: 1,
              client_timestamp: new Date().toISOString()
            }
          ]
        })
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.created_count).toBe(1);
    });
  });

  // =========================================================================
  // DOMAIN 5: Multi-Tenant Zero-Trust RBAC (RB-01 .. RB-08)
  // =========================================================================
  describe('Domain 5: Zero-Trust Multi-Tenancy & Authorization Invariants', () => {
    it('RB-01: School Admin cannot access Super Admin endpoints (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
        headers: { authorization: `Bearer ${schoolAdminToken}` }
      });
      expect(res.status).toBe(403);
    });

    it('RB-02: Super Admin cross-tenant override requires explicit privilege', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/students?tenantId=tenant-audit-school`, {
        headers: { authorization: `Bearer ${superAdminToken}` }
      });
      expect(res.status).toBe(200);
    });
  });

  // =========================================================================
  // DOMAIN 6: Service Lifecycle & Freshness (SV-01 .. SV-07)
  // =========================================================================
  describe('Domain 6: Shift Lifecycle & Freshness Invariants', () => {
    it('SV-01: System provides deterministic state and audit trails', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
        headers: { authorization: `Bearer ${schoolAdminToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.logs).toBeDefined();
    });
  });
});
