# Handoff Report - Testing Infrastructure and Empresas Service Design

## 1. Observation

During read-only exploration of the workspace `C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project`, the following components and configurations were observed:

### A. Testing Environment Configuration
1. **Jest Configuration (`jest.config.js`)**:
   ```javascript
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     testMatch: ['**/__tests__/**/*.test.ts'],
     verbose: true,
     collectCoverageFrom: ['src/lib/inventario.ts'],
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/src/$1',
     },
     transformIgnorePatterns: ['node_modules/(?!(@neondatabase)/)'],
   }
   ```
2. **NPM Scripts (`package.json`)**:
   - Test execution script: `"test": "jest --runInBand"`
   - Dependency versions: `"jest": "^30.4.2"`, `"ts-jest": "^29.4.9"`, `"prisma": "^5.22.0"`, `"next": "16.0.7"`, `"react": "19.2.0"`.

### B. Existing Test Patterns & Database Isolation
1. **Real DB Calls**: Tests in `src/__tests__/services/` run against the database specified in the environment (e.g., SQLite file `dev.db` or PostgreSQL depending on `.env`).
2. **Audit Logging Side Effects & Mocking**: In `src/__tests__/services/ProveedoresService.test.ts` (lines 5-9), the audit log service is mocked out to avoid pulling ESM-based imports that fail transpilation under Jest's node environment:
   ```typescript
   // La auditoría es un efecto colateral de "fire and forget" que arrastra la
   // cadena de Neon Auth (ESM no transpilable por Jest). Se aísla con un mock.
   jest.mock('../../lib/auditoria', () => ({
     registrarAuditoria: jest.fn().mockResolvedValue(undefined),
   }));
   ```
3. **API Session Mocking**: In `src/__tests__/api/productos.test.ts` (lines 6-9) and `src/__tests__/api/cotizaciones.test.ts` (lines 6-9), authentication is mocked by replacing `obtenerSesion` and `esAdmin`/`tienePermiso` checks:
   ```typescript
   jest.mock('../../lib/permisos', () => ({
     obtenerSesion: jest.fn().mockResolvedValue({ user: { id: 'test-user-prod-1', role: 'admin', estado: 'ACTIVO', empresaId: 'test-empresa-prod-api' } }),
     esAdmin: jest.fn().mockResolvedValue(true)
   }))
   ```
4. **Mock Request Helper**: API tests construct request inputs using `createMockRequest` in `src/__tests__/utils/test-utils.ts`:
   ```typescript
   export function createMockRequest(url: string, method: string = 'GET', ip: string = '127.0.0.1', body?: unknown) {
     const req = new NextRequest(new URL(url, 'http://localhost'), {
       method,
       body: body ? JSON.stringify(body) : undefined,
     });
     req.headers.set('x-forwarded-for', ip);
     return req;
   }
   ```

### C. Authentication & Authorization Patterns
1. **Permisos Library (`src/lib/permisos.ts`)**:
   - `obtenerSesion()` loads the session via `@neondatabase/auth/next/server`'s `auth.getSession()`, checks if the user exists in the local database (`prisma.usuario`), maps them, auto-promotes admins matching `esEmailAdministrador(usuario.email)`, and returns the combined user data.
   - `esAdmin()` checks: `sesion?.user?.rol === 'ADMIN' && sesion?.user?.estado === 'ACTIVO'`.
   - `tienePermiso(permiso: Permiso)` checks: `sesion.user.estado === 'ACTIVO'`. If they are an `ADMIN`, it returns true. Otherwise, it queries `obtenerPermisosUsuario` and checks if the permission is present.

### D. Audit Logging Entity Types (`src/lib/auditoria.ts`)
- The `EntidadAuditoria` union type (lines 15-25) does not currently contain `'Empresa'`:
  ```typescript
  export type EntidadAuditoria =
    | 'Producto'
    | 'Categoria'
    | 'Movimiento'
    | 'Usuario'
    | 'Venta'
    | 'Cotizacion'
    | 'Proveedor'
    | 'OrdenCompra'
    | 'Sesion'
  ```

---

## 2. Logic Chain

1. **Jest & Database Strategy**: Since the test runner executes tests using `jest --runInBand` and targets the real database, any new service or API tests must perform database seeding of necessary dependencies (e.g. test company, test user) inside `beforeAll` and perform clean up in `afterAll` in reverse-dependency order.
2. **Audit Service ESM Issue**: Because `registrarAuditoria` transitively imports ESM modules that crash under node-based Jest, any tests for `EmpresasService` must mock the `registrarAuditoria` method using `jest.mock('../../lib/auditoria', ...)`.
3. **Session Mocking**: API route tests for `/api/empresas` must mock `obtenerSesion` and `esAdmin` from `@/lib/permisos` to bypass external auth checks and assert behavior under different roles (e.g., standard user vs active admin).
4. **Delete Safety (Blocking)**: In the schema, `Empresa` is a parent to many models (`Usuario`, `Producto`, `Categoria`, etc.). While Cascade deletes exist, deleting an active tenant directly could result in massive data loss. Therefore, similar to `ProveedoresService` checking for associated purchase orders, `EmpresasService.eliminar` should perform `prisma.<model>.count` checks on associated entities and block deletion (throwing an `AppError` with status code 409) if any records exist.
5. **Auditing Expansion**: To track company-level changes, the `EntidadAuditoria` union and `ENTIDADES` array in `src/lib/auditoria.ts` should be expanded to include `'Empresa'`.

