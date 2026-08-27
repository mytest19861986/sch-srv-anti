import { z } from 'zod';

export const DashboardQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  shift_id: z.string().optional(),
  service_id: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type DashboardQueryDto = z.infer<typeof DashboardQuerySchema>;

export interface DashboardOverviewResponse {
  success: boolean;
  tenant_id: string;
  date: string;
  data_freshness_seconds: number;
  is_stale: boolean;
  summary: {
    total_services: number;
    total_students: number;
    total_picked_up: number;
    total_dropped_off: number;
    total_pending: number;
    total_absent: number;
  };
}

export interface LiveServiceItem {
  service_id: string;
  service_name: string;
  route_id?: string;
  route_name?: string;
  shift_id?: string;
  total_students: number;
  picked_up_count: number;
  dropped_off_count: number;
  pending_count: number;
  absent_count: number;
  last_event_at?: string;
  updated_at: string;
}

export interface LiveServicesResponse {
  success: boolean;
  tenant_id: string;
  date: string;
  data_freshness_seconds: number;
  is_stale: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  services: LiveServiceItem[];
}

export interface ServiceDetailResponse {
  success: boolean;
  tenant_id: string;
  date: string;
  data_freshness_seconds: number;
  is_stale: boolean;
  service: {
    id: string;
    name: string;
    route_name?: string;
    total_students: number;
    picked_up_count: number;
    dropped_off_count: number;
    pending_count: number;
    absent_count: number;
  };
  students: Array<{
    student_id: string;
    first_name: string;
    last_name: string;
    grade: string;
    status: 'PICKED_UP' | 'DROPPED_OFF' | 'PENDING' | 'ABSENT';
    last_event_time?: string;
  }>;
}
