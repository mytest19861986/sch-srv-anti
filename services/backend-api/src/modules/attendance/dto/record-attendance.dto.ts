import { z } from 'zod';

export const AttendanceEventTypeEnum = z.enum([
  'PICKED_UP',
  'DROPPED_OFF',
  'ABSENT',
  'CANCELLED',
  'CORRECTED'
], {
  errorMap: () => ({ message: "event_type must be 'PICKED_UP', 'DROPPED_OFF', 'ABSENT', 'CANCELLED', or 'CORRECTED'" })
});

export type AttendanceEventType = z.infer<typeof AttendanceEventTypeEnum>;

export const RecordAttendanceSchema = z.object({
  student_id: z.string().min(1, 'student_id is required'),
  service_id: z.string().min(1, 'service_id is required'),
  event_type: AttendanceEventTypeEnum,
  client_generated_id: z.string().uuid('client_generated_id must be a valid UUID v4'),
  client_timestamp: z.string().datetime('client_timestamp must be a valid ISO 8601 string'),
  cancelled_event_id: z.union([z.number(), z.string()]).optional(),
  correction_of_event_id: z.union([z.number(), z.string()]).optional(),
  correction_reason: z.string().optional()
});

export type RecordAttendanceDto = z.infer<typeof RecordAttendanceSchema>;

export interface AttendanceResponseDto {
  success: boolean;
  event_id: string | number;
  client_generated_id: string;
  student_id: string;
  service_id: string;
  event_type: AttendanceEventType;
  server_timestamp: string;
  is_idempotent_replay: boolean;
  cancelled_event_id?: string | number;
  correction_of_event_id?: string | number;
  correction_reason?: string;
}
