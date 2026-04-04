import {
  text,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('categories_name_uq').on(table.name)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
