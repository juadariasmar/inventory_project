// Gestion del carrito de venta en sessionStorage.
// El carrito vive solo en el navegador (no requiere endpoint para crearse/leerse)
// y se confirma con un POST a /api/ventas. Sobrevive a la navegacion dentro
// de la misma sesion del navegador y se limpia al cerrar la pestana.

export interface ItemCarrito {
  productoId: number
  codigo: string
  nombre: string
  precio: number
  stock: number
  cantidad: number
}

export const STORAGE_KEY_CARRITO = 'venta-rapida:carrito'
export const EVENTO_CARRITO_CAMBIO = 'venta-rapida:carrito:cambio'

function leerSeguro(): ItemCarrito[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CARRITO)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (it): it is ItemCarrito =>
        typeof it === 'object' && it !== null &&
        typeof it.productoId === 'number' &&
        typeof it.cantidad === 'number'
    )
  } catch {
    return []
  }
}

function escribirYNotificar(items: ItemCarrito[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY_CARRITO, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent(EVENTO_CARRITO_CAMBIO))
  } catch {
    // Si sessionStorage falla (modo privado estricto, etc.), igual notificamos.
    window.dispatchEvent(new CustomEvent(EVENTO_CARRITO_CAMBIO))
  }
}

export function obtenerCarrito(): ItemCarrito[] {
  return leerSeguro()
}

/**
 * Agrega un producto al carrito. Si ya estaba, suma la cantidad nueva al item
 * existente respetando el stock disponible.
 */
export function agregarAlCarrito(
  producto: Omit<ItemCarrito, 'cantidad'>,
  cantidad: number = 1
): { ok: boolean; cantidadEnCarrito: number; mensaje?: string } {
  if (cantidad <= 0) {
    return { ok: false, cantidadEnCarrito: 0, mensaje: 'La cantidad debe ser mayor a cero.' }
  }
  const items = leerSeguro()
  const existente = items.find((i) => i.productoId === producto.productoId)
  const cantidadActualEnCarrito = existente?.cantidad ?? 0
  const cantidadTotal = cantidadActualEnCarrito + cantidad
  if (cantidadTotal > producto.stock) {
    return {
      ok: false,
      cantidadEnCarrito: cantidadActualEnCarrito,
      mensaje: `Solo hay ${producto.stock} unidades en stock.`,
    }
  }
  if (existente) {
    existente.cantidad = cantidadTotal
    // Actualizar nombre/precio/stock por si cambio
    existente.codigo = producto.codigo
    existente.nombre = producto.nombre
    existente.precio = producto.precio
    existente.stock = producto.stock
  } else {
    items.push({ ...producto, cantidad })
  }
  escribirYNotificar(items)
  return { ok: true, cantidadEnCarrito: cantidadTotal }
}

export function actualizarCantidad(productoId: number, cantidad: number): boolean {
  const items = leerSeguro()
  const item = items.find((i) => i.productoId === productoId)
  if (!item) return false
  if (cantidad <= 0) {
    return quitarDelCarrito(productoId)
  }
  if (cantidad > item.stock) {
    return false
  }
  item.cantidad = cantidad
  escribirYNotificar(items)
  return true
}

export function quitarDelCarrito(productoId: number): boolean {
  const items = leerSeguro()
  const nuevo = items.filter((i) => i.productoId !== productoId)
  if (nuevo.length === items.length) return false
  escribirYNotificar(nuevo)
  return true
}

export function limpiarCarrito(): void {
  escribirYNotificar([])
}

export function totalCarrito(items: ItemCarrito[]): number {
  return items.reduce((s, it) => s + it.precio * it.cantidad, 0)
}

export function cantidadTotalCarrito(items: ItemCarrito[]): number {
  return items.reduce((s, it) => s + it.cantidad, 0)
}
