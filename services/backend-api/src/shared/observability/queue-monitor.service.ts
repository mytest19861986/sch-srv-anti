import { IOutboxQueueService, InMemoryOutboxQueueService } from '../queue/queue.service.js';
import { metricsService } from './metrics.service.js';
import { appLogger } from './logger.service.js';

export class QueueMonitorService {
  private timer: any = null;

  constructor(
    private readonly queueService: IOutboxQueueService,
    private readonly checkIntervalMs: number = 5000
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(async () => {
      try {
        if (typeof (this.queueService as any).getAllRecords === 'function') {
          const records = (this.queueService as any).getAllRecords();
          const pending = records.filter((r: any) => r.status === 'pending');
          const now = Date.now();

          let maxDelayMs = 0;
          for (const r of pending) {
            const delay = now - new Date(r.createdAt).getTime();
            if (delay > maxDelayMs) maxDelayMs = delay;
          }

          metricsService.recordOutboxDelay(maxDelayMs, pending.length);

          if (pending.length > 500) {
            appLogger.warn(`Outbox queue backpressure detected: ${pending.length} pending items`, {
              data: { pendingCount: pending.length, maxDelayMs }
            });
          }
        }
      } catch (err) {
        appLogger.error('Error during queue monitoring', err);
      }
    }, this.checkIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
