## 2026-06-22T20:05:34Z
You are a backend software engineer. Your working directory is C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\teamwork_preview_worker_m1_1.
Your task is to implement the CRUD de Empresas (Milestone 1) backend logic, service, API endpoints, and tests following a Test-Driven Development (TDD) workflow.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Follow these steps:
1. Update `src/lib/auditoria.ts`:
   - Add `'Empresa'` to the `EntidadAuditoria` union type.
   - Add `'Empresa'` to the `ENTIDADES` array.

2. Create the unit test file `src/__tests__/services/EmpresasService.test.ts` to test `EmpresasService` (which you will create next). Cover:
   - `obtenerTodas()`: lists companies.
   - `obtenerPorId(id)`: gets company or throws 404 AppError.
   - `crear(datos, ip, usuarioId)`: creates company (throws 400 AppError if name is empty/whitespace).
   - `actualizar(id, datos, ip, usuarioId)`: updates company (throws 400 AppError if name is empty/whitespace, throws 404 AppError if not found).
   - `eliminar(id, ip, usuarioId)`: deletes company if no users or products are associated. If users or products exist, throws a 400 AppError with a descriptive message.

3. Run `npm test` to verify that the newly written unit tests fail (TDD step).

4. Create `src/services/EmpresasService.ts` to implement the database CRUD operations, validation checks, deletion blocking, and audit registration (`registrarAuditoria` with action and entity `'Empresa'`). Use `AppError` and `prisma` client.

5. Run `npm test` to verify unit tests now pass.

6. Create the integration test file `src/__tests__/api/empresas.test.ts` to test the API routes:
   - `GET /api/empresas`: returns list of companies, restricted to active ADMIN users (status 403 if standard/inactive).
   - `POST /api/empresas`: accepts `{ nombre }` and creates company, restricted to active ADMIN users.
   - `PUT /api/empresas/[id]`: accepts `{ nombre }` and updates company, restricted to active ADMIN users.
   - `DELETE /api/empresas/[id]`: deletes company, restricted to active ADMIN users. Blocks delete with status 400 if users/products are associated. Blocks delete with status 400 if the admin tries to delete their own company.

7. Run `npm test` to verify that the integration tests fail (TDD step).

8. Create the API routes:
   - `src/app/api/empresas/route.ts` (GET, POST)
   - `src/app/api/empresas/[id]/route.ts` (GET, PUT, DELETE) (Include GET for detail retrieval, which is standard, and PUT/DELETE. Restrict appropriately using `esAdmin()`, and retrieve session with `obtenerSesion()`).

9. Run `npm test` to verify all tests pass.

10. Run `npm run build` to verify the application builds/compiles successfully without TypeScript or routing errors.

Write a handoff report documenting the changes made, the files created/updated, and test output, to `C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.agents\teamwork_preview_worker_m1_1\handoff.md`.
