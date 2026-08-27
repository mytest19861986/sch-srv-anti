import { DashboardOverviewSummary, LiveServiceItem, SuperAdminTenant, SuperAdminAuditLog } from "./types";

export * from "./types";

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error ${res.status}: ${errorText}`);
    }

    return res.json() as Promise<T>;
  }

  // Dashboard Endpoints
  async getOverview(date: string): Promise<{ success: boolean; summary: DashboardOverviewSummary }> {
    return this.request<{ success: boolean; summary: DashboardOverviewSummary }>(`/api/v1/dashboard/overview?date=${date}`);
  }

  async getLiveServices(date: string, page = 1, limit = 10): Promise<{ success: boolean; services: LiveServiceItem[] }> {
    return this.request<{ success: boolean; services: LiveServiceItem[] }>(`/api/v1/dashboard/live-services?date=${date}&page=${page}&limit=${limit}`);
  }

  // Super Admin Endpoints
  async getTenants(): Promise<{ success: boolean; tenants: SuperAdminTenant[] }> {
    return this.request<{ success: boolean; tenants: SuperAdminTenant[] }>("/api/v1/super-admin/tenants");
  }

  async createTenant(name: string, code: string): Promise<{ success: boolean; tenant: SuperAdminTenant }> {
    return this.request<{ success: boolean; tenant: SuperAdminTenant }>("/api/v1/super-admin/tenants", {
      method: "POST",
      body: JSON.stringify({ name, code }),
    });
  }

  async softDeleteTenant(tenantId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/v1/super-admin/tenants/${tenantId}`, {
      method: "DELETE",
    });
  }

  async getAuditLogs(page = 1, limit = 20): Promise<{ success: boolean; logs: SuperAdminAuditLog[] }> {
    return this.request<{ success: boolean; logs: SuperAdminAuditLog[] }>(`/api/v1/super-admin/audit-logs?page=${page}&limit=${limit}`);
  }
}
