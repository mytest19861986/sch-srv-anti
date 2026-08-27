import {
  DashboardQueryDto,
  DashboardOverviewResponse,
  LiveServicesResponse,
  ServiceDetailResponse,
  LiveServiceItem
} from './dto/dashboard-query.dto.js';
import { InMemoryDomainRepository } from '../domain/domain.service.js';
import { IAttendanceRepository } from '../attendance/attendance.service.js';

export interface DailySummaryRecord {
  id: string; // "tenantId:date:serviceId"
  tenantId: string;
  date: string; // YYYY-MM-DD
  shiftId?: string;
  serviceId: string;
  routeId?: string;
  totalStudents: number;
  pickedUpCount: number;
  droppedOffCount: number;
  pendingCount: number;
  absentCount: number;
  lastEventAt?: Date;
  updatedAt: Date;
}

export class DashboardService {
  private summaryStore = new Map<string, DailySummaryRecord>();

  constructor(
    private readonly domainRepo: InMemoryDomainRepository,
    private readonly attendanceRepo: IAttendanceRepository
  ) {}

  // Incremental update executed by Outbox Worker
  async incrementDailySummary(
    tenantId: string,
    serviceId: string,
    eventType: 'PICKED_UP' | 'DROPPED_OFF',
    eventTimestamp: Date
  ): Promise<void> {
    const dateStr = eventTimestamp.toISOString().split('T')[0];
    const key = `${tenantId}:${dateStr}:${serviceId}`;

    let record = this.summaryStore.get(key);
    if (!record) {
      // Find service & route & count assigned students
      const service = this.domainRepo.services.get(serviceId);
      const routeId = service ? service.routeId : undefined;
      const assignedStudents = routeId ? await this.domainRepo.getStudentsForRoute(tenantId, routeId) : [];
      const totalStudents = assignedStudents.length || 1;

      record = {
        id: key,
        tenantId,
        date: dateStr,
        serviceId,
        routeId,
        totalStudents,
        pickedUpCount: 0,
        droppedOffCount: 0,
        pendingCount: totalStudents,
        absentCount: 0,
        lastEventAt: eventTimestamp,
        updatedAt: new Date()
      };
    }

    if (eventType === 'PICKED_UP') {
      record.pickedUpCount += 1;
      if (record.pendingCount > 0) record.pendingCount -= 1;
    } else if (eventType === 'DROPPED_OFF') {
      record.droppedOffCount += 1;
    }

    record.lastEventAt = eventTimestamp;
    record.updatedAt = new Date();
    this.summaryStore.set(key, record);
  }

  // Force updated_at for testing staleness
  setSummaryUpdatedAt(tenantId: string, date: string, serviceId: string, updatedAt: Date) {
    const key = `${tenantId}:${date}:${serviceId}`;
    const record = this.summaryStore.get(key);
    if (record) {
      record.updatedAt = updatedAt;
      this.summaryStore.set(key, record);
    }
  }

  async getOverview(tenantId: string, queryDate?: string): Promise<DashboardOverviewResponse> {
    const date = queryDate || new Date().toISOString().split('T')[0];
    const summaries = Array.from(this.summaryStore.values()).filter(
      s => s.tenantId === tenantId && s.date === date
    );

    let totalStudents = 0;
    let totalPickedUp = 0;
    let totalDroppedOff = 0;
    let totalPending = 0;
    let totalAbsent = 0;
    let latestUpdatedAt: Date = new Date(0);

    for (const s of summaries) {
      totalStudents += s.totalStudents;
      totalPickedUp += s.pickedUpCount;
      totalDroppedOff += s.droppedOffCount;
      totalPending += s.pendingCount;
      totalAbsent += s.absentCount;
      if (s.updatedAt > latestUpdatedAt) {
        latestUpdatedAt = s.updatedAt;
      }
    }

    const now = Date.now();
    const freshnessSeconds = latestUpdatedAt.getTime() > 0 ? Math.max(0, Math.floor((now - latestUpdatedAt.getTime()) / 1000)) : 0;
    const isStale = freshnessSeconds > 30;

    return {
      success: true,
      tenant_id: tenantId,
      date,
      data_freshness_seconds: freshnessSeconds,
      is_stale: isStale,
      summary: {
        total_services: summaries.length,
        total_students: totalStudents,
        total_picked_up: totalPickedUp,
        total_dropped_off: totalDroppedOff,
        total_pending: totalPending,
        total_absent: totalAbsent
      }
    };
  }

