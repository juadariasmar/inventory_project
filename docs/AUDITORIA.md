# Auditoría de Seguridad y Rendimiento — inventory_project

**Fecha:** 24 Jun 2026  
**Auditor:** Arquitecto de Software Principal  
**Alcance:** Seguridad, performance, integridad de datos, patrones de código

---

## 🔴 CRÍTICOS

### C1. Admin de cualquier empresa puede acceder a endpoints globales (superadmin)

**Archivo:** `src/app/api/empresas/route.ts`, `src/app/api/empresas/[id]/route.ts`  
**Problema:** Cualquier usuario con `rol === 'ADMIN'` dentro de su propia empresa puede:
- Listar todas las empresas del sistema (`GET /api/empresas`)
- Ver detalle de cualquier empresa (`GET /api/empresas/[id]`)
- Modificar cualquier empresa (`PUT /api/empresas/[id]`)
- Eliminar cualquier empresa excepto la propia (`DELETE /api/empresas/[id]`)

**Causa raíz:** `esAdmin()` en `permisos.ts:58-61` solo verifica `rol === 'ADMIN' && estado === 'ACTIVO'`. No distingue entre "admin de empresa" y "superadmin global". Cualquier admin de cualquier empresa puede operar sobre todas las empresas.

**Fix:** Introducir concepto de superadmin vía `ADMIN_EMAILS` en estos endpoints:

```typescript
// src/lib/permisos.ts — agregar:
export async function esSuperAdmin() {
  const sesion = await obtenerSesion()
  if (!sesion?.user) return false
  return esEmailAdministrador(sesion.user.email)
}
```

```typescript
// src/app/api/empresas/route.ts — cambiar esAdmin() por esSuperAdmin():
export async function GET(_request: NextRequest) {
  if (!(await esSuperAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  // ...
}
```

Aplicar el mismo cambio en `src/app/api/empresas/[id]/route.ts`.

---

### C2. Auto-creación de empresa+admin por cualquier usuario autenticado

**Archivo:** `src/lib/permisos.ts:27-41`  
**Problema:** Si un usuario se autentica en Neon Auth y el webhook no ha llegado, `obtenerSesion()` crea automáticamente una empresa y un usuario `ADMIN` para ese usuario. No hay ningún tipo de verificación, invitación, o lista blanca.

**Impacto:** Cualquier persona con una cuenta de Google puede registrarse y obtener una empresa operativa. Aunque es un diseño intencional de self-signup, permite registro descontrolado.

**Fix:** Agregar una verificación opcional de lista blanca de emails para empresas:

```typescript
// src/lib/permisos.ts — en el bloque fallback, lines 27-41:
if (!usuario) {
  const email = data.user.email || ''
  // Opcional: verificar si el email está en lista blanca de auto-registro
  // Si no está en la lista blanca, rechazar en lugar de crear
  if (process.env.ALLOWLIST_REGISTRO && !esEmailAdministrador(email)) {
    const permitidos = (process.env.ALLOWLIST_REGISTRO || '').split(',').map(e => e.trim())
    if (!permitidos.includes(email)) {
      console.warn(`[Auth] Registro bloqueado para ${email} — no está en ALLOWLIST_REGISTRO`)
      return null
    }
  }
  // ... resto del código existente
}
```

---

### C3. Validación de webhook sin firma HMAC

**Archivo:** `src/services/WebhooksService.ts:13-31`  
**Problema:** La validación del webhook compara el token directamente contra el secreto usando `timingSafeEqual`. Esto significa que el "secreto del webhook" es solo un token estático que debe pasarse como header. No hay firma HMAC del cuerpo del payload, por lo que un atacante con el token puede enviar payloads falsificados.

Además, el webhook no verifica el tipo de evento antes de procesar.

**Fix:** Reemplazar con verificación HMAC-SHA256 del body:

```typescript
// src/services/WebhooksService.ts
import { createHmac, timingSafeEqual } from 'crypto'

export class WebhooksService {
  static async validarFirma(payload: string, signature: string | null): Promise<boolean> {
    const secreto = process.env.NEON_WEBHOOK_SECRET
    if (!secreto) {
      throw new AppError('NEON_WEBHOOK_SECRET no configurado', 500)
    }
    if (!signature) {
      throw new AppError('Firma de webhook inválida', 401)
    }

    const expected = createHmac('sha256', secreto).update(payload).digest('hex')
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new AppError('Firma de webhook inválida', 401)
    }
    return true
  }
}
```

Y en el endpoint del webhook, pasar `request.text()` para obtener el body crudo.

---

## 🟠 ALTOS

### A1. `obtenerTodoAnalisis` — sin paginación, carga todos los productos con subconsultas

