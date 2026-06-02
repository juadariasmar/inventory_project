import { expect, test } from '@playwright/test'

const BOTON_SUBMIT = 'button[type="submit"]'

test.describe('Autenticación', () => {
  test('rechaza credenciales incorrectas', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#nombreUsuario').fill('admin')
    await page.locator('#contrasena').fill('claveincorrecta')
    await page.locator(BOTON_SUBMIT).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Usuario o contraseña incorrectos')).toBeVisible({ timeout: 10_000 })
  })

  test('permite iniciar sesión con admin / admin123 y luego cerrar', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#nombreUsuario').fill('admin')
    await page.locator('#contrasena').fill('admin123')
    await page.locator(BOTON_SUBMIT).click()

    // Llegamos al panel principal.
    await expect(page).toHaveURL('/', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Panel Principal' })).toBeVisible()

    // El boton 'Cerrar sesión' aparece dos veces (escritorio y mobile colapsable);
    // tomamos el primero visible.
    await page.getByRole('button', { name: 'Cerrar sesión' }).first().click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('redirige a /login si se accede a una pantalla protegida sin sesión', async ({ page }) => {
    await page.goto('/productos')
    await expect(page).toHaveURL(/\/login/)
  })
})
