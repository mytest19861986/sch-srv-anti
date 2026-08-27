import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../../modules/auth/auth.service.js';
import { AuthTokenPayload } from '../../modules/auth/dto/login.dto.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthTokenPayload;
    tenantId?: string;
  }
}

export function createAuthMiddleware(authService: AuthService) {
  return async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header'
      });
    }

    const token = authHeader.substring(7).trim();
    try {
      const payload = authService.verifyToken(token);
      request.user = payload;
      request.tenantId = payload.tenantId;
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired access token'
      });
    }
  };
}

export function requireRole(...allowedRoles: Array<'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DRIVER' | 'PARENT'>) {
  return async function authorizeRole(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'FORBIDDEN',
        message: `User role '${request.user.role}' is not authorized to access this resource`
      });
    }
  };
}
