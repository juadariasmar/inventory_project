# Handoff Report — 2026-06-22T15:35:00-05:00

## 1. Observation

During my verification run, I observed the following details and code behaviors:

*   **Test Command Run:** `npm test` (executed as background task `521c9443-ead7-488c-9b09-dd49df55e75d/task-43`).
    *   **Result:** The command failed with exit code 1 due to database unique constraint failures in shared database environments (`src/__tests__/services/UsuariosService.test.ts`, `src/__tests__/api/movimientos.test.ts`, etc.).
    *   **However, the tests for the target feature passed successfully:**
        *   `PASS src/__tests__/services/EmpresasService.test.ts (8.292 s)` (11/11 tests passed)
        *   `PASS src/__tests__/api/empresas.test.ts (6.350 s)` (14/14 tests passed)
*   **Build Command Run:** `npm run build` (executed as background task `521c9443-ead7-488c-9b09-dd49df55e75d/task-59`).
    *   **Result:** The build failed with exit code 1 due to a locking conflict:
        ```
        ⨯ Unable to acquire lock at C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\.next\lock, is another instance of next build running?
        ```
*   **Code Inspection of Payload Validation (`src/services/EmpresasService.ts`):**
    *   **Crear:** Trim coercion is applied to `datos.nombre`. If not a string, it defaults to `""` and throws a 400 AppError.
        ```typescript
        const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
        if (!nombre) {
          throw new AppError('El nombre de la empresa es obligatorio', 400);
        }
        ```
    *   **Actualizar:** If `datos.nombre` is not a string (e.g. `null`), it resolves to `undefined`. The validation `nombre === ''` is bypassed, leading to a successful no-op update (200 OK) instead of validation failure.
        ```typescript
        const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : undefined;
        if (nombre === '') {
          throw new AppError('El nombre de la empresa es obligatorio', 400);
        }
        ```
*   **Code Inspection of JSON Parse Handling (`src/app/api/empresas/route.ts` & `[id]/route.ts`):**
    *   Requests parse JSON via `await request.json()` without protection. Malformed JSON or empty body triggers a native error, yielding a **500 Internal Server Error** in the `catch` block rather than a **400 Bad Request**.
*   **Code Inspection of Permission Gating (`src/lib/permisos.ts`):**
    *   Endpoints are gated by `esAdmin()`, checking `sesion?.user?.rol === 'ADMIN' && sesion?.user?.estado === 'ACTIVO'`. Non-admins or inactive admin users are correctly blocked with status 403.
*   **Code Inspection of Deletion Safety Rules (`src/app/api/empresas/[id]/route.ts` & `src/services/EmpresasService.ts`):**
    *   *Self-deletion block:* Gated in route:
        ```typescript
        if (id === adminEmpresaId) {
          return NextResponse.json(
            { error: 'No puedes eliminar tu propia empresa' },
            { status: 400 }
          );
        }
        ```
    *   *Associated users/products block:* Gated in service (lines 88-100):
        ```typescript
        const usuariosCount = await prisma.usuario.count({ where: { empresaId: id } });
        if (usuariosCount > 0) {
          throw new AppError('No se puede eliminar la empresa porque tiene usuarios asociados', 400);
        }
        const productosCount = await prisma.producto.count({ where: { empresaId: id } });
        if (productosCount > 0) {
          throw new AppError('No se puede eliminar la empresa porque tiene productos asociados', 400);
        }
        ```
    *   *Cascading deletions:* `prisma/schema.prisma` shows that other models (e.g., `Categoria`, `Venta`, `Cotizacion`, `Auditoria`, `Proveedor`, `OrdenCompra`, `Movimiento`) have `onDelete: Cascade` defined.

---

## 2. Logic Chain

