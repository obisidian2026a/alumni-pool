import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 50 }),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('activity_logs_created_at_idx').on(table.createdAt),
    index('activity_logs_entity_idx').on(table.entityType, table.entityId),
  ],
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
