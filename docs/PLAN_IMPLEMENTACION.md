# Plan de Implementación — Inventory Project (SaaS Multi-tenant)

## Fases

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Fundación (alert→toast, confirm→ConfirmarAccion) | ✅ Completado (PR #45) |
| 1 | Self-signup / Onboarding | ✅ Completado (PR #46) |
| — | Onboarding sin navbar + AvatarUsuario + link empresa | ✅ Completado (PR #47) |
| — | Fix TypeScript AvatarUsuario | ✅ Completado (PR #48) |
| 2 | Configuración por empresa | ✅ Completado |
| 3 | Invitaciones por email | ✅ Completado (PR #49) |
| 4 | Ajustes UI/UX (seguridad colapsable, sesión actual, nav) | ✅ Completado (PR #50) |
| 4.5 | **Admin empresas (superadmin)** | 🔄 En progreso |
| 5 | (por definir) | ⏳ Pendiente |

---

## Reporte de Avance — 24 Jun 2026

### Resumen

Se han completado las fases 0 a 4 del plan de implementación. La fase 4.5 (Admin empresas — página para superadmins) está en progreso.

### Detalle por Fase

#### Fase 0 — Fundación
- Reemplazo de `alert()` por toasts con `react-hot-toast`.
- Reemplazo de `confirm()` por componente `ConfirmarAccion` con diálogo modal.
- 9 archivos modificados.
- PR #45 mergeado a `main`.

#### Fase 1 — Self-signup / Onboarding
- Campo `onboardingCompletado` en modelo `Usuario`.
- Página `/onboarding` con formulario de bienvenida.
- `PATCH /api/usuarios/onboarding` para marcar completado.
- Redirección automática en `LayoutProtegido` si no ha completado onboarding.
- PR #46 mergeado a `main`.

#### PR #47 — Ajustes complementarios
- Onboarding sin navbar.
- Componente `AvatarUsuario` custom con iniciales reales.
- Link "Empresa" visible en nav para todos los usuarios.
- Campo empresa visible en formularios de usuario.
- PR #47 mergeado a `main`.

#### PR #48 — Fix técnico
- Corrección de tipo TypeScript en `AvatarUsuario` para compatibilidad con `BarraNavegacion`.
- PR #48 mergeado a `main`.

#### Fase 2 — Configuración por empresa
- Modelo `ConfiguracionEmpresa` en Prisma.
- `ConfiguracionService` con operaciones CRUD.
- API endpoints para configuración.
- UI en `/empresa/configuracion`.
- Completada (integrada en PRs anteriores).

#### Fase 3 — Invitaciones por email
- Modelo `Invitacion` con `EstadoInvitacion` enum.
- Migración de base de datos (`prisma db push`).
- `InvitacionesService` (crear, listar, cancelar, aceptar, obtenerPorToken).
- `EmailService` (console.log en dev, Resend en prod).
- API: `POST/GET /api/invitaciones`, `DELETE /api/invitaciones/[id]`, `POST /api/invitaciones/aceptar`, `GET /api/invitaciones/validar`.
- UI: `GestorInvitaciones` integrado en `/usuarios`.
- Página pública `/invitacion?token=` con flujo de aceptación.
- `/invitacion` excluido de middleware de auth.
- PR #49 mergeado a `main`.

#### Fase 4 — Ajustes UI/UX
- Página `/account/seguridad` con secciones colapsables (Radix Accordion): cambiar contraseña, 2FA, passkeys, sesión actual.
- Componente `SesionActual` que muestra solo la sesión activa (reemplaza `SessionsCard` de Neon Auth).
- Link "Empresa" como enlace directo en nav para todos (no solo admin).
- Avatar dropdown apunta a `/account/seguridad`.
- **Fix**: Se corrigió error de build Vercel (`useState`/`useEffect` no importados, se eliminó `useSyncExternalStore`).
- PR #50 mergeado a `main`.

#### Fase 4.5 — Admin empresas (superadmin) 🔄
- **Objetivo**: Página para superadmins que liste todas las empresas del sistema con detalle de cada una.
- **Estado**: Creación de rama `fase-4-5-admin-empresas` desde `main`.
- **Por implementar**:
  - [ ] Página `/admin` con listado de todas las empresas (tabla con nombre, fecha creación, # usuarios, # productos).
  - [ ] Página `/admin/empresas/[id]` con detalle: información general, usuarios, configuración.
  - [ ] Enlace "Empresas" en el menú desplegable "Administración" de la barra de navegación.
  - [ ] Protección: solo accesible por usuarios con email en `ADMIN_EMAILS` (rol `ADMIN`).

### Próximos Pasos

1. Completar implementación de Fase 4.5 (Admin empresas).
2. Definir fases 5+ según necesidades del proyecto.
3. Revisar vulnerabilidades Dependabot (28 encontradas, no bloqueantes).

### Contexto Técnico

- **Stack**: Next.js 16 (App Router), React 19, TypeScript, Prisma 5 + Neon Serverless, Radix UI, Tailwind CSS.
- **Auth**: Neon Auth con `@neondatabase/auth-ui`.
- **Base de datos**: PostgreSQL en Neon, con `PrismaNean` adapter (WebSocket).
- **Validación**: Zod v4.
- **Infraestructura**: Vercel para deploy, Upstash Redis para rate limiting.
- **Branch protection**: `main` protegido — cambios solo vía PR + status check "test".
- **Admin detection**: Vía `ADMIN_EMAILS` env var + `esEmailAdministrador()` en `src/lib/adminEmails.ts`.
- **APIs existentes para admin**: `GET/POST /api/empresas`, `GET/PUT/DELETE /api/empresas/[id]`, todas protegidas con `esAdmin()`.
