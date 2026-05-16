import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/db';
import { and, desc, eq } from 'drizzle-orm';
import { posts, users } from '../db/schema';
import { createPostBody, createPostBodySchema } from '../Models/Post';


async function PostsRoutes(fastify: FastifyInstance) {
  //get all posts
  fastify.get('/posts', async (request, reply) => {
    try {
      const allPosts = await db.query.posts.findMany({
        columns: {
          title: true,
          content: true,
          published: true,
        },
        with: {
          author: {
            columns: { id: true, username: true, email: true }
          }
        }
      })
      reply.status(200).send({
        success: true,
        data: allPosts
      })
    } catch (err) {
      throw err
    }

  });

  //get single post /:id
  fastify.get('/posts/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, parseInt(id)),
        with: {
          author: {
            columns: { id: true, username: true, email: true }
          }
        }
      })

      if (!post) {
        return reply.status(404).send({ success: false, error: 'Post not found' })
      }

      return { success: true, data: post }
    } catch (err: any) {
      fastify.log.error({ msg: err.message, cause: err.cause, query: err.query })
      throw err
    }
  })


  fastify.post<{ Body: createPostBody }>('/posts', { schema: { body: createPostBodySchema } }, async (request, reply) => {
    try {
      const { title, content, published } = request.body
      const userId = request.user?.id


      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' })
      }
      const newPost = await db.insert(posts).values({
        title,
        content,
        published: published || false,
        userId,
      }).returning()

      reply.status(201).send({
        success: true,
        data: newPost[0]
      });
    } catch (err) {
      throw err
    }
  })


  fastify.put('/posts/:id', async (request: FastifyRequest<{ Body: createPostBody }>, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { title, content, published } = request.body
      const userId = request.user?.id

      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' })
      }

      let updatedData: any = { updatedAt: new Date() }
      if (title) updatedData.title = title
      if (content) updatedData.content = content
      if (published !== undefined) updatedData.published = published

      const updated = await db.update(posts).set(updatedData).where(and(
        eq(posts.id, parseInt(id)),
        eq(posts.userId, userId!)
      )).returning()

      if (updated.length == 0) {
        return reply.status(404).send({ success: false, error: 'Post not found or you are not the author' })
      }
      return { success: true, data: updated[0] }
    } catch (err) {
      throw err
    }
  })


  fastify.delete('/posts/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const userId = request.user?.id
      if (!userId) {
        return reply.status(401).send({ success: false, error: 'Unauthorized' })
      }

      const delted = await db.delete(posts).where(and(
        eq(posts.id, parseInt(id)),
        eq(posts.userId, userId!)
      )).returning()

      if (delted.length == 0) {
        return reply.status(404).send({ success: false, error: 'Post not found or you are not the author' })
      }
      return { deleted: true, data: delted[0] }
    } catch (err) {
      throw err
    }
  })
}
export { PostsRoutes };
