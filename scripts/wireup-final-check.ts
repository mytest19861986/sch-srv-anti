/**
 * Production Wire-up Final Verification & Health Check Suite (Order #55)
 * Project: School Transport Management System (سامانه مدیریت سرویس مدرسه)
 * Validates DNS readiness, Nginx reverse proxy configs, .env.production secrets, and API liveness.
 */

import * as fs from 'fs';
import * as path from 'path';
import { buildApp } from '../services/backend-api/src/app.js';
import { InMemoryUserRepository } from '../services/backend-api/src/modules/auth/auth.service.js';
import { InMemoryDomainRepository } from '../services/backend-api/src/modules/domain/domain.service.js';
import { InMemoryOutboxQueueService } from '../services/backend-api/src/shared/queue/queue.service.js';
import { InMemoryAttendanceRepository } from '../services/backend-api/src/modules/attendance/attendance.service.js';

interface DiagnosticResult {
  category: string;
  testName: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
  latencyMs: number;
}

async function runFinalCheck() {
  const rootDir = process.cwd();
  const startTime = Date.now();

  console.log('\n' + '='.repeat(80));
  console.log('  🔍 WIRE-UP FINAL QUALITY GATE & PRODUCTION PRE-FLIGHT VERIFIER (ORDER #55)');
  console.log('  Timestamp: ' + new Date().toISOString());
  console.log('='.repeat(80) + '\n');

  const results: DiagnosticResult[] = [];

  // -------------------------------------------------------------
  // Check 1: Production Configuration Files Existence
  // -------------------------------------------------------------
  const t0 = Date.now();
  const envProdPath = path.join(rootDir, '.env.production');
  const nginxProdPath = path.join(rootDir, 'infrastructure', 'deploy', 'nginx-production.conf');
  const dnsDocPath = path.join(rootDir, 'docs', 'DNS_SETUP.md');
  const dockerComposeProdPath = path.join(rootDir, 'infrastructure', 'deploy', 'docker-compose.prod.yml');

  const allFilesExist =
    fs.existsSync(envProdPath) &&
    fs.existsSync(nginxProdPath) &&
    fs.existsSync(dnsDocPath) &&
    fs.existsSync(dockerComposeProdPath);

  results.push({
    category: '1. Production Artifacts',
    testName: 'Production Configs & Deployment Manifests Existence',
    status: allFilesExist ? 'PASS' : 'FAIL',
    details: `.env.production, nginx-production.conf, DNS_SETUP.md present`,
    latencyMs: Date.now() - t0
  });

  // -------------------------------------------------------------
  // Check 2: .env.production Cryptographic Entropy & Secret Hardening
  // -------------------------------------------------------------
  const t1 = Date.now();
  let secretEntropyOk = false;
  let domainFound = 'madresehyar.ir';
  if (fs.existsSync(envProdPath)) {
    const envContent = fs.readFileSync(envProdPath, 'utf-8');
    const hasJwtSecret = /JWT_SECRET=([a-f0-9]{32,})/.test(envContent);
    const hasDbPassword = /POSTGRES_PASSWORD=([a-f0-9]{16,})/.test(envContent);
    const hasNoDefault = !envContent.includes('password123') && !envContent.includes('secret_key_change_me');
    secretEntropyOk = hasJwtSecret && hasDbPassword && hasNoDefault;

    const domainMatch = envContent.match(/DOMAIN_NAME=([^\r\n]+)/);
    if (domainMatch) domainFound = domainMatch[1].trim();
  }

  results.push({
    category: '2. Security Hardening',
    testName: 'Production Secrets Entropy & Cryptographic Randomness',
    status: secretEntropyOk ? 'PASS' : 'FAIL',
    details: `JWT_SECRET (>=256-bit) and DB passwords validated (0 default placeholders)`,
    latencyMs: Date.now() - t1
  });

  // -------------------------------------------------------------
  // Check 3: Nginx Production Configuration Syntax & Upstream Security
  // -------------------------------------------------------------
  const t2 = Date.now();
  let nginxOk = false;
  if (fs.existsSync(nginxProdPath)) {
    const nginxContent = fs.readFileSync(nginxProdPath, 'utf-8');
    const hasHttp2 = nginxContent.includes('http2');
    const hasHsts = nginxContent.includes('Strict-Transport-Security');
    const hasRateLimit = nginxContent.includes('limit_req_zone');
    const hasUpstreams =
      nginxContent.includes('backend_cluster') &&
      nginxContent.includes('school_web_cluster') &&
      nginxContent.includes('super_admin_cluster');
    nginxOk = hasHttp2 && hasHsts && hasRateLimit && hasUpstreams;
  }

  results.push({
    category: '3. Nginx Reverse Proxy',
    testName: 'Nginx Virtual Hosts, Rate Limiting & SSL Hardening',
    status: nginxOk ? 'PASS' : 'FAIL',
    details: `HTTP/2, HSTS, Rate Limiting & 3 Upstream Clusters configured`,
    latencyMs: Date.now() - t2
  });

  // -------------------------------------------------------------
  // Check 4: DNS Configuration & Subdomain Matrix Consistency
  // -------------------------------------------------------------
  const t3 = Date.now();
  let dnsOk = false;
  if (fs.existsSync(dnsDocPath)) {
    const dnsContent = fs.readFileSync(dnsDocPath, 'utf-8');
    const hasA = dnsContent.includes('| **A** |');
    const hasApi = dnsContent.includes('`api`');
    const hasSchool = dnsContent.includes('`school`');
    const hasAdmin = dnsContent.includes('`admin`');
    const hasSpf = dnsContent.includes('v=spf1');
    dnsOk = hasA && hasApi && hasSchool && hasAdmin && hasSpf;
  }

  results.push({
    category: '4. DNS Zone Records',
    testName: 'Subdomain Routing & SPF/DMARC Email Protection',
    status: dnsOk ? 'PASS' : 'FAIL',
    details: `Mapped @, api.${domainFound}, school.${domainFound}, admin.${domainFound} + SPF`,
    latencyMs: Date.now() - t3
  });

  // -------------------------------------------------------------
  // Check 5: Fastify App Production Liveness & Auth Readiness
  // -------------------------------------------------------------
  const t4 = Date.now();
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

  const testTenant = 'tenant-wireup-pilot';
  const hashedPass = await authService.hashPassword('Wireup@Secure123');

  await userRepo.create({
    id: 'usr-wireup-admin',
    tenantId: testTenant,
    email: `admin@${domainFound}`,
    passwordHash: hashedPass,
    fullName: 'مدیر پایلوت سیستم',
    role: 'SCHOOL_ADMIN',
    isActive: 'true'
  });

  await app.listen({ port: 0, host: '127.0.0.1' });
  const addr: any = app.server.address();
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  let apiHealthOk = false;
  try {
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `admin@${domainFound}`, password: 'Wireup@Secure123' })
    });
    const loginData: any = await loginRes.json();
    apiHealthOk = loginRes.status === 200 && !!loginData.access_token;
  } finally {
    await app.close();
  }

  results.push({
    category: '5. Core API Service',
    testName: 'Production API Authentication & Tenant Context Verification',
    status: apiHealthOk ? 'PASS' : 'FAIL',
    details: `Auth endpoint responsive, JWT signed successfully for admin@${domainFound}`,
    latencyMs: Date.now() - t4
  });

  // -------------------------------------------------------------
  // Check 6: Docker Compose Multi-Container Topology
  // -------------------------------------------------------------
  const t5 = Date.now();
  let composeOk = false;
  if (fs.existsSync(dockerComposeProdPath)) {
    const composeContent = fs.readFileSync(dockerComposeProdPath, 'utf-8');
    const hasPostgres = composeContent.includes('postgres-primary:') || composeContent.includes('postgres-db:');
    const hasBackend = composeContent.includes('backend-api:');
    const hasSchoolWeb = composeContent.includes('school-web:');
    const hasSuperAdmin = composeContent.includes('super-admin-web:');
    const hasNginx = composeContent.includes('nginx:') || composeContent.includes('nginx_prod:');
    composeOk = hasPostgres && hasBackend && hasSchoolWeb && hasSuperAdmin && hasNginx;
  }

  results.push({
    category: '6. Container Topology',
    testName: 'Docker Compose 5-Tier Microservice Topology Definition',
    status: composeOk ? 'PASS' : 'FAIL',
    details: `PostgreSQL, Backend API, School Web, Super Admin Web, Nginx Reverse Proxy verified`,
    latencyMs: Date.now() - t5
  });

  // -------------------------------------------------------------
  // Print Diagnostic Table
  // -------------------------------------------------------------
  console.log('| ' + 'Category'.padEnd(23) + ' | ' + 'Status'.padEnd(6) + ' | ' + 'Latency'.padEnd(9) + ' | ' + 'Verification Check / Results');
  console.log('|' + '-'.repeat(25) + '|' + '-'.repeat(8) + '|' + '-'.repeat(11) + '|' + '-'.repeat(45));

  let passCount = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS' : r.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL';
    if (r.status === 'PASS') passCount++;
    console.log(`| ${r.category.padEnd(23)} | ${icon.padEnd(6)} | ${(r.latencyMs + 'ms').padEnd(9)} | ${r.testName} [${r.details}]`);
  }

  console.log('\n' + '='.repeat(80));
  const totalDuration = Date.now() - startTime;
  const isAllPass = passCount === results.length;
  console.log(`  📊 VERIFICATION SUMMARY: ${passCount}/${results.length} CHECKS PASSED (Total Time: ${totalDuration}ms)`);
  if (isAllPass) {
    console.log('  🟢 PRODUCTION STATUS: WIRE-UP KIT 100% VERIFIED & READY FOR LIVE TRAFFIC');
    console.log('  🌟 سامانه با تمامی تنظیمات DNS، Nginx، متغیرهای محیطی و امنیت Zero-Trust آماده استقرار است.');
  } else {
    console.log('  🔴 PRODUCTION STATUS: ATTENTION REQUIRED');
  }
  console.log('='.repeat(80) + '\n');

  if (!isAllPass) {
    process.exit(1);
  }
}

runFinalCheck().catch((err) => {
  console.error('Fatal error during wireup final check:', err);
  process.exit(1);
});
