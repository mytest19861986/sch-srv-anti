import { z } from 'zod';

export const RecordAttendanceSchema = z.object({
  student_id: z.string().min(1, 'student_id is required'),
  service_id: z.string().min(1, 'service_id is required'),
  event_type: z.enum(['PICKED_UP', 'DROPPED_OFF'], {
    errorMap: () => ({ message: "event_type must be either 'PICKED_UP' or 'DROPPED_OFF'" })
  }),
  client_generated_id: z.string().uuid('client_generated_id must be a valid UUID v4'),
  client_timestamp: z.string().datetime('client_timestamp must be a valid ISO 8601 string')
});

export type RecordAttendanceDto = z.infer<typeof RecordAttendanceSchema>;

export interface AttendanceResponseDto {
  success: boolean;
  event_id: string | number;
  client_generated_id: string;
  student_id: string;
  service_id: string;
  event_type: 'PICKED_UP' | 'DROPPED_OFF';
  server_timestamp: string;
  is_idempotent_replay: boolean;
}
