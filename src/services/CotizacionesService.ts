import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'

const DIAS_VALIDEZ_DEFECTO = 7

export const CotizacionesService = {
  async crearCotizacion(consolidados: Map<number, number>, vendedorId: string | null, notas: string, cliente: string, empresaId: string, diasValidezInput?: number) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    const productosIds = Array.from(consolidados.keys())
    const productos = await prisma.producto.findMany({ where: { id: { in: productosIds }, empresaId } })
    const mapaProductos = new Map(productos.map((p) => [p.id, p]))

    const diasValidez = diasValidezInput && Number.isInteger(diasValidezInput) && diasValidezInput > 0
      ? Math.min(365, diasValidezInput)
      : DIAS_VALIDEZ_DEFECTO

    const itemsValidados: { productoId: number; cantidad: number; precio: number; nombre: string; codigo: string }[] = []
    for (const [productoId, cantidad] of consolidados.entries()) {
      const p = mapaProductos.get(productoId)
      if (!p) throw new AppError(`Producto ${productoId} no encontrado en la empresa actual.`, 404)
      itemsValidados.push({ productoId: p.id, cantidad, precio: p.precio, nombre: p.nombre, codigo: p.codigo })
    }

    const total = itemsValidados.reduce((s, it) => s + it.precio * it.cantidad, 0)
    const validaHasta = new Date()
    validaHasta.setDate(validaHasta.getDate() + diasValidez)
    const ahora = new Date()

    return await prisma.$transaction(async (tx) => {
      for (const it of itemsValidados) {
        const prod = await tx.producto.findUnique({
          where: { id: it.productoId },
          select: { cantidad: true, nombre: true, empresaId: true },
        })
        if (prod?.empresaId !== empresaId) {
           throw new AppError(`Producto no pertenece a la empresa`, 403);
        }
        const reservasActuales = await tx.itemCotizacion.aggregate({
          where: {
            productoId: it.productoId,
            cotizacion: { estado: 'PENDIENTE', validaHasta: { gt: ahora }, empresaId },
          },
          _sum: { cantidad: true },
        })
        const disponibleTx = Math.max(
          0,
          (prod?.cantidad ?? 0) - (reservasActuales._sum.cantidad ?? 0)
        )
        if (it.cantidad > disponibleTx) {
          throw new AppError(`Stock insuficiente para "${prod?.nombre ?? it.productoId}". Solicitas ${it.cantidad}, disponible ${disponibleTx} (físico − reservado en otras cotizaciones).`, 400)
        }
      }

      const cotizacion = await tx.cotizacion.create({
        data: {
          empresaId,
          vendedorId,
          cliente: cliente || null,
          total,
          notas: notas || null,
          validaHasta,
          items: {
            create: itemsValidados.map((it) => ({
              productoId: it.productoId,
              cantidad: it.cantidad,
              precioUnitario: it.precio,
              subtotal: it.precio * it.cantidad,
            })),
          },
        },
        include: {
          items: { include: { producto: { select: { nombre: true, codigo: true } } } },
        },
      })
      
      return { cotizacion, itemsValidados, total, validaHasta }
    })
  }
}