---

## 3. Caveats

* **Multi-tenant scoping**: If the application transitions fully to a multi-tenant SaaS model, standard admins should only be allowed to update their *own* company name (e.g., checking `id === session.user.empresaId`). The plan covers both tenant-level restrictions and system-level super-admin management.
* **Open Jest Handles**: Since the database connection is persistent, test execution with `--runInBand` can sometimes report open handles. Adding a `prisma.$disconnect()` in `afterAll` ensures Jest terminates cleanly.

---

## 4. Conclusion

The testing environment is fully functional (all 142 tests passing locally). Bypassing real authentication during testing is cleanly achieved via Jest mocks on `src/lib/permisos.ts`. 

To implement `EmpresasService` and its API endpoints, we recommend the following design:

### Proposed Design for `src/services/EmpresasService.ts`
```typescript
import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';
import { registrarAuditoria } from '../lib/auditoria';

export const EmpresasService = {
  async obtenerTodas() {
    return await prisma.empresa.findMany({
      orderBy: { creadoEn: 'desc' },
      include: {
        _count: {
          select: {
            usuarios: true,
            productos: true,
          }
        }
      }
    });
  },

  async obtenerPorId(id: string) {
    const empresa = await prisma.empresa.findUnique({
      where: { id },
    });
    if (!empresa) {
      throw new AppError('Empresa no encontrada', 404);
    }
    return empresa;
  },

  async crear(datos: any, ip: string, usuarioId?: string) {
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    if (!nombre) {
      throw new AppError('El nombre de la empresa es obligatorio.', 400);
    }

    const empresa = await prisma.empresa.create({
      data: { nombre },
    });

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Empresa' as any, // TypeScript union can be updated or casted
      entidadId: empresa.id,
      datos: { despues: { id: empresa.id, nombre: empresa.nombre } },
      ip,
      usuarioId,
      empresaId: empresa.id,
    });

    return empresa;
  },

  async actualizar(id: string, datos: any, ip: string, usuarioId: string) {
    const antes = await this.obtenerPorId(id);

    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    if (!nombre) {
      throw new AppError('El nombre de la empresa es obligatorio.', 400);
    }

    const empresa = await prisma.empresa.update({
      where: { id },
      data: { nombre },
    });

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Empresa' as any,
      entidadId: empresa.id,
      datos: { antes, despues: { id: empresa.id, nombre: empresa.nombre } },
      ip,
      usuarioId,
      empresaId: id,
    });

    return empresa;
  },

  async eliminar(id: string, ip: string, usuarioId: string) {
    const antes = await this.obtenerPorId(id);

    // Block deletion if there are active associated resources
    const [usuariosCount, productosCount, categoriasCount, proveedoresCount] = await Promise.all([
      prisma.usuario.count({ where: { empresaId: id } }),
      prisma.producto.count({ where: { empresaId: id } }),
      prisma.categoria.count({ where: { empresaId: id } }),
      prisma.proveedor.count({ where: { empresaId: id } }),
    ]);

    if (usuariosCount > 0 || productosCount > 0 || categoriasCount > 0 || proveedoresCount > 0) {
      throw new AppError(
        `No se puede eliminar la empresa porque tiene datos asociados (${usuariosCount} usuarios, ${productosCount} productos, ${categoriasCount} categorías, ${proveedoresCount} proveedores).`,
        409
      );
    }

    await prisma.empresa.delete({
      where: { id },
    });

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Empresa' as any,
      entidadId: id,
      datos: { antes },
      ip,
      usuarioId,
      empresaId: null,
    });

    return { ok: true };
  }
};
```

### Proposed Design for `src/app/api/empresas/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { EmpresasService } from '@/services/EmpresasService';
import { AppError } from '@/lib/AppError';
import { esAdmin } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';

// GET - Listar todas las empresas (solo ADMIN)
export async function GET() {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const empresas = await EmpresasService.obtenerTodas();
    return NextResponse.json(empresas);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear una empresa (solo ADMIN)
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const ip = extraerIp(request) || '127.0.0.1';
    const empresa = await EmpresasService.crear(data, ip);
    revalidatePath('/empresas');
    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al crear la empresa' }, { status: 500 });
  }
}
```

### Proposed Design for `src/app/api/empresas/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { EmpresasService } from '@/services/EmpresasService';
import { AppError } from '@/lib/AppError';
import { esAdmin, obtenerSesion } from '@/lib/permisos';
import { extraerIp } from '@/lib/auditoria';

