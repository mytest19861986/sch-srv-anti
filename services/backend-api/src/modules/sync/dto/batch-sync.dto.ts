import { z } from 'zod';

export const SyncEventItemSchema = z.object({
  client_generated_id: z.string().uuid('client_generated_id must be a valid UUID'),
  student_id: z.string().min(1, 'student_id is required'),
  service_id: z.string().min(1, 'service_id is required'),
  event_type: z.enum(['PICKED_UP', 'DROPPED_OFF']),
  client_timestamp: z.string().datetime({ message: 'client_timestamp must be a valid ISO 8601 string' }),
  sequence_number: z.number().int().min(1, 'sequence_number must be a positive integer')
});

export const BatchSyncSchema = z.object({
  device_id: z.string().min(1, 'device_id is required'),
  events: z.array(SyncEventItemSchema).max(200, 'Batch size exceeds maximum limit of 200 events per request')
});

export type SyncEventItemDto = z.infer<typeof SyncEventItemSchema>;
export type BatchSyncDto = z.infer<typeof BatchSyncSchema>;

export type SyncResultStatus = 'created' | 'duplicate' | 'conflict' | 'error';

export interface SyncEventResult {
  client_generated_id: string;
  status: SyncResultStatus;
  sequence_number: number;
  message?: string;
}

export interface BatchSyncResponseDto {
  success: boolean;
  tenant_id: string;
  device_id: string;
  total_received: number;
  created_count: number;
  duplicate_count: number;
  conflict_count: number;
  error_count: number;
  results: SyncEventResult[];
}
