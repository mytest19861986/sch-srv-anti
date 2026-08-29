import Fastify, { FastifyInstance } from 'fastify';
import { AttendanceService, InMemoryAttendanceRepository, IAttendanceRepository } from './modules/attendance/attendance.service.js';
import { attendanceController } from './modules/attendance/attendance.controller.js';
import { AuthService, InMemoryUserRepository, IUserRepository } from './modules/auth/auth.service.js';
import { authController } from './modules/auth/auth.controller.js';
import { InMemoryDomainRepository } from './modules/domain/domain.service.js';
import { IOutboxQueueService, InMemoryOutboxQueueService } from './shared/queue/queue.service.js';
import { NotificationService } from './modules/notification/notification.service.js';
import { OutboxWorkerService } from './modules/notification/outbox-worker.service.js';
import { SyncService } from './modules/sync/sync.service.js';
import { syncController } from './modules/sync/sync.controller.js';
import { DashboardService } from './modules/dashboard/dashboard.service.js';
import { dashboardController } from './modules/dashboard/dashboard.controller.js';
import { ParentService } from './modules/parent/parent.service.js';
import { parentController } from './modules/parent/parent.controller.js';
import { InMemoryDeviceTokenRepository } from './modules/parent/device-token.service.js';
import { AuditService } from './modules/super-admin/audit.service.js';
import { SuperAdminService } from './modules/super-admin/super-admin.service.js';
import { superAdminController } from './modules/super-admin/super-admin.controller.js';
import { adminController } from './modules/admin/admin.controller.js';
import { registerTracingMiddleware } from './shared/observability/tracing.middleware.js';
import { healthController } from './shared/health/health.controller.js';
import { QueueMonitorService } from './shared/observability/queue-monitor.service.js';

import cors from '@fastify/cors';
import fs from 'fs';
import path from 'path';
import { FastifyRequest, FastifyReply } from 'fastify';

export interface AppOptions {
  attendanceRepository?: IAttendanceRepository;
  userRepository?: InMemoryUserRepository;
  domainRepository?: InMemoryDomainRepository;
  queueService?: IOutboxQueueService;
  syncService?: SyncService;
  dashboardService?: DashboardService;
  parentService?: ParentService;
  deviceTokenRepository?: InMemoryDeviceTokenRepository;
  auditService?: AuditService;
  superAdminService?: SuperAdminService;
  startWorker?: boolean;
  logger?: boolean;
  enableRateLimit?: boolean;
}

