import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { RecordAttendanceSchema } from './dto/record-attendance.dto.js';
import { AttendanceService } from './attendance.service.js';
import { AuthService } from '../auth/auth.service.js';
import { InMemoryDomainRepository } from '../domain/domain.service.js';
import { createAuthMiddleware, requireRole } from '../../shared/middleware/auth.middleware.js';
import { tenantGuard } from '../../shared/middleware/tenant.middleware.js';

export function attendanceController(
  attendanceService: AttendanceService,
  authService: AuthService,
  domainRepo: InMemoryDomainRepository
) {
  const authenticate = createAuthMiddleware(authService);
  const driverOrAdminOnly = requireRole('DRIVER', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

  return async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // 1. Attendance Ingestion Endpoint
    fastify.post(
      '/events',
      {
        preHandler: [authenticate, tenantGuard, driverOrAdminOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = RecordAttendanceSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'VALIDATION_ERROR',
            details: parseResult.error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message
            }))
          });
        }

        try {
          const tenantId = request.tenantId!;
          const response = await attendanceService.recordAttendance(parseResult.data, tenantId);
          const statusCode = response.is_idempotent_replay ? 200 : 201;
          return reply.status(statusCode).send(response);
        } catch (err: any) {
          request.log.error(err);
          return reply.status(500).send({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to record attendance event'
          });
        }
      }
    );

    // 2. Tenant Attendance Events List Endpoint
    fastify.get(
      '/events',
      {
        preHandler: [authenticate, tenantGuard]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const tenantId = request.tenantId!;
        const events = await attendanceService.getTenantAttendanceEvents(tenantId);
        return reply.status(200).send({
          success: true,
          tenant_id: tenantId,
          count: events.length,
          events
        });
      }
    );

    // 3. Driver Manifest API Endpoint
    fastify.get(
      '/manifest',
      {
        preHandler: [authenticate, tenantGuard, driverOrAdminOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const query = request.query as { shift_id?: string };
        if (!query.shift_id) {
          return reply.status(400).send({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'shift_id query parameter is required'
          });
        }

        const tenantId = request.tenantId!;
        const userId = request.user!.userId;

        try {
          const events = await attendanceService.getTenantAttendanceEvents(tenantId);
          const manifest = await domainRepo.getDriverManifest(tenantId, userId, query.shift_id, events);
          return reply.status(200).send({
            success: true,
            tenant_id: tenantId,
            manifest
          });
        } catch (err: any) {
          if (
            err.message === 'DRIVER_NOT_FOUND' ||
            err.message === 'SHIFT_NOT_FOUND' ||
            err.message === 'ROUTE_NOT_FOUND' ||
            err.message === 'SERVICE_NOT_FOUND'
          ) {
            return reply.status(404).send({
              success: false,
              error: 'NOT_FOUND',
              message: err.message
            });
          }
          if (err.message === 'DRIVER_NOT_ASSIGNED_TO_SHIFT') {
            return reply.status(403).send({
              success: false,
              error: 'FORBIDDEN',
              message: 'Driver is not authorized/assigned to this shift'
            });
          }
          return reply.status(500).send({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: err.message
          });
        }
      }
    );
  };
}
