import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/db';
import { and, desc, eq } from 'drizzle-orm';
import { posts, postTags, tags } from '../db/schema';
import { createPostBody } from '../Models/Post';
import { tagService } from '../services/tagService';

export const getAllPostsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const postsWithJunction = await db.query.posts.findMany({
            with: {
                author: {
                    columns: { id: true, username: true, email: true }
                },
                postTags: {
                    with: {
                        tag: true
                    }
                }
            },
            orderBy: desc(posts.createdAt)
        });
        const cleanedPosts = postsWithJunction.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            published: post.published,
            author: post.author,
            tags: post.postTags.map(pt => ({
                id: pt.tag.id,
                name: pt.tag.name,
                slug: pt.tag.slug
            })),
            createdAt: post.createdAt
        }));

        return { success: true, count: cleanedPosts.length, data: cleanedPosts };
    } catch (err) {
        throw err;
    }
};

export const getAllPostsForATag = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { tagSlug } = request.body as { tagSlug: string }
        const tag = await db.query.tags.findFirst({
            where: eq(tags.slug, tagSlug),
            with: {
                postTags: {
                    with: {
                        post: {
                            with: {
                                author: { columns: { id: true, username: true } }
                            }
                        }
                    }
                }
            }
        })

        console.log('THE TAG :', tag);
        if (!tag) {
            return reply.status(404).send({ error: 'Tag not found' });
        }
        // Extract posts from junction
        const posts = tag.postTags.map(pt => ({
            id: pt.post!.id,
            title: pt.post!.title,
            content: pt.post!.content,
            author: pt.post!.author
        }));

        return {
            success: true,
            tag: { id: tag.id, name: tag.name },
            count: posts.length,
            data: posts
        };
    } catch (err) {
        throw err;
    }
}
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

export const createPostWithTagsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.id;
    const { title, content, published, tags: tagNames } = request.body as any;
    try {

        const result = await db.transaction(async (tx) => {
            const [newPost] = await tx.insert(posts).values({
                title,
                content,
                published: published || false,
                userId
            }).returning()

            if (tagNames && tagNames.length > 0) {
                const tagIds = await tagService.findOrCreateTags(tagNames)
                for (const tagId of tagIds) {
                    await tx.insert(postTags).values({
                        postId: newPost.id,
                        tagId
                    })
                }
            }
            return newPost;
        })
        return reply.status(201).send({ success: true, data: result });
    } catch (err) {
        throw err;
    }
}





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