import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm'; // For raw SQL

interface UserParams {
  id: string;
}

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/users',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // DRIZZLE WAY: Type-safe, auto-completion
        const allUsers = await db.select().from(users);

        reply.status(200).send({
          success: true,
          method: 'drizzle-orm',
          count: allUsers.length,
          data: allUsers,
        });
      } catch (error) {
        fastify.log.error(error);
        reply
          .status(500)
          .send({ success: false, error: 'Failed to fetch users' });
      }
    }
  );

  fastify.get(
    '/users/raw',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const result = await db.execute(sql`SELECT * FROM users`);
        reply.status(200).send({
          success: true,
          method: 'raw-sql',
          query: 'SELECT * FROM users',
          count: result.rows.length,
          data: result.rows,
        });
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({
          success: false,
          error: 'Failed to fetch users with raw SQL',
        });
      }
    }
  );

  fastify.get(
    '/users/:id',
    async (
      request: FastifyRequest<{ Params: UserParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        // DRIZZLE WAY: Type-safe WHERE clause
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(id)));

        if (user.length === 0) {
          return reply.status(404).send({
            success: false,
            error: `User with id ${id} not found`,
          });
        }

        reply.status(200).send({
          success: true,
          method: 'drizzle-orm',
          data: user[0],
        });
      } catch (error) {
        fastify.log.error(error);
        reply
          .status(500)
          .send({ success: false, error: 'Failed to fetch user' });
      }
    }
  );

  fastify.get(
    '/users/:id/raw',
    async (
      request: FastifyRequest<{ Params: UserParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const result = await db.execute(
          sql`SELECT * FROM users WHERE id = ${id}`
        );
        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: `User with id ${id} not found`,
          });
        }

        reply.status(200).send({
          success: true,
          method: 'raw-sql',
          query: `SELECT * FROM users WHERE id = ${id}`,
          data: result.rows[0],
        });
      } catch (error) {
        fastify.log.error(error);
        reply
          .status(500)
          .send({ success: false, error: 'Failed to fetch user with raw SQL' });
      }
    }
  );

  fastify.get(
    '/users/search',
    async (
      request: FastifyRequest<{ Querystring: { username?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { username } = request.query;

        if (!username) {
          return reply.status(400).send({
            success: false,
            error: 'username query parameter is required',
          });
        }

        const result = await db.execute(sql`
            SELECT * FROM users 
            WHERE username ILIKE ${`%${username}%`}
            ORDER BY id;
            `);
        reply.status(200).send({
          success: true,
          method: 'raw-sql',
          query: `SELECT * FROM users WHERE username ILIKE '%${username}%'`,
          count: result.rows.length,
          data: result.rows,
        });
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ success: false, error: 'Search failed' });
      }
    }
  );

  fastify.get(
    '/users/raw/email',
    async (
      request: FastifyRequest<{ Querystring: { useremail: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { useremail } = request.query;
        if (!useremail) {
          return reply.status(400).send({
            success: false,
            error: 'email query parameter is required',
          });
        }
        const result = await db.execute(sql`
        SELECT * FROM users
        WHERE email ILIKE ${`%${useremail}%`}
          `);

        reply.status(200).send({
          success: true,
          method: 'raw-sql',
          query: `SELECT * FROM users WHERE username ILIKE '%${useremail}%'`,
          count: result.rows.length,
          data: result.rows,
        });
      } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ success: false, error: 'Search failed' });
      }
    }
  );
}
