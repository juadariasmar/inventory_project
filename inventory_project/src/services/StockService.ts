import { AppError } from '../lib/AppError'

export const StockService = {
  validarDisponibilidad(producto: any, solicitada: number, reservada: number) {
    const disponible = Math.max(0, producto.cantidad - reservada)
    if (solicitada > disponible) {
      throw new AppError(`Stock insuficiente para "${producto.nombre}". Solicitas ${solicitada}, disponible ${disponible}.`, 400)
    }
    return true;
  }
}
