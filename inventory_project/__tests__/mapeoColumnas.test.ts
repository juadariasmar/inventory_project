import {
  aplicarMapeo,
  mapearColumnas,
  normalizarEncabezado,
} from '../src/lib/mapeoColumnas'

describe('normalizarEncabezado', () => {
  test('quita acentos y mayúsculas', () => {
    expect(normalizarEncabezado('Categoría')).toBe('categoria')
    expect(normalizarEncabezado('CÓDIGO')).toBe('codigo')
    expect(normalizarEncabezado('Descripción')).toBe('descripcion')
  })

  test('colapsa espacios, guiones bajos y guiones medios', () => {
    expect(normalizarEncabezado('Stock Mínimo')).toBe('stockminimo')
    expect(normalizarEncabezado('stock_minimo')).toBe('stockminimo')
    expect(normalizarEncabezado('stock-minimo')).toBe('stockminimo')
    expect(normalizarEncabezado('  Precio   Venta  ')).toBe('precioventa')
  })
})

describe('mapearColumnas', () => {
  test('mapea encabezados estándares de la plantilla', () => {
    const encabezados = [
      'codigo', 'nombre', 'descripcion', 'precio', 'cantidad', 'stockMinimo', 'categoria',
    ]
    const r = mapearColumnas(encabezados)
    expect(r.faltantes).toEqual([])
    expect(r.mapeo.codigo).toBe('codigo')
    expect(r.mapeo.nombre).toBe('nombre')
    expect(r.mapeo.stockMinimo).toBe('stockMinimo')
    expect(r.ignoradas).toEqual([])
  })

  test('acepta alias en español con tildes', () => {
    const encabezados = ['Código', 'Producto', 'Precio venta', 'Existencias', 'Categoría']
    const r = mapearColumnas(encabezados)
    expect(r.mapeo.codigo).toBe('Código')
    expect(r.mapeo.nombre).toBe('Producto')
    expect(r.mapeo.precio).toBe('Precio venta')
    expect(r.mapeo.cantidad).toBe('Existencias')
    expect(r.mapeo.categoria).toBe('Categoría')
    expect(r.faltantes).toEqual([])
  })

  test('acepta SKU y referencia como código', () => {
    const r1 = mapearColumnas(['SKU', 'Nombre', 'Precio'])
    expect(r1.mapeo.codigo).toBe('SKU')
    const r2 = mapearColumnas(['Referencia', 'Producto', 'Valor'])
    expect(r2.mapeo.codigo).toBe('Referencia')
    expect(r2.mapeo.nombre).toBe('Producto')
    expect(r2.mapeo.precio).toBe('Valor')
  })

  test('ignora columnas no reconocidas', () => {
    const encabezados = ['codigo', 'nombre', 'precio', 'proveedor', 'foto', 'comentarios_extra']
    const r = mapearColumnas(encabezados)
    expect(r.faltantes).toEqual([])
    expect(r.ignoradas).toEqual(['proveedor', 'foto', 'comentarios_extra'])
  })

  test('detecta campos faltantes requeridos', () => {
    const encabezados = ['nombre', 'descripcion']
    const r = mapearColumnas(encabezados)
    expect(r.faltantes).toContain('codigo')
    expect(r.faltantes).toContain('precio')
    expect(r.faltantes).not.toContain('nombre')
  })

  test('no asigna la misma columna a dos campos canonicos distintos', () => {
    // si solo hay "codigo" no debe contar como SKU y como código
    const encabezados = ['codigo', 'nombre', 'precio', 'cod']
    const r = mapearColumnas(encabezados)
    expect(r.mapeo.codigo).toBe('codigo')
    // 'cod' queda ignorada porque ya se uso 'codigo'
    expect(r.ignoradas).toContain('cod')
  })
})

describe('aplicarMapeo', () => {
  test('extrae valores usando los encabezados originales', () => {
    const fila = { 'Código': 'X1', 'Producto': 'Lápiz', 'Precio venta': '5000', 'Stock': '10' }
    const mapeo = { codigo: 'Código', nombre: 'Producto', precio: 'Precio venta', cantidad: 'Stock' }
    expect(aplicarMapeo(fila, mapeo)).toEqual({
      codigo: 'X1',
      nombre: 'Lápiz',
      precio: '5000',
      cantidad: '10',
    })
  })

  test('campos faltantes en la fila se devuelven como cadena vacía', () => {
    const fila = { 'Código': 'X1', 'Producto': 'A' }
    const mapeo = { codigo: 'Código', nombre: 'Producto', precio: 'Precio' }
    expect(aplicarMapeo(fila, mapeo)).toEqual({ codigo: 'X1', nombre: 'A', precio: '' })
  })
})
