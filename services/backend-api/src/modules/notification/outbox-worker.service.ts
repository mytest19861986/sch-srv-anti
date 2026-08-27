import { IOutboxQueueService, OutboxRecord } from '../../shared/queue/queue.service.js';
import { NotificationService } from './notification.service.js';
import { DashboardService } from '../dashboard/dashboard.service.js';

export interface OutboxWorkerOptions {
  batchSize?: number;
  pollIntervalMs?: number;
  retryDelayMs?: number;
}

export class OutboxWorkerService {
  private isRunning: boolean = false;
  private timer: any = null;
  private batchSize: number;
  private pollIntervalMs: number;
  private retryDelayMs: number;

  constructor(
    private readonly queueService: IOutboxQueueService,
    private readonly notificationService: NotificationService,
    private readonly dashboardService?: DashboardService,
    opts: OutboxWorkerOptions = {}
  ) {
    this.batchSize = opts.batchSize ?? 50;
    this.pollIntervalMs = opts.pollIntervalMs ?? 100;
    this.retryDelayMs = opts.retryDelayMs ?? 1000;
  }

  async processBatch(): Promise<{ processedCount: number; failedCount: number }> {
    const batch = await this.queueService.fetchPendingBatch(this.batchSize);
    let processedCount = 0;
    let failedCount = 0;

    for (const record of batch) {
      try {
        if (record.aggregateType === 'ATTENDANCE') {
          const payload = record.payload;
          
          // 1. Fan-out notification to parents
          await this.notificationService.dispatchAttendanceNotification(
            record.tenantId,
            payload.student_id,
            record.eventType,
            payload.server_timestamp || new Date().toISOString()
          );

          // 2. Incremental update of Daily Summary Read Model
          if (this.dashboardService) {
            await this.dashboardService.incrementDailySummary(
              record.tenantId,
              payload.service_id,
              record.eventType as 'PICKED_UP' | 'DROPPED_OFF',
              new Date(payload.client_timestamp || new Date())
            );
          }
        }

        await this.queueService.markProcessed(record.id);
        processedCount++;
      } catch (err: any) {
        await this.queueService.markFailed(record.id, err.message, this.retryDelayMs);
        failedCount++;
      }
    }

    return { processedCount, failedCount };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const poll = async () => {
      if (!this.isRunning) return;
      try {
        await this.processBatch();
      } catch (err) {
        console.error('Error during outbox polling:', err);
      } finally {
        if (this.isRunning) {
          this.timer = setTimeout(poll, this.pollIntervalMs);
        }
      }
    };

    this.timer = setTimeout(poll, this.pollIntervalMs);
  }

  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
