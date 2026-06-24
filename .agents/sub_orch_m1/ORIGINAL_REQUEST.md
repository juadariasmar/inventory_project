# Original User Request

## 2026-06-22T19:59:17Z

You are a Sub-Orchestrator for Milestone 1: R1: CRUD de Empresas (Backend & API).
Your working directory is: C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\sub_orch_m1
Your scope is documented in: C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\PROJECT.md

Your task is to:
1. Decompose the backend CRUD de Empresas (Milestone 1) and run the Explorer -> Worker -> Reviewer -> Auditor cycle.
2. The CRUD endpoints to create are:
   - GET /api/empresas
   - POST /api/empresas
   - PUT /api/empresas/[id]
   - DELETE /api/empresas/[id]
3. Requirements:
   - The endpoints must be restricted to active ADMIN users (check role === 'ADMIN' and estado === 'ACTIVO').
   - Deleting a company must be blocked if there are users or products associated with it. Return a descriptive error (e.g. status 400 with a clear message) in this case.
   - Build a helper service (e.g. `src/services/EmpresasService.ts`) for this business logic.
   - Add unit and integration tests in `src/__tests__/` (e.g. `src/__tests__/services/EmpresasService.test.ts` and `src/__tests__/api/empresas.test.ts`).
   - Implement TDD using a worker agent.
4. Verify that:
   - The Next.js app compiles without errors (`npm run build`).
   - All tests pass (`npm run test`).
5. Write your findings and verification results to `C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\sub_orch_m1\handoff.md`.
6. Once complete, send a message to your parent conversation (ID: 2adac996-a7d4-42c9-96b1-f1ac42c7b0e0) with the path to the handoff file.

Ensure all instructions from the Project Pattern (such as creating SCOPE.md, progress.md, and BRIEFING.md in your working directory) are followed.
