import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/db';
import { $Type, and, desc, eq } from 'drizzle-orm';
import { posts } from '../db/schema';

interface IParams {
  userId: string;
}

interface IBody {
  title: string;
  content: string;
}
interface IPutDelte {
  userId: string;
  postId: string;
}
async function PostsRoutes(Fastify: FastifyInstance) {
  Fastify.get(
    '/users/:userId/posts',
    async (
      request: FastifyRequest<{ Params: IParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { userId } = request.params;
        if (!userId) {
          return reply.status(400).send({ error: 'User ID is required' });
        }
        const data = await db.query.posts.findMany({
          where: eq(posts.userId, parseInt(userId)),
          columns: {
            title: true,
            content: true,
            userId: true,
          },
          with: {
            author: {
              columns: {
                username: true,
                email: true,
              },
            },
          },
        });
        return reply.status(200).send({ success: true, data });
      } catch (err) {
        throw err;
      }
    }
  );

  Fastify.post(
    '/users/:userId/posts',
    async (
      request: FastifyRequest<{ Params: IParams; Body: IBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { userId } = request.params;
        const { title, content } = request.body;

        if (!userId) {
          return reply.status(400).send({ error: 'User ID is required' });
        }
        const result = await db
          .insert(posts)
          .values({
            title,
            content,
            userId: parseInt(userId),
          })
          .returning();
        return reply.status(201).send({ success: true, data: result });
      } catch (error) {
        throw error;
      }
    }
  );

  Fastify.put(
    '/users/:userId/posts/:postId',
    async (
      request: FastifyRequest<{ Body: IBody; Params: IPutDelte }>,
      reply: FastifyReply
    ) => {
      try {
        const { postId, userId } = request.params;

        const { title, content } = request.body;
        const updatedData: Partial<IBody> = {};
        if (title) updatedData.title = title;
        if (content) updatedData.content = content;

        const result = await db
          .update(posts)
          .set(updatedData)
          .where(
            and(
              eq(posts.id, parseInt(postId)),
              eq(posts.userId, parseInt(userId))
            )
          )
          .returning();

        if (result.length === 0) {
          return reply.status(404).send({
            error: 'Post not found or you do not own it',
          });
        }

        return { success: true, data: result[0] };
      } catch (error) {
        throw error;
      }
    }
  );

  Fastify.delete(
    '/users/:userId/posts/:postId',
    async (
      request: FastifyRequest<{ Params: IPutDelte }>,
      reply: FastifyReply
    ) => {
      const { userId, postId } = request.params;
      try {
        const deleted = await db
          .delete(posts)
          .where(
            and(
              eq(posts.id, parseInt(postId)),
              eq(posts.userId, parseInt(userId))
            )
          )
          .returning();

        if (deleted.length === 0) {
          return reply.status(404).send({
            error: 'Post not found or you do not own it',
          });
        }

        return { success: true, message: 'Post deleted successfully' };
      } catch (err) {
        throw err;
      }
    }
  );
}
export { PostsRoutes };