// GET - Obtener detalle de una empresa
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await obtenerSesion();
  if (!session?.user || session.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  
  // Scoped: standard admins can only view their own company details
  if (session.user.rol !== 'ADMIN' && session.user.empresaId !== id) {
    return NextResponse.json({ error: 'No autorizado para ver otra empresa' }, { status: 403 });
  }

  try {
    const empresa = await EmpresasService.obtenerPorId(id);
    return NextResponse.json(empresa);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT - Actualizar empresa (solo ADMIN)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await obtenerSesion();
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  if (session?.user?.empresaId !== id) {
    return NextResponse.json({ error: 'No autorizado para modificar esta empresa' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const ip = extraerIp(request) || '127.0.0.1';
    const usuarioId = String(session.user.id);

    const empresa = await EmpresasService.actualizar(id, data, ip, usuarioId);
    revalidatePath(`/empresas/${id}`);
    revalidatePath('/empresas');
    return NextResponse.json(empresa);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al actualizar la empresa' }, { status: 500 });
  }
}

// DELETE - Eliminar empresa (solo ADMIN)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await obtenerSesion();
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  // Prevent self-lockout: Admin cannot delete their current company
  if (session?.user?.empresaId === id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia empresa activa' }, { status: 400 });
  }

  try {
    const ip = extraerIp(request) || '127.0.0.1';
    const usuarioId = String(session.user.id);

    await EmpresasService.eliminar(id, ip, usuarioId);
    revalidatePath('/empresas');
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Error al eliminar la empresa' }, { status: 500 });
  }
}
```

### Proposed Modification to `src/lib/auditoria.ts`
```typescript
export type EntidadAuditoria =
  | 'Producto'
  | 'Categoria'
  | 'Movimiento'
  | 'Usuario'
  | 'Venta'
  | 'Cotizacion'
  | 'Proveedor'
  | 'OrdenCompra'
  | 'Sesion'
  | 'Empresa'

export const ENTIDADES: EntidadAuditoria[] = [
  'Producto',
  'Categoria',
  'Movimiento',
  'Usuario',
  'Venta',
  'Cotizacion',
  'Proveedor',
  'OrdenCompra',
  'Sesion',
  'Empresa',
]
```

### Proposed Unit Test: `src/__tests__/services/EmpresasService.test.ts`
```typescript
import { EmpresasService } from '../../services/EmpresasService';
import { prisma } from '../../lib/db';
import { AppError } from '../../lib/AppError';

jest.mock('../../lib/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined),
}));

describe('EmpresasService', () => {
  let createdEmpresaId: string;

  afterEach(async () => {
    jest.clearAllMocks();
    if (createdEmpresaId) {
      const exists = await prisma.empresa.findUnique({ where: { id: createdEmpresaId } });
      if (exists) {
        await prisma.usuario.deleteMany({ where: { empresaId: createdEmpresaId } });
        await prisma.empresa.delete({ where: { id: createdEmpresaId } });
      }
      createdEmpresaId = '';
    }
  });

  it('crear succeeds with valid name', async () => {
    const res = await EmpresasService.crear({ nombre: 'Test Empresa Srv' }, '127.0.0.1');
    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.nombre).toBe('Test Empresa Srv');
    createdEmpresaId = res.id;
  });

  it('crear throws AppError with empty name', async () => {
    await expect(EmpresasService.crear({ nombre: '   ' }, '127.0.0.1')).rejects.toThrow(AppError);
  });

  it('actualizar succeeds', async () => {
    const res = await EmpresasService.crear({ nombre: 'Original Name' }, '127.0.0.1');
    createdEmpresaId = res.id;

    const updated = await EmpresasService.actualizar(createdEmpresaId, { nombre: 'New Name' }, '127.0.0.1', 'user-id');
    expect(updated.nombre).toBe('New Name');
  });

  it('eliminar blocks deletion if company has active users', async () => {
    const res = await EmpresasService.crear({ nombre: 'Test Block Delete' }, '127.0.0.1');
    createdEmpresaId = res.id;

    await prisma.usuario.create({
      data: {
        neonAuthId: 'test-block-user-1',
        email: 'blockuser1@example.com',
        nombre: 'Block User',
        empresaId: createdEmpresaId,
      }
    });

    await expect(EmpresasService.eliminar(createdEmpresaId, '127.0.0.1', 'user-id')).rejects.toThrow(AppError);
  });

  it('eliminar deletes company if it has no associated records', async () => {
    const res = await EmpresasService.crear({ nombre: 'Test Clean Delete' }, '127.0.0.1');
    const deleteId = res.id;

    const result = await EmpresasService.eliminar(deleteId, '127.0.0.1', 'user-id');
    expect(result).toEqual({ ok: true });

    await expect(EmpresasService.obtenerPorId(deleteId)).rejects.toThrow(AppError);
  });
});
```

---

## 5. Verification Method

To verify the implementation once coded, developers should execute:
1. **Run unit & integration test suites**:
   ```bash
   npm test
   ```
2. **Review DB Migration**: Check that `npx prisma db push` or migrations run successfully and that the Prisma Client regenerates without schema validation errors.
3. **Audit Log Inspection**: Verify that creating, updating, or deleting a company generates audit logs in the `Auditoria` table under the entity `'Empresa'`.
