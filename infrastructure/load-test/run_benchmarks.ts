import { buildApp } from '../../services/backend-api/src/app.js';
import { InMemoryUserRepository } from '../../services/backend-api/src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../services/backend-api/src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../../services/backend-api/src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../../services/backend-api/src/modules/attendance/attendance.service.js';
import { randomUUID } from 'crypto';

interface BenchResult {
  scenario: string;
  concurrency: number;
  totalRequests: number;
  durationSeconds: number;
  reqPerSec: number;
  p50: number;
  p95: number;
  p99: number;
  successRate: number;
  errorRate: number;
  rssMb: number;
}

async function runBenchmark() {
  console.log("=================================================");
  console.log("⚡ Starting ServiceYar Real Load Test Suite");
  console.log("=================================================");

  const domainRepo = new InMemoryDomainRepository();
  const queueService = new InMemoryOutboxQueueService();
  const attendanceRepo = new InMemoryAttendanceRepository(queueService);
  const userRepo = new InMemoryUserRepository();

  const built = buildApp({
    attendanceRepository: attendanceRepo,
    userRepository: userRepo,
    domainRepository: domainRepo,
    queueService: queueService,
    startWorker: true,
    logger: false
  });
  const app = built.app;
  const authService = built.authService;

  const passwordHash = await authService.hashPassword('BenchmarkPass@123');

  // Seed 200 Students, 50 Drivers, 50 Shifts, 50 Routes
  for (let i = 1; i <= 200; i++) {
    await domainRepo.createStudent({
      id: `std-${i}`,
      tenantId: 'school-bench-1',
      firstName: `دانش‌آموز`,
      lastName: `${i}`,
      nationalId: `00${10000000 + i}`,
      status: 'ACTIVE'
    });
  }

  const driverTokens: { driverId: string; shiftId: string; serviceId: string; token: string }[] = [];

  for (let i = 1; i <= 50; i++) {
    await userRepo.create({
      id: `user-driver-${i}`,
      email: `driver${i}@bench.ir`,
      passwordHash,
      role: 'DRIVER',
      tenantId: 'school-bench-1',
      fullName: `راننده آزمایشی ${i}`,
      isActive: 'true'
    });

    await domainRepo.createDriver({
      id: `drv-${i}`,
      tenantId: 'school-bench-1',
      userId: `user-driver-${i}`,
      licenseNumber: `LIC-${1000 + i}`,
      vehicleId: `veh-${i}`
    });

    await domainRepo.createRoute({
      id: `route-${i}`,
      tenantId: 'school-bench-1',
      name: `مسیر ${i}`,
      points: []
    });

    await domainRepo.createService({
      id: `service-${i}`,
      tenantId: 'school-bench-1',
      routeId: `route-${i}`,
      driverId: `drv-${i}`,
      name: `سرویس ${i}`,
      scheduledTime: '07:30'
    });

    await domainRepo.createShift({
      id: `shift-${i}`,
      tenantId: 'school-bench-1',
      serviceId: `service-${i}`,
      plannedStartTime: new Date(),
      status: 'SCHEDULED'
    });

    await domainRepo.assignDriverToShift('school-bench-1', `drv-${i}`, `shift-${i}`);

    // Assign 4 students to each route
    for (let s = 1; s <= 4; s++) {
      const studentId = `std-${(i - 1) * 4 + s}`;
      await domainRepo.assignStudentToRoute('school-bench-1', `route-${i}`, studentId);
    }
  }

  // Create School Admin
  await userRepo.create({
    id: `admin-1`,
    email: `admin@bench.ir`,
    passwordHash,
    role: 'SCHOOL_ADMIN',
    tenantId: 'school-bench-1',
    fullName: `مدیر مدرسه بنچ‌مارک`,
    isActive: 'true'
  });

  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // Log in drivers
  for (let i = 1; i <= 50; i++) {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `driver${i}@bench.ir`, password: 'BenchmarkPass@123' })
    });
    const data = await res.json() as any;
    driverTokens.push({
      driverId: `drv-${i}`,
      shiftId: `shift-${i}`,
      serviceId: `service-${i}`,
      token: data.access_token
    });
  }

  // Admin login
  const adminRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `admin@bench.ir`, password: 'BenchmarkPass@123' })
  });
  const adminData = await adminRes.json() as any;
  const adminToken = adminData.access_token;

  const results: BenchResult[] = [];
  const scenarios = [
    { name: "Scenario 1: Morning Burst (50 Concurrent Drivers)", concurrency: 50, durationSec: 3 },
    { name: "Scenario 2: Rush Hour Scaling (100 Concurrent Users)", concurrency: 100, durationSec: 3 },
    { name: "Scenario 3: Peak Pilot Saturation (200 Concurrent Users)", concurrency: 200, durationSec: 3 },
  ];

  for (const sc of scenarios) {
    console.log(`\n⏳ Running ${sc.name}...`);
    const latencies: number[] = [];
    let errors = 0;
    let success = 0;
    const start = performance.now();
    const endTime = start + (sc.durationSec * 1000);

    const worker = async (workerId: number) => {
      const driver = driverTokens[workerId % driverTokens.length];
      while (performance.now() < endTime) {
        const reqStart = performance.now();
        try {
          const rand = Math.random();
          let res: Response;
          if (rand < 0.45) {
            // Manifest
            res = await fetch(`${baseUrl}/api/v1/attendance/manifest?shift_id=${driver.shiftId}`, {
              headers: { 'Authorization': `Bearer ${driver.token}` }
            });
          } else if (rand < 0.85) {
            // Attendance event (PICKED_UP)
            const studentId = `std-${((workerId * 4) % 200) + 1}`;
            res = await fetch(`${baseUrl}/api/v1/attendance/events`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${driver.token}`
              },
              body: JSON.stringify({
                client_generated_id: randomUUID(),
                service_id: driver.serviceId,
                student_id: studentId,
                event_type: 'PICKED_UP',
                client_timestamp: new Date().toISOString()
              })
            });
          } else {
            // Admin query
            res = await fetch(`${baseUrl}/api/v1/admin/students`, {
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });
          }

          if (res.ok) {
            success++;
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
        latencies.push(performance.now() - reqStart);
      }
    };

    await Promise.all(Array.from({ length: sc.concurrency }).map((_, i) => worker(i)));
    const totalDuration = (performance.now() - start) / 1000;
    latencies.sort((a, b) => a - b);

    const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const totalRequests = success + errors;
    const reqPerSec = Number((totalRequests / totalDuration).toFixed(1));
    const successRate = Number(((success / totalRequests) * 100).toFixed(2));
    const errorRate = Number(((errors / totalRequests) * 100).toFixed(2));
    const mem = process.memoryUsage();
    const rssMb = Number((mem.rss / (1024 * 1024)).toFixed(1));

    console.log(`  ✓ Completed ${totalRequests} requests in ${totalDuration.toFixed(2)}s`);
    console.log(`  ⚡ Throughput: ${reqPerSec} req/sec | Success: ${successRate}% | p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms | p99: ${p99.toFixed(2)}ms | RAM: ${rssMb}MB`);

    results.push({
      scenario: sc.name,
      concurrency: sc.concurrency,
      totalRequests,
      durationSeconds: Number(totalDuration.toFixed(2)),
      reqPerSec,
      p50: Number(p50.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      p99: Number(p99.toFixed(2)),
      successRate,
      errorRate,
      rssMb
    });
  }

  await app.close();

  // Save JSON report for docs generation
  await Bun.write('docs/load-test-results.json', JSON.stringify(results, null, 2));
  console.log("\n📊 Benchmark results written to docs/load-test-results.json");
}

runBenchmark().catch(console.error);
