import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

interface Parametros {
  params: Promise<{ id: string }>
}

// POST /api/cotizaciones/[id]/cancelar
// Marca la cotizacion como CANCELADA. Libera la reserva (porque ya no
// es PENDIENTE). No toca stock fisico (la cotizacion no lo habia tocado).
//
// Solo el vendedor original o un admin pueden cancelar; requiere motivo.
export async function POST(request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const esAdmin = sesion.user.rol === 'ADMIN' || sesion.user.rol === 'SUPER_ADMIN'
  if (!esAdmin && !(await tienePermiso('REALIZAR_VENTAS'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const cotizacionId = parseInt(id, 10)
    if (!cotizacionId || Number.isNaN(cotizacionId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
    }

    const datos = await request.json().catch(() => ({}))
    const motivo = typeof datos.motivo === 'string' ? datos.motivo.trim() : ''
    if (!motivo) {
      return NextResponse.json(
        { error: 'Debes indicar un motivo de cancelación.' },
        { status: 400 }
      )
    }

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId, empresaId: sesion.user.empresaId! },
    })
    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada.' }, { status: 404 })
    }
    if (cotizacion.estado === 'CANCELADA') {
      return NextResponse.json({ error: 'La cotización ya está cancelada.' }, { status: 409 })
    }
    if (cotizacion.estado === 'CONVERTIDA') {
      return NextResponse.json(
        { error: 'No se puede cancelar una cotización ya convertida. Cancela la venta resultante.' },
        { status: 409 }
      )
    }

    const usuarioId = sesion.user.id
    if (!esAdmin && cotizacion.vendedorId !== usuarioId) {
      return NextResponse.json(
        { error: 'Solo el vendedor original o un administrador puede cancelar esta cotización.' },
        { status: 403 }
      )
    }

    const actualizada = await prisma.cotizacion.update({
      where: { id: cotizacionId, empresaId: sesion.user.empresaId! },
      data: {
        estado: 'CANCELADA',
        canceladaEn: new Date(),
        canceladaPorId: usuarioId,
        motivoCancelacion: motivo,
      },
    })

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Cotizacion',
      entidadId: cotizacion.id,
      datos: {
        antes: { estado: cotizacion.estado },
        despues: { estado: 'CANCELADA', motivoCancelacion: motivo },
        operacion: 'CANCELAR_COTIZACION',
      },
      ip: extraerIp(request),
    })

    revalidatePath('/cotizaciones')
    revalidatePath(`/cotizaciones/${cotizacion.id}`)
    revalidatePath('/venta-rapida')
    revalidatePath('/productos')
    revalidatePath('/')

    return NextResponse.json(actualizada)
  } catch (error) {
    console.error('Error al cancelar cotización:', error)
    return NextResponse.json(
      { error: 'Error al cancelar la cotización.' },
      { status: 500 }
    )
  }
}
