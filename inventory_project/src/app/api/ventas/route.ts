import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { obtenerReservasPorProducto } from '@/lib/reservas'

interface ItemEntrada {
  productoId: number
  cantidad: number
}

/**
 * POST /api/ventas - Registra una venta con multiples items.
 * Crea una Venta + N ItemVenta + N Movimientos (uno por producto) en una
 * sola transaccion. El stock se descuenta automaticamente.
 *
 * Requiere permiso REALIZAR_VENTAS o rol ADMIN.
 */
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

    if (!Array.isArray(itemsCrudos) || itemsCrudos.length === 0) {
      return NextResponse.json(
        { error: 'La venta debe incluir al menos un producto.' },
        { status: 400 }
      )
    }

    // Consolidar por productoId (por si el cliente envia el mismo dos veces).
    const consolidados = new Map<number, number>()
    for (const it of itemsCrudos as ItemEntrada[]) {
      const productoId = parseInt(String(it.productoId), 10)
      const cantidad = parseInt(String(it.cantidad), 10)
      if (!productoId || cantidad <= 0) {
        return NextResponse.json(
          { error: 'Cada item debe tener un producto valido y cantidad > 0.' },
          { status: 400 }
        )
      }
      consolidados.set(productoId, (consolidados.get(productoId) ?? 0) + cantidad)
    }

    const productosIds = Array.from(consolidados.keys())
    const [productos, reservas] = await Promise.all([
      prisma.producto.findMany({
        where: { id: { in: productosIds } },
      }),
      obtenerReservasPorProducto(productosIds),
    ])
    const mapaProductos = new Map(productos.map((p) => [p.id, p]))

    // Validar stock DISPONIBLE (fisico - reservado en cotizaciones vigentes).
    const itemsValidados: { productoId: number; cantidad: number; precio: number; nombre: string; codigo: string }[] = []
    for (const [productoId, cantidad] of consolidados.entries()) {
      const p = mapaProductos.get(productoId)
      if (!p) {
        return NextResponse.json(
          { error: `Producto ${productoId} no encontrado.` },
          { status: 404 }
        )
      }
      const reservado = reservas.get(productoId) ?? 0
      const disponible = Math.max(0, p.cantidad - reservado)
      if (cantidad > disponible) {
        const detalle = reservado > 0
          ? ` (físico ${p.cantidad} − reservado ${reservado} en cotizaciones)`
          : ''
        return NextResponse.json(
          {
            error: `Stock insuficiente para "${p.nombre}". Solicitas ${cantidad}, disponible ${disponible}${detalle}.`,
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

    const venta = await prisma.$transaction(async (tx) => {
      const v = await tx.venta.create({
        data: {
          vendedorId,
          total,
          notas: notas || null,
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

      for (const it of itemsValidados) {
        await tx.movimiento.create({
          data: {
            productoId: it.productoId,
            tipo: 'salida',
            cantidad: it.cantidad,
            notas: notas ? `Venta #${v.id} — ${notas}` : `Venta #${v.id}`,
            ventaId: v.id,
          },
        })
        await tx.producto.update({
          where: { id: it.productoId },
          data: { cantidad: { decrement: it.cantidad } },
        })
      }

      return v
    })

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Venta',
      entidadId: venta.id,
      datos: {
        despues: {
          id: venta.id,
          total,
          totalItems: itemsValidados.length,
          totalUnidades: itemsValidados.reduce((s, it) => s + it.cantidad, 0),
          notas: notas || null,
          items: itemsValidados.map((it) => ({
            productoId: it.productoId,
            nombre: it.nombre,
            codigo: it.codigo,
            cantidad: it.cantidad,
            precioUnitario: it.precio,
          })),
        },
      },
      ip: extraerIp(request),
    })

    revalidatePath('/movimientos')
    revalidatePath('/productos')
    revalidatePath('/analisis')
    revalidatePath('/')
    revalidatePath('/venta-rapida')

    return NextResponse.json(venta, { status: 201 })
  } catch (error) {
    console.error('Error al registrar venta:', error)
    return NextResponse.json(
      { error: 'Error al registrar la venta' },
      { status: 500 }
    )
  }
}
