import { RecordAttendanceDto } from './dto/record-attendance.dto.js';
import { IOutboxQueueService, InMemoryOutboxQueueService, OutboxRecord } from '../../shared/queue/queue.service.js';

export interface AttendanceRecord {
  id: number;
  tenantId: string;
  clientGeneratedId: string;
  studentId: string;
  serviceId: string;
  eventType: 'PICKED_UP' | 'DROPPED_OFF';
  clientTimestamp: Date;
  serverTimestamp: Date;
  createdAt: Date;
}

export interface IAttendanceRepository {
  recordAttendanceWithOutbox(
    dto: RecordAttendanceDto,
    tenantId: string,
    serverTimestamp: Date
  ): Promise<{ attendanceEvent: AttendanceRecord; isDuplicate: boolean }>;
  
  getAttendanceEventsByTenant(tenantId: string): Promise<AttendanceRecord[]>;
  getAllEvents(): Promise<AttendanceRecord[]>;
  getAttendanceEvents?(): AttendanceRecord[];
  getOutboxEvents?(): OutboxRecord[];
}

export class InMemoryAttendanceRepository implements IAttendanceRepository {
  private events: AttendanceRecord[] = [];
  private clientGeneratedIds: Set<string> = new Set();
  private idCounter = 1;
  private mutex = false;
  public queueService: IOutboxQueueService;

  constructor(queueService?: IOutboxQueueService) {
    this.queueService = queueService ?? new InMemoryOutboxQueueService();
  }

  private async acquireLock(): Promise<void> {
    while (this.mutex) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    this.mutex = true;
  }

  private releaseLock(): void {
    this.mutex = false;
  }

  async recordAttendanceWithOutbox(
    dto: RecordAttendanceDto,
    tenantId: string,
    serverTimestamp: Date
  ): Promise<{ attendanceEvent: AttendanceRecord; isDuplicate: boolean }> {
    await this.acquireLock();
    try {
      // 1. Check Idempotency Key
      const key = `${tenantId}:${dto.client_generated_id}`;
      if (this.clientGeneratedIds.has(key)) {
        const existing = this.events.find(
          e => e.tenantId === tenantId && e.clientGeneratedId === dto.client_generated_id
        )!;
        return { attendanceEvent: existing, isDuplicate: true };
      }

      // 2. Insert into Attendance Events
      const newEvent: AttendanceRecord = {
        id: this.idCounter++,
        tenantId,
        clientGeneratedId: dto.client_generated_id,
        studentId: dto.student_id,
        serviceId: dto.service_id,
        eventType: dto.event_type,
        clientTimestamp: new Date(dto.client_timestamp),
        serverTimestamp,
        createdAt: new Date()
      };
      this.events.push(newEvent);
      this.clientGeneratedIds.add(key);

      // 3. Atomically Insert into Outbox (Transactional Outbox Pattern)
      await this.queueService.enqueue({
        tenantId,
        aggregateType: 'ATTENDANCE',
        aggregateId: String(newEvent.id),
        eventType: newEvent.eventType,
        payload: {
          attendance_event_id: newEvent.id,
          client_generated_id: newEvent.clientGeneratedId,
          student_id: newEvent.studentId,
          service_id: newEvent.serviceId,
          event_type: newEvent.eventType,
          client_timestamp: newEvent.clientTimestamp.toISOString(),
          server_timestamp: newEvent.serverTimestamp.toISOString()
        }
      });

      return { attendanceEvent: newEvent, isDuplicate: false };
    } finally {
      this.releaseLock();
    }
  }

  async getAttendanceEventsByTenant(tenantId: string): Promise<AttendanceRecord[]> {
    return this.events.filter(e => e.tenantId === tenantId);
  }

  async getAllEvents(): Promise<AttendanceRecord[]> {
    return [...this.events];
  }

  getAttendanceEvents(): AttendanceRecord[] {
    return [...this.events];
  }

  getOutboxEvents(): OutboxRecord[] {
    if (this.queueService && typeof (this.queueService as any).getAllRecords === 'function') {
      return (this.queueService as any).getAllRecords();
    }
    return [];
  }

  clear() {
    this.events = [];
    this.clientGeneratedIds.clear();
    this.idCounter = 1;
    this.mutex = false;
  }
}

export class AttendanceService {
  constructor(private readonly attendanceRepo: IAttendanceRepository) {}

  async recordAttendance(dto: RecordAttendanceDto, tenantId: string) {
    const serverTimestamp = new Date();
    const result = await this.attendanceRepo.recordAttendanceWithOutbox(dto, tenantId, serverTimestamp);
    return {
      success: true,
      event_id: result.attendanceEvent.id,
      client_generated_id: result.attendanceEvent.clientGeneratedId,
      student_id: result.attendanceEvent.studentId,
      service_id: result.attendanceEvent.serviceId,
      event_type: result.attendanceEvent.eventType,
      client_timestamp: result.attendanceEvent.clientTimestamp.toISOString(),
      server_timestamp: result.attendanceEvent.serverTimestamp.toISOString(),
      is_idempotent_replay: result.isDuplicate
    };
  }

  async processAttendance(dto: RecordAttendanceDto, tenantId: string) {
    return this.recordAttendance(dto, tenantId);
  }

  async getTenantAttendanceEvents(tenantId: string): Promise<AttendanceRecord[]> {
    return this.attendanceRepo.getAttendanceEventsByTenant(tenantId);
  }
}
