# BRIEFING — 2026-06-22T13:38:00Z

## Mission
Investigate Vercel HTTP 500 login errors (Google OAuth & OTP code) in Neon Auth integration.

## 🔒 My Identity
- Archetype: Read-Only Exploration Agent (teamwork_preview_explorer)
- Roles: Explorer, Analyst
- Working directory: C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\explorer_auth_1
- Original parent: 54c7057d-3da7-4b96-9ff6-d8b0532e8259
- Milestone: auth-investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement.
- Operating in CODE_ONLY network mode. No external website access or HTTP client queries to external URLs.

## Current Parent
- Conversation ID: 54c7057d-3da7-4b96-9ff6-d8b0532e8259
- Updated: 2026-06-22T13:38:00Z

## Investigation State
- **Explored paths**: `src/lib/auth/server.ts`, `src/middleware.ts`, `src/app/api/auth/[...path]/route.ts`, `src/lib/auth/client.ts`, `node_modules/@neondatabase/auth`, `next.config.ts`, `src/componentes/ProveedorSesion.tsx`, `src/componentes/BarraNavegacion.tsx`, `src/componentes/TerminalVentaRapida.tsx`
- **Key findings**: 
  1. Missing environment variables (`NEON_AUTH_BASE_URL` & `NEON_AUTH_COOKIE_SECRET`) on Vercel lead to `TypeError: Failed to parse URL` when routing proxies try to request `new URL("undefined/...")`. Caught exceptions result in HTTP 500.
  2. SameSite defaults to `strict`, which causes challenge cookies to be blocked on cross-site Google OAuth redirects.
  3. CSP `connect-src` restricts connection to `'self'`, blocking client components from reaching the Neon Auth server.
  4. Next.js 16 warns that `middleware.ts` convention is deprecated and should be renamed to `proxy.ts`.
- **Unexplored areas**: None.

## Key Decisions Made
- Performed static checks and build diagnostics (`npx next build` succeeded).
- Documented findings in `analysis.md` and `handoff.md`.

## Artifact Index
- C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\explorer_auth_1\analysis.md — Comprehensive analysis report
- C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\explorer_auth_1\handoff.md — Standard Handoff report
