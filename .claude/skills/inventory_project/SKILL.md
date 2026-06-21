```markdown
# inventory_project Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches you the core development patterns, coding conventions, and workflows used in the `inventory_project` TypeScript codebase. The repository is focused on inventory management, using TypeScript without a major frontend or backend framework. It features clear code organization, conventional commits, service-oriented architecture, and robust testing with Jest. The project also uses Prisma for database management and emphasizes documentation and maintainability.

## Coding Conventions

- **Language:** TypeScript
- **File Naming:** Use camelCase for file names.
  - Example: `stockService.ts`, `ventasService.ts`
- **Import Style:** Use aliases for imports.
  ```typescript
  import { StockService } from '@/services/stockService';
  ```
- **Export Style:** Prefer named exports.
  ```typescript
  // stockService.ts
  export class StockService { ... }

  // usage
  import { StockService } from '@/services/stockService';
  ```
- **Commit Messages:** Use [Conventional Commits](https://www.conventionalcommits.org/).
  - Prefixes: `fix:`, `docs:`, `feat:`, `chore:`, `test:`, `refactor:`
  - Example: `feat: add stock adjustment endpoint`

## Workflows

### Service Extraction or Implementation
**Trigger:** When refactoring logic into a dedicated service or adding a new service class.  
**Command:** `/extract-service`

1. Create or update a service file in `src/services` (e.g., `StockService.ts`).
2. Add or update the corresponding test file in `__tests__` (e.g., `StockService.test.ts`).
3. Update API route or other files to use the new service (if needed).

**Example:**
```typescript
// src/services/stockService.ts
export class StockService {
  // service methods
}

// __tests__/stockService.test.ts
import { StockService } from '@/services/stockService';
describe('StockService', () => { /* tests */ });
```

---

### Database Schema Change with Migration
**Trigger:** When adding or changing a database table, enum, or field.  
**Command:** `/db-migration`

1. Edit `prisma/schema.prisma` to update the schema.
2. Generate a new migration in `prisma/migrations`.
   ```sh
   npx prisma migrate dev --name <migration-name>
   ```
3. Update `prisma/seed.ts` or related files for new/changed data.
4. Update affected API route files in `src/app/api`.
5. Regenerate Prisma client if needed:
   ```sh
   npx prisma generate
   ```

---

### Documentation Spec or Plan Update
**Trigger:** When documenting a new feature, refactor, or implementation plan.  
**Command:** `/add-doc-spec`

1. Create or update a spec or plan markdown file in `docs/superpowers/specs` or `docs/superpowers/plans`.
   - Example: `docs/superpowers/specs/inventory-adjustment.md`

---

### Test Fix or Cleanup
**Trigger:** When improving test reliability, fixing tests, or cleaning up test-related code.  
**Command:** `/fix-tests`

1. Edit test files in `__tests__` (e.g., fix assertions, remove dead code).
2. Remove or update related code in `src/lib` as needed.
3. Update test database setup files (e.g., `test-db.mjs`) if necessary.

---

## Testing Patterns

- **Framework:** Jest
- **Test File Pattern:** `*.test.ts` in the `__tests__` directory.
- **Structure:** Tests import modules using aliases and test public APIs of services or utilities.
  ```typescript
  // __tests__/ventasService.test.ts
  import { VentasService } from '@/services/ventasService';

  describe('VentasService', () => {
    it('should calculate total sales', () => {
      // test implementation
    });
  });
  ```
- **Test Database:** Use setup files (e.g., `test-db.mjs`) for test data initialization.

## Commands

| Command           | Purpose                                                        |
|-------------------|----------------------------------------------------------------|
| /extract-service  | Extract or implement a new service class with tests            |
| /db-migration     | Update database schema, generate migration, and update routes  |
| /add-doc-spec     | Add or update a documentation spec or implementation plan      |
| /fix-tests        | Fix or clean up tests and related test utilities               |
```