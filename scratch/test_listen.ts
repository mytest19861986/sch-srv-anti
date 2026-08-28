import Fastify from 'fastify';

const fastify = Fastify({ logger: false });
fastify.get('/ping', async () => ({ pong: true }));

try {
  const address = await fastify.listen({ port: 3010, host: '127.0.0.1' });
  console.log('Successfully listening on:', address);
  await fastify.close();
} catch (e) {
  console.error('Fastify listen error:', e);
}
