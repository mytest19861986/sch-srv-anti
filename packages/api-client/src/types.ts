export interface DashboardOverviewSummary {
  date: string;
  total_students: number;
  picked_up_count: number;
  dropped_off_count: number;
  pending_count: number;
  absent_count: number;
  is_stale: boolean;
  last_updated: string;
}

export interface LiveServiceItem {
  service_id: string;
  route_name: string;
  driver_name: string;
  driver_phone: string;
  total_students: number;
  picked_up_count: number;
  dropped_off_count: number;
  status: "IN_PROGRESS" | "COMPLETED" | "NOT_STARTED";
}

export interface SuperAdminTenant {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface SuperAdminAuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  created_at: string;
  before_snapshot?: Record<string, any>;
  after_snapshot?: Record<string, any>;
}
