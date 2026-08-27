import { appLogger } from './shared/observability/logger.service.js';
import { InMemoryOutboxQueueService } from './shared/queue/queue.service.js';
import { NotificationService } from './modules/notification/notification.service.js';
import { MockNotificationAdapter } from './modules/notification/mock-notification.adapter.js';
import { FcmNotificationAdapter } from './modules/notification/fcm.adapter.js';
import { OutboxWorkerService } from './modules/notification/outbox-worker.service.js';
import { QueueMonitorService } from './shared/observability/queue-monitor.service.js';
import { InMemoryDeviceTokenRepository } from './modules/parent/device-token.service.js';

async function startWorker() {
  appLogger.info('⚙️ Initializing Standalone Outbox Worker Process...');

  const queueService = new InMemoryOutboxQueueService();
  const deviceTokenRepo = new InMemoryDeviceTokenRepository();

  const notificationAdapter = process.env.NOTIFICATION_ADAPTER === 'fcm'
    ? new FcmNotificationAdapter()
    : new MockNotificationAdapter();

  const notificationService = new NotificationService(
    notificationAdapter,
    deviceTokenRepo,
    queueService
  );

  const outboxWorker = new OutboxWorkerService(
    queueService,
    notificationService,
    {
      pollIntervalMs: 500,
      batchSize: 50,
      maxRetries: 3
    }
  );

  const queueMonitor = new QueueMonitorService(queueService, 10000);

  outboxWorker.start();
  queueMonitor.start();

  appLogger.info('🚀 outbox-worker started and listening for asynchronous events...');

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
