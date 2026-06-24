# AGENTS.md — Inventory Project (SaaS Multi-tenant)

## Quick Commands

```bash
# Install & generate Prisma
npm install && npm run prisma:generate

# Dev server (with Turbopack)
npm run dev

# Build (includes Prisma generate + db push)
npm run build

# Production server
npm run start

# Tests (run in band due to DB sharing)
npm run test
npm run test:coverage
npm run test:e2e

# Lint
npm run lint

# Seed DB
npm run seed

# Prisma utilities
npm run prisma:generate
npm run prisma:dbpush
npm run prisma:migrate
```

## Architecture Highlights

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Neon Serverless Postgres** with `@prisma/adapter-neon` (WebSocket driver)
- **Neon Auth** for authentication (no NextAuth)
- **Radix UI** + **Lucide** for components
- **Upstash Redis** for rate limiting (optional fallback in-memory)
- **Jest** + **Playwright** for testing

## Key Configuration

### Prisma + Neon
- `DATABASE_URL` = pooled connection (app runtime)
- `DATABASE_URL_UNPOOLED` = direct connection (Prisma CLI + Neon adapter)
- **Driver adapter required**: `previewFeatures = ["driverAdapters"]` in schema
- Prisma client in `src/lib/db.ts` uses WebSocket pool for production, direct for localhost

### Next.js Config (`next.config.ts`)
```ts
outputFileTracingRoot: __dirname,
serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "@neondatabase/serverless"]
```
Critical for Prisma engine binary discovery in production bundle.

### Auth (Neon Auth)
- `@neondatabase/auth` + `@neondatabase/auth-ui`
- Session via `auth.getSession()` in `src/lib/auth/server.ts`
- Middleware protects all routes except `/auth/*`
- Admin emails via `ADMIN_EMAILS` env (comma-separated)

## Multi-tenant Model

- Each company = `Empresa` (self-signup creates "Empresa de {email}")
- Users belong to one `Empresa` via `empresaId`
- All queries must filter by `empresaId` from session
- Permissions: `Permiso[]` array on `Usuario` + role (`ADMIN`/`USUARIO`)

## Testing

- `jest --runInBand` required (tests share DB)
- Test DB: same Neon instance, seeded per run
- 25 suites, 169 tests (~65s)
- `transformIgnorePatterns` for `@neondatabase/*` ESM modules

## Common Gotchas

| Issue | Fix |
|-------|-----|
| P2022 "column neonAuthId does not exist" in prod | Ensure `outputFileTracingRoot: __dirname` + `serverExternalPackages` in next.config.ts |
| Prisma engine not found in bundle | `serverExternalPackages` prevents bundling; engine resolves at runtime |
| WebSocket connection fails | Use `DATABASE_URL_UNPOOLED` for Neon adapter; `DATABASE_URL` for plain PrismaClient |
| Tests hang on DB | Run with `--runInBand`; ensure `.env` has both DATABASE URLs |
| Middleware rate limiting | Requires `UPSTASH_REDIS_*` env; falls back to in-memory Map |
| React hydration mismatch (attributes) | Vercel Analytics/SpeedInsights + Neon Auth UI inyectan atributos; `suppressHydrationWarning` en `<html>` y `<body>` |
| ERR_SSL_PROTOCOL_ERROR en fetch a API sin sesión | CSP `upgrade-insecure-requests` fuerza HTTPS en localhost; se omitió en dev (`process.env.NODE_ENV`) |
| Invalid origin en Neon Auth | Agregar `http://localhost:3000` en Neon Console > Auth > Settings > Allowed Origins |
| CSS compat warnings (-webkit-*) | Vienen de Tailwind/Neon Auth UI; seguros de ignorar |
| Vercel CSP bloquea speed-insights | `script-src-elem` con `https://va.vercel-scripts.com` en CSP |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (REST)
│   ├── empresa/configuracion/  # Company settings UI (Radix)
│   └── ...
├── components/            # Shared UI components (Radix wrappers)
├── lib/
│   ├── auth/              # Neon Auth server/client
│   ├── db.ts              # Prisma singleton (Neon adapter in prod)
│   ├── permisos.ts        # Session + permissions (cached)
│   ├── *.ts               # Domain utilities (inventario, csv, excel, etc.)
│   └── adminEmails.ts     # Admin email check
├── services/              # Business logic (tested)
│   ├── WebhooksService.ts # Neon Auth webhook handler
│   ├── ConfiguracionService.ts
│   └── ...
├── __tests__/             # Jest tests (co-located with code)
└── middleware.ts          # Rate limiting + auth protection
```

## Deployment

- Target: **Vercel** (Next.js native)
- Build command: `npm run build` (includes prisma generate + db push)
- Start command: `npm run start`
- Requires: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `UPSTASH_REDIS_*`

## Git Workflow

- Phase branches: `fase-0-fundacion`, `fase-1-self-signup`, `fase-2-configuracion`
- Merge sequentially to `pendientes-y-fixes` (no direct push to main)
- All tests + lint must pass before merge