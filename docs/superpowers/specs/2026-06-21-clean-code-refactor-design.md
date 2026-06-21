# Clean Code and Safe Security Refactor Design

## Overview
This document specifies the architectural restructuring of the Inventory Project. The primary goals are to eliminate 54 code clones (as reported by `jscpd`), remove dead code and configurations (as reported by `knip`), and ensure tests run cleanly without open handles, aligning with Clean Code practices.

## 1. Backend Service Layer Architecture
Currently, API routes (e.g., `src/app/api/ventas/route.ts`) contain both HTTP handling and complex business/transactional logic.

### Structural Changes
Create a `src/services/` directory to house domain logic:
- **`VentasService.ts`**: Handles creation, validation, and processing of sales.
- **`CotizacionesService.ts`**: Handles quotation generation and management.
- **`MovimientosService.ts`**: Handles inventory movements (entries and adjustments).
- **`StockService.ts`**: A shared utility service for atomic operations (increment/decrement) and stock availability validation.

### API Route Refactor
API routes will become "thin controllers". They will only:
1. Parse and validate the incoming HTTP request.
2. Delegate to the corresponding Service.
3. Return the formatted HTTP Response.

## 2. Frontend Abstractions
UI components currently duplicate presentation and state logic.

### Structural Changes
- **`<FiltrosBase>` Component**: Unify `FiltrosAuditoria` and `FiltrosVentas` into a single customizable component that accepts field configurations via props.
- **`<ListaBaseFiltrable>` Component**: Unify the visual lists that handle pagination and tabular data display.
- **Hooks**: Create `useFormularioInventario()` to extract form state, submission logic, and generic error handling shared between `FormularioMovimiento`, `FormularioProducto`, and others.

## 3. Dead Code Elimination
Based on the `knip` report, we will remove orphaned code to reduce maintenance overhead.
- **Unused Files**: Delete `test-db.mjs`.
- **Ghost Dependencies**: Remove `@neondatabase/serverless`, `@prisma/adapter-neon`, and `ws` from `package.json` unless a valid use case for Edge environments is confirmed.
- **Unused Exports**: Clean up exported functions and types in `lib/permisos.ts`, `lib/analisis.ts`, and `lib/codigos.ts` that have no consumers.

## 4. Stability and Testing
- **Test Teardown**: Address the Jest "Open Handles" warning by ensuring the global Prisma instance is disconnected in an `afterAll()` block within the test setup.
- **TDD Requirement**: As required by the TDD skill, new helper structures or services must be validated through tests first.

## Scope Limits
This refactor does **not** include redesigning the entire Next.js routing structure or database schema. It focuses solely on extracting existing, proven logic into cleaner abstractions.
