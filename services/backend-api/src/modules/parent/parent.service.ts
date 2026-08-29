import {
  TimelineQueryDto,
  NotificationHistoryQueryDto,
  ChildStatusResponse,
  ChildTimelineResponse,
  ParentNotificationsResponse
} from './dto/parent-query.dto.js';
import { InMemoryDomainRepository, Student } from '../domain/domain.service.js';
import { IAttendanceRepository } from '../attendance/attendance.service.js';
import { NotificationService } from '../notification/notification.service.js';

export class ParentService {
  constructor(
    private readonly domainRepo: InMemoryDomainRepository,
    private readonly attendanceRepo: IAttendanceRepository,
    private readonly notificationService: NotificationService
  ) {}

  async getParentByUserId(tenantId: string, userId: string) {
    const parent = await this.domainRepo.findParentByUserId(tenantId, userId);
    if (!parent) {
      throw new Error('PARENT_PROFILE_NOT_FOUND');
    }
    return parent;
  }

  async getChildren(tenantId: string, userId: string): Promise<{ success: boolean; children: any[] }> {
    const parent = await this.getParentByUserId(tenantId, userId);
    const children = await this.domainRepo.getChildrenForParent(tenantId, parent.id);
    const mapped = children.map(c => ({
      ...c,
      child_id: c.id,
      childId: c.id,
      student_id: c.id,
      studentId: c.id
    }));
    return {
      success: true,
      children: mapped
    };
  }

  async getChildStatus(tenantId: string, userId: string, childId: string): Promise<ChildStatusResponse> {
    const parent = await this.getParentByUserId(tenantId, userId);
    const isAuthorized = await this.domainRepo.isParentOfStudent(tenantId, parent.id, childId);
    if (!isAuthorized) {
      throw new Error('FORBIDDEN_CHILD_ACCESS');
    }

    const student = await this.domainRepo.getStudent(tenantId, childId);
    if (!student) {
      throw new Error('STUDENT_NOT_FOUND');
    }

    // Query today's events for this student
    const today = new Date().toISOString().split('T')[0];
    const allEvents = await this.attendanceRepo.getAttendanceEventsByTenant(tenantId);
    const studentEvents = allEvents
      .filter(e => e.studentId === childId && new Date(e.clientTimestamp).toISOString().startsWith(today))
      .sort((a, b) => new Date(b.clientTimestamp).getTime() - new Date(a.clientTimestamp).getTime());

    const latest = studentEvents[0];
    let currentStatus: 'PICKED_UP' | 'DROPPED_OFF' | 'IN_TRANSIT' | 'AT_SCHOOL' | 'NOT_STARTED' = 'NOT_STARTED';

    if (latest) {
      if (latest.eventType === 'PICKED_UP') {
        currentStatus = 'IN_TRANSIT';
      } else if (latest.eventType === 'DROPPED_OFF') {
        currentStatus = 'AT_SCHOOL';
      }
    }

    return {
      success: true,
      student: {
        id: student.id,
        first_name: student.firstName,
        last_name: student.lastName,
        grade: student.grade
      },
      current_status: currentStatus,
      last_event: latest
        ? {
            event_type: latest.eventType,
            service_id: latest.serviceId,
            timestamp: new Date(latest.clientTimestamp).toISOString()
          }
        : undefined
    };
  }

  async getChildTimeline(
    tenantId: string,
    userId: string,
    childId: string,
    query: TimelineQueryDto
  ): Promise<ChildTimelineResponse> {
    const parent = await this.getParentByUserId(tenantId, userId);
    const isAuthorized = await this.domainRepo.isParentOfStudent(tenantId, parent.id, childId);
    if (!isAuthorized) {
      throw new Error('FORBIDDEN_CHILD_ACCESS');
    }

    const date = query.date || new Date().toISOString().split('T')[0];
    const allEvents = await this.attendanceRepo.getAttendanceEventsByTenant(tenantId);
    const timelineEvents = allEvents
      .filter(e => e.studentId === childId && new Date(e.clientTimestamp).toISOString().startsWith(date))
      .sort((a, b) => new Date(b.clientTimestamp).getTime() - new Date(a.clientTimestamp).getTime());

    const page = query.page || 1;
    const limit = query.limit || 20;
    const total = timelineEvents.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = timelineEvents.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      student_id: childId,
      date,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      },
      events: paginated.map(e => ({
        eventId: e.id,
        event_id: e.id,
        eventType: e.eventType,
        event_type: e.eventType,
        timestamp: new Date(e.clientTimestamp).toISOString(),
        title: e.eventType === 'PICKED_UP' ? 'سوار شدن به سرویس' : 'پیاده شدن از سرویس',
        description: `ثبت رویداد ${e.eventType} در سرویس`
      })),
      timeline: paginated.map(e => ({
        id: e.id,
        event_type: e.eventType,
        service_id: e.serviceId,
        client_timestamp: new Date(e.clientTimestamp).toISOString(),
        server_timestamp: new Date(e.serverTimestamp).toISOString()
      }))
    };
  }

  async getNotifications(
    tenantId: string,
    userId: string,
    query: NotificationHistoryQueryDto
  ): Promise<ParentNotificationsResponse> {
    const parent = await this.getParentByUserId(tenantId, userId);
    const notifs = this.notificationService.getNotificationsForParent(tenantId, parent.id);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const total = notifs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = notifs.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      },
      notifications: paginated.map(n => ({
        id: n.id,
        student_id: n.studentId,
        title: n.title,
        body: n.body,
        status: n.status,
        sent_at: n.sentAt.toISOString()
      }))
    };
  }
}
