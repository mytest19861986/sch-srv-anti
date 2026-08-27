import { BatchSyncDto, BatchSyncResponseDto, SyncEventResult } from './dto/batch-sync.dto.js';
import { IAttendanceRepository } from '../attendance/attendance.service.js';

export interface SyncMetadataRecord {
  deviceId: string;
  tenantId: string;
  lastSyncedAt: Date;
  pendingCount: number;
  lastError?: string;
}

export interface SyncConflictRecord {
  id: string;
  tenantId: string;
  deviceId: string;
  studentId: string;
  serviceId: string;
  clientGeneratedId: string;
  clientTimestamp: Date;
  latestExistingTimestamp: Date;
  reason: string;
  detectedAt: Date;
}

export class SyncService {
  private syncMetadataStore = new Map<string, SyncMetadataRecord>();
  private conflictsStore: SyncConflictRecord[] = [];

  constructor(private readonly attendanceRepo: IAttendanceRepository) {}

  async processBatchSync(dto: BatchSyncDto, tenantId: string): Promise<BatchSyncResponseDto> {
    const results: SyncEventResult[] = [];
    const seenInBatch = new Set<string>();

    let createdCount = 0;
    let duplicateCount = 0;
    let conflictCount = 0;
    let errorCount = 0;

    // 1. Sort events chronologically by client_timestamp & sequence_number for deterministic replay
    const sortedEvents = [...dto.events].sort(
      (a, b) =>
        new Date(a.client_timestamp).getTime() - new Date(b.client_timestamp).getTime() ||
        a.sequence_number - b.sequence_number
    );

    // 2. Process each event independently (Partial Success)
    for (const item of sortedEvents) {
      try {
        // A. Check for duplicate within the current batch
        if (seenInBatch.has(item.client_generated_id)) {
          results.push({
            client_generated_id: item.client_generated_id,
            sequence_number: item.sequence_number,
            status: 'duplicate',
            message: 'Duplicate client_generated_id found within the same sync batch'
          });
          duplicateCount++;
          continue;
        }
        seenInBatch.add(item.client_generated_id);

        // B. Check existing events for this student on this service
        const existingTenantEvents = await this.attendanceRepo.getAttendanceEventsByTenant(tenantId);
        const alreadyRecorded = existingTenantEvents.find(
          e => e.clientGeneratedId === item.client_generated_id
        );

        if (alreadyRecorded) {
          results.push({
            client_generated_id: item.client_generated_id,
            sequence_number: item.sequence_number,
            status: 'duplicate',
            message: 'Event was already recorded previously'
          });
          duplicateCount++;
          continue;
        }

        // C. Chronological Conflict Detection
        // Find latest recorded event for this student on this service
        const studentEvents = existingTenantEvents
          .filter(e => e.studentId === item.student_id && e.serviceId === item.service_id)
          .sort((a, b) => new Date(b.clientTimestamp).getTime() - new Date(a.clientTimestamp).getTime());

        const latestEvent = studentEvents[0];
        const incomingTime = new Date(item.client_timestamp).getTime();

        if (latestEvent && incomingTime < new Date(latestEvent.clientTimestamp).getTime()) {
          // Out-of-order event arriving after a newer state was already recorded -> Conflict
          const conflict: SyncConflictRecord = {
            id: `conflict-${Math.random().toString(36).substring(2, 9)}`,
            tenantId,
            deviceId: dto.device_id,
            studentId: item.student_id,
            serviceId: item.service_id,
            clientGeneratedId: item.client_generated_id,
            clientTimestamp: new Date(item.client_timestamp),
            latestExistingTimestamp: new Date(latestEvent.clientTimestamp),
            reason: `Incoming event client_timestamp (${item.client_timestamp}) is older than latest recorded state (${latestEvent.clientTimestamp.toISOString()})`,
            detectedAt: new Date()
          };
          this.conflictsStore.push(conflict);

          results.push({
            client_generated_id: item.client_generated_id,
            sequence_number: item.sequence_number,
            status: 'conflict',
            message: conflict.reason
          });
          conflictCount++;
          continue;
        }

        // D. Record valid event
        const recordResult = await this.attendanceRepo.recordAttendanceWithOutbox(
          {
            student_id: item.student_id,
            service_id: item.service_id,
            event_type: item.event_type,
            client_generated_id: item.client_generated_id,
            client_timestamp: item.client_timestamp
          },
          tenantId,
          new Date()
        );

        if (recordResult.isDuplicate) {
          results.push({
            client_generated_id: item.client_generated_id,
            sequence_number: item.sequence_number,
            status: 'duplicate',
            message: 'Idempotent replay detected'
          });
          duplicateCount++;
        } else {
          results.push({
            client_generated_id: item.client_generated_id,
            sequence_number: item.sequence_number,
            status: 'created'
          });
          createdCount++;
        }
      } catch (err: any) {
        results.push({
          client_generated_id: item.client_generated_id,
          sequence_number: item.sequence_number,
          status: 'error',
          message: err.message || 'Unexpected processing error'
        });
        errorCount++;
      }
    }

    // 3. Update Sync Metadata for the device
    this.syncMetadataStore.set(`${tenantId}:${dto.device_id}`, {
      deviceId: dto.device_id,
      tenantId,
      lastSyncedAt: new Date(),
      pendingCount: conflictCount,
      lastError: errorCount > 0 ? `${errorCount} events failed during sync` : undefined
    });

    return {
      success: true,
      tenant_id: tenantId,
      device_id: dto.device_id,
      total_received: dto.events.length,
      created_count: createdCount,
      duplicate_count: duplicateCount,
      conflict_count: conflictCount,
      error_count: errorCount,
      results
    };
  }

  getDeviceSyncMetadata(tenantId: string, deviceId: string): SyncMetadataRecord | null {
    return this.syncMetadataStore.get(`${tenantId}:${deviceId}`) || null;
  }

  getConflicts(tenantId: string): SyncConflictRecord[] {
    return this.conflictsStore.filter(c => c.tenantId === tenantId);
  }

  clear() {
    this.syncMetadataStore.clear();
    this.conflictsStore = [];
  }
}
