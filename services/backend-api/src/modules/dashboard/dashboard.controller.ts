import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { DashboardQuerySchema } from './dto/dashboard-query.dto.js';
import { DashboardService } from './dashboard.service.js';
import { AuthService } from '../auth/auth.service.js';
import { createAuthMiddleware, requireRole } from '../../shared/middleware/auth.middleware.js';
import { tenantGuard } from '../../shared/middleware/tenant.middleware.js';

export function dashboardController(dashboardService: DashboardService, authService: AuthService) {
  const authenticate = createAuthMiddleware(authService);
  const adminOnly = requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN');

  return async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // 1. School-Wide Daily Overview (Reads ONLY from summary)
    fastify.get(
      '/overview',
      {
        preHandler: [authenticate, tenantGuard, adminOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const query = request.query as { date?: string };
        const tenantId = request.tenantId!;
        const response = await dashboardService.getOverview(tenantId, query.date);
        return reply.status(200).send(response);
      }
    );

    // 2. Live Services Status List with Pagination and Filtering
    fastify.get(
      '/live-services',
      {
        preHandler: [authenticate, tenantGuard, adminOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const parseResult = DashboardQuerySchema.safeParse(request.query);
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

        const tenantId = request.tenantId!;
        const response = await dashboardService.getLiveServices(tenantId, parseResult.data);
        return reply.status(200).send(response);
      }
    );

    // 3. Service Detail with Student List
    fastify.get(
      '/service-detail/:serviceId',
      {
        preHandler: [authenticate, tenantGuard, adminOnly]
      },
      async (request: FastifyRequest, reply: FastifyReply) => {
        const { serviceId } = request.params as { serviceId: string };
        const query = request.query as { date?: string };
        const tenantId = request.tenantId!;

        const response = await dashboardService.getServiceDetail(tenantId, serviceId, query.date);
        return reply.status(200).send(response);
      }
    );
  };
}