**Archivo:** `src/lib/analisis.ts:458-491`  
**Problema:** `obtenerTodoAnalisis` lanza 9 consultas en paralelo, muchas de las cuales cargan todos los productos sin paginación:
- `obtenerInventarioGeneral()` (line 324) — `findMany` de todos los productos con subconsulta de movimientos
- `obtenerStockPorAgotarse()` (line 120) — `findMany` de todos los productos + groupBy de movimientos
- `obtenerStockCritico()` (line 256) — `findMany` de todos los productos + groupBy de movimientos
- `obtenerDistribucionStock()` (line 439) — `findMany` de todos los productos

Con +1000 productos, esto degradará significativamente.

**Fix:** Agregar límite superior y paginación interna:

```typescript
// src/lib/analisis.ts
const MAX_PRODUCTOS_ANALISIS = 500

export async function obtenerInventarioGeneral(empresaId: string): Promise<FilaInventarioGeneral[]> {
  const productos = await prisma.producto.findMany({
    where: { empresaId },
    select: { /* ... */ },
    orderBy: { nombre: 'asc' },
    take: MAX_PRODUCTOS_ANALISIS,  // ← Agregar límite
  })
  // ...
}
```

Aplicar `take: MAX_PRODUCTOS_ANALISIS` en todas las queries de análisis que listan productos.

---

### A2. Índices compuestos faltantes en consultas frecuentes

**Archivo:** `prisma/schema.prisma`  
**Problema:** Varias consultas filtran por `empresaId` + otro campo pero solo hay índice en `empresaId` solo. Para tablas grandes, esto causa seq scans.

**Consultas identificadas sin índice compuesto:**

| Tabla | Filtro de query | Índice actual | Índice necesario |
|-------|----------------|---------------|------------------|
| `Producto` | `empresaId` + `codigo` (unique global pero busca por empresa) | `@@index([empresaId])` | `@@index([empresaId, codigo])` |
| `Movimiento` | `empresaId` + `creadoEn` (order + listados) | `@@index([empresaId])` | `@@index([empresaId, creadoEn(sort: Desc)])` |
| `Venta` | `empresaId` + `creadoEn` (order + analytics) | `@@index([empresaId])`, `@@index([creadoEn])` | `@@index([empresaId, creadoEn(sort: Desc)])` |
| `Auditoria` | `empresaId` + `creadoEn` (listados) | `@@index([empresaId])` | `@@index([empresaId, creadoEn(sort: Desc)])` |
| `Cotizacion` | `empresaId` + `estado` + `validaHasta` (reservas activas) | `@@index([empresaId])`, `@@index([estado])`, `@@index([validaHasta])` | `@@index([empresaId, estado, validaHasta])` |

**Fix:** Agregar índices compuestos en `prisma/schema.prisma`:

```prisma
model Producto {
  // ...
  @@index([empresaId])
  @@index([empresaId, codigo])  // ← Agregar
}

model Movimiento {
  // ...
  @@index([empresaId])
  @@index([empresaId, creadoEn(sort: Desc)])  // ← Agregar
  @@index([ventaId])
  @@index([ordenCompraId])
}

model Venta {
  // ...
  @@index([empresaId])
  @@index([empresaId, creadoEn(sort: Desc)])  // ← Reemplazar index existente
  @@index([vendedorId])
  @@index([canceladaEn])
}

model Auditoria {
  // ...
  @@index([empresaId])
  @@index([empresaId, creadoEn(sort: Desc)])  // ← Reemplazar
  @@index([usuarioId])
  @@index([entidad, entidadId])
  @@index([accion])
}

model Cotizacion {
  // ...
  @@index([empresaId])
  @@index([empresaId, estado, validaHasta])  // ← Reemplazar índices individuales
  @@index([creadoEn(sort: Desc)])
  @@index([vendedorId])
}
```

---

### A3. `obtenerProductosSinMovimientos` y `obtenerInventarioGeneral` — N+1 encubierto

**Archivo:** `src/lib/analisis.ts:175-213`, `324-367`  
**Problema:** En `obtenerProductosSinMovimientos`, se usa `include: { movimientos: { take: 1, orderBy: ... } }`. Prisma traduce esto a una subquery SQL separada por producto. Con N productos, son N+1 queries.

**Fix:** Reemplazar con una query de agregación directa:

