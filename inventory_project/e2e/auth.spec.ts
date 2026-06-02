import { expect, test } from '@playwright/test'

test.describe('Autenticación', () => {
  test('rechaza credenciales incorrectas', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/usuario/i).fill('admin')
    await page.getByLabel(/contraseña/i).fill('claveincorrecta')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    // El usuario debe seguir en /login y ver el mensaje de error.
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/credenciales|incorrecto|inválido/i)).toBeVisible()
  })

  test('permite iniciar sesión con admin / admin123 y luego cerrar', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/usuario/i).fill('admin')
    await page.getByLabel(/contraseña/i).fill('admin123')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()

    // Llega al panel principal con la barra de navegación.
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Panel Principal' })).toBeVisible()
    await expect(page.getByRole('link', { name: /productos/i }).first()).toBeVisible()

    // Cerrar sesión vuelve a la pantalla de login.
    await page.getByRole('button', { name: /cerrar sesión/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirige a /login si se accede a una pantalla protegida sin sesión', async ({ page }) => {
    await page.goto('/productos')
    await expect(page).toHaveURL(/\/login/)
  })
})
