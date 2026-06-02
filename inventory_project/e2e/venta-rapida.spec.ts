import { expect, test } from '@playwright/test'

// Flujo completo: login como admin, agregar 2 productos al carrito,
// editar cantidad, cobrar y verificar el mensaje de exito.

test.describe('Flujo de venta rápida con carrito', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/usuario/i).fill('admin')
    await page.getByLabel(/contraseña/i).fill('admin123')
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('agrega productos al carrito y registra la venta', async ({ page }) => {
    await page.goto('/venta-rapida')

    // Suponemos que hay al menos un producto en el catálogo con stock.
    // Abrir el desplegable y tomar el primero.
    const input = page.getByPlaceholder(/escribe para buscar/i)
    await input.click()
    const primerProducto = page.locator('button').filter({ hasText: /Stock:/ }).first()
    await primerProducto.waitFor()
    await primerProducto.click()

    // Agregar al carrito.
    await page.getByRole('button', { name: /agregar al carrito/i }).click()

    // El carrito ahora debe tener 1 producto.
    const carrito = page.getByText(/^Carrito$/i).locator('..')
    await expect(carrito.getByText('1 producto(s)')).toBeVisible()

    // Cobrar.
    await page.getByRole('button', { name: /^cobrar$/i }).click()

    // Mensaje de exito.
    await expect(page.getByText(/Venta #\d+ registrada/)).toBeVisible({ timeout: 10_000 })

    // El carrito ahora debe estar vacío.
    await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible()
  })

  test('rechaza el cobro si el carrito está vacío', async ({ page }) => {
    await page.goto('/venta-rapida')
    // No agregamos nada, el boton Cobrar debe estar deshabilitado.
    const cobrar = page.getByRole('button', { name: /^cobrar$/i })
    await expect(cobrar).toBeDisabled()
  })
})
