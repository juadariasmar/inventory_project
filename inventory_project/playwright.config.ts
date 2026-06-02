import { defineConfig, devices } from '@playwright/test'

const PUERTO = process.env.E2E_PORT ?? '3100'
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PUERTO}`

/**
 * Configuracion de Playwright para los tests E2E.
 *
 * Por defecto Playwright arranca el dev server en el puerto 3100 (para no
 * chocar con el dev habitual en 3000). Si E2E_BASE_URL apunta a otro origen
 * (p. ej. un preview de Vercel), se usa ese y NO se arranca el servidor.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `next dev -p ${PUERTO}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        // NextAuth construye URLs de redireccion absolutas a partir de
        // NEXTAUTH_URL. Si el .env apunta a localhost:3000 (o a la URL de
        // produccion), signOut() y otros redirects iran a esa URL y no a
        // la del dev server de Playwright. Lo sobreescribimos al BASE_URL
        // del test para que el redirect tras 'Cerrar sesión' caiga aqui.
        env: {
          NEXTAUTH_URL: BASE_URL,
        },
      },
})
