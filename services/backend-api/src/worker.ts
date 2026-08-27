import { appLogger } from './shared/observability/logger.service.js';
import { InMemoryOutboxQueueService } from './shared/queue/queue.service.js';
import { NotificationService } from './modules/notification/notification.service.js';
import { OutboxWorkerService } from './modules/notification/outbox-worker.service.js';
import { QueueMonitorService } from './shared/observability/queue-monitor.service.js';
import { InMemoryDomainRepository } from './modules/domain/domain.service.js';
import { InMemoryDeviceTokenRepository } from './modules/parent/device-token.service.js';

async function startWorker() {
  appLogger.info('⚙️ Initializing Standalone Outbox Worker Process...');

  const domainRepo = new InMemoryDomainRepository();
  const deviceTokenRepo = new InMemoryDeviceTokenRepository();
  const queueService = new InMemoryOutboxQueueService();
  const notificationService = new NotificationService(domainRepo, deviceTokenRepo);

  const outboxWorker = new OutboxWorkerService(
    queueService,
    notificationService,
    undefined,
    {
      pollIntervalMs: 500,
      batchSize: 50
    }
  );

  const queueMonitor = new QueueMonitorService(queueService, 10000);

  outboxWorker.start();
  queueMonitor.start();

  appLogger.info('🚀 outbox-worker started and polling for queued events...');

  // Graceful Shutdown
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, () => {
      appLogger.warn(`Received ${signal}. Gracefully stopping outbox-worker...`);
      outboxWorker.stop();
      queueMonitor.stop();
      appLogger.info('Outbox worker and queue monitor stopped cleanly.');
      process.exit(0);
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
  startWorker().catch((err) => {
    appLogger.fatal('Failed to start outbox-worker', err);
    process.exit(1);
  });
}
