import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TimelineQuerySchema, NotificationHistoryQuerySchema } from './dto/parent-query.dto.js';
import { ParentService } from './parent.service.js';
import { InMemoryDeviceTokenRepository } from './device-token.service.js';
import { AuthService } from '../auth/auth.service.js';
import { createAuthMiddleware, requireRole } from '../../shared/middleware/auth.middleware.js';
import { tenantGuard } from '../../shared/middleware/tenant.middleware.js';

import { InMemoryDomainRepository } from '../domain/domain.service.js';

export const RegisterDeviceSchema = z.object({
  token: z.string().min(5, 'device token is required'),
  platform: z.enum(['ANDROID', 'IOS', 'WEB'], {
    errorMap: () => ({ message: "platform must be 'ANDROID', 'IOS', or 'WEB'" })
  })
});

export function parentController(
  parentService: ParentService,
  authService: AuthService,
  deviceTokenRepo?: InMemoryDeviceTokenRepository,
  domainRepo?: InMemoryDomainRepository
) {
  const authenticate = createAuthMiddleware(authService);
  const parentOnly = requireRole('PARENT', 'SUPER_ADMIN');

  return async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // 1. List Children
    fastify.get(
      '/children',
      {
        preHandler: [authenticate, tenantGuard, parentOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const tenantId = request.tenantId!;
        const userId = request.user!.userId;
        try {
          const response = await parentService.getChildren(tenantId, userId);
          return reply.status(200).send(response);
        } catch (err: any) {
          if (err.message === 'PARENT_PROFILE_NOT_FOUND') {
            return reply.status(404).send({ success: false, error: 'NOT_FOUND', message: err.message });
          }
          return reply.status(500).send({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
      }
    );

    // 2. Child Status
    fastify.get(
      '/children/:childId/status',
      {
        preHandler: [authenticate, tenantGuard, parentOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { childId } = request.params as { childId: string };
        const tenantId = request.tenantId!;
        const userId = request.user!.userId;

        try {
          const response = await parentService.getChildStatus(tenantId, userId, childId);
          return reply.status(200).send(response);
        } catch (err: any) {
          if (err.message === 'FORBIDDEN_CHILD_ACCESS') {
            return reply.status(403).send({ success: false, error: 'FORBIDDEN', message: 'Parent is not authorized to access this student (IDOR prevented)' });
          }
          if (err.message === 'STUDENT_NOT_FOUND' || err.message === 'PARENT_PROFILE_NOT_FOUND') {
            return reply.status(404).send({ success: false, error: 'NOT_FOUND', message: err.message });
          }
          return reply.status(500).send({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
      }
    );

    // 3. Child Attendance Timeline
    fastify.get(
      '/children/:childId/timeline',
      {
        preHandler: [authenticate, tenantGuard, parentOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { childId } = request.params as { childId: string };
        const parseResult = TimelineQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'VALIDATION_ERROR',
            details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
          });
        }

        const tenantId = request.tenantId!;
        const userId = request.user!.userId;

        try {
          const response = await parentService.getChildTimeline(tenantId, userId, childId, parseResult.data);
          return reply.status(200).send(response);
        } catch (err: any) {
          if (err.message === 'FORBIDDEN_CHILD_ACCESS') {
            return reply.status(403).send({ success: false, error: 'FORBIDDEN', message: 'Parent is not authorized to access this student (IDOR prevented)' });
          }
          return reply.status(500).send({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
      }
    );

    // 4. Parent Notifications History
    fastify.get(
      '/notifications',
      {
        preHandler: [authenticate, tenantGuard, parentOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = NotificationHistoryQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'VALIDATION_ERROR',
            details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
          });
        }

        const tenantId = request.tenantId!;
        const userId = request.user!.userId;

        try {
          const response = await parentService.getNotifications(tenantId, userId, parseResult.data);
          return reply.status(200).send(response);
        } catch (err: any) {
          return reply.status(500).send({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
      }
    );

    // 5. Register Device Token Endpoint
    fastify.post(
      '/devices/register',
      {
        preHandler: [authenticate, tenantGuard, parentOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = RegisterDeviceSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'VALIDATION_ERROR',
            details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
          });
        }

        const tenantId = request.tenantId!;
        const userId = request.user!.userId;

        try {
          if (!deviceTokenRepo) {
            return reply.status(500).send({ success: false, error: 'SERVICE_UNAVAILABLE', message: 'Device token repository not configured' });
          }

          const record = await deviceTokenRepo.registerToken(
            tenantId,
            userId,
            parseResult.data.token,
            parseResult.data.platform
          );

          return reply.status(201).send({
            success: true,
            device_id: record.id,
            parent_id: record.parentId,
            platform: record.platform,
            registered_at: record.createdAt.toISOString()
          });
        } catch (err: any) {
          return reply.status(500).send({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
      }
    );

    // 6. Delete Device Token Endpoint
    fastify.delete(
      '/devices/:deviceId',
      {
        preHandler: [authenticate, tenantGuard, parentOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { deviceId } = request.params as { deviceId: string };
        const tenantId = request.tenantId!;
        const userId = request.user!.userId;

        try {
          if (!deviceTokenRepo) {
            return reply.status(500).send({ success: false, error: 'SERVICE_UNAVAILABLE', message: 'Device token repository not configured' });
          }

          const deleted = await deviceTokenRepo.deleteToken(tenantId, userId, deviceId);
          if (!deleted) {
            return reply.status(404).send({
              success: false,
              error: 'NOT_FOUND',
              message: 'Device token not found or not owned by caller'
            });
          }

          return reply.status(200).send({
            success: true,
            message: 'Device token successfully deregistered'
          });
        } catch (err: any) {
          return reply.status(500).send({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message });
        }
      }
    );

    // 7. Absence Report by Parent (P1-2)
    const handleAbsenceReport = async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as { child_id?: string; student_id?: string; date?: string; reason?: string };
      const childId = body.child_id || body.student_id;
      if (!childId) {
        return reply.status(400).send({ success: false, error: 'child_id is required' });
      }
      const tenantId = request.tenantId!;
      const userId = request.user!.userId;
      const dateStr = body.date || new Date().toISOString().split('T')[0];

      try {
        // RBAC: Verify that the parent owns this child
        await parentService.getChildStatus(tenantId, userId, childId);

        if (domainRepo) {
          await domainRepo.recordAbsenceReport({
            id: `abs-${Date.now()}`,
            tenantId,
            childId,
            parentId: userId,
            date: dateStr,
            reason: body.reason || 'گزارش عدم حضور توسط ولی',
            createdAt: new Date()
          });
        }

        return reply.status(201).send({
          success: true,
          message: 'عدم حضور دانش‌آموز با موفقیت ثبت شد و در مانیفست راننده علامت‌گذاری گردید.',
          child_id: childId,
          date: dateStr,
          status: 'ABSENT',
          reported_by: userId
        });
      } catch (err: any) {
        if (err.message === 'FORBIDDEN_CHILD_ACCESS') {
          return reply.status(403).send({ success: false, error: 'FORBIDDEN', message: 'تنها والد قانونی امکان ثبت عدم حضور این دانش‌آموز را دارد.' });
        }
        return reply.status(500).send({ success: false, error: err.message });
      }
    };

    fastify.post('/absence-report', { preHandler: [authenticate, tenantGuard, parentOnly] }, handleAbsenceReport);
    fastify.post('/absence-reports', { preHandler: [authenticate, tenantGuard, parentOnly] }, handleAbsenceReport);
  };
}
