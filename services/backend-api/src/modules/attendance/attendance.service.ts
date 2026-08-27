import { RecordAttendanceDto, AttendanceEventType } from './dto/record-attendance.dto.js';
import { IOutboxQueueService, InMemoryOutboxQueueService, OutboxRecord } from '../../shared/queue/queue.service.js';
import { AuditService } from '../super-admin/audit.service.js';

export interface AttendanceRecord {
  id: number;
  tenantId: string;
  clientGeneratedId: string;
  studentId: string;
  serviceId: string;
  eventType: AttendanceEventType;
  clientTimestamp: Date;
  serverTimestamp: Date;
  createdAt: Date;
  cancelledEventId?: number;
  correctionOfEventId?: number;
  correctionReason?: string;
  cancelled?: boolean;
  corrected?: boolean;
}

export interface UserContext {
  userId: string;
  role: string;
}

export interface IAttendanceRepository {
  recordAttendanceWithOutbox(
    dto: RecordAttendanceDto,
    tenantId: string,
    serverTimestamp: Date,
    userContext?: UserContext
  ): Promise<{ attendanceEvent: AttendanceRecord; isDuplicate: boolean }>;
  
  getAttendanceEventsByTenant(tenantId: string): Promise<AttendanceRecord[]>;
  getAllEvents(): Promise<AttendanceRecord[]>;
  getAttendanceEvents?(): AttendanceRecord[];
  getOutboxEvents?(): OutboxRecord[];
  getEventById(id: number): Promise<AttendanceRecord | undefined>;
}

export class InMemoryAttendanceRepository implements IAttendanceRepository {
  private events: AttendanceRecord[] = [];
  private clientGeneratedIds: Set<string> = new Set();
  private idCounter = 1;
  private mutex = false;
  public queueService: IOutboxQueueService;

