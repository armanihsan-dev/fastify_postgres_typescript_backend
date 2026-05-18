import { FastifyInstance } from "fastify";
import { db } from "../db/db";
import { tags } from "../db/schema";
import { eq } from "drizzle-orm";


export async function tagRoutes(fastify: FastifyInstance) {

    fastify.get('/tags', async (request, reply) => {
        const allTags = await db.select().from(tags);
        return { success: true, count: allTags.length, data: allTags };
    });

    fastify.get('/tags/:id', async (request, reply) => {
        const { id } = request.params as any
        const tag = await db.query.tags.findFirst({
            where: eq(tags.id, parseInt(id)),
            with: {
                postTags: {
                    with: {
                        post: {
                            columns: { id: true, title: true }
                        }
                    }
                }
            }
        })
        if (!tag) {
            return reply.status(404).send({ error: 'Tag not found' });
        }

        return { success: true, data: tag };

    })

    fastify.post('/tag', async (request, reply) => {
        try {
            const { name, description } = request.body as any
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            const newTag = await db.insert(tags).values({
                name,
                slug,
                description
            }).returning()
            return { success: true, data: newTag[0] };
        } catch (err) {
            console.error(err);
            throw err
        }
    })
}