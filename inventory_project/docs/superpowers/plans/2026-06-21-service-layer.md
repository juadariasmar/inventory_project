# Service Layer & Clean Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract business logic from API routes into standalone Service Singletons (MovimientosService, ProductosService, CategoriasService) to enforce Clean Architecture.

**Architecture:** Use Singleton Objects (`export const EntityService = { ... }`). Data flows from Next.js App Router (Controllers) into Services, which execute Prisma transactions and throw `AppError` on rule violations.

**Tech Stack:** Next.js App Router, Prisma ORM, Jest.

## Global Constraints

- Must use TDD (Red-Green-Refactor) for new modules.
- Must maintain all existing tests passing.
- Keep the `export const ServiceName = { ... }` pattern.
- Must throw `AppError` with status code for controlled HTTP errors.

---

### Task 1: Create CategoriasService and Thin API Route

**Files:**
- Create: `src/services/CategoriasService.ts`
- Modify: `src/app/api/categorias/route.ts`

**Interfaces:**
- Produces: `CategoriasService.obtenerTodos()`, `CategoriasService.crear(data)`

- [ ] **Step 1: Write minimal CategoriasService**

```typescript
import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';

export const CategoriasService = {
  async obtenerTodos() {
    return await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' }
    });
  },
  
  async crear(data: { nombre: string; descripcion?: string | null; prefijo: string }) {
    if (!data.nombre || !data.prefijo) {
      throw new AppError('El nombre y el prefijo son obligatorios', 400);
    }
    return await prisma.categoria.create({ data });
  }
};
```

- [ ] **Step 2: Update the API route (GET and POST)**

```typescript
import { NextResponse } from 'next/server';
import { CategoriasService } from '@/services/CategoriasService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, tienePermiso } from '@/lib/permisos';

export async function GET() {
  try {
    const session = await obtenerSesion();
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const categorias = await CategoriasService.obtenerTodos();
    return NextResponse.json(categorias);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await obtenerSesion();
    if (!session || !tienePermiso(session, 'gestionar_categorias')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const categoria = await CategoriasService.crear(data);
    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al crear la categoría' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run existing tests to verify nothing broke**

Run: `npm run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/CategoriasService.ts src/app/api/categorias/route.ts
git commit -m "refactor: extract CategoriasService"
```

---

### Task 2: Create ProductosService and Thin API Route

**Files:**
- Create: `src/services/ProductosService.ts`
- Modify: `src/app/api/productos/route.ts`

**Interfaces:**
- Produces: `ProductosService.crear(data)`

- [ ] **Step 1: Write ProductosService**

```typescript
import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';

export const ProductosService = {
  async crear(data: any) {
    if (!data.nombre || !data.codigo || data.precio === undefined || data.cantidad === undefined || !data.categoriaId) {
      throw new AppError('Faltan campos obligatorios', 400);
    }

    const existeCodigo = await prisma.producto.findUnique({
      where: { codigo: data.codigo }
    });

    if (existeCodigo) {
      throw new AppError('El código de producto ya existe', 400);
    }

    return await prisma.producto.create({ data });
  }
};
```

- [ ] **Step 2: Update the API route (POST)**

```typescript
import { NextResponse } from 'next/server';
import { ProductosService } from '@/services/ProductosService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, tienePermiso } from '@/lib/permisos';

export async function POST(request: Request) {
  try {
    const session = await obtenerSesion();
    if (!session || !tienePermiso(session, 'gestionar_inventario')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const producto = await ProductosService.crear(data);
    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run existing tests**

Run: `npm run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/ProductosService.ts src/app/api/productos/route.ts
git commit -m "refactor: extract ProductosService"
```

---

### Task 3: Create MovimientosService and Thin API Route

**Files:**
- Create: `src/services/MovimientosService.ts`
- Modify: `src/app/api/movimientos/route.ts`

**Interfaces:**
- Consumes: `StockService` from `src/services/StockService.ts`

- [ ] **Step 1: Write MovimientosService**

```typescript
import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';
import { StockService } from './StockService';

export const MovimientosService = {
  async registrarMovimiento(data: any, usuarioId: number, ip: string) {
    const { productoId, tipo, cantidad, motivo } = data;
    
    if (!productoId || !tipo || !cantidad) {
      throw new AppError('Faltan datos obligatorios', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: productoId }
      });

      if (!producto) {
        throw new AppError('Producto no encontrado', 404);
      }

      if (tipo === 'salida') {
        const reservas = await tx.itemCotizacion.aggregate({
          where: {
            productoId: producto.id,
            cotizacion: { estado: 'ACTIVA' }
          },
          _sum: { cantidad: true }
        });
        const stockReservado = reservas._sum.cantidad || 0;
        
        StockService.validarDisponibilidad(producto, cantidad, stockReservado);
      }

      const movimiento = await tx.movimiento.create({
        data: { productoId, tipo, cantidad, motivo, usuarioId }
      });

      const ajuste = tipo === 'entrada' ? cantidad : -cantidad;
      await tx.producto.update({
        where: { id: productoId },
        data: { cantidad: producto.cantidad + ajuste }
      });

      await tx.auditoria.create({
        data: {
          usuarioId,
          accion: 'CREAR_MOVIMIENTO',
          entidad: 'Movimiento',
          entidadId: movimiento.id,
          detalles: `Movimiento de ${tipo} de ${cantidad} unidades para producto ${producto.codigo}`,
          ipAddress: ip
        }
      });

      return movimiento;
    });
  }
};
```

- [ ] **Step 2: Update API Route (POST)**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { MovimientosService } from '@/services/MovimientosService';
import { AppError } from '@/lib/AppError';
import { obtenerSesion, tienePermiso } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const session = await obtenerSesion();
    if (!session || !tienePermiso(session, 'gestionar_inventario')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const ip = extraerIp(request);
    
    const movimiento = await MovimientosService.registrarMovimiento(data, parseInt(session.user.id), ip);
    
    revalidatePath('/movimientos');
    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Test integration**

Run: `npm run test -- src/__tests__/api/movimientos.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/services/MovimientosService.ts src/app/api/movimientos/route.ts
git commit -m "refactor: extract MovimientosService"
```
