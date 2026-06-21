# API & Middleware Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement integration and security testing for the API routes and Auth middleware.

**Architecture:** Use Jest with Node test environment to inject mocked `NextRequest` objects directly into route handlers and middleware functions to assert responses and HTTP status codes.

**Tech Stack:** Jest, TypeScript, Next.js App Router (NextRequest/NextResponse)

## Global Constraints

- Must run completely offline without an actual Next.js HTTP server.
- Must use Jest testing framework.

---

### Task 1: Test Utilities

**Files:**
- Create: `src/__tests__/utils/test-utils.ts`

**Interfaces:**
- Produces: `createMockRequest(url: string, method: string, ip?: string, body?: any)`

- [ ] **Step 1: Create test utilities file**

```typescript
// src/__tests__/utils/test-utils.ts
import { NextRequest } from 'next/server';

export function createMockRequest(url: string, method: string = 'GET', ip: string = '127.0.0.1', body?: any) {
  const req = new NextRequest(new URL(url, 'http://localhost'), {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Mock the IP headers for Rate Limiting testing
  req.headers.set('x-forwarded-for', ip);
  return req;
}
```

- [ ] **Step 2: Commit utilities**

```bash
git add src/__tests__/utils/test-utils.ts
git commit -m "test: add mock request utilities"
```

### Task 2: Middleware Security Tests

**Files:**
- Create: `src/__tests__/middleware.test.ts`

**Interfaces:**
- Consumes: `createMockRequest` from `src/__tests__/utils/test-utils.ts`

- [ ] **Step 1: Write rate limiting tests for middleware**

```typescript
// src/__tests__/middleware.test.ts
import { middleware } from '../../src/middleware';
import { createMockRequest } from './utils/test-utils';

describe('Middleware Security Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows normal routes without rate limiting', async () => {
    const req = createMockRequest('/api/productos', 'GET');
    const res = await middleware(req);
    expect(res.status).not.toBe(429);
  });

  it('rate limits login after 5 requests', async () => {
    const ip = '192.168.1.100';
    
    // 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const req = createMockRequest('/api/auth/callback/credentials', 'POST', ip);
      const res = await middleware(req);
      expect(res.status).not.toBe(429);
    }

    // 6th request should fail
    const req6 = createMockRequest('/api/auth/callback/credentials', 'POST', ip);
    const res6 = await middleware(req6);
    expect(res6.status).toBe(429);
    const body = await res6.json();
    expect(body.error).toContain('Demasiados intentos');

    // Wait 60 seconds
    jest.advanceTimersByTime(60000);

    // 7th request should pass again
    const req7 = createMockRequest('/api/auth/callback/credentials', 'POST', ip);
    const res7 = await middleware(req7);
    expect(res7.status).not.toBe(429);
  });
});
```

- [ ] **Step 2: Verify tests pass**

Run: `npm test -- src/__tests__/middleware.test.ts`
Expected: PASS

- [ ] **Step 3: Commit middleware tests**

```bash
git add src/__tests__/middleware.test.ts
git commit -m "test: add rate limit security tests for middleware"
```

### Task 3: Movimientos API Tests

**Files:**
- Create: `src/__tests__/api/movimientos.test.ts`

**Interfaces:**
- Consumes: `createMockRequest` from `src/__tests__/utils/test-utils.ts`

- [ ] **Step 1: Write Movimientos integration tests**

```typescript
// src/__tests__/api/movimientos.test.ts
import { POST } from '../../src/app/api/movimientos/route';
import { createMockRequest } from '../utils/test-utils';
import { prisma } from '../../src/lib/db';

jest.mock('../../src/lib/permisos', () => ({
  obtenerSesion: jest.fn().mockResolvedValue({ user: { id: 1, role: 'admin' } }),
  tienePermiso: jest.fn().mockResolvedValue(true)
}));

describe('Movimientos API', () => {
  let productoId: number;

  beforeAll(async () => {
    const p = await prisma.producto.create({
      data: { nombre: 'Test Prod', codigo: 'TEST-123', cantidad: 10, precio: 100 }
    });
    productoId = p.id;
  });

  afterAll(async () => {
    await prisma.movimiento.deleteMany({ where: { productoId } });
    await prisma.producto.delete({ where: { id: productoId } });
  });

  it('prevents exit movement if stock is insufficient', async () => {
    const req = createMockRequest('/api/movimientos', 'POST', '127.0.0.1', {
      productoId,
      tipo: 'salida',
      cantidad: 50 // more than 10
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('allows entry movement', async () => {
    const req = createMockRequest('/api/movimientos', 'POST', '127.0.0.1', {
      productoId,
      tipo: 'entrada',
      cantidad: 5
    });
    const res = await POST(req as any);
    expect(res.status).toBe(201);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- src/__tests__/api/movimientos.test.ts`
Expected: PASS

- [ ] **Step 3: Commit movimientos tests**

```bash
git add src/__tests__/api/movimientos.test.ts
git commit -m "test: add integration tests for movimientos API"
```

### Task 4: Cotizaciones API Tests

**Files:**
- Create: `src/__tests__/api/cotizaciones.test.ts`

**Interfaces:**
- Consumes: `createMockRequest`

- [ ] **Step 1: Write Cotizaciones integration tests**

```typescript
// src/__tests__/api/cotizaciones.test.ts
import { POST } from '../../src/app/api/cotizaciones/route';
import { createMockRequest } from '../utils/test-utils';
import { prisma } from '../../src/lib/db';

jest.mock('../../src/lib/permisos', () => ({
  obtenerSesion: jest.fn().mockResolvedValue({ user: { id: 1, role: 'admin' } }),
  tienePermiso: jest.fn().mockResolvedValue(true)
}));

describe('Cotizaciones API', () => {
  let productoId: number;

  beforeAll(async () => {
    const p = await prisma.producto.create({
      data: { nombre: 'Test Cotiz', codigo: 'COT-123', cantidad: 5, precio: 100 }
    });
    productoId = p.id;
  });

  afterAll(async () => {
    await prisma.itemCotizacion.deleteMany({ where: { productoId } });
    await prisma.cotizacion.deleteMany({});
    await prisma.producto.delete({ where: { id: productoId } });
  });

  it('prevents quote creation if existing active quotes reserve all stock', async () => {
    // 1. Create first valid quote reserving 5 items (all stock)
    const req1 = createMockRequest('/api/cotizaciones', 'POST', '127.0.0.1', {
      clienteId: null,
      clienteNombre: 'Cliente 1',
      items: [{ productoId, cantidad: 5, precioUnitario: 100 }]
    });
    const res1 = await POST(req1 as any);
    expect(res1.status).toBe(201);

    // 2. Second quote trying to reserve 1 item should fail due to insufficient stock
    const req2 = createMockRequest('/api/cotizaciones', 'POST', '127.0.0.1', {
      clienteId: null,
      clienteNombre: 'Cliente 2',
      items: [{ productoId, cantidad: 1, precioUnitario: 100 }]
    });
    const res2 = await POST(req2 as any);
    expect(res2.status).toBe(400);
    const data = await res2.json();
    expect(data.error).toContain('insuficiente');
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- src/__tests__/api/cotizaciones.test.ts`
Expected: PASS

- [ ] **Step 3: Commit cotizaciones tests**

```bash
git add src/__tests__/api/cotizaciones.test.ts
git commit -m "test: add integration tests for cotizaciones API stock reservation"
```
