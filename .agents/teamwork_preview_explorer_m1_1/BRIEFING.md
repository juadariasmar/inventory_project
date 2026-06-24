# BRIEFING — 2026-06-22T20:04:15Z

## Mission
Explore testing setup, auth patterns, and design the EmpresasService implementation strategy without making any code changes.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Read-only investigator, analyzer
- Working directory: C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\teamwork_preview_explorer_m1_1
- Original parent: deabe6c0-9ad9-40f3-9e90-2e80bf9469f7
- Milestone: Milestone 1.1 Exploration & Strategy

## 🔒 Key Constraints
- Read-only investigation — do NOT implement.
- Do not modify any codebase files.
- Operate in CODE_ONLY network mode.
- Report findings in C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\teamwork_preview_explorer_m1_1\handoff.md.

## Current Parent
- Conversation ID: deabe6c0-9ad9-40f3-9e90-2e80bf9469f7
- Updated: 2026-06-22T20:04:15Z

## Investigation State
- **Explored paths**:
  - `jest.config.js` (Jest Node environment, ts-jest preset)
  - `package.json` (Next.js v16.0.7, React v19, Prisma v5.22, Jest v30)
  - `prisma/schema.prisma` (Database schema with Empresa model and relationships)
  - `src/lib/db.ts` (Prisma client config with adapter-neon / serverless pool fallback)
  - `src/lib/permisos.ts` (Auth permissions system, caching, session retrieval from Neon Auth)
  - `src/lib/auth/server.ts` (Neon Auth server config)
  - `src/middleware.ts` (Rate limiting and route matching middleware)
  - `src/__tests__/services/*` & `src/__tests__/api/*` (Existing tests structure and mocks)
- **Key findings**:
  - The Jest environment is configured with node, using `ts-jest` for compilation, matching `**/__tests__/**/*.test.ts`.
  - Service tests write directly to the database rather than mocking Prisma, but they create/teardown custom resources (including custom Empresas/Usuarios) during `beforeAll` and `afterAll`.
  - Side effects like audit logging (`registrarAuditoria` from `src/lib/auditoria.ts`) are mocked in service tests because they transitively import ES modules (Neon Auth) that Jest cannot easily parse or run in a node env.
  - API tests mock `obtenerSesion` and `esAdmin` from `src/lib/permisos.ts` to return mock user session objects, bypassing real auth validation, and use `createMockRequest` helper.
  - No `EmpresasService` or API routes exist yet. Adding this will require relationship checks before deletion to prevent cascading issues or accidental deletion of records.
- **Unexplored areas**:
  - UI page layouts for listing and editing companies (Empresas) since our focus is service and API level.

## Key Decisions Made
- Design `EmpresasService` with robust validation and deletion blockers (checks for users, products, categories, providers).
- Propose expanding `EntidadAuditoria` union type to include `'Empresa'`.
- Mock `registrarAuditoria` in `EmpresasService` unit tests to avoid runtime ESM transpilation issues in Jest.
- Define a 5-step implementation plan including precise file locations and test templates.

## Artifact Index
- C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\teamwork_preview_explorer_m1_1\handoff.md — Main exploration findings and implementation plan.
