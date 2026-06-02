# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: venta-rapida.spec.ts >> Flujo de venta rápida con carrito >> agrega un producto via boton Vender y registra la venta
- Location: e2e\venta-rapida.spec.ts:20:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/1 producto/)
Expected: visible
Error: strict mode violation: getByText(/1 producto/) resolved to 2 elements:
    1) <div class="text-sm text-gray-500">1 producto(s) · 1 unidad(es)</div> aka getByText('producto(s) · 1 unidad(es)').first()
    2) <div class="text-xs text-gray-500 mt-1">1 producto(s) · 1 unidad(es)</div> aka getByText('producto(s) · 1 unidad(es)').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/1 producto/)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e5]:
        - link "Inventarios" [ref=e6] [cursor=pointer]:
          - /url: /
        - generic [ref=e7]:
          - link "Panel" [ref=e8] [cursor=pointer]:
            - /url: /
          - link "Venta rápida" [ref=e9] [cursor=pointer]:
            - /url: /venta-rapida
          - link "Productos" [ref=e10] [cursor=pointer]:
            - /url: /productos
          - link "Movimientos" [ref=e11] [cursor=pointer]:
            - /url: /movimientos
          - link "Categorías" [ref=e12] [cursor=pointer]:
            - /url: /categorias
          - link "Análisis" [ref=e13] [cursor=pointer]:
            - /url: /analisis
          - link "Usuarios" [ref=e14] [cursor=pointer]:
            - /url: /usuarios
          - link "Auditoría" [ref=e15] [cursor=pointer]:
            - /url: /auditoria
        - generic [ref=e16]:
          - generic [ref=e17]: AdministradorAdmin
          - button "Cerrar sesión" [ref=e18]
    - main [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]:
          - heading "Venta rápida" [level=1] [ref=e22]
          - paragraph [ref=e23]: Terminal de ventas. Cada venta registrada se guarda como un movimiento de salida en el inventario.
        - generic [ref=e24]:
          - generic [ref=e25]:
            - generic [ref=e26]:
              - generic [ref=e27]:
                - generic [ref=e28]: Producto (escribe para buscar o abre el listado)
                - generic [ref=e29]:
                  - textbox "Escribe para buscar o haz clic en ▾ para ver todos" [active] [ref=e30]
                  - button "Abrir listado de productos" [ref=e31]:
                    - generic [ref=e32]: ▾
                  - generic [ref=e33]:
                    - 'button "Alcohol 00007 · Stock: 20 $10,000" [ref=e34]':
                      - generic [ref=e35]:
                        - generic [ref=e36]:
                          - generic [ref=e37]: Alcohol
                          - generic [ref=e38]: "00007 · Stock: 20"
                        - generic [ref=e39]: $10,000
                    - 'button "Cetirizina 10mg 30 tabletas 00006 · Stock: 20 $8,500" [ref=e40]':
                      - generic [ref=e41]:
                        - generic [ref=e42]:
                          - generic [ref=e43]: Cetirizina 10mg 30 tabletas
                          - generic [ref=e44]: "00006 · Stock: 20"
                        - generic [ref=e45]: $8,500
                    - 'button "Gasas Esteriles 10x10cm 00005 · Stock: 15 $15,000" [ref=e46]':
                      - generic [ref=e47]:
                        - generic [ref=e48]:
                          - generic [ref=e49]: Gasas Esteriles 10x10cm
                          - generic [ref=e50]: "00005 · Stock: 15"
                        - generic [ref=e51]: $15,000
                    - 'button "Impresora 00004 · Stock: 1 $350,000" [ref=e52]':
                      - generic [ref=e53]:
                        - generic [ref=e54]:
                          - generic [ref=e55]: Impresora
                          - generic [ref=e56]: "00004 · Stock: 1"
                        - generic [ref=e57]: $350,000
                    - 'button "Isodine 00008 · Stock: 10 $15,000" [ref=e58]':
                      - generic [ref=e59]:
                        - generic [ref=e60]:
                          - generic [ref=e61]: Isodine
                          - generic [ref=e62]: "00008 · Stock: 10"
                        - generic [ref=e63]: $15,000
                    - 'button "Pantalla 00002 · Stock: 7 $100,000" [ref=e64]':
                      - generic [ref=e65]:
                        - generic [ref=e66]:
                          - generic [ref=e67]: Pantalla
                          - generic [ref=e68]: "00002 · Stock: 7"
                        - generic [ref=e69]: $100,000
                    - 'button "Teclado 00001 · Stock: 4 $50,000" [ref=e70]':
                      - generic [ref=e71]:
                        - generic [ref=e72]:
                          - generic [ref=e73]: Teclado
                          - generic [ref=e74]: "00001 · Stock: 4"
                        - generic [ref=e75]: $50,000
                    - 'button "USB 00003 · Stock: 2 $20,000" [ref=e76]':
                      - generic [ref=e77]:
                        - generic [ref=e78]:
                          - generic [ref=e79]: USB
                          - generic [ref=e80]: "00003 · Stock: 2"
                        - generic [ref=e81]: $20,000
              - generic [ref=e82]:
                - generic [ref=e83]:
                  - generic [ref=e84]: Cantidad
                  - spinbutton [ref=e85]: "1"
                - generic [ref=e86]:
                  - button "Limpiar" [disabled] [ref=e87]
                  - button "+ Agregar al carrito" [disabled] [ref=e88]
            - generic [ref=e89]:
              - generic [ref=e90]:
                - heading "Carrito" [level=2] [ref=e91]
                - generic [ref=e92]: 1 producto(s) · 1 unidad(es)
              - table [ref=e94]:
                - rowgroup [ref=e95]:
                  - row "Producto Precio Cantidad Subtotal" [ref=e96]:
                    - columnheader "Producto" [ref=e97]
                    - columnheader "Precio" [ref=e98]
                    - columnheader "Cantidad" [ref=e99]
                    - columnheader "Subtotal" [ref=e100]
                    - columnheader [ref=e101]
                - rowgroup [ref=e102]:
                  - row "Alcohol 00007 $10,000 1 $10,000 ✕" [ref=e103]:
                    - cell "Alcohol 00007" [ref=e104]:
                      - generic [ref=e105]: Alcohol
                      - generic [ref=e106]: "00007"
                    - cell "$10,000" [ref=e107]
                    - cell "1" [ref=e108]:
                      - spinbutton [ref=e109]: "1"
                    - cell "$10,000" [ref=e110]
                    - cell "✕" [ref=e111]:
                      - button "✕" [ref=e112]
              - button "Vaciar carrito" [ref=e114]
          - generic [ref=e115]:
            - generic [ref=e116]:
              - heading "Resumen de venta" [level=2] [ref=e117]
              - generic [ref=e118]:
                - generic [ref=e119]: Total a cobrar
                - generic [ref=e120]: $10,000
                - generic [ref=e121]: 1 producto(s) · 1 unidad(es)
              - generic [ref=e122]:
                - generic [ref=e123]: Notas (opcional)
                - textbox "Cliente, factura, etc." [ref=e124]
              - button "Cobrar" [ref=e125]
            - generic [ref=e126]:
              - heading "Ventas recientes en esta sesión" [level=2] [ref=e127]
              - paragraph [ref=e128]: No has registrado ventas en esta sesión.
  - button "Open Next.js Dev Tools" [ref=e134] [cursor=pointer]:
    - img [ref=e135]
  - alert [ref=e138]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | 
  3  | const BOTON_SUBMIT = 'button[type="submit"]'
  4  | 
  5  | async function login(page: import('@playwright/test').Page) {
  6  |   await page.goto('/login')
  7  |   await page.locator('#nombreUsuario').fill('admin')
  8  |   await page.locator('#contrasena').fill('admin123')
  9  |   await page.locator(BOTON_SUBMIT).click()
  10 |   await expect(page).toHaveURL('/', { timeout: 10_000 })
  11 | }
  12 | 
  13 | test.describe('Flujo de venta rápida con carrito', () => {
  14 |   test.beforeEach(async ({ page }) => {
  15 |     await login(page)
  16 |     // Limpiar el carrito de la sesion previa para empezar siempre vacios.
  17 |     await page.evaluate(() => sessionStorage.clear())
  18 |   })
  19 | 
  20 |   test('agrega un producto via boton Vender y registra la venta', async ({ page }) => {
  21 |     // El boton Vender desde /productos agrega 1 unidad al carrito sin
  22 |     // depender del combobox de Venta rapida. Es la ruta mas robusta.
  23 |     await page.goto('/productos')
  24 | 
  25 |     const botonVender = page.getByRole('button', { name: 'Vender' }).first()
  26 |     await botonVender.waitFor({ state: 'visible', timeout: 10_000 })
  27 |     await botonVender.click()
  28 | 
  29 |     // Esperar el toast de confirmacion (el componente lo muestra ~2.5s).
  30 |     await expect(page.getByText(/agregado al carrito/i)).toBeVisible({ timeout: 5_000 })
  31 | 
  32 |     // Ir a Venta rapida.
  33 |     await page.goto('/venta-rapida')
  34 | 
  35 |     // El carrito debe estar visible con al menos 1 producto.
  36 |     await expect(page.getByRole('heading', { name: 'Carrito' })).toBeVisible()
> 37 |     await expect(page.getByText(/1 producto/)).toBeVisible({ timeout: 5_000 })
     |                                                ^ Error: expect(locator).toBeVisible() failed
  38 | 
  39 |     // Cobrar.
  40 |     await page.getByRole('button', { name: 'Cobrar', exact: true }).click()
  41 | 
  42 |     // Verificar mensaje de exito.
  43 |     await expect(page.getByText(/Venta #\d+ registrada/)).toBeVisible({ timeout: 15_000 })
  44 | 
  45 |     // El carrito debe quedar vacio.
  46 |     await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible({ timeout: 5_000 })
  47 |   })
  48 | 
  49 |   test('rechaza el cobro si el carrito está vacío', async ({ page }) => {
  50 |     await page.goto('/venta-rapida')
  51 |     // sessionStorage ya esta limpio (beforeEach). El boton Cobrar debe
  52 |     // estar deshabilitado y el mensaje de carrito vacio visible.
  53 |     await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible()
  54 |     const cobrar = page.getByRole('button', { name: 'Cobrar', exact: true })
  55 |     await expect(cobrar).toBeDisabled()
  56 |   })
  57 | })
  58 | 
```