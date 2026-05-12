import { boolean, text } from 'drizzle-orm/pg-core';
import { serial, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const session = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expireAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
