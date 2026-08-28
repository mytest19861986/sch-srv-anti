import { buildApp } from './app.js';
import { appLogger } from './shared/observability/logger.service.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  const { app, outboxWorker, queueMonitor, authService, userRepository, domainRepository, attendanceRepository } = buildApp({
    startWorker: true,
    logger: false
  });

  // Seed default demo accounts and domain entities for instant login and real API testing
  try {
    const schoolPass = await authService.hashPassword('SchoolPass@123');
    const superPass = await authService.hashPassword('SuperPass@123');
    const driverPass = await authService.hashPassword('DriverPass@123');
    const parentPass = await authService.hashPassword('ParentPass@123');
    const demoPass = await authService.hashPassword('Demo@1234');

    // 1. School Admin
    await userRepository.create({
      id: 'usr-school-admin-demo',
      tenantId: 'tenant-school-mehr',
      email: 'school@mehr.ir',
      passwordHash: schoolPass,
      fullName: 'مدیر مدرسه مهر دانش',
      role: 'SCHOOL_ADMIN',
      isActive: 'true'
    });

    // 2. Super Admin
    await userRepository.create({
      id: 'usr-super-admin-demo',
      tenantId: 'system',
      email: 'admin@platform.ir',
      passwordHash: superPass,
      fullName: 'راهبر ارشد کشوری',
      role: 'SUPER_ADMIN',
      isActive: 'true'
    });

    // 3. Driver Accounts
    await userRepository.create({
      id: 'usr-driver-demo',
      tenantId: 'tenant-school-mehr',
      email: 'driver@serviceyar.ir',
      passwordHash: driverPass,
      fullName: 'مرتضی نوری (راننده سرویس)',
      role: 'DRIVER',
      isActive: 'true'
    });

    await userRepository.create({
      id: 'usr-driver-demo-alias',
      tenantId: 'tenant-school-mehr',
      email: 'driver@demo.ir',
      passwordHash: demoPass,
      fullName: 'مرتضی نوری (راننده سرویس دمو)',
      role: 'DRIVER',
      isActive: 'true'
    });

    // 4. Parent Accounts
    await userRepository.create({
      id: 'usr-parent-demo',
      tenantId: 'tenant-school-mehr',
      email: 'parent@serviceyar.ir',
      passwordHash: parentPass,
      fullName: 'محمد احمدی (ولی دانش‌آموز)',
      role: 'PARENT',
      isActive: 'true'
    });

    await userRepository.create({
      id: 'usr-parent-demo-alias',
      tenantId: 'tenant-school-mehr',
      email: 'parent@demo.ir',
      passwordHash: demoPass,
      fullName: 'محمد احمدی (ولی دانش‌آموز دمو)',
      role: 'PARENT',
      isActive: 'true'
    });

    // 5. Domain Entities (Students, Parents, Drivers, Shifts, Routes)
    const tenantId = 'tenant-school-mehr';

    // Parent domain records
    const parentRecord1 = await domainRepository.createParent({
      id: 'parent-demo-1',
      tenantId,
      userId: 'usr-parent-demo',
      phoneNumber: '09121112233'
    });

    const parentRecordAlias = await domainRepository.createParent({
      id: 'parent-demo-alias',
      tenantId,
      userId: 'usr-parent-demo-alias',
      phoneNumber: '09121112233'
    });

    // Students
    const std1 = await domainRepository.createStudent({
      id: 'std-mehr-1',
      tenantId,
      firstName: 'علی',
      lastName: 'احمدی',
      grade: 'پایه پنجم ابتدایی'
    });

    const std2 = await domainRepository.createStudent({
      id: 'std-mehr-2',
      tenantId,
      firstName: 'سارا',
      lastName: 'احمدی',
      grade: 'پایه سوم ابتدایی'
    });

    const std3 = await domainRepository.createStudent({
      id: 'std-mehr-3',
      tenantId,
      firstName: 'پارسا',
      lastName: 'تهرانی',
      grade: 'پایه ششم ابتدایی'
    });

    // Link Parents to Students
    await domainRepository.linkStudentParent(tenantId, std1.id, parentRecord1.id);
    await domainRepository.linkStudentParent(tenantId, std2.id, parentRecord1.id);
    await domainRepository.linkStudentParent(tenantId, std1.id, parentRecordAlias.id);
    await domainRepository.linkStudentParent(tenantId, std2.id, parentRecordAlias.id);

    // Driver domain records
    const driverRecord1 = await domainRepository.createDriver({
      id: 'driver-demo-1',
      tenantId,
      userId: 'usr-driver-demo',
      licenseNumber: '۳۳ع۴۵۶-۱۱'
    });

    const driverRecordAlias = await domainRepository.createDriver({
      id: 'driver-demo-alias',
      tenantId,
      userId: 'usr-driver-demo-alias',
      licenseNumber: '۳۳ع۴۵۶-۱۱'
    });

    // Route
    const route = await domainRepository.createRoute({
      id: 'route-mehr-morning',
      tenantId,
      name: 'مسیر ۱ — کارگر شمالی و فاطمی',
      direction: 'TO_SCHOOL'
    });

    // Assign Students to Route
    await domainRepository.assignStudentToRoute(tenantId, route.id, std1.id);
    await domainRepository.assignStudentToRoute(tenantId, route.id, std2.id);
    await domainRepository.assignStudentToRoute(tenantId, route.id, std3.id);

    // Service & Shift
    const service = await domainRepository.createService({
      id: 'srv-mehr-morning',
      tenantId,
      routeId: route.id
    });

    const shift = await domainRepository.createShift({
      id: 'shift-mehr-morning',
      tenantId,
      serviceId: service.id,
      startTime: new Date(),
      status: 'ACTIVE'
    });

    // Assign Drivers to Shift
    await domainRepository.assignDriverToShift(tenantId, driverRecord1.id, shift.id);
    await domainRepository.assignDriverToShift(tenantId, driverRecordAlias.id, shift.id);

    // Record an initial attendance event for Ali Ahmadi
    await attendanceRepository.recordAttendanceWithOutbox({
      student_id: std1.id,
      event_type: 'PICKED_UP',
      service_id: service.id,
      client_generated_id: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
      client_timestamp: new Date().toISOString()
    }, tenantId, new Date(), { userId: 'usr-driver-demo', role: 'DRIVER' });

    appLogger.info('🌱 Demo accounts and rich domain entities seeded successfully for instant login.');
  } catch (err) {
    appLogger.warn('Error seeding demo accounts', err);
  }

  try {
    await app.listen({ port: PORT, host: HOST });
    appLogger.info(`🚀 School Bus Fleet Management API is listening on http://${HOST}:${PORT}`);
    appLogger.info(`🩺 Health check available at: http://${HOST}:${PORT}/health/live and http://${HOST}:${PORT}/health/ready`);

    // Graceful Shutdown Handlers
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
    for (const signal of signals) {
      process.on(signal, async () => {
        appLogger.warn(`Received ${signal}. Initiating graceful shutdown...`);

        try {
          await app.close();
          appLogger.info('Fastify server closed.');
          process.exit(0);
        } catch (err) {
          appLogger.error('Error during shutdown', err);
          process.exit(1);
        }
      });
    }
  } catch (err) {
    appLogger.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();