  constructor(
    queueService?: IOutboxQueueService,
    private readonly auditService?: AuditService
  ) {
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

  async getEventById(id: number): Promise<AttendanceRecord | undefined> {
    return this.events.find(e => e.id === id);
  }

  async recordAttendanceWithOutbox(
    dto: RecordAttendanceDto,
    tenantId: string,
    serverTimestamp: Date,
    userContext?: UserContext
  ): Promise<{ attendanceEvent: AttendanceRecord; isDuplicate: boolean }> {
    await this.acquireLock();
    try {
      // 1. Check Idempotency Key first (never fail duplicate idempotent retries)
      const key = `${tenantId}:${dto.client_generated_id}`;
      if (this.clientGeneratedIds.has(key)) {
        const existing = this.events.find(
          e => e.tenantId === tenantId && e.clientGeneratedId === dto.client_generated_id
        )!;
        return { attendanceEvent: existing, isDuplicate: true };
      }

      // 2. Strict State Machine Validation
      const todayStr = (dto.client_timestamp ? new Date(dto.client_timestamp) : serverTimestamp)
        .toISOString()
        .split('T')[0];

      // Get active today events for this student
      const studentTodayEvents = this.events
        .filter(
          e =>
            e.tenantId === tenantId &&
            e.studentId === dto.student_id &&
            e.clientTimestamp.toISOString().startsWith(todayStr)
        )
        .sort((a, b) => a.id - b.id);

      const activeTodayEvents = studentTodayEvents.filter(e => !e.cancelled);
      const lastActiveEvent = activeTodayEvents.length > 0 ? activeTodayEvents[activeTodayEvents.length - 1] : null;

      const actorRole = userContext?.role || 'DRIVER';
      const actorId = userContext?.userId || 'system';

      if (dto.event_type === 'PICKED_UP') {
        if (lastActiveEvent && lastActiveEvent.eventType === 'PICKED_UP') {
          const err: any = new Error('Student is already marked as PICKED_UP today');
          err.statusCode = 409;
          err.code = 'INVALID_STATE_TRANSITION';
          throw err;
        }
        if (lastActiveEvent && lastActiveEvent.eventType === 'ABSENT') {
          const err: any = new Error('Student is marked ABSENT today. Cannot transition to PICKED_UP');
          err.statusCode = 409;
          err.code = 'INVALID_STATE_TRANSITION';
          throw err;
        }
      } else if (dto.event_type === 'DROPPED_OFF') {
        if (lastActiveEvent && (lastActiveEvent.eventType === 'DROPPED_OFF' || lastActiveEvent.eventType === 'ABSENT')) {
          const err: any = new Error('Cannot transition to DROPPED_OFF from current state');
          err.statusCode = 409;
          err.code = 'INVALID_STATE_TRANSITION';
          throw err;
        }
      } else if (dto.event_type === 'ABSENT') {
        if (actorRole !== 'SCHOOL_ADMIN' && actorRole !== 'SCHOOL_OPERATOR' && actorRole !== 'SUPER_ADMIN') {
          const err: any = new Error('Only SCHOOL_ADMIN or SCHOOL_OPERATOR can record student ABSENT status');
          err.statusCode = 403;
          err.code = 'FORBIDDEN_ROLE';
          throw err;
        }
        if (activeTodayEvents.length > 0) {
          const err: any = new Error('Student already has attendance activity recorded today. Cannot mark ABSENT');
          err.statusCode = 409;
          err.code = 'INVALID_STATE_TRANSITION';
          throw err;
        }
      } else if (dto.event_type === 'CANCELLED') {
        const targetId = dto.cancelled_event_id ? Number(dto.cancelled_event_id) : (lastActiveEvent ? lastActiveEvent.id : null);
        if (!targetId) {
          const err: any = new Error('No active event found to cancel');
          err.statusCode = 409;
          err.code = 'INVALID_STATE_TRANSITION';
          throw err;
        }
        const targetEvent = this.events.find(e => e.id === targetId && e.tenantId === tenantId);
        if (!targetEvent || targetEvent.cancelled) {
          const err: any = new Error('Target event to cancel not found or already cancelled');
          err.statusCode = 409;
          err.code = 'INVALID_STATE_TRANSITION';
          throw err;
        }
        // Soft-invalidate the target event
        targetEvent.cancelled = true;
      } else if (dto.event_type === 'CORRECTED') {
        if (actorRole !== 'SCHOOL_ADMIN' && actorRole !== 'SCHOOL_OPERATOR' && actorRole !== 'SUPER_ADMIN') {
          const err: any = new Error('Only SCHOOL_ADMIN or SCHOOL_OPERATOR can perform event correction');
          err.statusCode = 403;
          err.code = 'FORBIDDEN_ROLE';
          throw err;
        }
        if (!dto.correction_reason || dto.correction_reason.trim().length < 10) {
          const err: any = new Error('correction_reason is mandatory and must be at least 10 characters');
          err.statusCode = 400;
          err.code = 'INVALID_CORRECTION_REASON';
          throw err;
        }
        if (!dto.correction_of_event_id) {
          const err: any = new Error('correction_of_event_id is required for CORRECTED events');
          err.statusCode = 400;
          err.code = 'MISSING_TARGET_EVENT';
          throw err;
        }
        const targetEvent = this.events.find(e => e.id === Number(dto.correction_of_event_id) && e.tenantId === tenantId);
        if (!targetEvent) {
          const err: any = new Error('Target event for correction was not found');
          err.statusCode = 404;
          err.code = 'EVENT_NOT_FOUND';
          throw err;
        }

        // Snapshot BEFORE state
        const beforeSnapshot = {
          id: targetEvent.id,
          eventType: targetEvent.eventType,
          studentId: targetEvent.studentId,
          serviceId: targetEvent.serviceId,
          clientTimestamp: targetEvent.clientTimestamp.toISOString(),
          corrected: targetEvent.corrected
        };

        // Flag target event
        targetEvent.corrected = true;

        // Snapshot AFTER state
        const afterSnapshot = {
          targetEventId: targetEvent.id,
          newClientGeneratedId: dto.client_generated_id,
          correctionReason: dto.correction_reason,
          correctedBy: actorId,
          correctedAt: serverTimestamp.toISOString()
        };

        // Log to Audit Trail
        if (this.auditService) {
          await this.auditService.log({
            tenantId,
            userId: actorId,
            action: 'ATTENDANCE_EVENT_CORRECTED',
            resourceType: 'ATTENDANCE_EVENT',
            resourceId: String(targetEvent.id),
            changes: {
              before: beforeSnapshot,
              after: afterSnapshot
            }
          });
        }
      }

      // 3. Insert into Attendance Events
      const newEvent: AttendanceRecord = {
        id: this.idCounter++,
        tenantId,
        clientGeneratedId: dto.client_generated_id,
        studentId: dto.student_id,
        serviceId: dto.service_id,
        eventType: dto.event_type,
        clientTimestamp: new Date(dto.client_timestamp),
        serverTimestamp,
        createdAt: new Date(),
        cancelledEventId: dto.cancelled_event_id ? Number(dto.cancelled_event_id) : undefined,
        correctionOfEventId: dto.correction_of_event_id ? Number(dto.correction_of_event_id) : undefined,
        correctionReason: dto.correction_reason
      };
      this.events.push(newEvent);
      this.clientGeneratedIds.add(key);

      // 4. Atomically Insert into Outbox (Transactional Outbox Pattern)
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
          server_timestamp: newEvent.serverTimestamp.toISOString(),
          cancelled_event_id: newEvent.cancelledEventId,
          correction_of_event_id: newEvent.correctionOfEventId,
          correction_reason: newEvent.correctionReason
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

  async recordAttendance(dto: RecordAttendanceDto, tenantId: string, userContext?: UserContext) {
    const serverTimestamp = new Date();
    const result = await this.attendanceRepo.recordAttendanceWithOutbox(dto, tenantId, serverTimestamp, userContext);
    return {
      success: true,
      event_id: result.attendanceEvent.id,
      client_generated_id: result.attendanceEvent.clientGeneratedId,
      student_id: result.attendanceEvent.studentId,
      service_id: result.attendanceEvent.serviceId,
      event_type: result.attendanceEvent.eventType,
      client_timestamp: result.attendanceEvent.clientTimestamp.toISOString(),
      server_timestamp: result.attendanceEvent.serverTimestamp.toISOString(),
      is_idempotent_replay: result.isDuplicate,
      cancelled_event_id: result.attendanceEvent.cancelledEventId,
      correction_of_event_id: result.attendanceEvent.correctionOfEventId,
      correction_reason: result.attendanceEvent.correctionReason
    };
  }

  async processAttendance(dto: RecordAttendanceDto, tenantId: string, userContext?: UserContext) {
    return this.recordAttendance(dto, tenantId, userContext);
  }

  async getTenantAttendanceEvents(tenantId: string): Promise<AttendanceRecord[]> {
    return this.attendanceRepo.getAttendanceEventsByTenant(tenantId);
  }
}
