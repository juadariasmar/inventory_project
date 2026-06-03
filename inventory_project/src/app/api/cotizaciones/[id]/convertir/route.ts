import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

interface Parametros {
  params: Promise<{ id: string }>
}

// POST /api/cotizaciones/[id]/convertir
// Convierte una cotizacion PENDIENTE (no vencida) en Venta:
//  - Crea la Venta + ItemVenta + Movimientos de salida (= descontar stock)
//  - Marca la cotizacion como CONVERTIDA y la liga a la Venta via ventaId
//  - Esto libera la reserva automaticamente porque ya no es PENDIENTE
//
// Solo el vendedor original o un ADMIN pueden convertir. Requiere REALIZAR_VENTAS.
export async function POST(request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const esAdmin = sesion.user.rol === 'ADMIN'
  if (!esAdmin && !(await tienePermiso('REALIZAR_VENTAS'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const cotizacionId = parseInt(id, 10)
    if (!cotizacionId || Number.isNaN(cotizacionId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
    }

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: { items: { include: { producto: true } } },
    })
    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada.' }, { status: 404 })
    }
    if (cotizacion.estado !== 'PENDIENTE') {
      return NextResponse.json(
        {
          error: `La cotización ya está ${cotizacion.estado === 'CONVERTIDA' ? 'convertida' : 'cancelada'}.`,
        },
        { status: 409 }
      )
    }
    if (cotizacion.validaHasta <= new Date()) {
      return NextResponse.json(
        {
          error: 'La cotización está vencida. Cancélala y crea una nueva si la quieres revivir.',
        },
        { status: 400 }
      )
    }

    // Solo el vendedor original o admin.
    const usuarioId = parseInt(sesion.user.id, 10)
    if (!esAdmin && cotizacion.vendedorId !== usuarioId) {
      return NextResponse.json(
        { error: 'Solo el vendedor original o un administrador puede convertir esta cotización.' },
        { status: 403 }
      )
    }

    // Verificar stock fisico (no comparar con disponible aqui: la reserva
    // de ESTA cotizacion ya esta contada en disponible y al convertir se
    // descontara igual cantidad del stock fisico).
    for (const it of cotizacion.items) {
      if (it.cantidad > it.producto.cantidad) {
        return NextResponse.json(
          {
            error: `Stock físico insuficiente para "${it.producto.nombre}". Necesitas ${it.cantidad}, hay ${it.producto.cantidad}.`,
          },
          { status: 400 }
        )
      }
    }

    const vendedorIdVenta = cotizacion.vendedorId ?? usuarioId
    const notasVenta = cotizacion.notas
      ? `Venta convertida desde cotización #${cotizacion.id} — ${cotizacion.notas}`
      : `Venta convertida desde cotización #${cotizacion.id}`

    const resultado = await prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          vendedorId: vendedorIdVenta,
          total: cotizacion.total,
          notas: notasVenta,
          items: {
            create: cotizacion.items.map((it) => ({
              productoId: it.productoId,
              cantidad: it.cantidad,
              precioUnitario: it.precioUnitario,
              subtotal: it.subtotal,
            })),
          },
        },
      })

      for (const it of cotizacion.items) {
        await tx.movimiento.create({
          data: {
            productoId: it.productoId,
            tipo: 'salida',
            cantidad: it.cantidad,
            notas: `Venta #${venta.id} (cotización #${cotizacion.id})`,
            ventaId: venta.id,
          },
        })
        await tx.producto.update({
          where: { id: it.productoId },
          data: { cantidad: { decrement: it.cantidad } },
        })
      }

      const cotizacionActualizada = await tx.cotizacion.update({
        where: { id: cotizacionId },
        data: {
          estado: 'CONVERTIDA',
          ventaId: venta.id,
          convertidaEn: new Date(),
        },
      })

      return { venta, cotizacion: cotizacionActualizada }
    })

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Cotizacion',
      entidadId: cotizacion.id,
      datos: {
        antes: { estado: 'PENDIENTE' },
        despues: { estado: 'CONVERTIDA', ventaId: resultado.venta.id },
        operacion: 'CONVERTIR_COTIZACION',
      },
      ip: extraerIp(request),
    })

    revalidatePath('/cotizaciones')
    revalidatePath(`/cotizaciones/${cotizacion.id}`)
    revalidatePath('/ventas')
    revalidatePath('/venta-rapida')
    revalidatePath('/movimientos')
    revalidatePath('/productos')
    revalidatePath('/analisis')
    revalidatePath('/')

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al convertir cotización:', error)
    return NextResponse.json(
      { error: 'Error al convertir la cotización.' },
      { status: 500 }
    )
  }
}
