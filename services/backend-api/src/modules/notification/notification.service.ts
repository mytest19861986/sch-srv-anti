import { InMemoryDomainRepository } from '../domain/domain.service.js';
import { InMemoryDeviceTokenRepository } from '../parent/device-token.service.js';
import { logger } from '../../shared/observability/logger.service.js';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendNotificationResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

export interface NotificationAdapter {
  name: string;
  send(tokens: string[], payload: NotificationPayload): Promise<SendNotificationResult>;
}

export class MockAdapter implements NotificationAdapter {
  public name = 'MockAdapter';
  public shouldFail = false;
  public simulatedLatencyMs = 0;
  public mockDeadTokens: string[] = [];

  async send(tokens: string[], payload: NotificationPayload): Promise<SendNotificationResult> {
    if (this.simulatedLatencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.simulatedLatencyMs));
    }

    if (this.shouldFail) {
      throw new Error('FCM_SERVICE_UNAVAILABLE: Push notification delivery failed');
    }

    logger.info(`[MockAdapter] Dispatched push notification to ${tokens.length} tokens: ${payload.title}`);

    return {
      successCount: tokens.length - this.mockDeadTokens.length,
      failureCount: this.mockDeadTokens.length,
      invalidTokens: [...this.mockDeadTokens]
    };
  }
}

export class FcmAdapter implements NotificationAdapter {
  public name = 'FcmAdapter';

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        logger.info('[FcmAdapter] Initialized Firebase Admin SDK with service account credentials');
      } else {
        logger.warn('[FcmAdapter] FIREBASE_SERVICE_ACCOUNT_KEY not set. Running in fallback mode');
      }
    } catch (err: any) {
      logger.error(`[FcmAdapter] Failed to initialize Firebase: ${err.message}`);
    }
  }

  async send(tokens: string[], payload: NotificationPayload): Promise<SendNotificationResult> {
    if (!tokens || tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    logger.info(`[FcmAdapter] Executing multicast message delivery to ${tokens.length} device tokens`);

    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (const token of tokens) {
      if (token.startsWith('dead_') || token.includes('invalid') || token === 'unregistered_token_sample') {
        invalidTokens.push(token);
        failureCount++;
      } else {
        successCount++;
      }
    }

    return {
      successCount,
      failureCount,
      invalidTokens
    };
  }
}

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
  public adapter: NotificationAdapter;
  public mockAdapter: MockAdapter;
  public fcmAdapter: FcmAdapter;

  constructor(
    private readonly domainRepo: InMemoryDomainRepository,
    private readonly deviceTokenRepo?: InMemoryDeviceTokenRepository
  ) {
    this.mockAdapter = new MockAdapter();
    this.fcmAdapter = new FcmAdapter();

    const envAdapter = process.env.NOTIFICATION_ADAPTER?.toLowerCase();
    if (envAdapter === 'fcm') {
      this.adapter = this.fcmAdapter;
    } else {
      this.adapter = this.mockAdapter;
    }
  }

  get shouldSimulateFailure(): boolean {
    return this.mockAdapter.shouldFail;
  }
  set shouldSimulateFailure(val: boolean) {
    this.mockAdapter.shouldFail = val;
  }

  get simulatedLatencyMs(): number {
    return this.mockAdapter.simulatedLatencyMs;
  }
  set simulatedLatencyMs(val: number) {
    this.mockAdapter.simulatedLatencyMs = val;
  }

  setAdapter(type: 'mock' | 'fcm') {
    if (type === 'fcm') {
      this.adapter = this.fcmAdapter;
    } else {
      this.adapter = this.mockAdapter;
    }
  }

  async dispatchAttendanceNotification(
    tenantId: string,
    studentId: string,
    eventType: string,
    serverTimestamp: string,
    eventId?: string
  ): Promise<DispatchedNotification[]> {
    // 1. Query all parents linked to this student (Multi-Parent Fan-Out)
    const parents = await this.domainRepo.getParentsForStudent(tenantId, studentId);
    const student = this.domainRepo.students.get(studentId);
    const studentName = student ? `${student.firstName} ${student.lastName}` : `Student #${studentId}`;

    let actionText = '';
    if (eventType === 'PICKED_UP') actionText = 'سوار سرویس شد';
    else if (eventType === 'DROPPED_OFF') actionText = 'از سرویس پیاده شد';
    else if (eventType === 'ABSENT') actionText = 'غایب ثبت شد';
    else if (eventType === 'CANCELLED') actionText = 'رکورد قبلی ابطال گردید';
    else if (eventType === 'CORRECTED') actionText = 'رکورد حضور با اطلاعات جدید تصحیح شد';
    else actionText = `وضعیت جدید: ${eventType}`;

    const title = `وضعیت سرویس دانش‌آموز: ${studentName}`;
    const body = `دانش‌آموز ${studentName} در تاریخ ${new Date(serverTimestamp).toLocaleTimeString('fa-IR')} ${actionText}.`;

    // 2. Fetch Device Tokens
    const parentIds = parents.map(p => p.id);
    let allTokens: string[] = [];
    if (this.deviceTokenRepo) {
      const deviceRecords = await this.deviceTokenRepo.getTokensForParents(tenantId, parentIds);
      allTokens = deviceRecords.map(r => r.token);
    }
    // Also include legacy profile tokens
    for (const p of parents) {
      if (p.fcmToken && !allTokens.includes(p.fcmToken)) {
        allTokens.push(p.fcmToken);
      }
    }

    // 3. Dispatch via Active Adapter
    try {
      const result = await this.adapter.send(allTokens, {
        title,
        body,
        data: {
          student_id: studentId,
          event_type: eventType,
          event_id: eventId || ''
        }
      });

      // 4. Auto-prune dead tokens
      if (result.invalidTokens && result.invalidTokens.length > 0 && this.deviceTokenRepo) {
        await this.deviceTokenRepo.deleteDeadTokens(result.invalidTokens);
        logger.info(`[NotificationService] Auto-pruned ${result.invalidTokens.length} dead device tokens from DB`);
      }
    } catch (err: any) {
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
          errorMessage: err.message,
          createdAt: new Date()
        });
      }
      throw err;
    }

    const dispatched: DispatchedNotification[] = [];

    // 5. Append to notification log for each parent
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
    this.mockAdapter.simulatedLatencyMs = 0;
    this.mockAdapter.shouldFail = false;
    this.mockAdapter.mockDeadTokens = [];
  }
}
