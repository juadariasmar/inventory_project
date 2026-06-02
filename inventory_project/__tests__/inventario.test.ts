import {
  tieneStockBajo,
  aplicarMovimiento,
  calcularValorTotalInventario,
  validarProducto,
  formatearPrecio,
  calcularSugerenciaCompra,
  ProductoBase,
  MARGEN_ALERTA_STOCK,
} from '../src/lib/inventario'

const productoBase: ProductoBase = {
  nombre: 'Teclado mecánico',
  codigo: 'TEC-001',
  precio: 150000,
  cantidad: 10,
  stockMinimo: 5,
}

describe('tieneStockBajo', () => {
  // La alerta se activa cuando cantidad <= stockMinimo + MARGEN_ALERTA_STOCK.
  // productoBase: stockMinimo=5, MARGEN_ALERTA_STOCK=2, umbral de alerta = 7.

  test('retorna false cuando la cantidad supera el stock mínimo más el margen', () => {
    expect(tieneStockBajo(productoBase)).toBe(false) // cantidad=10 > 7
  })

  test('retorna true cuando la cantidad es muy inferior al stock mínimo', () => {
    const producto = { ...productoBase, cantidad: 2 }
    expect(tieneStockBajo(producto)).toBe(true)
  })

  test('retorna true cuando la cantidad es exactamente igual al stock mínimo (margen activo)', () => {
    const producto = { ...productoBase, cantidad: 5 }
    expect(tieneStockBajo(producto)).toBe(true)
  })

  test('retorna true en el borde superior del margen (stockMinimo + MARGEN_ALERTA_STOCK)', () => {
    const producto = { ...productoBase, cantidad: 5 + MARGEN_ALERTA_STOCK }
    expect(tieneStockBajo(producto)).toBe(true)
  })

  test('retorna false una unidad por encima del margen', () => {
    const producto = { ...productoBase, cantidad: 5 + MARGEN_ALERTA_STOCK + 1 }
    expect(tieneStockBajo(producto)).toBe(false)
  })
})

describe('aplicarMovimiento', () => {
  test('una entrada incrementa la cantidad del producto', () => {
    const resultado = aplicarMovimiento(productoBase, {
      tipo: 'entrada',
      cantidad: 5,
    })
    expect(resultado.cantidad).toBe(15)
  })

  test('una salida disminuye la cantidad del producto', () => {
    const resultado = aplicarMovimiento(productoBase, {
      tipo: 'salida',
      cantidad: 3,
    })
    expect(resultado.cantidad).toBe(7)
  })

  test('lanza error cuando la salida supera el stock disponible', () => {
    expect(() =>
      aplicarMovimiento(productoBase, { tipo: 'salida', cantidad: 20 }),
    ).toThrow('Stock insuficiente')
  })

  test('lanza error si la cantidad del movimiento es cero o negativa', () => {
    expect(() =>
      aplicarMovimiento(productoBase, { tipo: 'entrada', cantidad: 0 }),
    ).toThrow()
    expect(() =>
      aplicarMovimiento(productoBase, { tipo: 'entrada', cantidad: -5 }),
    ).toThrow()
  })

  test('no muta el producto original (inmutabilidad)', () => {
    const original = { ...productoBase }
    aplicarMovimiento(productoBase, { tipo: 'entrada', cantidad: 5 })
    expect(productoBase).toEqual(original)
  })
})

describe('calcularValorTotalInventario', () => {
  test('calcula correctamente el valor total de un inventario', () => {
    const productos: ProductoBase[] = [
      { ...productoBase, precio: 100, cantidad: 2 },
      { ...productoBase, precio: 50, cantidad: 4 },
      { ...productoBase, precio: 1000, cantidad: 1 },
    ]
    expect(calcularValorTotalInventario(productos)).toBe(1400)
  })

  test('retorna 0 cuando el inventario está vacío', () => {
    expect(calcularValorTotalInventario([])).toBe(0)
  })
})

describe('validarProducto', () => {
  test('un producto válido no produce errores', () => {
    expect(validarProducto(productoBase)).toEqual([])
  })

  test('detecta nombre vacío', () => {
    const errores = validarProducto({ ...productoBase, nombre: '' })
    expect(errores).toContain('El nombre debe tener al menos 2 caracteres')
  })

  test('detecta precio negativo', () => {
    const errores = validarProducto({ ...productoBase, precio: -10 })
    expect(errores).toContain('El precio no puede ser negativo')
  })

  test('acumula varios errores cuando hay múltiples campos inválidos', () => {
    const errores = validarProducto({
      nombre: '',
      codigo: '',
      precio: -5,
      cantidad: -1,
      stockMinimo: -2,
    })
    expect(errores.length).toBeGreaterThanOrEqual(4)
  })
})

describe('calcularSugerenciaCompra', () => {
  // Recordatorio: un producto es critico cuando cantidad <= stockMinimo + MARGEN_ALERTA_STOCK.
  // La sugerencia debe sacarlo de ese umbral y, cuando se pueda, llevarlo al doble del minimo.

  test('al stockMinimo + MARGEN exacto, sugiere lo justo para superar el umbral', () => {
    // stockMinimo=5, MARGEN=2 -> critico hasta cantidad=7.
    // objetivo = max(10, 8) = 10. sugerencia = 10 - 7 = 3.
    expect(calcularSugerenciaCompra(5, 5 + MARGEN_ALERTA_STOCK)).toBe(3)
  })

  test('al stockMinimo exacto sugiere completar al doble', () => {
    // stockMinimo=5, cantidad=5 -> objetivo=10, sugerencia=5.
    expect(calcularSugerenciaCompra(5, 5)).toBe(5)
  })

  test('con stock=0 sugiere al menos el doble del mínimo', () => {
    expect(calcularSugerenciaCompra(5, 0)).toBe(10)
  })

  test('caso del bug original: stockMinimo=1 y cantidad=2 sugiere mayor a cero', () => {
    // Antes del fix devolvia 0. Ahora debe sacarlo de la zona critica.
    // objetivo = max(2, 1+2+1=4) = 4. sugerencia = 4 - 2 = 2.
    const sug = calcularSugerenciaCompra(1, 2)
    expect(sug).toBeGreaterThan(0)
    expect(sug).toBe(2)
  })

  test('caso del bug: stockMinimo=2 y cantidad=4 sugiere mayor a cero', () => {
    // objetivo = max(4, 2+2+1=5) = 5. sugerencia = 5 - 4 = 1.
    const sug = calcularSugerenciaCompra(2, 4)
    expect(sug).toBeGreaterThan(0)
    expect(sug).toBe(1)
  })

  test('al recibir la sugerencia, el producto sale del umbral critico', () => {
    // Casos limites donde el bug se manifestaba.
    const casos: Array<[number, number]> = [
      [1, 2], [1, 3], [2, 4], [3, 5], [4, 6],
    ]
    for (const [stockMinimo, cantidad] of casos) {
      const sug = calcularSugerenciaCompra(stockMinimo, cantidad)
      const cantidadDespues = cantidad + sug
      expect(cantidadDespues).toBeGreaterThan(stockMinimo + MARGEN_ALERTA_STOCK)
    }
  })
})

describe('formatearPrecio', () => {
  test('formatea un número como precio en pesos colombianos', () => {
    const resultado = formatearPrecio(150000)
    expect(resultado).toMatch(/150\.000/)
    expect(resultado).toContain('$')
  })

  test('formatea correctamente el valor cero', () => {
    const resultado = formatearPrecio(0)
    expect(resultado).toContain('0')
  })
})
