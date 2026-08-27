import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { CreateTenantSchema, UpdateTenantSchema } from './dto/tenant-management.dto.js';
import { CreateUserSchema, ChangeUserRoleSchema, ChangeUserStatusSchema } from './dto/user-management.dto.js';
import { SuperAdminService } from './super-admin.service.js';
import { AuditService } from './audit.service.js';
import { AuthService } from '../auth/auth.service.js';
import { createAuthMiddleware, requireRole } from '../../shared/middleware/auth.middleware.js';

export function superAdminController(
  superAdminService: SuperAdminService,
  auditService: AuditService,
  authService: AuthService
) {
  const authenticate = createAuthMiddleware(authService);
  const superAdminOnly = requireRole('SUPER_ADMIN');

  return async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    // 1. Tenants CRUD
    fastify.get('/tenants', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const query = request.query as { page?: string; limit?: string };
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 20;
      const result = await superAdminService.listTenants(page, limit);
      return reply.status(200).send({ success: true, ...result });
    });

    fastify.post('/tenants', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const parseResult = CreateTenantSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ success: false, error: 'VALIDATION_ERROR', details: parseResult.error.errors });
      }
      try {
        const tenant = await superAdminService.createTenant(parseResult.data, request.user!.userId);
        return reply.status(201).send({ success: true, tenant });
      } catch (err: any) {
        return reply.status(400).send({ success: false, error: err.message });
      }
    });

    fastify.patch('/tenants/:tenantId', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const { tenantId } = request.params as { tenantId: string };
      const parseResult = UpdateTenantSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ success: false, error: 'VALIDATION_ERROR', details: parseResult.error.errors });
      }
      try {
        const tenant = await superAdminService.updateTenant(tenantId, parseResult.data, request.user!.userId);
        return reply.status(200).send({ success: true, tenant });
      } catch (err: any) {
        return reply.status(404).send({ success: false, error: err.message });
      }
    });

    fastify.delete('/tenants/:tenantId', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const { tenantId } = request.params as { tenantId: string };
      try {
        const tenant = await superAdminService.softDeleteTenant(tenantId, request.user!.userId);
        return reply.status(200).send({ success: true, message: 'Tenant soft-deleted successfully', tenant });
      } catch (err: any) {
        return reply.status(404).send({ success: false, error: err.message });
      }
    });

    // 2. Users CRUD & Role Changes
    fastify.get('/users', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const query = request.query as { page?: string; limit?: string; tenantId?: string };
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 20;
      const result = await superAdminService.listUsers(page, limit, query.tenantId);
      return reply.status(200).send({ success: true, ...result });
    });

    fastify.post('/users', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const parseResult = CreateUserSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ success: false, error: 'VALIDATION_ERROR', details: parseResult.error.errors });
      }
      try {
        const user = await superAdminService.createUser(parseResult.data, request.user!.userId);
        return reply.status(201).send({ success: true, user });
      } catch (err: any) {
        return reply.status(400).send({ success: false, error: err.message });
      }
    });

    fastify.patch('/users/:userId/role', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const parseResult = ChangeUserRoleSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ success: false, error: 'VALIDATION_ERROR', details: parseResult.error.errors });
      }
      try {
        const result = await superAdminService.changeUserRole(userId, parseResult.data, request.user!.userId);
        return reply.status(200).send({ success: true, user: result });
      } catch (err: any) {
        return reply.status(404).send({ success: false, error: err.message });
      }
    });

    fastify.patch('/users/:userId/status', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const parseResult = ChangeUserStatusSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({ success: false, error: 'VALIDATION_ERROR', details: parseResult.error.errors });
      }
      try {
        const result = await superAdminService.changeUserStatus(userId, parseResult.data, request.user!.userId);
        return reply.status(200).send({ success: true, user: result });
      } catch (err: any) {
        return reply.status(404).send({ success: false, error: err.message });
      }
    });

    // 3. Audit Logs View
    fastify.get('/audit-logs', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const query = request.query as { page?: string; limit?: string; tenantId?: string; userId?: string; action?: string };
      const page = query.page ? parseInt(query.page, 10) : 1;
      const limit = query.limit ? parseInt(query.limit, 10) : 20;
      const result = await auditService.getLogs({
        page,
        limit,
        tenantId: query.tenantId,
        userId: query.userId,
        action: query.action
      });
      return reply.status(200).send({ success: true, ...result });
    });

    // 4. Platform Overview Report
    fastify.get('/reports/platform-overview', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const overview = await superAdminService.getPlatformOverview();
      return reply.status(200).send(overview);
    });

    fastify.get('/platform-overview', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const overview = await superAdminService.getPlatformOverview();
      return reply.status(200).send(overview);
    });

    // 5. Platform Settings
    fastify.get('/settings', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const settings = await superAdminService.getSettings();
      return reply.status(200).send(settings);
    });

    fastify.patch('/settings', { preHandler: [authenticate, superAdminOnly] }, async (request, reply) => {
      const { key, value } = request.body as { key: string; value: any };
      if (!key || value === undefined) {
        return reply.status(400).send({ success: false, error: 'Key and Value are required' });
      }
      const updated = await superAdminService.updateSetting(key, value, request.user!.userId);
      return reply.status(200).send(updated);
    });
  };
}