```typescript
// src/lib/analisis.ts — reemplazar obtenerProductosSinMovimientos:
export async function obtenerProductosSinMovimientos(empresaId: string): Promise<AlertaSinMovimientos[]> {
  const productos = await prisma.producto.findMany({
    where: { empresaId },
    select: {
      id: true, nombre: true, codigo: true, cantidad: true, precio: true,
    },
  })
  
  // Query única para último movimiento por producto
  const ultimosMovimientos = await prisma.movimiento.groupBy({
    by: ['productoId'],
    where: { empresaId },
    _max: { creadoEn: true },
  })
  const mapaUltimoMov = new Map(ultimosMovimientos.map(m => [m.productoId, m._max.creadoEn]))
  
  const hoy = new Date()
  const alertas: AlertaSinMovimientos[] = []
  for (const p of productos) {
    if (p.cantidad <= 0) continue
    const ultimo = mapaUltimoMov.get(p.id)
    const diasSinMovimiento = ultimo
      ? Math.floor((hoy.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24))
      : DIAS_SIN_MOVIMIENTO + 1
    if (diasSinMovimiento >= DIAS_SIN_MOVIMIENTO) {
      alertas.push({ /* ... */ })
    }
  }
  return alertas.sort((a, b) => b.valorInmovilizado - a.valorInmovilizado)
}
```

Aplicar la misma optimización a `obtenerInventarioGeneral`.

---

### A4. `obtenerVentasPorCategoria` — incluye producto + categoría por cada item

**Archivo:** `src/lib/analisis.ts:408-433`  
**Problema:** La query `prisma.itemVenta.findMany` con `include: { producto: { include: { categoria: true } } }` para TODOS los items de ventas en 30 días puede ser masiva. Con muchas ventas, esto descarga filas innecesarias.

**Fix:** Usar `groupBy` con joins directos:

```typescript
export async function obtenerVentasPorCategoria(empresaId: string, dias = 30, top = 8): Promise<CategoriaVentas[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  desde.setHours(0, 0, 0, 0)

  const resultado = await prisma.itemVenta.groupBy({
    by: ['productoId'],
    where: {
      venta: { empresaId, creadoEn: { gte: desde }, canceladaEn: null },
    },
    _sum: { cantidad: true, subtotal: true },
  })

  // Luego resolver nombres de categoría solo para los productos que aparecen
  const productosIds = resultado.map(r => r.productoId)
  const productos = await prisma.producto.findMany({
    where: { id: { in: productosIds } },
    select: { id: true, categoria: { select: { nombre: true } } },
  })
  // ... agrupar por categoría
}
```

---

### A5. Rate limiting insuficiente

**Archivo:** `src/middleware.ts:22-65`  
**Problema:** El rate limiting solo aplica a `POST /api/auth/`. No hay protección contra fuerza bruta en:
- `POST /api/invitaciones/aceptar` — aceptación de invitaciones
- `PATCH /api/usuarios/onboarding` — completar onboarding
- `POST /api/admin/restablecer` — aunque tiene token, no tiene rate limit
- `POST /api/empresas` — creación de empresas por superadmin
- `POST /api/usuarios` — creación de usuarios

**Fix:** Extender el rate limiting a más endpoints sensibles:

```typescript
// src/middleware.ts
if (
  (request.nextUrl.pathname.includes('/api/auth/') && request.method === 'POST') ||
  (request.nextUrl.pathname === '/api/invitaciones/aceptar' && request.method === 'POST') ||
  (request.nextUrl.pathname === '/api/admin/restablecer' && request.method === 'POST') ||
  (request.nextUrl.pathname === '/api/empresas' && request.method === 'POST') ||
  (request.nextUrl.pathname === '/api/usuarios' && request.method === 'POST')
) {
  // ... aplicar rate limiting
}
```

---

## 🟡 MEDIOS

### M1. `UsuariosService.crearUsuario` usa `pending-${Date.now()}` como neonAuthId

**Archivo:** `src/services/UsuariosService.ts:29`  
**Problema:** Los usuarios creados manualmente por un admin reciben un `neonAuthId` con formato `pending-{timestamp}` que es una violación potencial de unique constraint si se crean dos usuarios en el mismo milisegundo. Y si la invitación no se completa, queda un usuario huérfano que no puede iniciar sesión.

**Fix:** Usar UUID v4 para evitar colisiones:

```typescript
import { randomUUID } from 'crypto'
// ...
neonAuthId: `pending-${randomUUID()}`,
```

---

### M2. `UsuariosService.actualizarUsuario` sin validación de email duplicado

**Archivo:** `src/services/UsuariosService.ts:49-74`  
**Problema:** Al cambiar el email de un usuario, no se verifica que el nuevo email no esté ya en uso. Prisma lanzará error P2002 (unique constraint), que se convertirá en un 500 genérico.

**Fix:** Agregar verificación antes de actualizar:

```typescript
// En actualizarUsuario, después de validar existencia:
if (datos.email) {
  const existente = await prisma.usuario.findUnique({ where: { email: datos.email } })
  if (existente && existente.id !== id) {
    throw new AppError('El email ya está en uso por otro usuario', 409)
  }
}
```

---

### M3. Falta de auditoría en accesos denegados

