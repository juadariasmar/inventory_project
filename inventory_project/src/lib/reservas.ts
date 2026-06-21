import { prisma } from './db'

// Stock reservado por cotizaciones PENDIENTE vigentes (no vencidas).
//
// Una cotizacion reserva stock mientras:
//   estado = 'PENDIENTE' AND validaHasta > now
//
// Las CANCELADAS, CONVERTIDAS y las PENDIENTE con validaHasta <= now
// no aportan a la reserva (las vencidas se consideran liberadas).
//
// Devuelve un Map productoId -> unidades reservadas. Los productos sin
// reserva no aparecen (consultar con .get() y usar `?? 0`).
//
// Acepta un cliente de transaccion opcional (tx) para que las llamadas
// desde dentro de un $transaction sean atomicas con el resto de la tx.
type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

export async function obtenerReservasPorProducto(
  productoIds?: number[],
  tx?: TxClient
): Promise<Map<number, number>> {
  const cliente = tx ?? prisma
  const ahora = new Date()
  const reservas = await cliente.itemCotizacion.groupBy({
    by: ['productoId'],
    where: {
      ...(productoIds && productoIds.length > 0
        ? { productoId: { in: productoIds } }
        : {}),
      cotizacion: {
        estado: 'PENDIENTE',
        validaHasta: { gt: ahora },
      },
    },
    _sum: { cantidad: true },
  })
  return new Map(reservas.map((r) => [r.productoId, r._sum.cantidad ?? 0]))
}

// Stock disponible para vender o cotizar: cantidad fisica - reservado.
// Mismo formato (productoId -> disponible). Si el producto no tiene fila
// es porque no se encontro (no porque no este disponible).
export async function obtenerDisponiblePorProducto(
  productoIds?: number[]
): Promise<Map<number, number>> {
  const [productos, reservas] = await Promise.all([
    prisma.producto.findMany({
      ...(productoIds && productoIds.length > 0
        ? { where: { id: { in: productoIds } } }
        : {}),
      select: { id: true, cantidad: true },
    }),
    obtenerReservasPorProducto(productoIds),
  ])
  return new Map(
    productos.map((p) => {
      const reservado = reservas.get(p.id) ?? 0
      return [p.id, Math.max(0, p.cantidad - reservado)]
    })
  )
}
