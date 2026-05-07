import Fastify from 'fastify';
import { db } from '../src/db/db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true,
      },
    },
  },
});

fastify.get('/', (request, replay) => {
  replay.status(200).send({ server: 'server is running' });
});

fastify.get('/users', async (request, reply) => {
  try {
    const allUsers = await db.select().from(users);
    return reply.status(200).send({
      success: true,
      count: allUsers.length,
      data: allUsers,
    });
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

fastify.get('/users/:id', async (request, replay) => {
  const { id } = request.params as { id: string };
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)));
    if (user.length === 0) {
      return replay.status(404).send({
        success: false,
        error: 'User not found',
      });
    }
    return replay.status(200).send({
      success: true,
      data: user[0],
    });
  } catch (er) {
    fastify.log.error(er);
    return replay.status(500).send({
      success: false,
      error: 'Failed to fetch user',
    });
  }
});

const start = async () => {
  try {
    await fastify.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    });
    fastify.log.info(`Server running on port ${process.env.PORT || 3000}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
