
import { and, eq } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { db } from '../db/db';
import { posts, postTags, tags } from '../db/schema';

export async function postTagRoutes(fastify: FastifyInstance) {
    fastify.post('/posts/:postId/tags/:tagId', async (request, reply) => {
        const { postId, tagId } = request.params as { postId: string; tagId: string };
        const userId = request.user?.id;

        // Verify ownership
        const post = await db.query.posts.findFirst({
            where: eq(posts.id, parseInt(postId))
        })

        if (!post || post.userId !== userId) {
            return reply.status(403).send({ message: 'Unauthorized' });
        }

        try {
            await db.insert(postTags).values({
                postId: parseInt(postId),
                tagId: parseInt(tagId)
            })

            let tag = await db.query.tags.findFirst({
                where: eq(tags.id, parseInt(tagId))
            })
            return { success: true, message: 'Tag added to post', tag: tag!.name };

        } catch (err: any) {
            // PostgreSQL error code 23505 = unique violation
            if (err.code === '23505') {
                return reply.status(409).send({ error: 'Tag already added to this post' });
            }
            throw err
        }
    })

    fastify.delete('/posts/:postId/tags/:tagId', async (request, reply) => {
        const { postId, tagId } = request.params as { postId: string; tagId: string };
        const userId = request.user?.id;

        // Verify ownership
        const post = await db.query.posts.findFirst({
            where: eq(posts.id, parseInt(postId))
        });

        if (!post || post.userId !== userId) {
            return reply.status(403).send({ error: 'You do not own this post' });
        }

        try {
            await db.delete(postTags).where(and(
                eq(postTags.postId, parseInt(postId)),
                eq(postTags.tagId, parseInt(tagId))
            ))
            return { success: true, message: 'Tag removed from post' };
        } catch (err) {
            return reply.status(500).send({ error: 'Failed to remove tag from post' });
        }

    })
}