import { buildApp } from './app.js';
import { appLogger } from './shared/observability/logger.service.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  const { app, outboxWorker, queueMonitor, authService, userRepository, domainRepository } = buildApp({
    startWorker: true,
    logger: false
  });

  // Seed default demo accounts for instant login
  try {
    const schoolPass = await authService.hashPassword('SchoolPass@123');
    const superPass = await authService.hashPassword('SuperPass@123');
    const driverPass = await authService.hashPassword('DriverPass@123');
    const parentPass = await authService.hashPassword('ParentPass@123');

    await userRepository.create({
      id: 'usr-school-admin-demo',
      tenantId: 'tenant-school-mehr',
      email: 'school@mehr.ir',
      passwordHash: schoolPass,
      fullName: 'مدیر مدرسه مهر دانش',
      role: 'SCHOOL_ADMIN',
      isActive: 'true'
    });

    await userRepository.create({
      id: 'usr-super-admin-demo',
      tenantId: 'system',
      email: 'admin@platform.ir',
      passwordHash: superPass,
      fullName: 'راهبر ارشد کشوری',
      role: 'SUPER_ADMIN',
      isActive: 'true'
    });

    await userRepository.create({
      id: 'usr-driver-demo',
      tenantId: 'tenant-school-mehr',
      email: 'driver@serviceyar.ir',
      passwordHash: driverPass,
      fullName: 'راننده سرویس نمونه',
      role: 'DRIVER',
      isActive: 'true'
    });

    await userRepository.create({
      id: 'usr-parent-demo',
      tenantId: 'tenant-school-mehr',
      email: 'parent@serviceyar.ir',
      passwordHash: parentPass,
      fullName: 'ولی دانش‌آموز نمونه',
      role: 'PARENT',
      isActive: 'true'
    });

    appLogger.info('🌱 Demo accounts seeded successfully for instant login.');
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

        // Stop accepting new traffic & drain active connections
        const shutdownTimeout = setTimeout(() => {
          appLogger.fatal('Graceful shutdown timeout exceeded (30s). Forcing termination.');
          process.exit(1);
        }, 30000);

        try {
          outboxWorker.stop();
          queueMonitor.stop();
          await app.close();
          appLogger.info('Server and background workers terminated cleanly.');
          clearTimeout(shutdownTimeout);
          process.exit(0);
        } catch (err) {
          appLogger.error('Error occurred during graceful shutdown', err);
          process.exit(1);
        }
      });
    }
  } catch (err) {
    appLogger.fatal('Failed to start server', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
