# Sistema de Inventario — Aplicación Next.js

Esta carpeta contiene el proyecto Next.js del Sistema de Inventario. Para la documentación completa (propósito, arquitectura, tecnologías, modelo de datos, despliegue), consulta el [README principal del repositorio](../README.md).

## Inicio rápido

```bash
npm install
cp .env.example .env       # configurar DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Credenciales de prueba:** `admin / admin123` (rol ADMIN) o `usuario / usuario123` (rol USUARIO).

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Build de producción (genera Prisma Client y aplica migraciones) |
| `npm start` | Servidor productivo |
| `npm run lint` | Análisis estático con ESLint |
| `npm test` | Pruebas unitarias con Jest |
| `npm run test:coverage` | Pruebas con reporte de cobertura |
| `npm run seed` | Cargar datos iniciales (usuarios y categorías) |

## Estructura

```
src/
├── app/           # Páginas y API routes (App Router)
│   ├── api/       # Endpoints REST
│   ├── analisis/  # Reportes y alertas
│   ├── productos/
│   ├── categorias/
│   ├── movimientos/
│   ├── usuarios/  # CRUD usuarios (solo ADMIN)
│   └── login/
├── componentes/   # Componentes React reutilizables
├── lib/
│   ├── analisis.ts     # Lógica de reportes
│   ├── auth.ts         # Configuración NextAuth
│   ├── db.ts           # Prisma Client singleton
│   ├── inventario.ts   # Funciones puras de dominio
│   └── permisos.ts     # Helpers de autorización
└── types/         # Tipos extendidos NextAuth
prisma/
├── schema.prisma  # Modelo de datos
├── migrations/    # Migraciones PostgreSQL
└── seed.ts        # Datos iniciales
__tests__/         # Pruebas unitarias Jest
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `NEXTAUTH_URL` | URL pública del sitio |
| `NEXTAUTH_SECRET` | Cadena aleatoria (32+ caracteres) para firmar JWT |

## Tecnologías principales

Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · NextAuth.js 4 · Prisma 5 · PostgreSQL · Recharts 3 · Jest 30.

Para detalles completos del stack, arquitectura y despliegue, ver el [README principal](../README.md).
