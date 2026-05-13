import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { userRoutes } from './routes/UserRoutes';
import { AuthRoutes } from './routes/AuthRoutes';
import { db } from './db/db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { PostsRoutes } from './routes/PostRoutes';

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

  fastify.addHook(
    'preHandler',
    async (
      request: FastifyRequest<{ Body: { email: string } }>,
      replay: FastifyReply
    ) => {
      try {
        console.log(`Handling request: ${request.method} ${request.url}`);
        const publicRoutes = ['/health', '/api/v1/auth/login'];
        if (publicRoutes.includes(request.url)) {
          return;
        }
        if (!request.body?.email) return;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, request.body.email));
        if (!user || user.length === 0) {
          return replay
            .status(401)
            .send({ success: false, error: 'Unauthorized' });
        }
        request.user = user;
      } catch (error) {
        if (error instanceof Error) {
          fastify.log.error(`error in pre handler ${error}`);
          throw new Error('User not found', error);
        }
      }
    }
  );

  await fastify.register(userRoutes, { prefix: '/api/v1' });
  await fastify.register(PostsRoutes, { prefix: '/api/v1' });
  await fastify.register(AuthRoutes, { prefix: '/api/v1' });
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  fastify.setErrorHandler((error, request, reply) => {
    // Use the error's statusCode if it exists, otherwise default to 500
    const statusCode = error.statusCode || 500;

    fastify.log.error(error);

    reply.status(statusCode).send({
      success: false,
      error: error.message || 'Internal server error',
      // Optional: Add stack trace only in development
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  });
  return fastify;
}
