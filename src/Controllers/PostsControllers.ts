import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/db';
import { and, eq } from 'drizzle-orm';
import { posts } from '../db/schema';
import { createPostBody } from '../Models/Post';

export const getAllPostsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
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
        });

        return reply.status(200).send({
            success: true,
            data: allPosts
        });
    } catch (err) {
        throw err;
    }
};

export const getSinglePostHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { id } = request.params as { id: string };
        const post = await db.query.posts.findFirst({
            where: eq(posts.id, parseInt(id)),
            with: {
                author: {
                    columns: { id: true, username: true, email: true }
                }
            }
        });

        if (!post) {
            return reply.status(404).send({ success: false, error: 'Post not found' });
        }

        return reply.status(200).send({ success: true, data: post });
    } catch (err: any) {
        request.log.error({ msg: err.message, cause: err.cause, query: err.query });
        throw err;
    }
};

export const createPostHandler = async (
    request: FastifyRequest<{ Body: createPostBody }>,
    reply: FastifyReply
) => {
    try {
        const { title, content, published } = request.body;
        const userId = request.user?.id;

        if (!userId) {
            return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }

        const newPost = await db.insert(posts).values({
            title,
            content,
            published: published || false,
            userId,
        }).returning();

        return reply.status(201).send({
            success: true,
            data: newPost[0]
        });
    } catch (err) {
        throw err;
    }
};

export const updatePostHandler = async (
    request: FastifyRequest<{ Body: createPostBody }>,
    reply: FastifyReply
) => {
    try {
        const { id } = request.params as { id: string };
        const { title, content, published } = request.body;
        const userId = request.user?.id;

        if (!userId) {
            return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }

        let updatedData: any = { updatedAt: new Date() };
        if (title) updatedData.title = title;
        if (content) updatedData.content = content;
        if (published !== undefined) updatedData.published = published;

        const updated = await db.update(posts).set(updatedData).where(and(
            eq(posts.id, parseInt(id)),
            eq(posts.userId, userId)
        )).returning();

        if (updated.length === 0) {
            return reply.status(404).send({ success: false, error: 'Post not found or you are not the author' });
        }

        return reply.status(200).send({ success: true, data: updated[0] });
    } catch (err) {
        throw err;
    }
};

export const deletePostHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { id } = request.params as { id: string };
        const userId = request.user?.id;

        if (!userId) {
            return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }

        const deleted = await db.delete(posts).where(and(
            eq(posts.id, parseInt(id)),
            eq(posts.userId, userId)
        )).returning();

        if (deleted.length === 0) {
            return reply.status(404).send({ success: false, error: 'Post not found or you are not the author' });
        }

        return reply.status(200).send({ deleted: true, data: deleted[0] });
    } catch (err) {
        throw err;
    }
};