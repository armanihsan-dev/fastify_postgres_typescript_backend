import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/db';
import { session, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function AuthRoutes(Fastify: FastifyInstance) {
  Fastify.post(
    '/login',
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { email, password } = request.body;

        if (!email || !password) {
          return reply
            .status(400)
            .send({ message: 'Email and password are required' });
        }

        let user = await db.select().from(users).where(eq(users.email, email));
        if (!user) {
          return reply
            .status(401)
            .send({ message: 'Invalid email or password' });
        }
        const newExpiry = new Date(Date.now() + 60 * 60 * 1000);

        const existing_sessions = await db
          .select()
          .from(session)
          .where(eq(session.userId, user[0].id));

        if (existing_sessions.length > 0) {
          await db
            .update(session)
            .set({ expireAt: newExpiry })
            .where(eq(session.userId, user[0].id));
        } else {
          await db.insert(session).values({
            userId: user[0].id,
            expireAt: new Date(Date.now() + 60 * 60 * 1000),
            createdAt: new Date(),
          });
        }

        return reply.status(200).send({
          message: 'Login successful',
          userId: user[0].id,
        });
      } catch (e) {
        console.error('Error during login:', e);
      }
    }
  );
}