  async getLiveServices(tenantId: string, query: DashboardQueryDto): Promise<LiveServicesResponse> {
    const date = query.date || new Date().toISOString().split('T')[0];
    let summaries = Array.from(this.summaryStore.values()).filter(
      s => s.tenantId === tenantId && s.date === date
    );

    if (query.service_id) {
      summaries = summaries.filter(s => s.serviceId === query.service_id);
    }

    let latestUpdatedAt: Date = new Date(0);
    const serviceItems: LiveServiceItem[] = [];

    for (const s of summaries) {
      if (s.updatedAt > latestUpdatedAt) latestUpdatedAt = s.updatedAt;
      const service = this.domainRepo.services.get(s.serviceId);
      const route = s.routeId ? this.domainRepo.routes.get(s.routeId) : undefined;

      serviceItems.push({
        service_id: s.serviceId,
        service_name: service ? service.name : `Service ${s.serviceId}`,
        route_id: s.routeId,
        route_name: route ? route.name : undefined,
        shift_id: s.shiftId,
        total_students: s.totalStudents,
        picked_up_count: s.pickedUpCount,
        dropped_off_count: s.droppedOffCount,
        pending_count: s.pendingCount,
        absent_count: s.absentCount,
        last_event_at: s.lastEventAt ? s.lastEventAt.toISOString() : undefined,
        updated_at: s.updatedAt.toISOString()
      });
    }

    const total = serviceItems.length;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = serviceItems.slice((page - 1) * limit, page * limit);

    const now = Date.now();
    const freshnessSeconds = latestUpdatedAt.getTime() > 0 ? Math.max(0, Math.floor((now - latestUpdatedAt.getTime()) / 1000)) : 0;
    const isStale = freshnessSeconds > 30;

    return {
      success: true,
      tenant_id: tenantId,
      date,
      data_freshness_seconds: freshnessSeconds,
      is_stale: isStale,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      },
      services: paginatedItems
    };
  }

  async getServiceDetail(tenantId: string, serviceId: string, queryDate?: string): Promise<ServiceDetailResponse> {
    const date = queryDate || new Date().toISOString().split('T')[0];
    const key = `${tenantId}:${date}:${serviceId}`;
    const summary = this.summaryStore.get(key);

    const service = this.domainRepo.services.get(serviceId);
    const serviceName = service ? service.name : `Service ${serviceId}`;
    const route = service ? this.domainRepo.routes.get(service.routeId) : undefined;

    const assignedStudents = service && service.routeId ? await this.domainRepo.getStudentsForRoute(tenantId, service.routeId) : [];

    // Get attendance events for this tenant and service on that date
    const allEvents = await this.attendanceRepo.getAttendanceEventsByTenant(tenantId);
    const serviceEvents = allEvents.filter(
      e => e.serviceId === serviceId && e.clientTimestamp.toISOString().startsWith(date)
    );

    const studentsDetail = assignedStudents.map(s => {
      const studentEvents = serviceEvents
        .filter(e => e.studentId === s.id)
        .sort((a, b) => new Date(b.clientTimestamp).getTime() - new Date(a.clientTimestamp).getTime());

      const latest = studentEvents[0];
      let status: 'PICKED_UP' | 'DROPPED_OFF' | 'PENDING' | 'ABSENT' = 'PENDING';
      if (latest) {
        status = latest.eventType as 'PICKED_UP' | 'DROPPED_OFF';
      }

      return {
        student_id: s.id,
        first_name: s.firstName,
        last_name: s.lastName,
        grade: s.grade,
        status,
        last_event_time: latest ? latest.clientTimestamp.toISOString() : undefined
      };
    });

    const updatedAt = summary ? summary.updatedAt : new Date();
    const freshnessSeconds = Math.max(0, Math.floor((Date.now() - updatedAt.getTime()) / 1000));

    return {
      success: true,
      tenant_id: tenantId,
      date,
      data_freshness_seconds: freshnessSeconds,
      is_stale: freshnessSeconds > 30,
      service: {
        id: serviceId,
        name: serviceName,
        route_name: route ? route.name : undefined,
        total_students: summary ? summary.totalStudents : assignedStudents.length,
        picked_up_count: summary ? summary.pickedUpCount : 0,
        dropped_off_count: summary ? summary.droppedOffCount : 0,
        pending_count: summary ? summary.pendingCount : assignedStudents.length,
        absent_count: summary ? summary.absentCount : 0
      },
      students: studentsDetail
    };
  }

  clear() {
    this.summaryStore.clear();
  }
}
