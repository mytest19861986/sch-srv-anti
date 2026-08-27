export interface AuditLogEntry {
  id: string;
  tenantId?: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'ROLE_CHANGE' | 'SETTING_CHANGE';
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AuditQueryOptions {
  tenantId?: string;
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export class AuditService {
  private logs: AuditLogEntry[] = [];

  async log(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<AuditLogEntry> {
    const id = `audit-${Math.random().toString(36).substring(2, 11)}`;
    const newEntry: AuditLogEntry = {
      ...entry,
      id,
      createdAt: new Date()
    };
    this.logs.push(newEntry);
    return newEntry;
  }

  async getLogs(opts: AuditQueryOptions = {}): Promise<{ total: number; page: number; limit: number; logs: AuditLogEntry[] }> {
    let filtered = [...this.logs];

    if (opts.tenantId) {
      filtered = filtered.filter(l => l.tenantId === opts.tenantId);
    }
    if (opts.userId) {
      filtered = filtered.filter(l => l.userId === opts.userId);
    }
    if (opts.action) {
      filtered = filtered.filter(l => l.action === opts.action);
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const page = opts.page || 1;
    const limit = opts.limit || 20;
    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      total,
      page,
      limit,
      logs: paginated
    };
  }

  clear() {
    this.logs = [];
  }
}
