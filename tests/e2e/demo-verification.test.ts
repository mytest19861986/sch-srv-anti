import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { buildApp } from "../../services/backend-api/src/app";
import { InMemoryUserRepository } from "../../services/backend-api/src/modules/auth/auth.service";
import { InMemoryDomainRepository } from "../../services/backend-api/src/modules/domain/domain.service";
import { seedDemoData } from "../../scripts/seed-demo";

describe("Order #21: Quick Demo Launch & Real Login Verification Suite", () => {
  let app: any;
  let baseUrl: string;
  let userRepo: InMemoryUserRepository;
  let domainRepo: InMemoryDomainRepository;
  const demoTokens: Record<string, string> = {};

  beforeAll(async () => {
    userRepo = new InMemoryUserRepository();
    domainRepo = new InMemoryDomainRepository();

    const built = buildApp({
      userRepository: userRepo,
      domainRepository: domainRepo,
      logger: false,
    });
    app = built.app;

    // Run Demo Seeding
    await seedDemoData(userRepo, domainRepo, built.authService);

    await app.listen({ port: 0, host: "127.0.0.1" });
    const address = app.server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("1. Health Check Verification: /health/live and /health/ready return 200", async () => {
    const liveRes = await fetch(`${baseUrl}/health/live`);
    expect(liveRes.status).toBe(200);
    const liveBody: any = await liveRes.json();
    expect(liveBody.status).toBe("UP");

    const readyRes = await fetch(`${baseUrl}/health/ready`);
    expect(readyRes.status).toBe(200);
    const readyBody: any = await readyRes.json();
    expect(readyBody.status).toBe("READY");
  });

  it("2. Super Admin Demo Login (super-admin@platform.ir / Demo@1234)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "super-admin@platform.ir",
        password: "Demo@1234",
      }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.user.role).toBe("SUPER_ADMIN");
    expect(body.access_token).toBeDefined();
    demoTokens["super_admin"] = body.access_token;
  });

  it("3. School Admin Demo Login (school-admin@demo.ir / Demo@1234)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "school-admin@demo.ir",
        password: "Demo@1234",
      }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.user.role).toBe("SCHOOL_ADMIN");
    expect(body.access_token).toBeDefined();
    demoTokens["school_admin"] = body.access_token;
  });

  it("4. Driver Demo Login (driver@demo.ir / Demo@1234)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "driver@demo.ir",
        password: "Demo@1234",
      }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.user.role).toBe("DRIVER");
    expect(body.access_token).toBeDefined();
    demoTokens["driver"] = body.access_token;
  });

  it("5. Parent Demo Login (parent@demo.ir / Demo@1234)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "parent@demo.ir",
        password: "Demo@1234",
      }),
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.user.role).toBe("PARENT");
    expect(body.access_token).toBeDefined();
    demoTokens["parent"] = body.access_token;
  });

  it("6. Driver Manifest Access with Demo Driver Token", async () => {
    const res = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=shift-demo-1`, {
      headers: { Authorization: `Bearer ${demoTokens["driver"]}` },
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
  });

  it("7. School Dashboard Overview Access with Demo School Admin Token", async () => {
    const res = await fetch(`${baseUrl}/api/v1/dashboard/overview?date=2026-08-27`, {
      headers: { Authorization: `Bearer ${demoTokens["school_admin"]}` },
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
  });

  it("8. Super Admin Tenant List Access with Demo Super Admin Token", async () => {
    const res = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
      headers: { Authorization: `Bearer ${demoTokens["super_admin"]}` },
    });
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
  });
});
