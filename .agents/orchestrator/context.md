# Context: inventory_project

## Environment Details
- **OS**: Windows (user local environment)
- **Deployment target**: Vercel Serverless (Edge / Node runtimes)
- **Database**: Neon Postgres with `@neondatabase/auth` and `@neondatabase/auth-ui`

## Core Packages
- `next`: `16.0.7`
- `react`: `19.2.0`
- `react-dom`: `19.2.0`
- `@neondatabase/auth`: `^0.4.2-beta`
- `@neondatabase/auth-ui`: `^0.2.1-beta`
- `@prisma/client` and `@prisma/adapter-neon`: `^5.22.0`
- `@upstash/ratelimit` / `@upstash/redis` for rate limiting (fallback Map in-memory)

## Existing Authentication Files
- `src/middleware.ts`: Rate limiting POST requests to `/api/auth/` and running `auth.middleware({ loginUrl: '/auth/sign-in' })(request)`.
- `src/app/api/auth/[...path]/route.ts`: Imports `auth` from `@/lib/auth/server` and exports `GET`, `POST` handlers.
- `src/lib/auth/server.ts`: Creates `auth` via `createNeonAuth` with `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`.
- `src/lib/auth/client.ts`: Holds client-side auth.

## Current Investigation Areas
- Cause of HTTP 500 errors on Vercel during login (Google OAuth and OTP codes).
- Verifying environment variables configuration (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, etc.).
- Middleware compatibility with Neon Auth (Clerk-based) headers.
- Next.js 16 / React 19 compatibility and clean code/best practices.