**Archivo:** Múltiples endpoints API  
**Problema:** Cuando una API retorna 401/403, no se registra en la tabla `Auditoria`. Esto impide detectar patrones de ataque o accesos no autorizados.

**Fix:** Agregar registro de auditoría en los rechazos de autorización:

```typescript
// Patrón recomendado para endpoints sensibles:
if (!(await esAdmin())) {
  await registrarAuditoria({
    accion: 'LOGIN_FALLIDO',
    entidad: 'Usuario',
    datos: { motivo: 'Intento de acceso no autorizado a endpoint admin', ip: extraerIp(request) },
  }).catch(() => {}) // No fallar si la auditoría no puede registrarse
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}
```

---

### M4. Revalidación excesiva en reset (`revalidatePath('/', 'layout')`)

**Archivo:** `src/app/api/admin/restablecer/route.ts:72`  
**Problema:** `revalidatePath('/', 'layout')` invalida TODAS las páginas del layout raíz, forzando regeneración completa del sitio. Aunque es correcto después de un reset, podría optimizarse.

**Fix:** Usar `revalidatePath` con rutas específicas:

```typescript
revalidatePath('/productos', 'layout')
revalidatePath('/movimientos', 'layout')
revalidatePath('/ventas', 'layout')
revalidatePath('/analisis', 'layout')
revalidatePath('/cotizaciones', 'layout')
revalidatePath('/', 'page')
```

---

### M5. Contraseña en logs de error (potencial)

**Archivo:** `src/app/api/usuarios/[id]/route.ts:73`  
**Problema:** El `catch` hace `console.error('Error al actualizar usuario:', error)`. Si el error ocurre antes de que Zod valide, el objeto `error` podría contener los datos crudos del request. No se filtran datos sensibles.

**Fix:** Sanitizar logs de error:

```typescript
catch (error) {
  console.error('Error al actualizar usuario:', error instanceof AppError ? error.message : 'Error interno')
  // ...
}
```

---

### M6. CSP permite 'unsafe-inline' y 'unsafe-eval'

**Archivo:** `next.config.ts:7`  
**Problema:** `script-src 'unsafe-inline' 'unsafe-eval'` debilita la protección contra XSS. Aunque es necesario para Next.js en desarrollo, en producción podría mitigarse.

**Fix:** Agregar nonces o hashes en producción:

```typescript
// next.config.ts (esquema conceptual)
const cspDirectives = [
  "default-src 'self'",
  ...(isProd 
    ? ["script-src 'self' https://va.vercel-scripts.com"] 
    : ["script-src 'self' 'unsafe-inline' 'unsafe-eval'"]),
  // ...
]
```

---

### M7. Falta de paginación en listados de auditoría

**Archivo:** `src/app/auditoria/page.tsx`, API de auditoría  
**Problema:** La tabla `Auditoria` puede crecer rápidamente. No se usa paginación por cursor en el listado de auditoría, lo que eventualmente causará timeouts.

**Fix:** Agregar paginación por cursor al GET de auditoría, similar a `ProductosService.obtenerTodos`.

---

### M8. `obtenerSesion` se llama múltiples veces en un mismo endpoint

**Archivo:** Múltiples APIs  
**Problema:** Patrón común: se llama `esAdmin()` (que llama `obtenerSesion()`) y luego se llama `obtenerSesion()` nuevamente para obtener `empresaId`. Aunque `cache()` de React hace que la segunda llamada sea gratuita, es código redundante.

**Fix:** Unificar la llamada:

```typescript
// En vez de:
if (!(await esAdmin())) return 403
const sesion = await obtenerSesion()
const empresaId = sesion?.user?.empresaId

// Hacer:
const sesion = await obtenerSesion()
if (!sesion?.user || sesion.user.rol !== 'ADMIN') return 403
const empresaId = sesion.user.empresaId
```

---

## 📊 RESUMEN

| Severidad | Hallazgos | 
|-----------|-----------|
| 🔴 Crítico | 3 (escalada privilegios admin, auto-creación sin control, webhook sin HMAC) |
| 🟠 Alto | 5 (análisis sin paginación, índices faltantes, N+1 encubierto, rate limiting insuficiente) |
| 🟡 Medio | 8 (neonAuthId colisionable, validación email duplicado, auditoría rechazos, revalidación excesiva, CSP, logs, paginación auditoría, redundancia código) |
| **Total** | **16 hallazgos** |

### Prioridad de remediación
1. **C1 + C2** — Ejecutar inmediatamente (escalada de privilegios + registro sin control)
2. **C3** — Ejecutar pronto (webhook sin HMAC)
3. **A1 + A2 + A3** — Siguiente sprint (performance con datos reales)
4. **A4 + A5** — Siguiente sprint (optimización + seguridad)
5. **M1-M8** — Backlog técnico
