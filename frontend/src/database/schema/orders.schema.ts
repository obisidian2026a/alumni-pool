import {
  check,
  index,
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.schema';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerName: varchar('customer_name', { length: 150 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: orderStatusEnum('status').notNull().default('pending'),
    totalPrice: numeric('total_price', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('orders_status_idx').on(table.status),
    index('orders_created_at_idx').on(table.createdAt),
    index('orders_user_idx').on(table.userId),
    check('orders_total_price_non_negative', sql`${table.totalPrice} >= 0`),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
