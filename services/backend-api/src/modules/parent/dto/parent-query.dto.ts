import { z } from 'zod';

export const TimelineQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const NotificationHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export type TimelineQueryDto = z.infer<typeof TimelineQuerySchema>;
export type NotificationHistoryQueryDto = z.infer<typeof NotificationHistoryQuerySchema>;

export interface ChildStatusResponse {
  success: boolean;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    grade: string;
  };
  current_status: 'PICKED_UP' | 'DROPPED_OFF' | 'IN_TRANSIT' | 'AT_SCHOOL' | 'NOT_STARTED';
  last_event?: {
    event_type: string;
    service_id: string;
    timestamp: string;
  };
  driver_info?: {
    full_name: string;
  };
}

export interface ChildTimelineResponse {
  success: boolean;
  student_id: string;
  date: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  timeline: Array<{
    id: number;
    event_type: string;
    service_id: string;
    client_timestamp: string;
    server_timestamp: string;
  }>;
}

export interface ParentNotificationsResponse {
  success: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  notifications: Array<{
    id: string;
    student_id: string;
    title: string;
    body: string;
    status: string;
    sent_at: string;
  }>;
}
