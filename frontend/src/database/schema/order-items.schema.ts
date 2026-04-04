import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { orders } from './orders.schema';
import { products } from './products.schema';

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [
    uniqueIndex('order_items_order_product_uq').on(
      table.orderId,
      table.productId,
    ),
    index('order_items_order_idx').on(table.orderId),
    index('order_items_product_idx').on(table.productId),
    check('order_items_quantity_positive', sql`${table.quantity} > 0`),
    check('order_items_unit_price_non_negative', sql`${table.unitPrice} >= 0`),
  ],
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
