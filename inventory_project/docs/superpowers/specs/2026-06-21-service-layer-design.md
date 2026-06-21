# Spec: Service Layer & Clean Architecture

## 1. Overview
The goal of this restructuring is to extract business logic, validation, and database operations currently residing inside the Next.js API Routes (`src/app/api/...`) and move them into a dedicated Service Layer (`src/services/`). This enables code reusability, better testability, and framework independence.

## 2. Architecture & Pattern
- **Pattern:** Singleton Objects (`export const EntityService = { ... }`).
- **Data Flow:** 
  `Client -> Next.js API Route / Server Action -> Controller (optional) -> Service -> Prisma ORM -> Database`.
- **Error Handling:** Services will throw `AppError` when a business rule fails (e.g., 400 Bad Request) or a resource is not found (e.g., 404). The API route will catch these errors using a generic wrapper or try/catch and format the response.

## 3. Services to Implement

### 3.1 `MovimientosService`
- **Path:** `src/services/MovimientosService.ts`
- **Responsibilities:** 
  - Register new movements (entry/exit).
  - Use `StockService` to validate stock availability against reservations before exits.
  - Revalidate cache (`revalidatePath`) and trigger `AuditoriaService`.
  - Handle Bulk Deletions safely.

### 3.2 `CotizacionesService`
- **Path:** `src/services/CotizacionesService.ts`
- **Responsibilities:**
  - Create quotes and calculate totals.
  - Convert quotes to sales (interacts with `VentasService`).
  - Cancel quotes and release reserved stock.

### 3.3 `ProductosService`
- **Path:** `src/services/ProductosService.ts`
- **Responsibilities:**
  - Product CRUD (Create, Read, Update, Delete).
  - Bulk deletions and constraint validations (e.g., can't delete a product with active movements).
  - Code generation logic (`sugerir-codigo`).

### 3.4 `CategoriasService`
- **Path:** `src/services/CategoriasService.ts`
- **Responsibilities:**
  - Category CRUD.
  - Validate before delete (e.g., can't delete category with products).

## 4. API Route Thinning
Existing routes like `src/app/api/movimientos/route.ts` will be reduced to simple controllers:
1. Validate authentication/permissions (`obtenerSesion`).
2. Parse request body (`req.json()`).
3. Call `EntityService.method()`.
4. Catch `AppError` and return HTTP Status Response.

## 5. Testing
The integration tests we recently wrote will naturally cover the integration between the API routes and the new Services without needing to change much, since the test inputs/outputs remain exactly the same.
