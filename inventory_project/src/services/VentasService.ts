import { prisma } from '../lib/db'
import { Prisma } from '@prisma/client'
import { StockService } from './StockService'
import { obtenerReservasPorProducto } from '../lib/reservas'
import { AppError } from '../lib/AppError'

export const VentasService = {
  async registrarVenta(consolidados: Map<number, number>, vendedorId: string | null, notas: string, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    return await prisma.$transaction(async (tx) => {
      const productosIds = Array.from(consolidados.keys())
      const productos = await tx.producto.findMany({ where: { id: { in: productosIds }, empresaId } })
      const mapaProductos = new Map(productos.map((p) => [p.id, p]))
      const reservas = await obtenerReservasPorProducto(productosIds, tx as Prisma.TransactionClient, empresaId)

      const itemsValidados = []
      for (const [productoId, cantidad] of consolidados.entries()) {
        const p = mapaProductos.get(productoId)
        if (!p) throw new AppError(`Producto no encontrado o no pertenece a la empresa: ${productoId}`, 404)
        const reservado = reservas.get(productoId) ?? 0
        StockService.validarDisponibilidad(p as any, cantidad, reservado)
        itemsValidados.push({ productoId: p.id, cantidad, precio: p.precio, nombre: p.nombre, codigo: p.codigo })
      }

      const total = itemsValidados.reduce((s, it) => s + it.precio * it.cantidad, 0)
      const venta = await tx.venta.create({ 
        data: { 
          vendedorId, 
          notas: notas || null, 
          total,
          empresaId,
          items: { 
            create: itemsValidados.map(it => ({
              productoId: it.productoId,
              cantidad: it.cantidad,
              precioUnitario: it.precio,
              subtotal: it.precio * it.cantidad
            })) 
          } 
        },
        include: {
          items: { include: { producto: { select: { nombre: true, codigo: true } } } },
        }
      })
      
      for (const it of itemsValidados) {
        await tx.movimiento.create({
          data: {
            productoId: it.productoId,
            tipo: 'salida',
            cantidad: it.cantidad,
            notas: notas ? `Venta #${venta.id} — ${notas}` : `Venta #${venta.id}`,
            ventaId: venta.id
          },
        })
        await tx.producto.update({ where: { id: it.productoId }, data: { cantidad: { decrement: it.cantidad } } })
      }
      return { venta, itemsValidados, total }
    })
  }
}
