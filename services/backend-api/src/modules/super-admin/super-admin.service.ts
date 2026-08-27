import { CreateTenantDto, UpdateTenantDto } from './dto/tenant-management.dto.js';
import { CreateUserDto, ChangeUserRoleDto, ChangeUserStatusDto } from './dto/user-management.dto.js';
import { AuditService } from './audit.service.js';
import { InMemoryUserRepository, AuthService } from '../auth/auth.service.js';
import { InMemoryDomainRepository } from '../domain/domain.service.js';
import { IAttendanceRepository } from '../attendance/attendance.service.js';

export interface TenantRecord {
  id: string;
  name: string;
  isActive: 'true' | 'false';
  createdAt: Date;
}

export class SuperAdminService {
  private tenants = new Map<string, TenantRecord>();
  private settings = new Map<string, any>();

  constructor(
    private readonly auditService: AuditService,
    private readonly userRepo: InMemoryUserRepository,
    private readonly authService: AuthService,
    private readonly domainRepo: InMemoryDomainRepository,
    private readonly attendanceRepo: IAttendanceRepository
  ) {
    // Initial default settings
    this.settings.set('max_batch_sync_limit', { value: 200, description: 'Max events per offline batch' });
    this.settings.set('data_freshness_threshold_seconds', { value: 30, description: 'Seconds before dashboard indicates stale data' });
  }

  // --- TENANT MANAGEMENT ---
  async createTenant(dto: CreateTenantDto, performedByUserId: string): Promise<TenantRecord> {
    if (this.tenants.has(dto.id)) {
      throw new Error('TENANT_ALREADY_EXISTS');
    }
    const record: TenantRecord = {
      id: dto.id,
      name: dto.name,
      isActive: 'true',
      createdAt: new Date()
    };
    this.tenants.set(dto.id, record);

    await this.auditService.log({
      tenantId: dto.id,
      userId: performedByUserId,
      action: 'CREATE',
      resourceType: 'TENANT',
      resourceId: dto.id,
      changes: { name: dto.name, is_active: 'true' }
    });

    return record;
  }

  async updateTenant(id: string, dto: UpdateTenantDto, performedByUserId: string): Promise<TenantRecord> {
    const record = this.tenants.get(id);
    if (!record) {
      throw new Error('TENANT_NOT_FOUND');
    }

    const previous = { ...record };
    if (dto.name) record.name = dto.name;
    if (dto.is_active) record.isActive = dto.is_active;
    this.tenants.set(id, record);

    await this.auditService.log({
      tenantId: id,
      userId: performedByUserId,
      action: 'UPDATE',
      resourceType: 'TENANT',
      resourceId: id,
      changes: { previous, updated: { name: record.name, isActive: record.isActive } }
    });

    return record;
  }

  async softDeleteTenant(id: string, performedByUserId: string): Promise<TenantRecord> {
    const record = this.tenants.get(id);
    if (!record) {
      throw new Error('TENANT_NOT_FOUND');
    }

    record.isActive = 'false';
    this.tenants.set(id, record);

    await this.auditService.log({
      tenantId: id,
      userId: performedByUserId,
      action: 'DELETE',
      resourceType: 'TENANT',
      resourceId: id,
      changes: { action: 'SOFT_DELETE', is_active: 'false' }
    });

    return record;
  }

  async listTenants(page: number = 1, limit: number = 20) {
    const all = Array.from(this.tenants.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = all.length;
    const paginated = all.slice((page - 1) * limit, page * limit);
    return {
      total,
      page,
      limit,
      tenants: paginated
    };
  }

  // --- USER MANAGEMENT ---
  async createUser(dto: CreateUserDto, performedByUserId: string) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const passwordHash = await this.authService.hashPassword(dto.password);
    const user = await this.userRepo.create({
      id: dto.id,
      tenantId: dto.tenant_id,
      email: dto.email,
      passwordHash,
      fullName: dto.full_name,
      role: dto.role,
      isActive: 'true'
    });

    await this.auditService.log({
      tenantId: dto.tenant_id,
      userId: performedByUserId,
      action: 'CREATE',
      resourceType: 'USER',
      resourceId: user.id,
      changes: { email: user.email, role: user.role, tenantId: user.tenantId }
    });

    return {
      id: user.id,
      tenant_id: user.tenantId,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      is_active: user.isActive
    };
  }

  async changeUserRole(userId: string, dto: ChangeUserRoleDto, performedByUserId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const previousRole = user.role;
    user.role = dto.role;

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: performedByUserId,
      action: 'ROLE_CHANGE',
      resourceType: 'USER',
      resourceId: user.id,
      changes: {
        previousRole,
        newRole: dto.role
      }
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }

  async changeUserStatus(userId: string, dto: ChangeUserStatusDto, performedByUserId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    user.isActive = dto.is_active;

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: performedByUserId,
      action: 'UPDATE',
      resourceType: 'USER',
      resourceId: user.id,
      changes: {
        is_active: dto.is_active
      }
    });

    return {
      id: user.id,
      email: user.email,
      is_active: user.isActive
    };
  }

  async listUsers(page: number = 1, limit: number = 20, tenantId?: string) {
    let users = await this.userRepo.listAll();
    if (tenantId) {
      users = users.filter(u => u.tenantId === tenantId);
    }
    const total = users.length;
    const paginated = users.slice((page - 1) * limit, page * limit);
    return {
      total,
      page,
      limit,
      users: paginated.map(u => ({
        id: u.id,
        tenant_id: u.tenantId,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        is_active: u.isActive
      }))
    };
  }

  // --- PLATFORM OVERVIEW REPORT ---
  async getPlatformOverview() {
    const totalTenants = this.tenants.size;
    const activeTenants = Array.from(this.tenants.values()).filter(t => t.isActive === 'true').length;
    const allUsers = await this.userRepo.listAll();
    const totalStudents = this.domainRepo.students.size;

    const today = new Date().toISOString().split('T')[0];
    const allEvents = await this.attendanceRepo.getAllEvents();
    const todayEvents = allEvents.filter(e => e.clientTimestamp.toISOString().startsWith(today));

    return {
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        total_tenants: totalTenants,
        active_tenants: activeTenants,
        total_users: allUsers.length,
        total_students: totalStudents,
        total_attendance_events_today: todayEvents.length,
        system_status: 'HEALTHY'
      }
    };
  }

  // --- PLATFORM SETTINGS ---
  async getSettings() {
    const result: Record<string, any> = {};
    for (const [k, v] of this.settings.entries()) {
      result[k] = v;
    }
    return {
      success: true,
      settings: result
    };
  }

  async updateSetting(key: string, value: any, performedByUserId: string) {
    const current = this.settings.get(key) || {};
    this.settings.set(key, { ...current, value, updatedAt: new Date(), updatedBy: performedByUserId });

    await this.auditService.log({
      userId: performedByUserId,
      action: 'SETTING_CHANGE',
      resourceType: 'PLATFORM_SETTING',
      resourceId: key,
      changes: { key, value }
    });

    return {
      success: true,
      key,
      value
    };
  }

  seedTenant(record: TenantRecord) {
    this.tenants.set(record.id, record);
  }
}
