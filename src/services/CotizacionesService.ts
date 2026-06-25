import { prisma } from '../lib/db'
import { Prisma } from '@prisma/client'
import { AppError } from '../lib/AppError'

const DIAS_VALIDEZ_DEFECTO = 7

export const CotizacionesService = {
  async crearCotizacion(consolidados: Map<number, number>, vendedorId: string | null, notas: string, clienteNombre: string, empresaId: string, diasValidezInput?: number) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    const productosIds = Array.from(consolidados.keys())
    const productos = await prisma.producto.findMany({ where: { id: { in: productosIds }, empresaId } })
    const mapaProductos = new Map(productos.map((p) => [p.id, p]))

    let clienteId: number | null = null
    if (clienteNombre?.trim()) {
      const cliente = await prisma.cliente.findFirst({ where: { nombre: clienteNombre.trim(), empresaId } })
      if (cliente) {
        clienteId = cliente.id
      } else {
        const nuevo = await prisma.cliente.create({ data: { nombre: clienteNombre.trim(), empresaId } })
        clienteId = nuevo.id
      }
    }

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
      // Bloqueo pesimista de filas de Producto (ordenadas por id) antes de leer
      // stock/reservas y crear la cotización, evitando que cotizaciones
      // concurrentes sobre-comprometan el inventario.
      const idsBloqueo = [...productosIds].sort((a, b) => a - b)
      if (idsBloqueo.length > 0) {
        await tx.$queryRaw`SELECT id FROM "Producto" WHERE id IN (${Prisma.join(idsBloqueo)}) AND "empresaId" = ${empresaId} ORDER BY id FOR UPDATE`
      }
      const prods = await tx.producto.findMany({
        where: { id: { in: idsBloqueo } },
        select: { id: true, cantidad: true, nombre: true, empresaId: true },
      })
      const mapaProds = new Map(prods.map((p) => [p.id, p]))

      const reservas = await tx.itemCotizacion.groupBy({
        by: ['productoId'],
        where: {
          productoId: { in: idsBloqueo },
          cotizacion: { estado: 'PENDIENTE', validaHasta: { gt: ahora }, empresaId },
        },
        _sum: { cantidad: true },
      })
      const mapaReservas = new Map(reservas.map((r) => [r.productoId, r._sum.cantidad ?? 0]))

      for (const it of itemsValidados) {
        const prod = mapaProds.get(it.productoId)
        if (!prod || prod.empresaId !== empresaId) {
          throw new AppError(`Producto no pertenece a la empresa`, 403)
        }
        const disponibleTx = Math.max(0, prod.cantidad - (mapaReservas.get(it.productoId) ?? 0))
        if (it.cantidad > disponibleTx) {
          throw new AppError(`Stock insuficiente para "${prod.nombre}". Solicitas ${it.cantidad}, disponible ${disponibleTx} (físico − reservado en otras cotizaciones).`, 400)
        }
      }

      const cotizacion = await tx.cotizacion.create({
        data: {
          empresaId,
          vendedorId,
          clienteId,
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
