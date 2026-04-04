import {
  check,
  index,
  pgTable,
  text,
  uuid,
  varchar,
  numeric,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { categories } from './categories.schema';

export const productStatusEnum = pgEnum('product_status', [
  'active',
  'out_of_stock',
]);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    sku: varchar('sku', { length: 50 }),
    brand: varchar('brand', { length: 80 }),
    description: text('description'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    stock: integer('stock').notNull().default(0),
    minThreshold: integer('min_threshold').notNull().default(5),
    status: productStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('products_category_idx').on(table.categoryId),
    index('products_status_idx').on(table.status),
    index('products_stock_idx').on(table.stock),
    index('products_sku_idx').on(table.sku),
    check('products_price_non_negative', sql`${table.price} >= 0`),
    check('products_stock_non_negative', sql`${table.stock} >= 0`),
    check(
      'products_min_threshold_non_negative',
      sql`${table.minThreshold} >= 0`,
    ),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
