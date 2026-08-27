import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { metricsService } from './metrics.service.js';
import { appLogger } from './logger.service.js';

export function registerTracingMiddleware(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Generate or propagate Request ID
    const requestId = (request.headers['x-request-id'] as string) || `req-${Math.random().toString(36).substring(2, 11)}`;
    const correlationId = (request.headers['x-correlation-id'] as string) || requestId;

    request.headers['x-request-id'] = requestId;
    request.headers['x-correlation-id'] = correlationId;
    reply.header('x-request-id', requestId);
    reply.header('x-correlation-id', correlationId);

    (request as any).startTime = performance.now();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const startTime = (request as any).startTime || performance.now();
    const durationMs = performance.now() - startTime;
    const durationSec = durationMs / 1000;

    const route = request.routeOptions?.url || request.url;
    metricsService.recordHttpRequest(request.method, route, reply.statusCode, durationSec);

    appLogger.info(`${request.method} ${request.url} - ${reply.statusCode} (${durationMs.toFixed(2)}ms)`, {
      requestId: request.headers['x-request-id'] as string,
      tenantId: (request as any).tenantId,
      data: {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs: Number(durationMs.toFixed(2))
      }
    });
  });
}
