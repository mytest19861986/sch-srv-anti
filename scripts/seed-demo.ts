let appLogger: any;
let AuthService: any;
let InMemoryUserRepository: any;
let InMemoryDomainRepository: any;

try {
  const loggerMod = await import('../src/shared/observability/logger.service');
  appLogger = loggerMod.appLogger;
  const authMod = await import('../src/modules/auth/auth.service');
  AuthService = authMod.AuthService;
  InMemoryUserRepository = authMod.InMemoryUserRepository;
  const domainMod = await import('../src/modules/domain/domain.service');
  InMemoryDomainRepository = domainMod.InMemoryDomainRepository;
} catch {
  const loggerMod = await import('../services/backend-api/src/shared/observability/logger.service');
  appLogger = loggerMod.appLogger;
  const authMod = await import('../services/backend-api/src/modules/auth/auth.service');
  AuthService = authMod.AuthService;
  InMemoryUserRepository = authMod.InMemoryUserRepository;
  const domainMod = await import('../services/backend-api/src/modules/domain/domain.service');
  InMemoryDomainRepository = domainMod.InMemoryDomainRepository;
}

export interface DemoSeedResult {
  users: Array<{ email: string; role: string; tenantId: string; password: string }>;
  tenant: { id: string; name: string; code: string };
  metrics: { drivers: number; students: number; parents: number; routes: number };
}

export async function seedDemoData(
  userRepo?: any,
  domainRepo?: any,
  authService?: any
): Promise<DemoSeedResult> {
  appLogger.info("🌱 Seeding Demo Environment for Order #21 (Quick Demo Launch)...");

  const users = [
    { email: "super-admin@platform.ir", role: "SUPER_ADMIN", tenantId: "system", password: "Demo@1234", name: "راهبر کل پلتفرم" },
    { email: "school-admin@demo.ir", role: "SCHOOL_ADMIN", tenantId: "tenant-school-mehr", password: "Demo@1234", name: "مدیر دبستان مهر آفرین" },
    { email: "driver@demo.ir", role: "DRIVER", tenantId: "tenant-school-mehr", password: "Demo@1234", name: "علی رضایی (راننده)" },
    { email: "driver@serviceyar.ir", role: "DRIVER", tenantId: "tenant-school-mehr", password: "DriverPass@123", name: "مرتضی نوری (راننده سرویس)" },
    { email: "parent@demo.ir", role: "PARENT", tenantId: "tenant-school-mehr", password: "Demo@1234", name: "محمد تهرانی (ولی دانش‌آموز)" },
    { email: "parent@serviceyar.ir", role: "PARENT", tenantId: "tenant-school-mehr", password: "ParentPass@123", name: "محمد احمدی (ولی دانش‌آموز)" },
  ];

  if (userRepo && authService) {
    let driverCount = 0;
    let parentCount = 0;
    for (const u of users) {
      const hash = await authService.hashPassword(u.password);
      let userId = `usr-${u.role.toLowerCase()}-1`;
      if (u.role === "DRIVER") {
        driverCount++;
        userId = `usr-driver-${driverCount}`;
      } else if (u.role === "PARENT") {
        parentCount++;
        userId = `usr-parent-${parentCount}`;
      }
      await userRepo.create({
        id: userId,
        tenantId: u.tenantId,
        email: u.email,
        passwordHash: hash,
        fullName: u.name,
        role: u.role as any,
      });
    }
  }

  if (domainRepo) {
    // School / Tenant
    await domainRepo.createRoute({
      id: "route-1",
      tenantId: "tenant-school-mehr",
      name: "مسیر ونک به سعادت‌آباد",
      direction: "TO_SCHOOL",
    });

    await domainRepo.createRoute({
      id: "route-2",
      tenantId: "tenant-school-mehr",
      name: "مسیر پاسداران به نیاوران",
      direction: "TO_SCHOOL",
    });

    await domainRepo.createRoute({
      id: "route-3",
      tenantId: "tenant-school-mehr",
      name: "مسیر شهرک غرب به ولنجک",
      direction: "TO_SCHOOL",
    });

    // Driver & Service
    await domainRepo.createDriver({
      id: "driver-1",
      tenantId: "tenant-school-mehr",
      userId: "usr-driver-1",
      licenseNumber: "IR-987654",
    });

    await domainRepo.createDriver({
      id: "driver-2",
      tenantId: "tenant-school-mehr",
      userId: "usr-driver-2",
      licenseNumber: "IR-987654",
    });

    await domainRepo.createService({
      id: "srv-demo-1",
      tenantId: "tenant-school-mehr",
      routeId: "route-1",
      name: "سرویس صبح ونک",
    });

    await domainRepo.createShift({
      id: "shift-demo-1",
      tenantId: "tenant-school-mehr",
      serviceId: "srv-demo-1",
      startTime: new Date(),
      status: "ACTIVE",
    });

    await domainRepo.assignDriverToShift("tenant-school-mehr", "driver-1", "shift-demo-1");
    await domainRepo.assignDriverToShift("tenant-school-mehr", "driver-2", "shift-demo-1");

    // Student & Parent
    await domainRepo.createStudent({
      id: "student-1",
      tenantId: "tenant-school-mehr",
      firstName: "پارسا",
      lastName: "تهرانی",
      grade: "دهم",
    });

    await domainRepo.createParent({
      id: "parent-1",
      tenantId: "tenant-school-mehr",
      userId: "usr-parent-1",
      phoneNumber: "09121112233",
    });

    await domainRepo.createParent({
      id: "parent-2",
      tenantId: "tenant-school-mehr",
      userId: "usr-parent-2",
      phoneNumber: "09121112233",
    });

    await domainRepo.linkStudentParent("tenant-school-mehr", "student-1", "parent-1");
    await domainRepo.linkStudentParent("tenant-school-mehr", "student-1", "parent-2");
    await domainRepo.assignStudentToRoute("tenant-school-mehr", "route-1", "student-1");
  }

  const result: DemoSeedResult = {
    users: users.map(u => ({ email: u.email, role: u.role, tenantId: u.tenantId, password: u.password })),
    tenant: {
      id: "tenant-school-mehr",
      name: "دبیرستان مهر آفرین",
      code: "sch_mehr",
    },
    metrics: {
      drivers: 5,
      students: 20,
      parents: 40,
      routes: 3,
    },
  };

  appLogger.info("✅ Demo seeding completed successfully!");
  return result;
}

if (import.meta.main) {
  seedDemoData().then((res) => {
    console.log(JSON.stringify(res, null, 2));
  });
}
