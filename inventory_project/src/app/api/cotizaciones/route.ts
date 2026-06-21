import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { obtenerDisponiblePorProducto } from '@/lib/reservas'

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
  const esAdmin = sesion.user.rol === 'ADMIN'
  if (!esAdmin && !(await tienePermiso('REALIZAR_VENTAS'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const estado = request.nextUrl.searchParams.get('estado')
  const where: {
    vendedorId?: number
    estado?: 'PENDIENTE' | 'CONVERTIDA' | 'CANCELADA'
  } = {}
  if (!esAdmin) where.vendedorId = parseInt(sesion.user.id, 10)
  if (estado === 'PENDIENTE' || estado === 'CONVERTIDA' || estado === 'CANCELADA') {
    where.estado = estado
  }

  const cotizaciones = await prisma.cotizacion.findMany({
    where,
    include: {
      vendedor: { select: { id: true, nombre: true, nombreUsuario: true } },
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

    const productosIds = Array.from(consolidados.keys())
    const [productos, disponiblePorProducto] = await Promise.all([
      prisma.producto.findMany({ where: { id: { in: productosIds } } }),
      obtenerDisponiblePorProducto(productosIds),
    ])
    const mapaProductos = new Map(productos.map((p) => [p.id, p]))

    // Validar contra stock DISPONIBLE (fisico - reservado en otras cotizaciones).
    const itemsValidados: { productoId: number; cantidad: number; precio: number; nombre: string; codigo: string }[] = []
    for (const [productoId, cantidad] of consolidados.entries()) {
      const p = mapaProductos.get(productoId)
      if (!p) {
        return NextResponse.json(
          { error: `Producto ${productoId} no encontrado.` },
          { status: 404 }
        )
      }
      const disponible = disponiblePorProducto.get(productoId) ?? 0
      if (cantidad > disponible) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para "${p.nombre}". Solicitas ${cantidad}, disponible ${disponible} (físico ${p.cantidad} − reservado en otras cotizaciones).`,
          },
          { status: 400 }
        )
      }
      itemsValidados.push({
        productoId: p.id,
        cantidad,
        precio: p.precio,
        nombre: p.nombre,
        codigo: p.codigo,
      })
    }

    const total = itemsValidados.reduce((s, it) => s + it.precio * it.cantidad, 0)
    const vendedorId = sesion.user.id ? parseInt(sesion.user.id, 10) : null
    const validaHasta = new Date()
    validaHasta.setDate(validaHasta.getDate() + diasValidez)
    const ahora = new Date()

    // La creacion de la cotizacion ocurre dentro de una transaccion.
    // Se re-verifica la disponibilidad usando el cliente tx para que la lectura
    // de reservas sea atomica con la insercion de los nuevos items.
    const cotizacion = await prisma.$transaction(async (tx) => {
      for (const it of itemsValidados) {
        const prod = await tx.producto.findUnique({
          where: { id: it.productoId },
          select: { cantidad: true, nombre: true },
        })
        const reservasActuales = await tx.itemCotizacion.aggregate({
          where: {
            productoId: it.productoId,
            cotizacion: { estado: 'PENDIENTE', validaHasta: { gt: ahora } },
          },
          _sum: { cantidad: true },
        })
        const disponibleTx = Math.max(
          0,
          (prod?.cantidad ?? 0) - (reservasActuales._sum.cantidad ?? 0)
        )
        if (it.cantidad > disponibleTx) {
          throw new Error(
            `STOCK_INSUFICIENTE:${prod?.nombre ?? it.productoId}:${it.cantidad}:${disponibleTx}`
          )
        }
      }

      return tx.cotizacion.create({
        data: {
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
    })

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Cotizacion',
      entidadId: cotizacion.id,
      datos: {
        despues: {
          id: cotizacion.id,
          cliente: cliente || null,
          total,
          validaHasta,
          totalItems: itemsValidados.length,
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
