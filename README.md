# Sistema de Inventario

Aplicación web para la gestión de inventario en pequeñas y medianas empresas: productos, categorías, movimientos de entrada y salida, control de stock, gestión de usuarios con roles y módulo de análisis con alertas automáticas.

**URL en producción:** https://inventory-project-ten.vercel.app

---

## Tabla de contenido

1. [Propósito](#propósito)
2. [Características](#características)
3. [Capturas y demostración](#capturas-y-demostración)
4. [Arquitectura](#arquitectura)
5. [Tecnologías](#tecnologías)
6. [Estructura del repositorio](#estructura-del-repositorio)
7. [Requisitos previos](#requisitos-previos)
8. [Instalación local](#instalación-local)
9. [Variables de entorno](#variables-de-entorno)
10. [Scripts disponibles](#scripts-disponibles)
11. [Modelo de datos](#modelo-de-datos)
12. [Roles y permisos](#roles-y-permisos)
13. [Pruebas](#pruebas)
14. [Despliegue](#despliegue)
15. [Hoja de ruta](#hoja-de-ruta)
16. [Autor](#autor)

---

## Propósito

Este repositorio aloja el proyecto formativo desarrollado durante el programa **Tecnólogo en Análisis y Desarrollo de Software (ADSO)** del SENA. El sistema cubre el ciclo completo: análisis de requisitos, modelado de datos, desarrollo, pruebas, documentación, implantación y mantenimiento.

Está pensado para que un negocio pequeño o mediano pueda llevar control digital de su inventario sin depender de hojas de cálculo, con persistencia en la nube y acceso desde cualquier dispositivo con navegador.

---

## Características

### Gestión de catálogo
- CRUD de productos con código único, descripción, precio, cantidad y stock mínimo.
- CRUD de categorías para agrupar productos. Al eliminar una categoría los productos asociados quedan sin categoría (no se borran).
- Indicador automático de stock bajo cuando la cantidad cae por debajo del mínimo configurado.

### Movimientos
- Registro de entradas (compras, devoluciones) y salidas (ventas, daños).
- Validación automática: no se permiten salidas con cantidad mayor al stock disponible.
- El stock del producto se actualiza de forma atómica usando transacciones.
- Historial cronológico completo con notas opcionales.

### Panel principal
- Tarjetas estadísticas: total de productos, total de categorías, productos con stock bajo y valor total del inventario.
- Banner de alertas (visible si el usuario tiene permiso de análisis).
- Movimientos recientes con vista adaptada a escritorio y móvil.

### Gestión de usuarios
- Solo el administrador puede crear, editar y eliminar usuarios.
- Dos roles: `ADMIN` (acceso total) y `USUARIO` (lectura + registrar movimientos).
- Permisos granulares opcionales que el administrador puede asignar a un usuario regular (por ejemplo, `VER_ANALISIS`, `EXPORTAR_REPORTES`).
- Contraseñas hasheadas con bcrypt; el usuario logueado no puede eliminarse a sí mismo.

### Módulo de análisis e informes
- Página dedicada `/analisis` con cuatro tipos de reporte:
  - **Stock por agotarse**: proyección basada en el consumo promedio diario de los últimos 30 días.
  - **Productos sin movimientos**: detecta capital ocioso (sin entradas ni salidas en 30+ días).
  - **Alta rotación**: top 10 productos más vendidos en los últimos 30 días.
  - **Stock crítico**: productos con cantidad por debajo del mínimo y sugerencia de compra.
- Gráficos interactivos (barras verticales para movimientos diarios y barras horizontales para top de rotación).
- Exportación de los reportes a CSV con codificación UTF-8.

### Diseño responsivo
- Layout adaptado para móvil, tablet y escritorio.
- Menú hamburguesa en pantallas pequeñas.
- Tablas que se transforman en tarjetas (cards) en móvil para facilitar la lectura.
- Botones y formularios con áreas táctiles adecuadas.

---

## Capturas y demostración

| Pantalla | Imagen / Enlace |
|---|---|
| **Sitio en producción** | https://inventory-project-ten.vercel.app |
| **Login** | Pantalla con usuario, contraseña y toggle para mostrar la contraseña. |
| **Dashboard** | Cuatro tarjetas de estadísticas + banner de alertas + módulos. |
| **Productos** | Tabla en desktop, vista tipo card en móvil. |
| **Análisis** | Gráficos + tablas con alertas y reportes. |

> Las capturas se generan dinámicamente con datos reales. Para verlas, inicie sesión con las credenciales de prueba listadas más abajo.

---

## Arquitectura

```
┌─────────────────────────────────────┐
│  Cliente (Navegador)                │
└──────────────────┬──────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────┐
│  Vercel Edge Network (CDN)          │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│  Aplicación Next.js (Vercel)        │
│  ├─ Frontend (React + Tailwind)     │
│  ├─ API Routes (/api/*)             │
│  ├─ NextAuth (autenticación)        │
│  └─ Prisma Client                   │
└──────────────────┬──────────────────┘
                   │ SQL/TLS
┌──────────────────▼──────────────────┐
│  PostgreSQL gestionado (Neon)       │
└─────────────────────────────────────┘
```

**Patrón de aplicación:** capas (Presentación → Aplicación → Dominio → Persistencia → Seguridad transversal).

---

## Tecnologías

### Frontend
| Tecnología | Uso |
|---|---|
| **Next.js 16** (App Router) | Framework full-stack con SSR/SSG/Server Actions |
| **React 19** | Librería de UI |
| **TypeScript 5** | Tipado estático |
| **Tailwind CSS 4** | Diseño utility-first y responsivo |
| **Recharts 3** | Gráficos de barras para el módulo de análisis |

### Backend / API
| Tecnología | Uso |
|---|---|
| **Next.js API Routes** | Endpoints REST en `/api/*` |
| **NextAuth.js 4** | Autenticación con Credentials Provider y JWT |
| **Prisma 5** | ORM type-safe sobre PostgreSQL |
| **bcryptjs** | Hash de contraseñas |

### Base de datos
| Tecnología | Uso |
|---|---|
| **PostgreSQL 17** | Motor relacional |
| **Neon** | Hosting gestionado (free tier, branching, backups automáticos) |

### Calidad y herramientas
| Tecnología | Uso |
|---|---|
| **Jest 30 + ts-jest** | Pruebas unitarias de la lógica de inventario |
| **ESLint 9** | Análisis estático del código |
| **Git + GitHub** | Control de versiones |
| **Vercel** | CI/CD y hosting con despliegue continuo desde `main` |

### Estándares aplicados
REST, HTTPS, HSTS (RFC 6797), JWT (RFC 7519), SQL ANSI, UTF-8, WCAG 2.1 AA, OWASP Top 10, Conventional Commits, ISO 8601, ISO/IEC 12207, ISO/IEC 25010.

---

## Estructura del repositorio

```
inventory_project/
└── inventory_project/                 # Proyecto Next.js
    ├── prisma/
    │   ├── schema.prisma              # Modelo de datos
    │   ├── migrations/                # Migraciones PostgreSQL
    │   └── seed.ts                    # Datos iniciales
    ├── src/
    │   ├── app/                       # Páginas (App Router)
    │   │   ├── api/                   # Endpoints REST
    │   │   ├── analisis/              # Página de reportes
    │   │   ├── categorias/
    │   │   ├── login/
    │   │   ├── movimientos/
    │   │   ├── productos/
    │   │   ├── usuarios/              # CRUD de usuarios (solo ADMIN)
    │   │   ├── layout.tsx
    │   │   └── page.tsx               # Dashboard
    │   ├── componentes/               # Componentes React
    │   ├── lib/
    │   │   ├── analisis.ts            # Lógica de alertas y reportes
    │   │   ├── auth.ts                # Configuración NextAuth
    │   │   ├── db.ts                  # Prisma Client singleton
    │   │   ├── inventario.ts          # Funciones puras de dominio
    │   │   └── permisos.ts            # Helpers de autorización
    │   └── types/                     # Tipos extendidos NextAuth
    ├── __tests__/                     # Pruebas Jest
    ├── package.json
    ├── tsconfig.json
    └── next.config.ts
```

---

## Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20 LTS |
| npm | 10 |
| Git | 2.40 |
| PostgreSQL | 15 (o cuenta en Neon) |

---

## Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/juadariasmar/inventory_project.git
cd inventory_project/inventory_project

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales (ver siguiente sección)

# 4. Generar el cliente Prisma
npx prisma generate

# 5. Aplicar migraciones
npx prisma migrate deploy

# 6. Cargar datos iniciales (admin/admin123 + usuario/usuario123 + 5 categorías)
npm run seed

# 7. Levantar el servidor de desarrollo
npm run dev

# 8. Abrir http://localhost:3000
```

---

## Variables de entorno

Las tres variables que se configuran en `.env` (local) y en Vercel (producción):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL (`postgresql://user:pass@host/db?sslmode=require`) |
| `NEXTAUTH_URL` | URL pública del sitio (en desarrollo `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Cadena aleatoria de al menos 32 caracteres para firmar JWT |

Generación de `NEXTAUTH_SECRET` en PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

> El archivo `.env` está en `.gitignore`. Nunca se versionan los valores reales. Solo `.env.example` se versiona como referencia.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática (puerto 3000) |
| `npm run build` | Build de producción (incluye `prisma generate` y `prisma migrate deploy`) |
| `npm start` | Servidor productivo después del build |
| `npm run lint` | Análisis estático del código con ESLint |
| `npm test` | Pruebas unitarias con Jest |
| `npm run test:coverage` | Pruebas con reporte de cobertura |
| `npm run seed` | Carga el usuario admin/usuario y las categorías iniciales |

---

## Modelo de datos

```prisma
enum Rol {
  ADMIN
  USUARIO
}

enum Permiso {
  VER_ANALISIS
  EXPORTAR_REPORTES
}

model Usuario {
  id            Int       @id @default(autoincrement())
  nombreUsuario String    @unique
  contrasena    String                              // hash bcrypt
  nombre        String
  rol           Rol       @default(USUARIO)
  permisos      Permiso[] @default([])
  creadoEn      DateTime  @default(now())
}

model Categoria {
  id        Int        @id @default(autoincrement())
  nombre    String     @unique
  productos Producto[]
}

model Producto {
  id          Int          @id @default(autoincrement())
  nombre      String
  descripcion String?
  codigo      String       @unique
  precio      Float
  cantidad    Int          @default(0)
  stockMinimo Int          @default(5)
  categoriaId Int?
  categoria   Categoria?   @relation(fields: [categoriaId], references: [id])
  movimientos Movimiento[]
  creadoEn    DateTime     @default(now())
}

model Movimiento {
  id         Int      @id @default(autoincrement())
  productoId Int
  producto   Producto @relation(fields: [productoId], references: [id])
  tipo       String                                 // "entrada" o "salida"
  cantidad   Int
  notas      String?
  creadoEn   DateTime @default(now())
}
```

**Relaciones:**
- `Categoria` 1 ─── N `Producto` (opcional)
- `Producto` 1 ─── N `Movimiento` (obligatoria)

---

## Roles y permisos

| Acción | ADMIN | USUARIO | USUARIO + permiso |
|---|:-:|:-:|:-:|
| Iniciar sesión | ✓ | ✓ | ✓ |
| Ver dashboard | ✓ | ✓ | ✓ |
| Consultar productos | ✓ | ✓ | ✓ |
| Consultar categorías | ✓ | ✓ | ✓ |
| Consultar movimientos | ✓ | ✓ | ✓ |
| Registrar movimiento | ✓ | ✓ | ✓ |
| CRUD productos | ✓ | ✗ | ✗ |
| CRUD categorías | ✓ | ✗ | ✗ |
| CRUD usuarios | ✓ | ✗ | ✗ |
| Ver `/analisis` | ✓ | ✗ | ✓ con `VER_ANALISIS` |
| Exportar CSV de análisis | ✓ | ✗ | ✓ con `EXPORTAR_REPORTES` |

**Credenciales de prueba** (en producción y tras correr el seed):

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `usuario` | `usuario123` | USUARIO |

---

## Pruebas

```bash
npm test
```

Cobertura de pruebas unitarias sobre la lógica de dominio (`src/lib/inventario.ts`):

| Métrica | Valor |
|---|---:|
| Statements | 100 % |
| Branches | 100 % |
| Functions | 100 % |
| Lines | 100 % |
| Tests | 16 / 16 pasando |

Las pruebas cubren: detección de stock bajo, cálculo de delta de movimientos, validación de salidas, validación de campos, cálculo de valor total y formato de precio.

---

## Despliegue

El proyecto se despliega automáticamente en **Vercel** cada vez que se hace `git push` a la rama `main`.

**Stack de producción:**
- **Hosting:** Vercel (plan Hobby, gratuito, sin tarjeta)
- **Base de datos:** Neon PostgreSQL (plan Free)
- **Dominio:** `inventory-project-ten.vercel.app` (HTTPS automático con certificado Google Trust Services)
- **CI/CD:** GitHub → Vercel
- **Tiempo de despliegue:** 2-3 minutos por push

Variables de entorno configuradas en Vercel: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

Para desplegar a un dominio propio: configurar el dominio en Vercel y actualizar `NEXTAUTH_URL` con la nueva URL.

---

## Hoja de ruta

- [x] Autenticación con NextAuth y JWT
- [x] CRUD de productos, categorías y movimientos
- [x] Validaciones de stock atómicas con transacciones Prisma
- [x] Dashboard con estadísticas
- [x] Roles ADMIN/USUARIO y gestión de usuarios
- [x] Permisos granulares
- [x] Diseño responsivo (móvil, tablet, escritorio)
- [x] Módulo de análisis con alertas y exportación CSV
- [x] Gráficos con Recharts
- [ ] Notificaciones por correo cuando un stock crítico es detectado
- [ ] Exportación a Excel (XLSX) además de CSV
- [ ] Multi-empresa (tenant)
- [ ] Integración con pasarelas de pago
- [ ] Módulo móvil Android nativo (Kotlin + Jetpack Compose) — versión inicial en otro repositorio

---

## Autor

Proyecto desarrollado por **Juan David Arias** como parte del programa Tecnólogo en Análisis y Desarrollo de Software (ADSO) del SENA, Colombia.

- GitHub: [@juadariasmar](https://github.com/juadariasmar)
- Repositorio: https://github.com/juadariasmar/inventory_project