export function buildApp(opts: AppOptions = {}): {
  app: FastifyInstance;
  attendanceRepository: IAttendanceRepository;
  userRepository: InMemoryUserRepository;
  domainRepository: InMemoryDomainRepository;
  deviceTokenRepository: InMemoryDeviceTokenRepository;
  queueService: IOutboxQueueService;
  notificationService: NotificationService;
  outboxWorker: OutboxWorkerService;
  queueMonitor: QueueMonitorService;
  syncService: SyncService;
  dashboardService: DashboardService;
  parentService: ParentService;
  auditService: AuditService;
  superAdminService: SuperAdminService;
  authService: AuthService;
  attendanceService: AttendanceService;
} {
  const app = Fastify({
    logger: opts.logger ?? false
  });

  // Global Official CORS Registration (Supports localhost, 127.0.0.1, 192.168.1.110 and all Wi-Fi clients)
  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-Tenant-Id'],
    credentials: true
  });

  // 1. Tracing & Request Observability Hook
  registerTracingMiddleware(app);

  // 2. Request Logger & 404 Catcher to Console and temp/qa/request-log.txt (FIX-012)
  const logDir = path.resolve(process.cwd(), 'temp/qa');
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch {}
  const logFilePath = path.join(logDir, 'request-log.txt');

  app.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any)._reqStartTime = performance.now();
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const start = (request as any)._reqStartTime;
    const duration = (start ? performance.now() - start : 0).toFixed(2);
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const logLine = `[REQ] ${ip} ${request.method} ${request.url} -> ${reply.statusCode} (${duration}ms)\n`;
    console.log(logLine.trim());
    try {
      fs.appendFileSync(logFilePath, logLine, 'utf8');
    } catch {}
  });

  app.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const logLine = `[404-MISS] ${ip} ${request.method} ${request.url}\n`;
    console.warn(logLine.trim());
    try {
      fs.appendFileSync(logFilePath, logLine, 'utf8');
    } catch {}
    return reply.status(404).send({
      success: false,
      error: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
      path: request.url
    });
  });

  const domainRepository = opts.domainRepository ?? new InMemoryDomainRepository();
  const auditService = opts.auditService ?? new AuditService();
  const attendanceRepository =
    opts.attendanceRepository ?? new InMemoryAttendanceRepository(undefined, auditService);
  const queueService =
    opts.queueService ??
    (attendanceRepository as InMemoryAttendanceRepository).queueService ??
    new InMemoryOutboxQueueService();

  if ((attendanceRepository as InMemoryAttendanceRepository).queueService !== queueService) {
    (attendanceRepository as InMemoryAttendanceRepository).queueService = queueService;
  }

  const userRepository = opts.userRepository ?? new InMemoryUserRepository();
  const deviceTokenRepository = opts.deviceTokenRepository ?? new InMemoryDeviceTokenRepository();

  const authService = new AuthService(userRepository);
  const attendanceService = new AttendanceService(attendanceRepository);
  const syncService = opts.syncService ?? new SyncService(attendanceRepository);
  const notificationService = new NotificationService(domainRepository, deviceTokenRepository);
  const dashboardService = opts.dashboardService ?? new DashboardService(domainRepository, attendanceRepository);
  const parentService = opts.parentService ?? new ParentService(domainRepository, attendanceRepository, notificationService);
  const superAdminService = opts.superAdminService ?? new SuperAdminService(auditService, userRepository, authService, domainRepository, attendanceRepository);

  const outboxWorker = new OutboxWorkerService(queueService, notificationService, dashboardService, {
    pollIntervalMs: 50,
    batchSize: 50
  });

  const queueMonitor = new QueueMonitorService(queueService, 1000);

  if (opts.startWorker) {
    outboxWorker.start();
    queueMonitor.start();
  }

  // Health Checks & Metrics
  app.register(healthController(queueService), { prefix: '/health' });

  // Register Auth Module
  app.register(authController(authService, opts.enableRateLimit), { prefix: '/api/v1/auth' });

  // Register Attendance Module with Auth, Tenant protection, and Driver Manifest
  app.register(attendanceController(attendanceService, authService, domainRepository), {
    prefix: '/api/v1/attendance'
  });

  // Register Offline Sync Module
  app.register(syncController(syncService, authService), {
    prefix: '/api/v1/sync'
  });

  // Register Dashboard Module
  app.register(dashboardController(dashboardService, authService), {
    prefix: '/api/v1/dashboard'
  });

  // Register Parent Module with Device Token endpoints and Absence Reports (P1-2)
  app.register(parentController(parentService, authService, deviceTokenRepository, domainRepository), {
    prefix: '/api/v1/parent'
  });

  // Register Super Admin Module
  app.register(superAdminController(superAdminService, auditService, authService), {
    prefix: '/api/v1/super-admin'
  });

  // Register School Admin Tenant Module (Order #31)
  app.register(adminController(authService, domainRepository, attendanceRepository, auditService), {
    prefix: '/api/v1/admin'
  });

  // Graceful hook
  app.addHook('onClose', async () => {
    outboxWorker.stop();
    queueMonitor.stop();
  });

  return {
    app,
    attendanceRepository,
    userRepository,
    domainRepository,
    deviceTokenRepository,
    queueService,
    notificationService,
    outboxWorker,
    queueMonitor,
    syncService,
    dashboardService,
    parentService,
    auditService,
    superAdminService,
    authService,
    attendanceService
  };
}
