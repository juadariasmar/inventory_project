import { expect, test } from '@playwright/test'

const BOTON_SUBMIT = 'button[type="submit"]'

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.locator('#nombreUsuario').fill('admin')
  await page.locator('#contrasena').fill('Admin2024!')
  await page.locator(BOTON_SUBMIT).click()
  await expect(page).toHaveURL('/', { timeout: 10_000 })
}

test.describe('Flujo de venta rápida con carrito', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    // Limpiar el carrito de la sesion previa para empezar siempre vacios.
    await page.evaluate(() => sessionStorage.clear())
  })

  test('agrega un producto via boton Vender y registra la venta', async ({ page }) => {
    // El boton Vender desde /productos agrega 1 unidad al carrito sin
    // depender del combobox de Venta rapida. Es la ruta mas robusta.
    await page.goto('/productos')

    const botonVender = page.getByRole('button', { name: 'Vender' }).first()
    await botonVender.waitFor({ state: 'visible', timeout: 10_000 })
    await botonVender.click()

    // Esperar el toast de confirmacion (el componente lo muestra ~2.5s).
    await expect(page.getByText(/agregado a la venta/i)).toBeVisible({ timeout: 5_000 })

    // Ir a Venta rapida.
    await page.goto('/venta-rapida')

    // El carrito debe estar visible con al menos 1 producto. El texto
    // '1 producto(s)' aparece dos veces (en la seccion Carrito y en el
    // sidebar 'Resumen de venta'); .first() resuelve la ambigüedad.
    await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible()
    await expect(page.getByText(/1 producto/).first()).toBeVisible({ timeout: 5_000 })

    // Cobrar.
    await page.getByRole('button', { name: 'Vender', exact: true }).click()

    // Verificar mensaje de exito.
    await expect(page.getByText(/Venta #\d+ registrada/)).toBeVisible({ timeout: 15_000 })

    // El carrito debe quedar vacio.
    await expect(page.getByText(/aún no has agregado productos/i)).toBeVisible({ timeout: 5_000 })
  })

  test('rechaza el cobro si el carrito está vacío', async ({ page }) => {
    await page.goto('/venta-rapida')
    // sessionStorage ya esta limpio (beforeEach). El boton Cobrar debe
    // estar deshabilitado y el mensaje de carrito vacio visible.
    await expect(page.getByText(/aún no has agregado productos/i)).toBeVisible()
    const cobrar = page.getByRole('button', { name: 'Vender', exact: true })
    await expect(cobrar).toBeDisabled()
  })
})
