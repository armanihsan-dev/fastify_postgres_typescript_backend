import { relations } from 'drizzle-orm';
import { boolean, integer, primaryKey, text } from 'drizzle-orm/pg-core';
import { serial, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  isActive: boolean('is_active').default(true),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const session = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expireAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  published: boolean('published').default(false),
  userId: integer('user_id').references(() => users.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
})

//junction table
export const postTags = pgTable('post_tags', {
  postId: integer('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] })
}))

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(), // in cents
  stock: integer('stock').notNull().default(0),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').default('pending'), // pending, paid, shipped, cancelled
  createdAt: timestamp('created_at').defaultNow(),
});


export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  priceAtTime: integer('price_at_time').notNull(), // Snapshot of price
});


export const userRelation = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelation = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  postTags: many(postTags)
}));


export const tagsRelation = relations(tags, ({ many }) => ({
  postTags: many(postTags) // mean a single row in the tags table can be related to many rows in the post table
}))

// Junction Relation
export const postTagsRelation = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id]
  }),

  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id]
  })
}))