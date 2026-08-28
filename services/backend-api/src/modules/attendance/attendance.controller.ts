import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { RecordAttendanceSchema } from './dto/record-attendance.dto.js';
import { AttendanceService } from './attendance.service.js';
import { AuthService } from '../auth/auth.service.js';
import { InMemoryDomainRepository } from '../domain/domain.service.js';
import { createAuthMiddleware, requireRole } from '../../shared/middleware/auth.middleware.js';
import { tenantGuard } from '../../shared/middleware/tenant.middleware.js';
import { metricsService } from '../../shared/observability/metrics.service.js';

export function attendanceController(
  attendanceService: AttendanceService,
  authService: AuthService,
  domainRepo: InMemoryDomainRepository
) {
  const authenticate = createAuthMiddleware(authService);
  const driverOrAdminOnly = requireRole('DRIVER', 'SCHOOL_ADMIN', 'SCHOOL_OPERATOR', 'SUPER_ADMIN');

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

        const startTime = performance.now();
        try {
          const tenantId = request.tenantId!;
          const user = request.user!;
          const response = await attendanceService.recordAttendance(
            parseResult.data,
            tenantId,
            { userId: user.userId, role: user.role }
          );
          const statusCode = response.is_idempotent_replay ? 200 : 201;
          const duration = performance.now() - startTime;
          metricsService.recordAttendanceWriteSuccess(duration);
          return reply.status(statusCode).send(response);
        } catch (err: any) {
          metricsService.recordAttendanceWriteError(err.code || 'INGESTION_ERROR');
          if (err.statusCode) {
            return reply.status(err.statusCode).send({
              success: false,
              statusCode: err.statusCode,
              error: err.code || 'ERROR',
              message: err.message
            });
          }
          request.log.error(err);
          return reply.status(500).send({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'Failed to record attendance event'
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
        const tenantId = request.tenantId!;
        const userId = request.user!.userId;
        const query = (request.query || {}) as { shift_id?: string };

        let shiftId = query.shift_id;
        if (!shiftId) {
          const shifts = await domainRepo.findShiftsForDriver(tenantId, userId);
          if (shifts.length > 0) {
            shiftId = shifts[0].id;
          } else {
            return reply.status(400).send({
              success: false,
              error: 'VALIDATION_ERROR',
              message: 'shift_id query parameter is required or no active shift assigned'
            });
          }
        }

        try {
          const events = await attendanceService.getTenantAttendanceEvents(tenantId);
          const manifest = await domainRepo.getDriverManifest(tenantId, userId, shiftId, events);
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
