import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { db } from '../db/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { Static } from '@sinclair/typebox';
import {
  authResponseSchema,
  loginBodySchema,
  registerBodySchema,
} from '../Models/Auth';

type registerBody = Static<typeof registerBodySchema>;
type LoginBody = Static<typeof loginBodySchema>;

export async function AuthRoutes(Fastify: FastifyInstance) {
  Fastify.post<{ Body: registerBody }>(
    '/auth/register',
    {
      schema: {
        body: registerBodySchema,
        response: { 201: authResponseSchema, 409: authResponseSchema },
      },
    },
    async (request, reply) => {
      try {
        const { username, email, password } = request.body;
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (existingUser.length > 0) {
          return reply.status(409).send({
            success: false,
            error: 'User with this email already exists',
          });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await db
          .insert(users)
          .values({
            username,
            email,
            passwordHash,
          })
          .returning();

        const token = Fastify.jwt.sign({
          id: newUser[0].id,
          email: newUser[0].email,
          username: newUser[0].username,
        });
        reply.status(201).send({
          success: true,
          token,
          user: {
            id: newUser[0].id,
            username: newUser[0].username,
            email: newUser[0].email,
          },
        });
      } catch (err) {
        throw err;
      }
    }
  );

  Fastify.post<{ Body: LoginBody }>(
    '/auth/login',
    {
      schema: {
        body: loginBodySchema,
        response: { 200: authResponseSchema, 401: authResponseSchema },
      },
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (user.length === 0) {
          return reply.status(401).send({
            success: false,
            error: 'Invalid email or password',
          });
        }

        const isValid = await bcrypt.compare(password, user[0].passwordHash);

        if (!isValid) {
          return reply.status(401).send({
            success: false,
            error: 'Invalid email or password',
          });
        }

        const token = Fastify.jwt.sign({
          id: user[0].id,
          email: user[0].email,
          username: user[0].username,
        });
        reply.status(200).send({
          success: true,
          token,
          user: {
            id: user[0].id,
            username: user[0].username,
            email: user[0].email,
          },
        });
      } catch (err) {
        throw err;
      }
    }
  );
}
