# Alumni Pool Frontend

Next.js dashboard UI for the Smart Inventory and Order Management System.

## Implemented Features

- Auth pages:
	- `/login` with Demo Login autofill button
	- `/signup`
	- Redirect to dashboard after successful auth
- Dashboard page:
	- KPI cards (orders today, pending/completed, revenue)
	- Category creation
	- Product creation
	- Product search/listing
	- Order creation with duplicate product prevention in UI
	- Order status updates
	- Restock queue with manual restock action
	- Product summary snapshot
	- Recent activity feed

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4

## Project Structure

- `app/(auth)/`: login/signup pages and auth layout
- `app/dashboard/page.tsx`: inventory management dashboard
- `components/auth/`: auth UI shell
- `lib/api/client.ts`: shared API request helper and error type
- `lib/api/auth.ts`: auth API calls
- `lib/api/inventory.ts`: dashboard/inventory/order API calls
- `types/auth.ts`: auth types
- `types/inventory.ts`: inventory/order/dashboard types

## Environment

Create `.env.local` from `.env.example`.

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`

## Scripts

- `npm run dev`: local development server
- `npm run build`: production build
- `npm run lint`: lint checks

## Demo Login

The login page includes a demo button that fills:
- email: `demo@alumnipool.app`
- password: `DemoPass123`

Make sure backend seed has been run (`npm run db:seed`) before using demo login.

## Deployment

### Deploy Frontend (Vercel)

1. Import this frontend directory as a project.
2. Set environment variable:
	- `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain`
3. Deploy and verify login + dashboard API calls.

### Docker Run

```bash
docker build -t alumni-pool-frontend ./alumni-pool-frontend
docker run -e NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 -p 3000:3000 alumni-pool-frontend
```
