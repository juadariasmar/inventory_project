# Project: Multi-Tenant UI and CRUD for Inventory Application

## Architecture
- Framework: Next.js (App Router)
- Database: PostgreSQL with Prisma
- ORM: Prisma Client
- UI: React, Tailwind CSS, custom components (Input, Button, Select, Card)
- Authentication: Neon Auth (handled by a middleware/session system)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | R1: CRUD de Empresas (Backend) | Create API endpoints (`GET /api/empresas`, `POST /api/empresas`, `PUT /api/empresas/[id]`, `DELETE /api/empresas/[id]`) and database validations (block delete if users/products exist) with unit tests. | None | IN_PROGRESS (deabe6c0-9ad9-40f3-9e90-2e80bf9469f7) |
| 2 | R2: Vista de Administración de Empresas | Create responsibe UI at `/admin/empresas` to list, create, edit, delete companies using base UI components (Input, Button, Select, Card) with WCAG 2.2 AA. | M1 | PLANNED |
| 3 | R3: Selector de Empresa en Usuarios | Update UI in user list and edit forms to display/change company (`empresaId`) and update the backend accordingly. | M1 | PLANNED |
| 4 | Final E2E Verification & Hardening | Complete Next.js build (`npm run build`) and test suite verification. | M1, M2, M3 | PLANNED |

## Interface Contracts
### CRUD de Empresas API
- `GET /api/empresas`: Returns `Empresa[]`. Restricted to ADMIN.
- `POST /api/empresas`: Accepts `{ nombre: string }`. Returns new `Empresa`. Restricted to ADMIN.
- `PUT /api/empresas/[id]`: Accepts `{ nombre: string }`. Returns updated `Empresa`. Restricted to ADMIN.
- `DELETE /api/empresas/[id]`: Deletes company. Returns `{ ok: true }` or error if has users or products. Restricted to ADMIN.

### User CRUD Update
- `GET /api/usuarios`: Include `empresa` object (`{ id, nombre }`) for each user.
- `POST /api/usuarios`: Support `empresaId` field in request body.
- `PUT /api/usuarios/[id]`: Support `empresaId` field in request body.

## Code Layout
- `src/app/api/empresas/route.ts` - CRUD endpoint (GET, POST)
- `src/app/api/empresas/[id]/route.ts` - CRUD endpoint (PUT, DELETE)
- `src/app/admin/empresas/page.tsx` - Admin companies page view
- `src/services/EmpresasService.ts` - Business logic for companies CRUD and checks
- `src/app/usuarios/page.tsx` - Updated to show company name
- `src/app/usuarios/[id]/page.tsx` - Updated to show company selector
- `src/app/usuarios/nuevo/page.tsx` - Updated to show company selector
- `src/__tests__/services/EmpresasService.test.ts` - Tests for Empresas service
- `src/__tests__/api/empresas.test.ts` - Tests for Empresas API
