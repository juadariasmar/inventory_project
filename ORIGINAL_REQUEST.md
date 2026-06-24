# Original User Request

## Initial Request — 2026-06-22T08:17:56-05:00

Auditar la integridad completa de la aplicación `inventory_project` y solucionar los errores HTTP 500 que ocurren en Vercel durante el proceso de login (Google OAuth y login con código), asegurando el cumplimiento de clean code, performance y best-practices.

Working directory: `C:\Users\juan\Documents\ADSO\PROYECTO\inventory_project`
Integrity mode: development

## Requirements

### R1. Solucionar Errores de Autenticación HTTP 500
Identificar y corregir la causa raíz de los errores 500 en las rutas de login (`/api/auth/*` o middleware) al intentar autenticarse con Neon Auth (Google OAuth y códigos OTP) en el entorno Serverless de Vercel. Asegurarse de que el manejo de cookies, las redirecciones de OAuth y las variables de entorno estén alineadas a los requerimientos de Next.js en Vercel.

### R2. Auditoría de Integridad y Performance
Realizar una revisión general en los componentes principales (UI/UX) y servicios, aplicando refactorizaciones si es necesario para asegurar mejores prácticas de Next.js (`next-best-practices`), arquitectura segura y de alto rendimiento (`performance`).

## Acceptance Criteria

### Autenticación
- [ ] Existe un script local o test que simula la validación en un entorno serverless (Edge/Node) y que comprueba que las rutas de `/api/auth` no arrojan error 500 bajo condiciones restrictivas.
- [ ] La configuración del Proxy/Middleware no interfiere con los headers de autenticación de Neon Auth.

### Calidad
- [ ] La aplicación compila sin errores (`npm run build`).
- [ ] Los tests de Integración Continua pasan exitosamente.
- [ ] No hay variables de React marcadas como erróneas por mutabilidad o efectos secundarios en los componentes principales de UI.

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
