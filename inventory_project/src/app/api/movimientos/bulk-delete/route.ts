import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

// POST /api/movimientos/bulk-delete  body: { ids: number[] }
// Solo permite borrar movimientos MANUALES (ventaId == null). Los que
// provienen de ventas o cancelaciones quedan protegidos para mantener la
// trazabilidad. Si la seleccion incluye movimientos de venta, la
// transaccion falla y no borra nada.
// IMPORTANTE: borrar movimientos NO ajusta el stock del producto; el
// producto.cantidad es un valor desnormalizado. Esto se documenta en la UI.
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const datos = await request.json().catch(() => ({}))
    const idsCrudos = datos.ids
    if (!Array.isArray(idsCrudos) || idsCrudos.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un movimiento.' },
        { status: 400 }
      )
    }
    const ids = idsCrudos
      .map((x) => parseInt(String(x), 10))
      .filter((n) => Number.isInteger(n) && n > 0)
    if (ids.length === 0) {
      return NextResponse.json({ error: 'IDs inválidos.' }, { status: 400 })
    }

    const movimientos = await prisma.movimiento.findMany({
      where: { id: { in: ids } },
      select: { id: true, ventaId: true, tipo: true, cantidad: true, productoId: true },
    })
    if (movimientos.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró ningún movimiento con esos IDs.' },
        { status: 404 }
      )
    }

    const deVenta = movimientos.filter((m) => m.ventaId !== null)
    if (deVenta.length > 0) {
      return NextResponse.json(
        {
          error: `${deVenta.length} movimiento(s) provienen de ventas o cancelaciones y no se pueden borrar. Filtra solo movimientos manuales o usa "Restablecer datos".`,
        },
        { status: 409 }
      )
    }

    const idsValidos = movimientos.map((m) => m.id)
    await prisma.movimiento.deleteMany({ where: { id: { in: idsValidos } } })

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Movimiento',
      datos: {
        operacion: 'BULK_DELETE',
        cantidad: movimientos.length,
        movimientos: movimientos.map((m) => ({
          id: m.id,
          tipo: m.tipo,
          cantidad: m.cantidad,
          productoId: m.productoId,
        })),
      },
      ip: extraerIp(request),
    })

    revalidatePath('/movimientos')
    revalidatePath('/analisis')

    return NextResponse.json({
      eliminados: movimientos.length,
      ids: idsValidos,
    })
  } catch (error) {
    console.error('Error en bulk delete de movimientos:', error)
    return NextResponse.json(
      { error: 'Error al eliminar movimientos.' },
      { status: 500 }
    )
  }
}
