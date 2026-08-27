import { buildApp } from '../../src/app.js';
import { InMemoryUserRepository } from '../../src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../../src/modules/domain/domain.service.js';
import { InMemoryAttendanceRepository } from '../../src/modules/attendance/attendance.service.js';
import autocannon from 'autocannon';
import { randomUUID } from 'crypto';

interface ScenarioResult {
  scenario: string;
  totalRequests: number;
  rps: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  errors: number;
  successRate: number;
}

async function runBenchmark(): Promise<ScenarioResult[]> {
  console.log('🚀 Starting Progressive Load Testing Engine...\n');

  const userRepo = new InMemoryUserRepository();
  const domainRepo = new InMemoryDomainRepository();
  const attendanceRepo = new InMemoryAttendanceRepository();

  const built = buildApp({
    userRepository: userRepo,
    domainRepository: domainRepo,
    attendanceRepository: attendanceRepo,
    startWorker: true,
    logger: false
  });

  const app = built.app;

  // Provision load test driver user
  const hash = await built.authService.hashPassword('pass123');
  await userRepo.create({
    id: 'driver-bench',
    tenantId: 'school-bench-tenant',
    email: 'driver.bench@school.com',
    passwordHash: hash,
    fullName: 'Driver Bench',
    role: 'DRIVER'
  });

  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  const baseUrl = `http://127.0.0.1:${(address as any).port}`;

  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver.bench@school.com', password: 'pass123' })
  });
  const token = ((await loginRes.json()) as any).access_token;

  const results: ScenarioResult[] = [];

  // ==========================================
  // Scenario 1: Morning Burst (Attendance Write)
  // ==========================================
  console.log('--- [1/3] Executing Scenario 1: Morning Attendance Burst ---');
  let iter = 0;
  const burstResult = await autocannon({
    url: `${baseUrl}/api/v1/attendance/events`,
    connections: 50,
    pipelining: 1,
    duration: 5,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`
    },
    setupClient: (client) => {
      const isReplay = iter % 10 === 0;
      const uuid = isReplay 
        ? '00000000-0000-0000-0000-000000000001' 
        : `00000000-0000-0000-0000-${String((iter++) % 100000).padStart(12, '0')}`;
      
      client.setBody(
        JSON.stringify({
          student_id: `student-${Math.floor(Math.random() * 1000)}`,
          service_id: 'service-bench-1',
          event_type: 'PICKED_UP',
          client_generated_id: uuid,
          client_timestamp: new Date().toISOString()
        })
      );
    }
  });

  results.push({
    scenario: '1. Morning Burst (Attendance Write)',
    totalRequests: burstResult.requests.total,
    rps: Number(burstResult.requests.average.toFixed(2)),
    p50Ms: burstResult.latency.p50,
    p95Ms: burstResult.latency.p95 || burstResult.latency.p90,
    p99Ms: burstResult.latency.p99,
    maxMs: burstResult.latency.max,
    errors: burstResult.errors + burstResult.non2xx,
    successRate: Number(((burstResult['2xx'] / burstResult.requests.total) * 100).toFixed(2))
  });

  // ==========================================
  // Scenario 2: Reconnection Storm (Batch Sync)
  // ==========================================
  console.log('\n--- [2/3] Executing Scenario 2: Reconnection Storm (Batch Sync) ---');
  let stormIter = 0;
  const stormResult = await autocannon({
    url: `${baseUrl}/api/v1/sync/batch`,
    connections: 30,
    pipelining: 1,
    duration: 5,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`
    },
    setupClient: (client) => {
      const events = Array.from({ length: 50 }).map((_, idx) => ({
        client_generated_id: randomUUID(),
        student_id: `student-storm-${idx}`,
        service_id: 'service-storm-1',
        event_type: 'PICKED_UP',
        client_timestamp: new Date().toISOString(),
        sequence_number: idx + 1
      }));

      client.setBody(
        JSON.stringify({
          device_id: `handset-bench-${stormIter++ % 100}`,
          events: events
        })
      );
    }
  });

  results.push({
    scenario: '2. Reconnection Storm (50-Event Batch Sync)',
    totalRequests: stormResult.requests.total,
    rps: Number(stormResult.requests.average.toFixed(2)),
    p50Ms: stormResult.latency.p50,
    p95Ms: stormResult.latency.p95 || stormResult.latency.p90,
    p99Ms: stormResult.latency.p99,
    maxMs: stormResult.latency.max,
    errors: stormResult.errors + stormResult.non2xx,
    successRate: Number(((stormResult['2xx'] / stormResult.requests.total) * 100).toFixed(2))
  });

  // ==========================================
  // Scenario 3: Worker Backpressure & Decoupling
  // ==========================================
  console.log('\n--- [3/3] Executing Scenario 3: Worker Backpressure & Decoupling ---');
  (built.notificationService as any).dispatchAttendanceNotification = async () => {
    await new Promise((r) => setTimeout(r, 2000));
  };

  let bpIter = 0;
  const bpResult = await autocannon({
    url: `${baseUrl}/api/v1/attendance/events`,
    connections: 40,
    pipelining: 1,
    duration: 5,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`
    },
    setupClient: (client) => {
      client.setBody(
        JSON.stringify({
          student_id: `student-bp-${Math.floor(Math.random() * 500)}`,
          service_id: 'service-bp-1',
          event_type: 'PICKED_UP',
          client_generated_id: randomUUID(),
          client_timestamp: new Date().toISOString()
        })
      );
    }
  });

  results.push({
    scenario: '3. Worker Backpressure & Decoupling (2s FCM Delay)',
    totalRequests: bpResult.requests.total,
    rps: Number(bpResult.requests.average.toFixed(2)),
    p50Ms: bpResult.latency.p50,
    p95Ms: bpResult.latency.p95 || bpResult.latency.p90,
    p99Ms: bpResult.latency.p99,
    maxMs: bpResult.latency.max,
    errors: bpResult.errors + bpResult.non2xx,
    successRate: Number(((bpResult['2xx'] / bpResult.requests.total) * 100).toFixed(2))
  });

  await app.close();

  console.log('\n========================================================================================');
  console.log('🏆 PROGRESSIVE LOAD TEST BENCHMARK RESULTS (EVIDENCE-BASED)');
  console.log('========================================================================================');
  console.table(results);
  console.log('========================================================================================\n');

  return results;
}

runBenchmark().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
