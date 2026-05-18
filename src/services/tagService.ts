// src/services/tagService.ts
import { db } from '../db/db';
import { tags, postTags } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

export const tagService = {

    // Ensure tags exist (create if not), return their IDs
    async findOrCreateTags(tagNames: string[]): Promise<number[]> {
        const tagIds: number[] = [];

        for (const name of tagNames) {
            // Try to find existing tag
            let tag = await db.query.tags.findFirst({
                where: eq(tags.name, name)
            });

            // Create if doesn't exist
            if (!tag) {
                const slug = name.toLowerCase().replace(/\s+/g, '-');
                const [newTag] = await db.insert(tags).values({
                    name,
                    slug
                }).returning();
                tag = newTag;
            }

            tagIds.push(tag.id);
        }

        return tagIds;
    },

    // Sync tags for a post (replace all tags)
    async syncPostTags(postId: number, tagNames: string[]) {
        // Start transaction
        return await db.transaction(async (tx) => {

            // 1. Get or create all tags
            const tagIds = await this.findOrCreateTags(tagNames);

            // 2. Remove all existing tag connections
            await tx.delete(postTags).where(eq(postTags.postId, postId));

            // 3. Add new connections
            for (const tagId of tagIds) {
                await tx.insert(postTags).values({ postId, tagId });
            }
        });
    },

    // Get all tags for a post
    async getPostTags(postId: number) {
        const result = await db.query.postTags.findMany({
            where: eq(postTags.postId, postId),
            with: { tag: true }
        });

        return result.map(pt => pt.tag);
    },

    // Get popular tags (most used)
    async getPopularTags(limit: number = 10) {
        const result = await db.execute(sql`
      SELECT t.id, t.name, t.slug, COUNT(pt.tag_id) as usage_count
      FROM tags t
      JOIN post_tags pt ON t.id = pt.tag_id
      GROUP BY t.id, t.name, t.slug
      ORDER BY usage_count DESC
      LIMIT ${limit}
    `);

        return result.rows;
    }
};