import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'manager']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').notNull().default('manager'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
