import Fastify, { FastifyInstance } from 'fastify';
import { userRoutes } from './routes/UserRoutes';

export default async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty', // Pretty console logs
        options: { translateTime: 'HH:MM:ss Z' },
      },
    },
  });

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      success: false,
      error: error.message || 'Internal server error',
    });
  });

  await fastify.register(userRoutes, { prefix: '/api/v1' });
    
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return fastify;
}
