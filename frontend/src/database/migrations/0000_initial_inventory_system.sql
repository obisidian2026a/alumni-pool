CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE role AS ENUM ('admin', 'manager');
CREATE TYPE product_status AS ENUM ('active', 'out_of_stock');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  password text NOT NULL,
  role role NOT NULL DEFAULT 'manager',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE,
  description text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(150) NOT NULL,
  sku varchar(50),
  brand varchar(80),
  description text,
  category_id uuid NOT NULL REFERENCES categories(id),
  price numeric(10, 2) NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  min_threshold integer NOT NULL DEFAULT 5,
  status product_status NOT NULL DEFAULT 'active',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT products_price_non_negative CHECK (price >= 0),
  CONSTRAINT products_stock_non_negative CHECK (stock >= 0),
  CONSTRAINT products_min_threshold_non_negative CHECK (min_threshold >= 0)
);

CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_status_idx ON products(status);
CREATE INDEX products_stock_idx ON products(stock);
CREATE INDEX products_sku_idx ON products(sku);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name varchar(150) NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'pending',
  total_price numeric(10, 2) NOT NULL DEFAULT '0',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT orders_total_price_non_negative CHECK (total_price >= 0)
);

CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at);
CREATE INDEX orders_user_idx ON orders(user_id);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  CONSTRAINT order_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price >= 0)
);

CREATE UNIQUE INDEX order_items_order_product_uq ON order_items(order_id, product_id);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX order_items_product_idx ON order_items(product_id);

CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action varchar(100) NOT NULL,
  entity_type varchar(50),
  entity_id uuid,
  metadata jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX activity_logs_created_at_idx ON activity_logs(created_at);
CREATE INDEX activity_logs_entity_idx ON activity_logs(entity_type, entity_id);
