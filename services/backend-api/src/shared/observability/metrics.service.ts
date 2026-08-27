export class MetricsService {
  // Counters
  public attendance_write_success_total: number = 0;
  public attendance_write_error_total: Map<string, number> = new Map();
  public notification_failure_total: number = 0;
  public http_requests_total: Map<string, number> = new Map(); // "METHOD:route:statusCode" -> count

  // Gauges
  public outbox_queue_length: number = 0;
  public db_connection_pool_active: number = 0;
  public db_connection_pool_waiting: number = 0;

  // Histograms (Samples)
  public attendance_write_latency_ms: number[] = [];
  public outbox_processing_delay_ms: number[] = [];
  public notification_dispatch_latency_ms: number[] = [];
  public offline_sync_batch_size: number[] = [];
  public http_request_duration_seconds: number[] = [];

  recordAttendanceWriteSuccess(latencyMs: number): void {
    this.attendance_write_success_total += 1;
    this.attendance_write_latency_ms.push(latencyMs);
    if (this.attendance_write_latency_ms.length > 1000) {
      this.attendance_write_latency_ms.shift();
    }
  }

  recordAttendanceWriteError(errorType: string): void {
    const current = this.attendance_write_error_total.get(errorType) || 0;
    this.attendance_write_error_total.set(errorType, current + 1);
  }

  recordOutboxDelay(delayMs: number, currentQueueLength: number): void {
    this.outbox_queue_length = currentQueueLength;
    this.outbox_processing_delay_ms.push(delayMs);
    if (this.outbox_processing_delay_ms.length > 1000) {
      this.outbox_processing_delay_ms.shift();
    }
  }

  recordNotificationDispatch(latencyMs: number, isFailure: boolean = false): void {
    if (isFailure) {
      this.notification_failure_total += 1;
    }
    this.notification_dispatch_latency_ms.push(latencyMs);
    if (this.notification_dispatch_latency_ms.length > 1000) {
      this.notification_dispatch_latency_ms.shift();
    }
  }

  recordOfflineBatchSize(size: number): void {
    this.offline_sync_batch_size.push(size);
    if (this.offline_sync_batch_size.length > 1000) {
      this.offline_sync_batch_size.shift();
    }
  }

  recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
    const key = `${method.toUpperCase()}:${route}:${statusCode}`;
    const count = this.http_requests_total.get(key) || 0;
    this.http_requests_total.set(key, count + 1);

    this.http_request_duration_seconds.push(durationSeconds);
    if (this.http_request_duration_seconds.length > 1000) {
      this.http_request_duration_seconds.shift();
    }
  }

  getSnapshot(): Record<string, any> {
    const calcAvg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const calcP95 = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * 0.95);
      return sorted[idx] || sorted[sorted.length - 1];
    };

    return {
      timestamp: new Date().toISOString(),
      attendance: {
        success_total: this.attendance_write_success_total,
        errors_total: Object.fromEntries(this.attendance_write_error_total),
        latency_avg_ms: calcAvg(this.attendance_write_latency_ms),
        latency_p95_ms: calcP95(this.attendance_write_latency_ms)
      },
      outbox: {
        queue_length: this.outbox_queue_length,
        processing_delay_avg_ms: calcAvg(this.outbox_processing_delay_ms),
        processing_delay_p95_ms: calcP95(this.outbox_processing_delay_ms)
      },
      notifications: {
        failures_total: this.notification_failure_total,
        dispatch_latency_avg_ms: calcAvg(this.notification_dispatch_latency_ms)
      },
      database_pool: {
        active_connections: this.db_connection_pool_active,
        waiting_connections: this.db_connection_pool_waiting
      },
      http: {
        requests_total: Object.fromEntries(this.http_requests_total),
        duration_avg_seconds: calcAvg(this.http_request_duration_seconds)
      }
    };
  }

  clear(): void {
    this.attendance_write_success_total = 0;
    this.attendance_write_error_total.clear();
    this.notification_failure_total = 0;
    this.http_requests_total.clear();
    this.outbox_queue_length = 0;
    this.attendance_write_latency_ms = [];
    this.outbox_processing_delay_ms = [];
    this.notification_dispatch_latency_ms = [];
    this.offline_sync_batch_size = [];
    this.http_request_duration_seconds = [];
  }
}

export const metricsService = new MetricsService();
