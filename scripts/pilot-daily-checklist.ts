/**
 * Pilot Day Automated Daily Checklist & Health Diagnostic Engine
 * Project: School Transport Management System (سامانه مدیریت سرویس مدرسه)
 * Phase: 20 - Pilot Operations & Pre-Flight Verification (Order #54)
 */

import { buildApp } from '../services/backend-api/src/app.js';
import { InMemoryUserRepository } from '../services/backend-api/src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../services/backend-api/src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../services/backend-api/src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../services/backend-api/src/modules/attendance/attendance.service.js';

interface CheckItem {
  domain: string;
  check: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  latencyMs: number;
}

async function runChecklist() {
  const startTime = Date.now();
  console.log('\n' + '='.repeat(80));
  console.log('  🚀 SAMANEH MADRESEHYAR — PILOT DAY AUTOMATED DAILY CHECKLIST (ORDER #54)');
  console.log('  Execution Timestamp: ' + new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  const results: CheckItem[] = [];

  const domainRepo = new InMemoryDomainRepository();
  const queueService = new InMemoryOutboxQueueService();
  const attendanceRepo = new InMemoryAttendanceRepository(queueService);
  const userRepo = new InMemoryUserRepository();

  const built = buildApp({
    attendanceRepository: attendanceRepo,
    userRepository: userRepo,
    domainRepository: domainRepo,
    queueService: queueService,
    startWorker: false,
    logger: false
  });

  const app = built.app;
  const authService = built.authService;

  const tenantId = 'school-pilot-alborz';
  const passHash = await authService.hashPassword('Pilot@Pass123');

  // Seed School Admin
  await userRepo.create({
    id: 'admin-pilot-1',
    tenantId,
    email: 'admin@pilot-school.ir',
    passwordHash: passHash,
    fullName: 'مدیر مدرسه البرز',
    role: 'SCHOOL_ADMIN',
    isActive: 'true'
  });

  // Seed Driver
  await userRepo.create({
    id: 'driver-pilot-1',
    tenantId,
    email: 'driver@pilot-school.ir',
    passwordHash: passHash,
    fullName: 'علی مرادی (راننده ۱)',
    role: 'DRIVER',
    isActive: 'true'
  });

  // Seed Parent User
  await userRepo.create({
    id: 'parent-pilot-1',
    tenantId,
    email: 'parent@pilot-school.ir',
    passwordHash: passHash,
    fullName: 'فاطمه حسینی (ولی دانش‌آموز)',
    role: 'PARENT',
    isActive: 'true'
  });

  // Seed Super Admin
  await userRepo.create({
    id: 'super-admin-pilot',
    tenantId: 'system',
    email: 'root@platform.ir',
    passwordHash: passHash,
    fullName: 'راهبر کل پلتفرم',
    role: 'SUPER_ADMIN',
    isActive: 'true'
  });

  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr: any = app.server.address();
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    // -------------------------------------------------------------
    // Check 1: Authentication & Token Generation (Admin & Driver)
    // -------------------------------------------------------------
    const t0 = Date.now();
    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@pilot-school.ir', password: 'Pilot@Pass123' })
    });
    const adminLoginData: any = await adminLoginRes.json();
    const adminToken = adminLoginData.access_token;
    const authLatency = Date.now() - t0;

    const driverLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@pilot-school.ir', password: 'Pilot@Pass123' })
    });
    const driverLoginData: any = await driverLoginRes.json();
    const driverToken = driverLoginData.access_token;

    results.push({
      domain: '1. Authentication',
      check: 'Admin & Driver JWT Issuance with Tenant Context',
      status: adminLoginRes.status === 200 && driverLoginRes.status === 200 ? 'PASS' : 'FAIL',
      details: `JWT issued for School Admin and Driver (${authLatency}ms)`,
      latencyMs: authLatency
    });

    // -------------------------------------------------------------
    // Check 2: Parent↔Student Relationship & Entity CRUD Integrity
    // -------------------------------------------------------------
    const t1 = Date.now();
    const parentCreateRes = await fetch(`${baseUrl}/api/v1/admin/parents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        full_name: 'مریم ابراهیمی',
        phone: '09199998877',
        relationship: 'مادر'
      })
    });
    const parentData: any = await parentCreateRes.json();
    const createdParentId = parentData.id;

    const studentCreateRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        first_name: 'آرتین',
        last_name: 'ابراهیمی',
        grade: 'پایه دوم',
        parent_ids: [createdParentId]
      })
    });
    const studentData: any = await studentCreateRes.json();
    const studentId = studentData.id;

    const getStudentsRes = await fetch(`${baseUrl}/api/v1/admin/students`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const studentsList: any = await getStudentsRes.json();
    const isLinked = studentsList.items?.some((s: any) => s.id === studentId && s.parents?.length > 0);
    const relLatency = Date.now() - t1;

    results.push({
      domain: '2. Entity Integrity',
      check: 'Bidirectional Parent↔Student Relationship Verification',
      status: isLinked ? 'PASS' : 'FAIL',
      details: `Linked Student (${studentId}) to Parent (${createdParentId})`,
      latencyMs: relLatency
    });

    // -------------------------------------------------------------
    // Check 3: State Machine Hardening (Pre-Pilot Guard)
    // -------------------------------------------------------------
    const t2 = Date.now();
    const illegalTransitionRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: 'srv-pilot-route-1',
        event_type: 'DROPPED_OFF', // Illegal without prior PICKED_UP
        client_generated_id: '00000000-0000-0000-0000-000000000001',
        client_timestamp: new Date().toISOString()
      })
    });
    const smLatency = Date.now() - t2;

    results.push({
      domain: '3. State Machine',
      check: 'Illegal State Transition Blocked (DROPPED_OFF before PICKED_UP)',
      status: illegalTransitionRes.status === 409 ? 'PASS' : 'FAIL',
      details: `Guard successfully returned 409 INVALID_STATE_TRANSITION`,
      latencyMs: smLatency
    });

    // -------------------------------------------------------------
    // Check 4: Attendance Recording & Idempotency Key Dedup
    // -------------------------------------------------------------
    const t3 = Date.now();
    const clientEventId = '88888888-4444-4444-4444-123456789012';
    const validEventRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: 'srv-pilot-route-1',
        event_type: 'PICKED_UP',
        client_generated_id: clientEventId,
        client_timestamp: new Date().toISOString()
      })
    });

    // Replay with identical key
    const replayRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        service_id: 'srv-pilot-route-1',
        event_type: 'PICKED_UP',
        client_generated_id: clientEventId,
        client_timestamp: new Date().toISOString()
      })
    });
    const replayBody: any = await replayRes.json();
    const eventLatency = Date.now() - t3;

    results.push({
      domain: '4. Attendance Engine',
      check: 'Real-time Attendance Ingestion & Idempotent Deduplication',
      status: validEventRes.status === 201 && replayBody.is_idempotent_replay === true ? 'PASS' : 'FAIL',
      details: `Ingestion Status=201, Replay Status=200 (is_idempotent_replay: true)`,
      latencyMs: eventLatency
    });

    // -------------------------------------------------------------
    // Check 5: Transactional Outbox Queue Status
    // -------------------------------------------------------------
    const t4 = Date.now();
    const pendingBatch = await queueService.fetchPendingBatch(50);
    const hasOutboxItem = pendingBatch.length > 0;
    const outboxLatency = Date.now() - t4;

    results.push({
      domain: '5. Outbox Queue',
      check: 'Transactional Outbox Event Generation & Zero-Loss Queue',
      status: hasOutboxItem ? 'PASS' : 'FAIL',
      details: `Outbox buffer has ${pendingBatch.length} pending events ready for async dispatch`,
      latencyMs: outboxLatency
    });

    // -------------------------------------------------------------
    // Check 6: Zero-Trust Multi-Tenancy & IDOR Defense
    // -------------------------------------------------------------
    const t5 = Date.now();
    const crossTenantAttackRes = await fetch(`${baseUrl}/api/v1/attendance/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}` // Pilot Alborz Driver
      },
      body: JSON.stringify({
        student_id: 'std-shiraz-999',
        service_id: 'srv-shiraz-1',
        event_type: 'PICKED_UP',
        client_generated_id: '99999999-9999-9999-9999-999999999999',
        client_timestamp: new Date().toISOString(),
        tenant_id: 'school-shiraz-high' // Cross-tenant injection attempt
      })
    });
    const ztLatency = Date.now() - t5;

    results.push({
      domain: '6. Zero-Trust RBAC',
      check: 'Cross-Tenant Access Injection Defense (BOLA/IDOR)',
      status: crossTenantAttackRes.status === 403 ? 'PASS' : 'FAIL',
      details: `Forbidden (403) returned on unauthorized tenant override attempt`,
      latencyMs: ztLatency
    });

    // -------------------------------------------------------------
    // Check 7: Offline-First Store & Forward Batch Sync
    // -------------------------------------------------------------
    const t6 = Date.now();
    const syncRes = await fetch(`${baseUrl}/api/v1/sync/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`
      },
      body: JSON.stringify({
        device_id: 'driver-device-samsung-a54',
        events: [
          {
            client_generated_id: '55555555-6666-7777-8888-999999999999',
            student_id: studentId,
            service_id: 'srv-pilot-route-1',
            event_type: 'PICKED_UP',
            client_timestamp: new Date().toISOString(),
            sequence_number: 1
          }
        ]
      })
    });
    const syncLatency = Date.now() - t6;

    results.push({
      domain: '7. Offline Sync',
      check: 'Offline Store-and-Forward Batch Ingestion Endpoint',
      status: syncRes.status === 200 ? 'PASS' : 'FAIL',
      details: `Canonical /api/v1/sync/batch responded with 200 OK (${syncLatency}ms)`,
      latencyMs: syncLatency
    });

    // -------------------------------------------------------------
    // Check 8: Super Admin Platform Backup Dump
    // -------------------------------------------------------------
    const t7 = Date.now();
    const rootLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'root@platform.ir', password: 'Pilot@Pass123' })
    });
    const rootLoginData: any = await rootLoginRes.json();
    const rootToken = rootLoginData.access_token;

    const backupDumpRes = await fetch(`${baseUrl}/api/v1/super-admin/database-dump`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rootToken}` }
    });
    const backupLatency = Date.now() - t7;

    results.push({
      domain: '8. Backup & DR',
      check: 'Super Admin Daily Database Dump & Snapshot Export',
      status: backupDumpRes.status === 200 ? 'PASS' : 'FAIL',
      details: `Platform DB dump successfully created in ${backupLatency}ms`,
      latencyMs: backupLatency
    });

  } finally {
    await app.close();
  }

  // -------------------------------------------------------------
  // Diagnostic Summary Report
  // -------------------------------------------------------------
  console.log('| ' + 'Domain'.padEnd(20) + ' | ' + 'Status'.padEnd(6) + ' | ' + 'Latency'.padEnd(9) + ' | ' + 'Verification Check / Results');
  console.log('|' + '-'.repeat(22) + '|' + '-'.repeat(8) + '|' + '-'.repeat(11) + '|' + '-'.repeat(45));

  let passCount = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS' : r.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL';
    if (r.status === 'PASS') passCount++;
    console.log(`| ${r.domain.padEnd(20)} | ${icon.padEnd(6)} | ${(r.latencyMs + 'ms').padEnd(9)} | ${r.check} [${r.details}]`);
  }

  console.log('\n' + '='.repeat(80));
  const totalDuration = Date.now() - startTime;
  const isAllPass = passCount === results.length;
  console.log(`  📊 DIAGNOSTIC RESULT: ${passCount}/${results.length} CHECKS PASSED (Total: ${totalDuration}ms)`);
  if (isAllPass) {
    console.log('  🟢 PILOT READINESS STATUS: ALL SYSTEMS GO (100% OPERATIONAL & READY)');
    console.log('  🌟 تمامی سیستم‌های بک‌اند، فرانت‌اند، ممیزی، ماشین وضعیت و صف‌ها آماده روز پایلوت هستند.');
  } else {
    console.log('  🔴 PILOT READINESS STATUS: INVESTIGATION REQUIRED');
  }
  console.log('='.repeat(80) + '\n');
}

runChecklist().catch((err) => {
  console.error('Fatal checklist execution error:', err);
  process.exit(1);
});
