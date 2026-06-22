# Análisis Técnico - Integración de Neon Auth y Errores HTTP 500 en Vercel

Este informe detalla el análisis de la integración del sistema de autenticación de **Neon Auth** en el proyecto, identifica las causas de los errores HTTP 500 que se presentan al ejecutar en la plataforma Vercel (tanto para el inicio de sesión con Google OAuth como con código OTP), y propone mejoras para asegurar la integridad, rendimiento y apego a las mejores prácticas en el código.

---

## 1. Análisis de la Integración de Neon Auth

El proyecto migró recientemente de NextAuth v4 a **Neon Auth** (una plataforma gestionada basada en Better Auth). La estructura de archivos inspeccionada es la siguiente:

### 1.1. Configuración del Servidor (`src/lib/auth/server.ts`)
```typescript
import { createNeonAuth } from '@neondatabase/auth/next/server'

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET || 'secret-for-build-only-change-in-prod',
  },
})
```
- **Rol:** Inicializa el SDK de servidor para proxy/middleware.
- **Riesgo:** Confía en que `process.env.NEON_AUTH_BASE_URL` siempre está configurado. Si es `undefined`, no falla al inicializar, pero causará excepciones fatales en tiempo de ejecución. El fallback de la cookie secreta tiene una longitud de 36 caracteres, lo que evita el fallo de validación de longitud mínima (32 caracteres).

### 1.2. Configuración de API Route (`src/app/api/auth/[...path]/route.ts`)
```typescript
import { auth } from '@/lib/auth/server'

export const { GET, POST } = auth.handler()
```
- **Rol:** Catch-all endpoint para el proxy de autenticación. Redirige peticiones de login, registro, callback, OTP y reseteo hacia los servidores de Neon Auth.
- **Riesgo:** Si `auth` lanza un error interno (por ejemplo, debido a una URL inválida), esta API arrojará directamente un código de estado HTTP 500.

### 1.3. Middleware de Seguridad y Ruteo (`src/middleware.ts`)
- **Rol:** Realiza rate limiting en peticiones POST a `/api/auth/` mediante Upstash Redis (con fallback en memoria para desarrollo local). Luego delega la protección de rutas a `auth.middleware(...)`.
- **Riesgo:** El middleware se ejecuta en el **Edge Runtime** de Vercel. Aunque `@neondatabase/auth` y `jose` son compatibles con el Edge Runtime, cualquier incompatibilidad o excepción (como el fallo al evaluar la variable de entorno de base URL) provocará un fallo completo del middleware, haciendo que todas las páginas del sitio retornen HTTP 500.

### 1.4. Cliente de Autenticación (`src/lib/auth/client.ts` y páginas)
- `src/lib/auth/client.ts` exporta `authClient` inicializado mediante `createAuthClient()`.
- `src/componentes/ProveedorSesion.tsx` configura el `NeonAuthUIProvider` con traducciones al español y soporte para `emailVerification`, `emailOTP`, y `credentials.forgotPassword`.
- `src/app/auth/[path]/page.tsx` genera de manera estática los parámetros de rutas de autenticación mediante `generateStaticParams()` y renderiza el componente `<AuthView path={path} />`.

---

## 2. Diagnóstico de Errores HTTP 500 en Vercel

A través del análisis del flujo de ejecución del SDK de Neon Auth y de la configuración de Next.js, se identificaron cuatro factores críticos que provocan los fallos HTTP 500 en Vercel:

### Factor A: Variables de entorno ausentes en Vercel (Causa Principal)
- **Mecanismo del fallo:** 
  1. Durante el desarrollo local, el script `append-env.js` crea o edita un archivo `.env.local` agregando `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET`.
  2. Como `.env.local` está excluido del control de versiones (gitignored), estas variables **no se suben a Vercel**.
  3. En Vercel, `process.env.NEON_AUTH_BASE_URL` resulta en `undefined`.
  4. Al intentar realizar un login o validar un código OTP, el cliente envía una petición a `/api/auth/sign-in/social` o `/api/auth/email-otp/verify-email`.
  5. El route handler ejecuta `handleAuthProxyRequest(...)` que a su vez ejecuta `handleAuthRequest(baseUrl, ...)`.
  6. La función `getUpstreamURL` intenta resolver `new URL("undefined/sign-in/social")`. Esto lanza una excepción de tipo `TypeError: Failed to parse URL`.
  7. El bloque `catch` captura el error, lo registra como `"Unexpected proxy error"`, y devuelve una respuesta con **status 500** (`INTERNAL_ERROR`).
