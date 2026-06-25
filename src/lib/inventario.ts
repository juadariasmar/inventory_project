export interface ProductoBase {
  nombre: string
  codigo: string
  precio: number
  cantidad: number
  stockMinimo: number
}

export interface MovimientoBase {
  tipo: 'entrada' | 'salida'
  cantidad: number
}

// Margen por encima del stock minimo dentro del cual se considera "stock bajo".
// Con MARGEN_ALERTA_STOCK = 2 y stockMinimo = 1, la alerta aparece cuando
// quedan 2 o 3 unidades (cantidad <= stockMinimo + MARGEN_ALERTA_STOCK).
export const MARGEN_ALERTA_STOCK = 2

export function tieneStockBajo(producto: ProductoBase): boolean {
  return producto.cantidad <= producto.stockMinimo + MARGEN_ALERTA_STOCK
}

// Cuantos dias de stock queremos tener entre pedidos. Si el producto vende
// 5 unidades al dia, el objetivo es tener stock para 14 dias = 70 unidades
// (mas el colchon del stockMinimo).
export const DIAS_COBERTURA_OBJETIVO = 14

// Sugiere cuantas unidades comprar para sacar al producto del umbral critico.
// Garantiza que la sugerencia, al sumarse a la cantidad actual, deje el stock
// por encima del umbral de alerta (cantidad > stockMinimo + MARGEN_ALERTA_STOCK)
// y, cuando es posible, lleve el stock al doble del minimo (colchon recomendable).
// Devuelve siempre un entero >= 1 si el producto esta en zona critica.
// Esta es la formula simple (sin tener en cuenta movimientos). Se usa como
// fallback cuando no hay historial de ventas para proyectar.
export function calcularSugerenciaCompra(
  stockMinimo: number,
  cantidadActual: number,
): number {
  // Clamp to non‑negative values to avoid nonsensical suggestions.
  const sMin = Math.max(0, stockMinimo)
  const current = Math.max(0, cantidadActual)

  const umbralSalida = sMin + MARGEN_ALERTA_STOCK + 1
  const objetivo = Math.max(sMin * 2, umbralSalida)
  return Math.max(0, objetivo - current)
}

// Sugiere cuantas unidades comprar basandose en el consumo diario promedio
// de los ultimos N dias (DIAS_VENTANA_CONSUMO en analisis.ts).
// El objetivo es cubrir DIAS_COBERTURA_OBJETIVO dias de ventas + el stockMinimo
// como colchon de seguridad. Si el producto no tiene historial (consumo = 0),
// cae a la formula simple para no dejarlo sin sugerencia.
export function calcularSugerenciaCompraInteligente(
  stockMinimo: number,
  cantidadActual: number,
  consumoDiarioPromedio: number,
): number {
  const sMin = Math.max(0, stockMinimo)
  const current = Math.max(0, cantidadActual)
  const consumo = Math.max(0, consumoDiarioPromedio)

  if (consumo <= 0) {
    return calcularSugerenciaCompra(sMin, current)
  }

  const umbralSalida = sMin + MARGEN_ALERTA_STOCK + 1
  const objetivoCobertura =
    Math.ceil(consumo * DIAS_COBERTURA_OBJETIVO) + sMin
  const objetivo = Math.max(umbralSalida, objetivoCobertura)
  return Math.max(0, objetivo - current)
}

export type EstadoStock = 'sin_stock' | 'stock_bajo' | 'normal'

// Estado del stock con tres niveles:
//   - sin_stock: cantidad = 0 (sin existencias)
//   - stock_bajo: cantidad dentro del umbral de alerta
//   - normal: por encima del umbral
export function estadoStock(producto: ProductoBase): EstadoStock {
  if (producto.cantidad <= 0) return 'sin_stock'
  if (tieneStockBajo(producto)) return 'stock_bajo'
  return 'normal'
}

export function etiquetaEstadoStock(estado: EstadoStock): string {
  switch (estado) {
    case 'sin_stock':
      return 'Sin stock'
    case 'stock_bajo':
      return 'Stock bajo'
    case 'normal':
      return 'Normal'
  }
}

export function aplicarMovimiento(
  producto: ProductoBase,
  movimiento: MovimientoBase,
): ProductoBase {
  if (movimiento.cantidad <= 0) {
    throw new Error('La cantidad del movimiento debe ser mayor a cero')
  }
  if (movimiento.tipo === 'salida' && movimiento.cantidad > producto.cantidad) {
    throw new Error('Stock insuficiente para realizar la salida')
  }
  const delta =
    movimiento.tipo === 'entrada' ? movimiento.cantidad : -movimiento.cantidad
  return { ...producto, cantidad: producto.cantidad + delta }
}

export function calcularValorTotalInventario(productos: ProductoBase[]): number {
  return productos.reduce((total, p) => total + p.precio * p.cantidad, 0)
}

export function validarProducto(producto: Partial<ProductoBase>): string[] {
  const errores: string[] = []
  if (!producto.nombre || producto.nombre.trim().length < 2) {
    errores.push('El nombre debe tener al menos 2 caracteres')
  }
  if (!producto.codigo || producto.codigo.trim().length === 0) {
    errores.push('El código es obligatorio')
  }
  if (producto.precio === undefined || producto.precio < 0) {
    errores.push('El precio no puede ser negativo')
  }
  if (producto.cantidad !== undefined && producto.cantidad < 0) {
    errores.push('La cantidad no puede ser negativa')
  }
  if (producto.stockMinimo !== undefined && producto.stockMinimo < 0) {
    errores.push('El stock mínimo no puede ser negativo')
  }
  return errores
}

export function formatearPrecio(valor: number, moneda: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(valor)
}
