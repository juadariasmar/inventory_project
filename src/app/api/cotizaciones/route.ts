import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { obtenerDisponiblePorProducto } from '@/lib/reservas'
import { CotizacionesService } from '@/services/CotizacionesService'
import { AppError } from '@/lib/AppError'

interface ItemEntrada {
  productoId: number
  cantidad: number
}

const DIAS_VALIDEZ_DEFECTO = 7

// GET /api/cotizaciones - Lista de cotizaciones (con count de items).
// Los no-admin solo ven las suyas. Filtros opcionales por estado.
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }
  const esAdmin = sesion.user.rol === 'ADMIN'
  if (!esAdmin && !(await tienePermiso('REALIZAR_VENTAS'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const estado = request.nextUrl.searchParams.get('estado')
  const where: {
    empresaId: string
    vendedorId?: string
    estado?: 'PENDIENTE' | 'CONVERTIDA' | 'CANCELADA'
  } = { empresaId }
  if (!esAdmin) where.vendedorId = sesion.user.id
  if (estado === 'PENDIENTE' || estado === 'CONVERTIDA' || estado === 'CANCELADA') {
    where.estado = estado
  }

  const cotizaciones = await prisma.cotizacion.findMany({
    where,
    include: {
      vendedor: { select: { id: true, nombre: true, email: true } },
      _count: { select: { items: true } },
    },
    orderBy: { creadoEn: 'desc' },
  })
  return NextResponse.json(cotizaciones)
}

// POST /api/cotizaciones - Crea una cotizacion. Reserva stock implicito
// (cuando estado=PENDIENTE y validaHasta>now, otros endpoints la cuentan
// como reservada). NO descuenta stock fisico.
export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }
  const esAdmin = sesion.user.rol === 'ADMIN'
  if (!esAdmin && !(await tienePermiso('REALIZAR_VENTAS'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const datos = await request.json()
    const itemsCrudos = datos.items as unknown
    const notas = typeof datos.notas === 'string' ? datos.notas.trim() : ''
    const cliente = typeof datos.cliente === 'string' ? datos.cliente.trim() : ''
    const diasValidez = Number.isInteger(datos.diasValidez) && datos.diasValidez > 0
      ? Math.min(365, datos.diasValidez)
      : DIAS_VALIDEZ_DEFECTO

    if (!Array.isArray(itemsCrudos) || itemsCrudos.length === 0) {
      return NextResponse.json(
        { error: 'La cotización debe incluir al menos un producto.' },
        { status: 400 }
      )
    }

    const consolidados = new Map<number, number>()
    for (const it of itemsCrudos as ItemEntrada[]) {
      const productoId = parseInt(String(it.productoId), 10)
      const cantidad = parseInt(String(it.cantidad), 10)
      if (!productoId || cantidad <= 0) {
        return NextResponse.json(
          { error: 'Cada item debe tener un producto válido y cantidad > 0.' },
          { status: 400 }
        )
      }
      consolidados.set(productoId, (consolidados.get(productoId) ?? 0) + cantidad)
    }

    const vendedorId = sesion.user.id ? sesion.user.id : null
    
    const resultado = await CotizacionesService.crearCotizacion(consolidados, vendedorId, notas, cliente, empresaId, diasValidez)
    const cotizacion = resultado.cotizacion
    const total = resultado.total
    const validaHasta = resultado.validaHasta
    const itemsValidadosResult = resultado.itemsValidados

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Cotizacion',
      entidadId: cotizacion.id,
      empresaId,
      datos: {
        despues: {
          id: cotizacion.id,
          cliente: cliente || null,
          total,
          validaHasta,
          totalItems: itemsValidadosResult.length,
          notas: notas || null,
        },
      },
      ip: extraerIp(request),
    })

    revalidatePath('/cotizaciones')
    revalidatePath('/venta-rapida')
    revalidatePath('/productos')
    revalidatePath('/')

    return NextResponse.json(cotizacion, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    if (error instanceof Error && error.message.startsWith('STOCK_INSUFICIENTE:')) {
      const partes = error.message.split(':')
      const nombre = partes[1]
      const solicitado = partes[2]
      const disponible = partes[3]
      return NextResponse.json(
        {
          error: `Stock insuficiente para "${nombre}". Solicitas ${solicitado}, disponible ${disponible} (físico − reservado en otras cotizaciones).`,
        },
        { status: 400 }
      )
    }
    console.error('Error al crear cotización:', error)
    return NextResponse.json(
      { error: 'Error al crear la cotización' },
      { status: 500 }
    )
  }
}
