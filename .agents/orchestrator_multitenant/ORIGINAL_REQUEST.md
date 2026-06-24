# Original User Request

## Follow-up — 2026-06-22T14:56:56-05:00

Implementar la interfaz de usuario para el modelo multi-tenant en el aplicativo de inventarios, incluyendo el CRUD de empresas y el selector en el perfil/edición de usuarios.

Working directory: C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project
Integrity mode: development

### Requirements

#### R1. CRUD de Empresas (Backend y API)
Crear endpoints de API seguros (`GET /api/empresas`, `POST /api/empresas`, `PUT /api/empresas/[id]`, `DELETE /api/empresas/[id]`) reservados para administradores en la base de datos PostgreSQL/Prisma.

#### R2. Vista de Administración de Empresas
Crear la interfaz responsiva en `/admin/empresas` para listar, crear, editar y eliminar empresas usando los componentes visuales base (`Input`, `Button`, `Select`, `Card`).

#### R3. Selector de Empresa en Usuarios
Agregar columnas de visualización y campos de selección (`<select>`) en la lista de usuarios y las vistas de creación/edición de usuarios (`/usuarios/[id]`, `/usuarios/nuevo`) para cambiar su empresa (`empresaId`).

### Acceptance Criteria

#### Funcionalidad de Administración y Control
- [ ] Los endpoints de empresas solo son accesibles por usuarios con rol `ADMIN` (retornar 403/401 si no corresponde).
- [ ] La eliminación de empresas está bloqueada si la empresa tiene usuarios o productos asociados.
- [ ] Los administradores pueden ver la empresa actual de cada usuario en `/usuarios`.
- [ ] Modificar la empresa de un usuario en `/usuarios/[id]` actualiza correctamente su `empresaId` en la base de datos.

#### Calidad, Accesibilidad y Rendimiento
- [ ] Los cambios de la interfaz cumplen con accesibilidad WCAG 2.2 AA (foco visible y etiquetas descriptivas).
- [ ] Toda nueva funcionalidad de backend cuenta con cobertura de pruebas (TDD) en `src/__tests__/`.
- [ ] La compilación del build de Next.js (`npm run build`) se ejecuta exitosamente sin errores de compilación ni de TypeScript.
