# Alumni Pool Backend

Backend API for the Smart Inventory and Order Management System using NestJS + Drizzle + Neon PostgreSQL.

## Implemented Features

- Authentication:
  - Email/password signup and login
  - JWT bearer auth for protected routes
  - Global auth guard with `@Public()` support
- Categories:
  - Create and list categories
- Products:
  - Create, list (search/filter/pagination), and update products
  - Product status auto-normalization when stock reaches `0`
- Orders:
  - Create orders with multiple items
  - Duplicate product detection inside a single order
  - Auto stock deduction on order create
  - Insufficient stock prevention with descriptive errors
  - Cancel order with stock rollback
  - Update order status (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`)
- Restock Queue:
  - List low-stock products (`stock < min_threshold`) prioritized by stock severity
  - Manual restock endpoint
- Dashboard:
  - Orders today, pending vs completed, revenue today, low stock count, product summary
- Activity Log:
  - Recent events endpoint and structured activity tracking across flows

## Architecture

- Feature-based modules under `src/modules/*`
- Separation of concerns:
  - controllers: transport layer
  - services: business logic
  - DTOs: validation contracts
  - repositories (where used): persistence abstractions
- Global validation pipe (`whitelist`, `forbidNonWhitelisted`, `transform`)

## Database Setup

1. Create backend `.env` from `.env.example`
2. Set values:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `FRONTEND_URL`
   - `PORT`
3. Run one of:
   - `npm run db:push` (sync schema quickly)
   - `npm run db:migrate` (run SQL migrations)
4. Seed demo login user:
   - `npm run db:seed`

Demo credentials seeded:
- email: `demo@alumnipool.app`
- password: `DemoPass123`

## Scripts

- `npm run start:dev`: run in watch mode
- `npm run build`: compile TypeScript
- `npm run lint`: run ESLint
- `npm run test`: run unit tests
- `npm run db:generate`: generate migrations from schema
- `npm run db:migrate`: apply migrations
- `npm run db:push`: push schema directly
- `npm run db:studio`: open Drizzle Studio
- `npm run db:seed`: seed demo user

## SQL Best Practices

- Enum-based constrained statuses for users/products/orders
- Unique and composite unique indexes for conflict prevention
- Indexes on frequently filtered columns (`status`, `created_at`, FK fields)
- Check constraints for non-negative prices/stock/thresholds and positive quantities
- Transactional order creation/update/cancellation for stock consistency

## Deployment

### Health Check

- `GET /health` returns service status and timestamp.
- Swagger docs available at `GET /docs`.

### Deploy Backend (Railway or Render)

1. Set build command: `npm ci && npm run build`
2. Set start command: `npm run start:prod`
3. Configure environment variables:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `FRONTEND_URL`
  - `PORT` (usually auto-provided by host)
4. Run DB initialization once after first deploy:
  - `npm run db:push`
  - `npm run db:seed`

### Docker Run

```bash
docker build -t alumni-pool-backend ./alumni-pool-backend
docker run --env-file ./alumni-pool-backend/.env -p 3001:3001 alumni-pool-backend
```
