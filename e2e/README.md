# Tests E2E con Playwright

Tests de extremo a extremo que abren un navegador real y simulan la
interacción de un usuario con el aplicativo.

## Setup (solo la primera vez)

```bash
cd inventory_project
npm install
npx playwright install --with-deps chromium
```

`npx playwright install` descarga los binarios de Chromium (~150 MB).
Es necesario una sola vez por máquina.

## Correr todos los tests

```bash
npm run test:e2e
```

Playwright arranca el dev server en el puerto **3100** automáticamente,
ejecuta los tests y muestra el resumen.

## Correr en modo UI (interactivo)

```bash
npm run test:e2e:ui
```

Abre la interfaz de Playwright donde se pueden ver los tests paso a
paso, los selectores y los screenshots.

## Correr contra otro entorno (preview de Vercel, etc.)

```bash
E2E_BASE_URL=https://inventory-project-tu-preview.vercel.app npm run test:e2e
```

Cuando `E2E_BASE_URL` está definida, Playwright **no** arranca el dev
server: ejecuta los tests directamente contra esa URL.

## Tests incluidos

- `auth.spec.ts`: login válido, login inválido, redirección a /login
  cuando no hay sesión.
- `venta-rapida.spec.ts`: flujo completo de carrito + cobrar; rechazo
  de cobro con carrito vacío.

## Credenciales esperadas

Los tests asumen que existe un usuario `admin` con contraseña
`admin123` (el seed lo crea por defecto).
