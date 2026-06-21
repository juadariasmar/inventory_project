# Clean Code Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the codebase to eliminate duplicates, remove dead code, and centralize business logic into services while fixing test open handles.

**Architecture:** We are creating a Service Layer for backend logic, shared Components for the frontend UI, and configuring Neon database adapters properly.

**Tech Stack:** Next.js, Prisma, PostgreSQL (Neon), Jest, React

## Global Constraints
- Target directory: `C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project\inventory_project`
- Must use TDD (Red-Green-Refactor) for new modules.

---

### Task 1: Fix Test Open Handles & Clean Dead Code

**Files:**
- Modify: `inventory_project/inventory_project/__tests__/inventario.test.ts`
- Modify: `inventory_project/inventory_project/src/lib/permisos.ts`
- Modify: `inventory_project/inventory_project/src/lib/analisis.ts`
- Delete: `inventory_project/inventory_project/test-db.mjs`

**Interfaces:**
- Consumes: Prisma Client
- Produces: Clean test execution

- [ ] **Step 1: Modify tests to fix Open Handles**
```typescript
// Append this to inventory_project/inventory_project/__tests__/inventario.test.ts
import { prisma } from '../src/lib/db'
afterAll(async () => {
  await prisma.$disconnect()
})
```

- [ ] **Step 2: Remove unused exports**
Delete `requerirSesion`, `requerirRol`, `obtenerPermisos`, `requerirPermiso` from `src/lib/permisos.ts`.
Delete `obtenerAltaRotacion`, `obtenerStockCritico`, `obtenerResumenMovimientos`, `obtenerInventarioGeneral`, `obtenerVentasPorDia`, `obtenerVentasPorCategoria`, `obtenerDistribucionStock` from `src/lib/analisis.ts`.
Run `rm test-db.mjs` from terminal.

- [ ] **Step 3: Run tests to verify**
Run: `npm run test -- --detectOpenHandles`
Expected: PASS with no open handle warnings.

- [ ] **Step 4: Commit**
```bash
git add __tests__/inventario.test.ts src/lib/permisos.ts src/lib/analisis.ts test-db.mjs
git commit -m "test: fix open handles and remove dead code"
```

### Task 2: Implement AppError

**Files:**
- Create: `inventory_project/inventory_project/src/lib/AppError.ts`
- Create: `inventory_project/inventory_project/__tests__/AppError.test.ts`

- [ ] **Step 1: Write the failing test**
```typescript
import { AppError } from '../src/lib/AppError'

test('AppError sets message and statusCode correctly', () => {
  const error = new AppError('Stock Insuficiente', 400)
  expect(error.message).toBe('Stock Insuficiente')
  expect(error.statusCode).toBe(400)
  expect(error).toBeInstanceOf(Error)
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test __tests__/AppError.test.ts`
Expected: FAIL "Cannot find module"

- [ ] **Step 3: Write minimal implementation**
```typescript
export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message)
    this.name = 'AppError'
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test __tests__/AppError.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/AppError.ts __tests__/AppError.test.ts
git commit -m "feat: implement AppError class"
```

### Task 3: Implement Database Adapters (Neon)

**Files:**
- Modify: `inventory_project/inventory_project/src/lib/db.ts`

- [ ] **Step 1: Write minimal implementation**
```typescript
import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws
const connectionString = process.env.DATABASE_URL || ''
const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)

const prismaGlobal = global as unknown as { prisma: PrismaClient }

export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({ adapter, log: ['error'] })

if (process.env.NODE_ENV !== 'production') prismaGlobal.prisma = prisma
```

- [ ] **Step 2: Run tests to verify connections still work**
Run: `npm run test`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/lib/db.ts
git commit -m "feat: configure neon serverless adapters"
```

### Task 4: Extract StockService

**Files:**
- Create: `inventory_project/inventory_project/src/services/StockService.ts`
- Create: `inventory_project/inventory_project/__tests__/StockService.test.ts`

- [ ] **Step 1: Write the failing test**
```typescript
import { StockService } from '../src/services/StockService'
import { AppError } from '../src/lib/AppError'

test('validarDisponibilidad throws AppError if stock is insufficient', () => {
  expect(() => {
    StockService.validarDisponibilidad({ id: 1, cantidad: 5, nombre: 'A', precio: 10, codigo: '123' }, 10, 0)
  }).toThrow(AppError)
})
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test __tests__/StockService.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**
```typescript
import { AppError } from '../lib/AppError'

export const StockService = {
  validarDisponibilidad(producto: any, solicitada: number, reservada: number) {
    const disponible = Math.max(0, producto.cantidad - reservada)
    if (solicitada > disponible) {
      throw new AppError(`Stock insuficiente para "${producto.nombre}". Solicitas ${solicitada}, disponible ${disponible}.`, 400)
    }
    return true;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test __tests__/StockService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/services/StockService.ts __tests__/StockService.test.ts
git commit -m "feat: extract StockService"
```

### Task 5: Refactor Ventas API to VentasService

**Files:**
- Create: `inventory_project/inventory_project/src/services/VentasService.ts`
- Modify: `inventory_project/inventory_project/src/app/api/ventas/route.ts`

- [ ] **Step 1: Write implementation for VentasService**
```typescript
// src/services/VentasService.ts
import { prisma } from '../lib/db'
import { StockService } from './StockService'
import { obtenerReservasPorProducto } from '../lib/reservas'
import { AppError } from '../lib/AppError'

export const VentasService = {
  async registrarVenta(consolidados: Map<number, number>, vendedorId: number | null, notas: string) {
    return await prisma.$transaction(async (tx) => {
      const productosIds = Array.from(consolidados.keys())
      const productos = await tx.producto.findMany({ where: { id: { in: productosIds } } })
      const mapaProductos = new Map(productos.map((p) => [p.id, p]))
      const reservas = await obtenerReservasPorProducto(productosIds, tx as any)

      const itemsValidados = []
      for (const [productoId, cantidad] of consolidados.entries()) {
        const p = mapaProductos.get(productoId)
        if (!p) throw new AppError(`Producto no encontrado: ${productoId}`, 404)
        const reservado = reservas.get(productoId) ?? 0
        StockService.validarDisponibilidad(p, cantidad, reservado)
        itemsValidados.push({ productoId: p.id, cantidad, precio: p.precio, nombre: p.nombre, codigo: p.codigo })
      }

      const total = itemsValidados.reduce((s, it) => s + it.precio * it.cantidad, 0)
      const venta = await tx.venta.create({ data: { vendedorId, notas, items: { create: itemsValidados } } })
      
      for (const it of itemsValidados) {
        await tx.producto.update({ where: { id: it.productoId }, data: { cantidad: { decrement: it.cantidad } } })
      }
      return { venta, itemsValidados, total }
    })
  }
}
```

- [ ] **Step 2: Modify route.ts to catch AppError**
```typescript
// src/app/api/ventas/route.ts
// Replace existing POST implementation with thin controller calling VentasService
// catch(error) { if(error instanceof AppError) return NextResponse.json({error: error.message}, {status: error.statusCode}) ... }
```

- [ ] **Step 3: Run tests to verify**
Run: `npm run test`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/services/VentasService.ts src/app/api/ventas/route.ts
git commit -m "refactor: extract VentasService"
```
