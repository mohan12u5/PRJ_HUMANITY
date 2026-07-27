# Humanity Ecommerce Application

Production-oriented Next.js ecommerce foundation with secure user authentication, database-backed sessions, product/cart/order APIs, and Vercel-ready deployment.

## Stack
- Next.js 14 (App Router)
- Prisma ORM
- PostgreSQL (recommended: Supabase or Neon)
- Server-side API routes for auth and ecommerce operations

## Core Backend Features
- Database-backed users with hashed passwords
- Login lockout flow for repeated failures
- Signed, persisted, and revocable session tokens in HttpOnly cookies
- Rate limiting on sensitive endpoints
- Security headers middleware
- Cart and checkout APIs with transactional order creation
- Contact message persistence in DB

## API Endpoints
- `POST /api/register` create user account
- `POST /api/login` authenticate and issue session cookie
- `GET /api/session` validate active session
- `POST /api/session` refresh active session
- `DELETE /api/session` logout and revoke session
- `GET /api/products` get active products
- `GET /api/cart` get authenticated user cart
- `POST /api/cart` add or update cart item
- `DELETE /api/cart` remove one cart item or clear cart
- `POST /api/checkout` create order from cart
- `POST /api/contact` save contact request

## Database Setup
1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env` and set values:
	- `DATABASE_URL`
	- `AUTH_JWT_SECRET`
3. Generate Prisma client:
	- `npm run prisma:generate`
4. Apply schema migrations:
	- `npx prisma migrate dev --name init` (local)
	- `npm run prisma:migrate` (production deploy pipeline)
5. Seed initial products:
	- `npm run prisma:seed`

## Local Development
1. Install dependencies:
	- `npm install`
2. Start app:
	- `npm run dev`

## Deploy to Vercel
1. Push repository to GitHub.
2. Import repo in Vercel.
3. Set environment variables in Vercel:
	- `DATABASE_URL`
	- `AUTH_JWT_SECRET`
	- `NODE_ENV=production`
4. Set build command:
	- `npm run prisma:generate && npm run build`
5. Set output/start defaults (Vercel handles runtime for Next.js).
6. Run migrations against production DB before or during release:
	- `npm run prisma:migrate`

## Reliability Notes
- Vercel already handles edge routing and scaling across regions.
- Use managed Postgres backups and monitoring.
- Add payment provider webhook verification before accepting live payments.
- For stricter global rate limits, integrate Redis-backed limiting (for example Upstash).