- **Solución:** Agregar `NEON_AUTH_BASE_URL` y `NEON_AUTH_COOKIE_SECRET` (de al menos 32 caracteres) de forma manual en el panel de control de Vercel.

### Factor B: Restricción en la Content Security Policy (CSP)
- **Mecanismo del fallo:**
  1. En `next.config.ts`, la directiva `connect-src` está restringida a `'self'`:
     ```typescript
     "connect-src 'self'"
     ```
  2. Cuando el cliente de autenticación o los componentes de `@neondatabase/auth-ui` intentan realizar peticiones directamente al endpoint de Neon (ej: `https://ep-xxx.neonauth.us-east-1.aws.neon.tech`), el navegador las bloquea inmediatamente mostrando una violación de CSP.
- **Solución:** Modificar `next.config.ts` para permitir el origen de Neon Auth:
  ```typescript
  "connect-src 'self' https://*.neonauth.us-east-1.aws.neon.tech https://*.neon.tech"
  ```

### Factor C: Pérdida de Cookies de Verificación por SameSite "Strict" en OAuth
- **Mecanismo del fallo:**
  1. Por defecto, Neon Auth establece las cookies en modo `sameSite: 'strict'`.
  2. Al iniciar la autenticación con Google OAuth, el servidor genera una cookie de desafío (`neon-auth.session-challenge`) para prevenir ataques CSRF.
  3. El usuario es redirigido a Google y luego de vuelta a Vercel (`/auth/callback?verifier=...`).
  4. Debido a que la redirección de regreso desde Google es una navegación entre diferentes sitios, el navegador **no incluye las cookies con SameSite="Strict"** en la petición inicial.
  5. Al no recibirse la cookie de desafío, la función `needsSessionVerification(request)` o `exchangeOAuthToken(...)` determina que el desafío no existe y devuelve `null`. El flujo de intercambio se rompe, causando fallos de sesión y posibles 500 en las validaciones internas.
- **Solución:** Cambiar la configuración de cookies del servidor a `sameSite: 'lax'` en `src/lib/auth/server.ts`:
  ```typescript
  export const auth = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
      secret: process.env.NEON_AUTH_COOKIE_SECRET || 'secret-for-build-only-change-in-prod',
      sameSite: 'lax', // Requerido para permitir que las cookies viajen en el redirect de OAuth
    },
  })
  ```

---

## 3. Integridad y Buenas Prácticas del Codebase

### 3.1. Advertencias de Next.js 16 sobre Middleware
Durante el proceso de build, se detectó la siguiente advertencia:
> `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`

- **Impacto:** Aunque Next.js compila con éxito, Next.js 16 depreca la convención `middleware.ts` en favor de `proxy.ts`.
- **Recomendación:** Cambiar el nombre del archivo `src/middleware.ts` a `src/proxy.ts` (y actualizar las rutas de importación correspondientes en los tests) para asegurar compatibilidad futura.

### 3.2. Sincronización de State en Render (React Components)
En `src/componentes/BarraNavegacion.tsx` y `src/componentes/TerminalVentaRapida.tsx` se hace uso de comentarios `// eslint-disable-next-line react-hooks/set-state-in-effect` al setear estado dentro de un `useEffect` vacío.
- **Justificación:** Se utiliza para inicializar datos provenientes de variables del navegador (como `sessionStorage` o listeners de eventos globales) tras el primer render. En arquitecturas Next.js con renderizado del lado del servidor (SSR), esta es la forma recomendada para evitar errores de hidratación ("Hydration Mismatch").
- **Evaluación:** El código es correcto y no introduce bucles infinitos de re-render. El uso del silenciador de reglas ESLint está plenamente justificado en este escenario.
