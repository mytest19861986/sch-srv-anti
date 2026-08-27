export interface OutboxRecord {
  id: string;
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, any>;
  status: 'pending' | 'processed' | 'failed';
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
  lastError?: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface IOutboxQueueService {
  enqueue(record: Omit<OutboxRecord, 'id' | 'status' | 'retryCount' | 'maxRetries' | 'nextRetryAt' | 'createdAt'>): Promise<OutboxRecord>;
  fetchPendingBatch(batchSize: number): Promise<OutboxRecord[]>;
  markProcessed(id: string): Promise<void>;
  markFailed(id: string, error: string, retryDelayMs?: number): Promise<void>;
}

export class InMemoryOutboxQueueService implements IOutboxQueueService {
  private records = new Map<string, OutboxRecord>();
  private locked = new Set<string>(); // Simulates FOR UPDATE SKIP LOCKED concurrency

  async enqueue(
    record: Omit<OutboxRecord, 'id' | 'status' | 'retryCount' | 'maxRetries' | 'nextRetryAt' | 'createdAt'>
  ): Promise<OutboxRecord> {
    const id = `outbox-${Math.random().toString(36).substring(2, 11)}`;
    const newRecord: OutboxRecord = {
      ...record,
      id,
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      nextRetryAt: new Date(),
      createdAt: new Date()
    };
    this.records.set(id, newRecord);
    return newRecord;
  }

  // Atomic batch poll simulating FOR UPDATE SKIP LOCKED
  async fetchPendingBatch(batchSize: number = 50): Promise<OutboxRecord[]> {
    const now = new Date();
    const batch: OutboxRecord[] = [];

    for (const record of this.records.values()) {
      if (batch.length >= batchSize) break;

      if (
        record.status === 'pending' &&
        !this.locked.has(record.id) &&
        record.nextRetryAt <= now
      ) {
        this.locked.add(record.id); // SKIP LOCKED lock
        batch.push({ ...record });
      }
    }

    return batch;
  }

  async markProcessed(id: string): Promise<void> {
    const record = this.records.get(id);
    if (record) {
      record.status = 'processed';
      record.processedAt = new Date();
      this.records.set(id, record);
    }
    this.locked.delete(id); // Release lock
  }

  async markFailed(id: string, error: string, retryDelayMs: number = 1000): Promise<void> {
    const record = this.records.get(id);
    if (record) {
      record.retryCount += 1;
      record.lastError = error;

      if (record.retryCount >= record.maxRetries) {
        record.status = 'failed';
      } else {
        // Exponential backoff
        const delay = retryDelayMs * Math.pow(2, record.retryCount - 1);
        record.nextRetryAt = new Date(Date.now() + delay);
      }
      this.records.set(id, record);
    }
    this.locked.delete(id); // Release lock
  }

  getAllRecords(): OutboxRecord[] {
    return Array.from(this.records.values());
  }

  clear() {
    this.records.clear();
    this.locked.clear();
  }
}