1. **Authorization Verification:** `esAdmin()` checks if the active user role is `ADMIN` and status is `ACTIVO`. The API routes require `esAdmin()` before any execution. Thus, only active admin users can interact with these routes.
2. **Global Tenant Leakage:** While other modules isolate records using the user's `empresaId`, `/api/empresas` and `/api/empresas/[id]` are not tenant-bound. Any admin user belonging to *any* company can view and delete *other* companies (so long as the target company ID doesn't match their own session's `empresaId`). This represents a tenant isolation breach at the SaaS administrative level.
3. **Database Cascading Side-Effects:** Since database constraints use `onDelete: Cascade`, deleting a company via `/api/empresas/[id]` will silently delete categories, audit logs, sales, quotations, movements, and suppliers. The deletion guard only prevents delete if *users* or *products* are present, meaning compliance data (e.g., audit trails) will be silently purged, risking loss of transaction history.
4. **Validation Vulnerability:** The service relies on type checks mapping non-string values to `undefined` for updates. Consequently, sending `{ nombre: null }` results in a no-op 200 OK update, whereas sending `{ nombre: "" }` results in a 400 error, which is inconsistent.

---

## 3. Caveats

*   **Database state conflicts:** The concurrent test suite execution fails due to static IDs and dirty records. Tests were verified in isolated logs, but a clean database reset command (e.g., `npx prisma db push --force-reset`) was not executed.
*   **Build Lock:** The Next.js build failed solely due to a lock file conflict, which suggests another development server process was running in the workspace during execution.

---

## 4. Conclusion & Adversarial Review

### Challenge Report

**Overall risk assessment**: **HIGH**

#### [High Challenge] Tenant Isolation Bypass on Company Endpoints
*   **Assumption challenged:** Only global/super-admins should manage tenant companies.
*   **Attack scenario:** Admin A from Company A issues a `DELETE /api/empresas/<Company B ID>` request. Since Admin A is an active admin, and the target ID matches Company B (not their own), the request passes and Company B is completely deleted.
*   **Blast radius:** Immediate, cross-tenant data loss of another company's entire database footprint.
*   **Mitigation:** Restrict the endpoints to a system-wide global administrator (e.g. verified via specific system environment emails or a separate `SUPER_ADMIN` role).

#### [Medium Challenge] Silent Cascade Purge of Compliance & Audit Logs
*   **Assumption challenged:** Companies can be safely deleted if they have no users or products.
*   **Attack scenario:** Deleting a company with existing transactions, orders, and audits triggers a Cascade delete in the database, purging transaction and audit logs.
*   **Blast radius:** Irreversible loss of financial and security audit records, violating data preservation compliance.
*   **Mitigation:** Add checks for `Venta`, `Cotizacion`, and `Auditoria` counts, blocking deletion if transactions or logs are present, or use soft-deletes.

#### [Low Challenge] Server Crash (500 Error) on Invalid JSON payloads
*   **Assumption challenged:** Requests always send valid JSON.
*   **Attack scenario:** An empty body or malformed payload sent to POST or PUT throws a syntax error inside `request.json()`, returning a 500 status code.
*   **Blast radius:** API leaks server errors instead of a clean 400 Bad Request.
*   **Mitigation:** Safe-parse request payload using `.catch(() => ({}))`.

#### [Low Challenge] Null Payload Update Bypass (No-Op instead of Validation Failure)
*   **Assumption challenged:** Inputs are always well-typed strings.
*   **Attack scenario:** An admin sends a PUT request with `{ nombre: null }`. `actualizar` maps it to `undefined`, bypassing the empty-string validation check and returning 200 OK without making any change.
*   **Blast radius:** Inconsistent validation interface.
*   **Mitigation:** Throw 400 if `nombre` is present in the payload but is not a string.

---

## 5. Verification Method

1.  **Execute the target unit test suites in isolation:**
    ```bash
    npx jest src/__tests__/services/EmpresasService.test.ts src/__tests__/api/empresas.test.ts --runInBand
    ```
    *Verification Condition:* All 25 tests inside these two files must return green/pass.
2.  **Verify build lock resolution:**
    Ensure no Next.js build or dev process is running, remove `.next/lock` if stale, and execute:
    ```bash
    npm run build
    ```
    *Verification Condition:* The build should complete successfully (exit 0).
