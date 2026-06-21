import { AppError } from '../lib/AppError'
import { Producto } from '@prisma/client'

export const StockService = {
  validarDisponibilidad(producto: Partial<Producto> & { cantidad: number; nombre: string }, solicitada: number, reservada: number) {
    const disponible = Math.max(0, producto.cantidad - reservada)
    if (solicitada > disponible) {
      throw new AppError(`Stock insuficiente para "${producto.nombre}". Solicitas ${solicitada}, disponible ${disponible}.`, 400)
    }
    return true;
  }
}
