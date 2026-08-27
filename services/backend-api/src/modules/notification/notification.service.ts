import { InMemoryDomainRepository } from '../domain/domain.service.js';

export interface NotificationLogRecord {
  id: string;
  tenantId: string;
  parentId: string;
  studentId: string;
  eventId?: string;
  notificationType: string;
  status: 'sent' | 'failed' | 'pending';
  title: string;
  body: string;
  sentAt: Date;
  errorMessage?: string;
  createdAt: Date;
}

export interface DispatchedNotification {
  tenantId: string;
  studentId: string;
  parentId: string;
  phoneNumber: string;
  fcmToken?: string;
  title: string;
  body: string;
  eventType: string;
  dispatchedAt: Date;
}

export class NotificationService {
  private dispatchedHistory: DispatchedNotification[] = [];
  private notificationLogs: NotificationLogRecord[] = [];
  public simulatedLatencyMs: number = 0;
  public shouldSimulateFailure: boolean = false;

  constructor(private readonly domainRepo: InMemoryDomainRepository) {}

  async dispatchAttendanceNotification(
    tenantId: string,
    studentId: string,
    eventType: string,
    serverTimestamp: string,
    eventId?: string
  ): Promise<DispatchedNotification[]> {
    // 1. Simulate external I/O latency
    if (this.simulatedLatencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulatedLatencyMs));
    }

    // 2. Query all parents linked to this student (Multi-Parent Fan-Out)
    const parents = await this.domainRepo.getParentsForStudent(tenantId, studentId);
    const student = this.domainRepo.students.get(studentId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : `Student #${studentId}`;

    const actionText = eventType === 'PICKED_UP' ? 'سوار سرویس شد' : 'از سرویس پیاده شد';
    const title = `وضعیت سرویس دانش‌آموز: ${studentName}`;
    const body = `دانش‌آموز ${studentName} در تاریخ ${new Date(serverTimestamp).toLocaleTimeString('fa-IR')} ${actionText}.`;

    // 3. Handle simulated failure
    if (this.shouldSimulateFailure) {
      for (const parent of parents) {
        this.notificationLogs.push({
          id: `notif-${Math.random().toString(36).substring(2, 9)}`,
          tenantId,
          parentId: parent.id,
          studentId,
          eventId,
          notificationType: 'PUSH',
          status: 'failed',
          title,
          body,
          sentAt: new Date(),
          errorMessage: 'FCM_SERVICE_UNAVAILABLE: Push notification delivery failed',
          createdAt: new Date()
        });
      }
      throw new Error('FCM_SERVICE_UNAVAILABLE: Push notification delivery failed');
    }

    const dispatched: DispatchedNotification[] = [];

    // 4. Fan-out dispatch and append to notification log
    for (const parent of parents) {
      const item: DispatchedNotification = {
        tenantId,
        studentId,
        parentId: parent.id,
        phoneNumber: parent.phoneNumber,
        fcmToken: parent.fcmToken,
        title,
        body,
        eventType,
        dispatchedAt: new Date()
      };
      this.dispatchedHistory.push(item);
      dispatched.push(item);

      // Append to notification_log
      this.notificationLogs.push({
        id: `notif-${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        parentId: parent.id,
        studentId,
        eventId,
        notificationType: 'PUSH',
        status: 'sent',
        title,
        body,
        sentAt: new Date(),
        createdAt: new Date()
      });
    }

    return dispatched;
  }

  getNotificationsForParent(tenantId: string, parentId: string): NotificationLogRecord[] {
    return this.notificationLogs
      .filter(n => n.tenantId === tenantId && n.parentId === parentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getDispatchedHistory(): DispatchedNotification[] {
    return [...this.dispatchedHistory];
  }

  clear() {
    this.dispatchedHistory = [];
    this.notificationLogs = [];
    this.simulatedLatencyMs = 0;
    this.shouldSimulateFailure = false;
  }
}
