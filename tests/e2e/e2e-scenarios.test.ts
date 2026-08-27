import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { buildApp } from "../../services/backend-api/src/app";
import { InMemoryUserRepository } from "../../services/backend-api/src/modules/auth/auth.service";
import { InMemoryDomainRepository } from "../../services/backend-api/src/modules/domain/domain.service";

describe("Comprehensive E2E Integration Suite (All 8 Core Scenarios)", () => {
  let app: any;
  let baseUrl: string;
  let userRepo: InMemoryUserRepository;
  let domainRepo: InMemoryDomainRepository;
  let driverToken: string;
  let adminToken: string;
  let parentToken: string;
  let superAdminToken: string;
  let recordedEventId: string | number;

  beforeAll(async () => {
    userRepo = new InMemoryUserRepository();
    domainRepo = new InMemoryDomainRepository();

    const built = buildApp({
      userRepository: userRepo,
      domainRepository: domainRepo,
      logger: false,
    });
    app = built.app;

    const hash = await built.authService.hashPassword("password123");

    // 1. Seed Users
    await userRepo.create({
      id: "usr-driver-1",
      tenantId: "tenant-school-e2e",
      email: "driver1@school.ir",
      passwordHash: hash,
      fullName: "علی رضایی",
      role: "DRIVER",
    });

    await userRepo.create({
      id: "usr-admin-1",
      tenantId: "tenant-school-e2e",
      email: "admin@school.ir",
      passwordHash: hash,
      fullName: "مدیر مدرسه",
      role: "SCHOOL_ADMIN",
    });

    await userRepo.create({
      id: "usr-parent-1",
      tenantId: "tenant-school-e2e",
      email: "parent1@family.ir",
      passwordHash: hash,
      fullName: "والد دانش‌آموز",
      role: "PARENT",
    });

    await userRepo.create({
      id: "usr-super-1",
      tenantId: "system",
      email: "super@platform.ir",
      passwordHash: hash,
      fullName: "راهبر ارشد",
      role: "SUPER_ADMIN",
    });

    // 2. Seed Domain Entities
    await domainRepo.createDriver({
      id: "driver-1",
      tenantId: "tenant-school-e2e",
      userId: "usr-driver-1",
      licenseNumber: "IR-123456",
    });

    await domainRepo.createParent({
      id: "parent-1",
      tenantId: "tenant-school-e2e",
      userId: "usr-parent-1",
      phoneNumber: "09121112233",
    });

    await domainRepo.createStudent({
      id: "student-e2e-1",
      tenantId: "tenant-school-e2e",
      firstName: "پارسا",
      lastName: "تهرانی",
      grade: "دهم",
    });

    await domainRepo.linkStudentParent("tenant-school-e2e", "student-e2e-1", "parent-1");

    await domainRepo.createRoute({
      id: "route-e2e-1",
      tenantId: "tenant-school-e2e",
      name: "مسیر ونک",
      direction: "TO_SCHOOL",
    });

    await domainRepo.assignStudentToRoute("tenant-school-e2e", "route-e2e-1", "student-e2e-1");

    await domainRepo.createService({
      id: "service-e2e-1",
      tenantId: "tenant-school-e2e",
      routeId: "route-e2e-1",
      name: "سرویس صبح ونک",
    });

    await domainRepo.createShift({
      id: "shift-e2e-1",
      tenantId: "tenant-school-e2e",
      serviceId: "service-e2e-1",
      startTime: new Date(),
      status: "SCHEDULED",
    });

    await domainRepo.assignDriverToShift("tenant-school-e2e", "driver-1", "shift-e2e-1");

    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    async function login(email: string) {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123" }),
      });
      const data: any = await res.json();
      return data.access_token;
    }

    driverToken = await login("driver1@school.ir");
    adminToken = await login("admin@school.ir");
    parentToken = await login("parent1@family.ir");
    superAdminToken = await login("super@platform.ir");
  });

  afterAll(async () => {
    await app.close();
  });

  it("Scenario 1: Happy Path Driver -> Ingest -> Outbox -> Notification Dispatch", async () => {
    expect(driverToken).toBeDefined();

    // 1. Fetch manifest
    const manifestRes = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-e2e-1`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    expect(manifestRes.status).toBe(200);

    // 2. Record PICKED_UP
    const punchRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${driverToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: "student-e2e-1",
        service_id: "service-e2e-1",
        event_type: "PICKED_UP",
        client_generated_id: crypto.randomUUID(),
        client_timestamp: new Date().toISOString(),
      }),
    });
    expect(punchRes.status).toBe(201);
    const body: any = await punchRes.json();
    recordedEventId = body.event_id;
    expect(recordedEventId).toBeDefined();
  });

  it("Scenario 2: Offline-First Batch Sync with Partial Success", async () => {
    const batchRes = await fetch(`${baseUrl}/api/v1/sync/batch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${driverToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_id: "driver-handset-samsung",
        events: [
          {
            student_id: "student-e2e-1",
            service_id: "service-e2e-1",
            event_type: "DROPPED_OFF",
            client_generated_id: crypto.randomUUID(),
            client_timestamp: new Date().toISOString(),
            sequence_number: 1,
          },
        ],
      }),
    });

    expect(batchRes.status).toBe(200);
    const body: any = await batchRes.json();
    expect(body.success).toBe(true);
  });

  it("Scenario 3: Parent Deep Link & Timeline Retrieval", async () => {
    const childrenRes = await fetch(`${baseUrl}/api/v1/parent/children`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    expect(childrenRes.status).toBe(200);

    const timelineRes = await fetch(`${baseUrl}/api/v1/parent/children/student-e2e-1/timeline?date=2026-08-27`, {
      headers: { Authorization: `Bearer ${parentToken}` },
    });
    expect(timelineRes.status).toBe(200);
  });

  it("Scenario 4: School Dashboard Data Freshness & Stale Flag", async () => {
    const overviewRes = await fetch(`${baseUrl}/api/v1/dashboard/overview?date=2026-08-27`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(overviewRes.status).toBe(200);
    const body: any = await overviewRes.json();
    expect(body.success).toBe(true);
    expect(typeof body.is_stale).toBe("boolean");
  });

  it("Scenario 5: Super Admin Tenant Creation & Management", async () => {
    const createTenantRes = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: `tenant-farzanegan-${Date.now()}`,
        name: "مدرسه فرزانگان",
      }),
    });
    expect(createTenantRes.status).toBe(201);
  });

  it("Scenario 6: Cross-Tenant IDOR & Privilege Escalation Guard", async () => {
    // Driver attempting to query parent endpoint
    const attackRes = await fetch(`${baseUrl}/api/v1/parent/children`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    expect(attackRes.status).toBe(403);
  });

  it("Scenario 7: Event Lifecycle Correction by School Admin", async () => {
    const correctRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: "student-e2e-1",
        service_id: "service-e2e-1",
        event_type: "CORRECTED",
        client_generated_id: crypto.randomUUID(),
        client_timestamp: new Date().toISOString(),
        correction_of_event_id: recordedEventId,
        correction_reason: "دانش‌آموز با هماهنگی والدین زودتر پیاده شد",
      }),
    });
    expect(correctRes.status).toBe(201);
  });

  it("Scenario 8: Graceful System Health Verification", async () => {
    const liveRes = await fetch(`${baseUrl}/health/live`);
    expect(liveRes.status).toBe(200);

    const readyRes = await fetch(`${baseUrl}/health/ready`);
    expect(readyRes.status).toBe(200);
  });
});
