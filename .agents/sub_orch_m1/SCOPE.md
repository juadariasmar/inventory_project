# Scope: Milestone 1: R1: CRUD de Empresas (Backend & API)

## Architecture
- Framework: Next.js (App Router)
- Database: PostgreSQL (Prisma ORM)
- Helper Service: `src/services/EmpresasService.ts`
- API Routes:
  - `src/app/api/empresas/route.ts` (GET, POST)
  - `src/app/api/empresas/[id]/route.ts` (PUT, DELETE)
- Security: Restricted to active ADMIN users (`role === 'ADMIN' && estado === 'ACTIVO'`)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Service Layer & Unit Tests | Build `src/services/EmpresasService.ts` with TDD and verify all unit tests pass | None | PLANNED |
| 2 | API Routes & Integration Tests | Build API routes with session checks and TDD, verify all integration tests pass | M1.1 | PLANNED |
| 3 | Full Verification | Run `npm run build` and `npm run test` to verify no regressions | M1.2 | PLANNED |

## Interface Contracts
### CRUD de Empresas API
- `GET /api/empresas`: Returns `Empresa[]`. Restricted to active ADMIN.
- `POST /api/empresas`: Accepts `{ nombre: string }`. Returns new `Empresa`. Restricted to active ADMIN.
- `PUT /api/empresas/[id]`: Accepts `{ nombre: string }`. Returns updated `Empresa`. Restricted to active ADMIN.
- `DELETE /api/empresas/[id]`: Deletes company. Returns `{ ok: true }` or error status 400 if has users or products. Restricted to active ADMIN.

## Code Layout
- `src/services/EmpresasService.ts`
- `src/app/api/empresas/route.ts`
- `src/app/api/empresas/[id]/route.ts`
- `src/__tests__/services/EmpresasService.test.ts`
- `src/__tests__/api/empresas.test.ts`
