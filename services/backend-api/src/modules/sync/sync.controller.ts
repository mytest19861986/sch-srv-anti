import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { BatchSyncSchema } from './dto/batch-sync.dto.js';
import { SyncService } from './sync.service.js';
import { AuthService } from '../auth/auth.service.js';
import { createAuthMiddleware, requireRole } from '../../shared/middleware/auth.middleware.js';
import { tenantGuard } from '../../shared/middleware/tenant.middleware.js';

export function syncController(syncService: SyncService, authService: AuthService) {
  const authenticate = createAuthMiddleware(authService);
  const driverOrAdminOnly = requireRole('DRIVER', 'SCHOOL_ADMIN', 'SUPER_ADMIN');

  return async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    fastify.post(
      '/batch',
      {
        preHandler: [authenticate, tenantGuard, driverOrAdminOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = BatchSyncSchema.safeParse(request.body);
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
          const response = await syncService.processBatchSync(parseResult.data, tenantId);
          return reply.status(200).send(response);
        } catch (err: any) {
          request.log.error(err);
          return reply.status(500).send({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to process sync batch'
          });
        }
      }
    );

    fastify.get(
      '/metadata/:deviceId',
      {
        preHandler: [authenticate, tenantGuard]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { deviceId } = request.params as { deviceId: string };
        const tenantId = request.tenantId!;
        const metadata = syncService.getDeviceSyncMetadata(tenantId, deviceId);

        if (!metadata) {
          return reply.status(404).send({
            success: false,
            error: 'NOT_FOUND',
            message: 'Sync metadata for this device was not found'
          });
        }

        return reply.status(200).send({
          success: true,
          metadata
        });
      }
    );
  };
}
