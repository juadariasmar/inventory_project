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

export function tieneStockBajo(producto: ProductoBase): boolean {
  return producto.cantidad < producto.stockMinimo
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
