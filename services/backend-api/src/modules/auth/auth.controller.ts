import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { LoginSchema } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import { authRateLimiter, createRateLimitHook } from '../../shared/middleware/rate-limit.middleware.js';

export function authController(authService: AuthService, enableRateLimit: boolean = false) {
  return async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
    const hooks = enableRateLimit ? [createRateLimitHook(authRateLimiter, { maxRequests: 5, windowMs: 60000 })] : [];

    fastify.post('/login', { preHandler: hooks }, async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = LoginSchema.safeParse(request.body);
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
        const response = await authService.login(parseResult.data);
        return reply.status(200).send(response);
      } catch (err: any) {
        if (err.message === 'INVALID_CREDENTIALS') {
          return reply.status(401).send({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Invalid email or password'
          });
        }
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        });
      }
    });
  };
}
