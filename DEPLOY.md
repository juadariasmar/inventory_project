Deployment Guide: Prisma + Neon + Vercel
==========================================

This guide covers local development and production deployment on Vercel using Neon as the database.

## Quick Overview

- **Local**: Uses plain `PrismaClient()` (no WebSocket/adapter overhead)
- **Production (Vercel)**: Same plain `PrismaClient()` — Vercel's Neon integration injects `DATABASE_URL` automatically

## Local Development

### Setup

1. Install dependencies:
```bash
cd inventory_project
npm install
```

2. Apply schema to Neon:
```bash
npx prisma db push --schema=prisma/schema.prisma
```

3. Generate Prisma Client:
```bash
npx prisma generate --schema=prisma/schema.prisma
```

### Test Prisma CRUD Locally

Run the test script to verify your setup:

```bash
npm run test:prisma
```

Expected output:
```
Created usuario: { id: ..., nombreUsuario: 'alice_...' }
Found usuario: { id: ..., nombreUsuario: 'alice_...' }
Updated usuario: { id: ..., nombre: 'Alice Smith' }
Deleted usuario.
```

## Production: Vercel + Neon

### Prerequisites

- Vercel project connected to your Git repo
- Neon project created and integrated with Vercel (see below)

### Step 1: Integrate Neon with Vercel

1. Go to your Neon project dashboard
2. **Project Settings** → **Integrations** → **Vercel**
3. Select your Vercel project
4. Click **Connect** (Neon will automatically create a Vercel integration)
5. Verify that Vercel's environment variables now include:
   - `DATABASE_URL` (Neon pooler URL for runtime)
   - `DATABASE_URL_UNPOOLED` (Direct URL for migrations)

This integration handles env vars automatically — no manual setup needed.

### Step 2: Configure Vercel for Prisma Migrations

In your **Vercel Project Settings** → **Environment Variables**, ensure both database URLs are set:

```
DATABASE_URL = postgresql://... (from Neon integration)
DATABASE_URL_UNPOOLED = postgresql://... (from Neon integration)
```

Both should already be there via the integration. If not, copy them manually from your Neon project.

### Step 3: Update Build Command

In **Vercel Project Settings** → **Build & Development Settings**, set the build command to:

```
prisma generate && prisma migrate deploy && next build
```

Or use the npm script from `package.json`:

```
npm run build
```

This ensures:
1. Prisma Client is generated fresh on each deploy
2. Database migrations run using `DATABASE_URL_UNPOOLED` (direct URL)
3. Next.js builds the application

### Step 4: Deploy

Push to your Git branch. Vercel will:
1. Run the build command (including migrations)
2. Deploy to production
3. Your app uses `DATABASE_URL` (pooler) at runtime via `src/lib/db.ts`

### Step 5: Verify in Production

Once deployed, check Vercel logs:

```
✓ Migrations applied
✓ Prisma Client generated
✓ Next.js build successful
```

Then test your app — Prisma should connect seamlessly to Neon.

## How It Works

### `src/lib/db.ts` (Production)

```typescript
// Uses plain PrismaClient without the Neon adapter
const prisma = new PrismaClient()
```

The plain client:
- Connects using PostgreSQL driver (TCP)
- Works with both pooled and direct URLs
- No WebSocket overhead
- Fully compatible with Vercel serverless functions

### Database URLs in Vercel

- **Runtime**: Vercel functions use `DATABASE_URL` (Neon pooler → efficient connection pooling)
- **Migrations**: Build step uses `DATABASE_URL_UNPOOLED` (direct connection → full SQL support)

## Troubleshooting

### "Cannot find database" or "Connection refused"

- ✅ Verify `DATABASE_URL` and `DATABASE_URL_UNPOOLED` exist in Vercel Settings
- ✅ Check Neon integration is connected (Neon → Vercel Integration)
- ✅ Confirm Neon project is running (not suspended)

### Migration fails on deploy

- Ensure `DATABASE_URL_UNPOOLED` is set (not just `DATABASE_URL`)
- Direct URL required for `prisma migrate deploy`

### Prisma Client not found

- Build command must include `prisma generate`
- Check `npm run build` includes this step

## Scripts

Available npm scripts in `inventory_project/package.json`:

```bash
npm run dev              # Local Next.js development
npm run build            # Build (runs migrations + Prisma generate)
npm run start            # Production start
npm run test:prisma      # Test Prisma CRUD
npm run prisma:dbpush    # Push schema to database
npm run prisma:migrate   # Run migrations
```

## Summary

| Aspect | Local | Vercel Production |
|--------|-------|-------------------|
| PrismaClient | Plain (no adapter) | Plain (no adapter) |
| DATABASE_URL | `.env` file | Neon integration |
| DATABASE_URL_UNPOOLED | `.env` file | Neon integration |
| Migrations | Manual `npx prisma db push` | Auto on deploy via build command |
| Runtime | Direct connection | Pooler connection (efficient) |
