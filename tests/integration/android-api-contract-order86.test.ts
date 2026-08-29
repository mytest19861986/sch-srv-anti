import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { buildApp } from "../../services/backend-api/src/app";
import { InMemoryUserRepository } from "../../services/backend-api/src/modules/auth/auth.service";
import { InMemoryDomainRepository } from "../../services/backend-api/src/modules/domain/domain.service";
import { seedDemoData } from "../../scripts/seed-demo";
import { randomUUID } from "crypto";

describe("Android Apps API Contract Alignment Test Suite (Order 86 / FIX-010)", () => {
  let app: any;
  let baseUrl: string;
  let driverToken: string;
  let driverTenantId: string;
  let parentToken: string;
  let parentTenantId: string;
  let testChildId: string = "student-1";
  let testServiceId: string = "srv-demo-1";

  beforeAll(async () => {
    const userRepo = new InMemoryUserRepository();
    const domainRepo = new InMemoryDomainRepository();

    const built = buildApp({
      userRepository: userRepo,
      domainRepository: domainRepo,
      logger: false,
    });
    app = built.app;

    await seedDemoData(userRepo, domainRepo, built.authService);

    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;

    // 1. Driver Login
    const driverLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "driver@serviceyar.ir",
        password: "DriverPass@123",
      }),
    });
    expect(driverLoginRes.status).toBe(200);
    const driverData: any = await driverLoginRes.json();
    driverToken = driverData.access_token || driverData.token;
    driverTenantId = driverData.tenantId || driverData.tenant_id;
    expect(driverToken).toBeDefined();
    expect(driverTenantId).toBe("tenant-school-mehr");

    // 2. Parent Login
    const parentLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "parent@serviceyar.ir",
        password: "ParentPass@123",
      }),
    });
    expect(parentLoginRes.status).toBe(200);
    const parentData: any = await parentLoginRes.json();
    parentToken = parentData.access_token || parentData.token;
    parentTenantId = parentData.tenantId || parentData.tenant_id;
    expect(parentToken).toBeDefined();
    expect(parentTenantId).toBe("tenant-school-mehr");
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Driver App Contract Endpoints", () => {
    it("1. GET /api/v1/attendance/manifest returns 200 with student manifest", async () => {
      const res = await fetch(`${baseUrl}/api/v1/attendance/manifest`, {
        headers: { Authorization: `Bearer ${driverToken}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(body.manifest).toBeDefined();
      expect(Array.isArray(body.manifest.students)).toBe(true);
      if (body.manifest.students.length > 0) {
        testChildId = body.manifest.students[0].student_id || body.manifest.students[0].studentId || testChildId;
        testServiceId = body.manifest.service_id || body.manifest.serviceId || testServiceId;
      }
    });

    it("2. POST /api/v1/attendance/events (PICKED_UP) returns 201 or 200", async () => {
      const clientGeneratedId = randomUUID();
      const res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${driverToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_generated_id: clientGeneratedId,
          student_id: testChildId,
          service_id: testServiceId,
          event_type: "PICKED_UP",
          client_timestamp: new Date().toISOString(),
        }),
      });
      expect([200, 201]).toContain(res.status);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });

    it("3. POST /api/v1/attendance/events (DROPPED_OFF) returns 201 or 200", async () => {
      const clientGeneratedId = randomUUID();
      const res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${driverToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_generated_id: clientGeneratedId,
          student_id: testChildId,
          service_id: testServiceId,
          event_type: "DROPPED_OFF",
          client_timestamp: new Date().toISOString(),
        }),
      });
      expect([200, 201]).toContain(res.status);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });

    it("4. POST /api/v1/sync/batch returns 200", async () => {
      const res = await fetch(`${baseUrl}/api/v1/sync/batch`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${driverToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: "test-device-driver-android",
          events: [
            {
              client_generated_id: randomUUID(),
              student_id: testChildId,
              service_id: testServiceId,
              event_type: "PICKED_UP",
              client_timestamp: new Date().toISOString(),
              sequence_number: 1,
            },
          ],
        }),
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe("Parent App Contract Endpoints", () => {
    it("5. GET /api/v1/parent/children returns 200 with children list", async () => {
      const res = await fetch(`${baseUrl}/api/v1/parent/children`, {
        headers: { Authorization: `Bearer ${parentToken}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.children)).toBe(true);
      expect(body.children.length).toBeGreaterThan(0);
      testChildId = body.children[0].child_id || body.children[0].childId;
    });

    it("6. GET /api/v1/parent/children/:childId/status returns 200", async () => {
      const res = await fetch(`${baseUrl}/api/v1/parent/children/${testChildId}/status`, {
        headers: { Authorization: `Bearer ${parentToken}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });

    it("7. GET /api/v1/parent/children/:childId/timeline returns 200", async () => {
      const res = await fetch(`${baseUrl}/api/v1/parent/children/${testChildId}/timeline`, {
        headers: { Authorization: `Bearer ${parentToken}` },
      });
      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.events)).toBe(true);
    });

    it("8. POST /api/v1/parent/devices/register returns 201", async () => {
      const res = await fetch(`${baseUrl}/api/v1/parent/devices/register`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${parentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: "fcm-device-token-sample-123456",
          platform: "ANDROID",
        }),
      });
      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });

    it("9. POST /api/v1/parent/absence-report returns 201", async () => {
      const res = await fetch(`${baseUrl}/api/v1/parent/absence-report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${parentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          child_id: testChildId,
          date: "2026-08-29",
          reason: "پزشک و استراحت در منزل",
        }),
      });
      expect(res.status).toBe(201);
      const body: any = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
