import { FastifyRequest, FastifyReply } from 'fastify';

export async function tenantGuard(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || !request.user.tenantId) {
    return reply.status(401).send({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Tenant context is missing. Authentication required.'
    });
  }

  // Ensure request.tenantId is strictly bound to token's tenantId
  request.tenantId = request.user.tenantId;

  // If request params or body explicitly specify a tenant_id, it MUST match token tenantId
  const body = request.body as Record<string, any> | undefined;
  const params = request.params as Record<string, any> | undefined;
  const query = request.query as Record<string, any> | undefined;

  const requestedTenantId =
    (body && (body.tenant_id || body.tenantId)) ||
    (params && (params.tenant_id || params.tenantId)) ||
    (query && (query.tenant_id || query.tenantId));

  if (requestedTenantId && requestedTenantId !== request.user.tenantId) {
    return reply.status(403).send({
      success: false,
      error: 'FORBIDDEN',
      message: 'Cross-tenant data access violation (IDOR prevented)'
    });
  }
}
