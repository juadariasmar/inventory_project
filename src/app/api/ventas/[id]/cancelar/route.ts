import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

interface Parametros {
  params: Promise<{ id: string }>
}

// POST /api/ventas/[id]/cancelar
// Cancela una venta. Reglas:
//  - Solo ADMIN.
//  - Solo el mismo dia calendario en que se creo (zona horaria del servidor).
//  - No se puede cancelar dos veces.
// Efectos:
//  - Marca canceladaEn / canceladaPorId / motivoCancelacion en la Venta.
//  - Por cada item devuelve el stock al producto.
//  - Crea un movimiento de entrada por cada item con notas
//    "Devolucion por cancelacion de venta #N".
//  - La venta se conserva en historial; los totales globales la excluyen.
export async function POST(request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (!(await esAdmin())) {
    return NextResponse.json(
      { error: 'Solo un administrador puede cancelar ventas.' },
      { status: 403 }
    )
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }

  try {
    const { id } = await params
    const ventaId = parseInt(id, 10)
    if (!ventaId || Number.isNaN(ventaId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
    }

    const datos = await request.json().catch(() => ({}))
    const motivo = typeof datos.motivo === 'string' ? datos.motivo.trim() : ''

    const venta = await prisma.venta.findUnique({
      where: { id: ventaId, empresaId },
      include: { items: { select: { productoId: true, cantidad: true } } },
    })
    if (!venta) {
      return NextResponse.json(
        { error: 'Venta no encontrada.' },
        { status: 404 }
      )
    }
    if (venta.canceladaEn) {
      return NextResponse.json(
        { error: 'Esta venta ya fue cancelada.' },
        { status: 409 }
      )
    }

    // Ventana de tiempo: mismo dia calendario (en la zona del servidor).
    const hoy = new Date()
    const mismoDia =
      venta.creadoEn.getFullYear() === hoy.getFullYear() &&
      venta.creadoEn.getMonth() === hoy.getMonth() &&
      venta.creadoEn.getDate() === hoy.getDate()
    if (!mismoDia) {
      return NextResponse.json(
        {
          error:
            'Solo se pueden cancelar ventas registradas el mismo día calendario.',
        },
        { status: 400 }
      )
    }

    const adminId = sesion.user.id ? sesion.user.id : null

    const cancelada = await prisma.$transaction(async (tx) => {
      // Devolver stock + registrar movimiento por cada item.
      for (const item of venta.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { cantidad: { increment: item.cantidad } },
        })
        await tx.movimiento.create({
          data: {
            productoId: item.productoId,
            tipo: 'entrada',
            cantidad: item.cantidad,
            notas: `Devolución por cancelación de venta #${venta.id}`,
            ventaId: venta.id,
            empresaId: venta.empresaId,
          },
        })
      }

      return tx.venta.update({
        where: { id: ventaId },
        data: {
          canceladaEn: new Date(),
          canceladaPorId: adminId,
          motivoCancelacion: motivo || null,
        },
        include: {
          items: { include: { producto: { select: { nombre: true, codigo: true } } } },
          canceladaPor: { select: { id: true, nombre: true, email: true } },
        },
      })
    })

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Venta',
      entidadId: venta.id,
      datos: {
        antes: { canceladaEn: null },
        despues: {
          canceladaEn: cancelada.canceladaEn,
          canceladaPorId: cancelada.canceladaPorId,
          motivoCancelacion: cancelada.motivoCancelacion,
        },
        operacion: 'CANCELAR_VENTA',
      },
      ip: extraerIp(request),
    })

    revalidatePath('/ventas')
    revalidatePath(`/ventas/${venta.id}/recibo`)
    revalidatePath('/movimientos')
    revalidatePath('/productos')
    revalidatePath('/analisis')
    revalidatePath('/')
    revalidatePath('/venta-rapida')

    return NextResponse.json(cancelada)
  } catch (error) {
    console.error('Error al cancelar venta:', error)
    return NextResponse.json(
      { error: 'Error al cancelar la venta.' },
      { status: 500 }
    )
  }
}
