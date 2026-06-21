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
 * La validacion de stock disponible (fisico − reservado en cotizaciones)
 * ocurre DENTRO de la transaccion para evitar race conditions (TOCTOU).
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
    const vendedorId = sesion.user.id ? parseInt(sesion.user.id, 10) : null

    // Toda la operacion ocurre en una sola transaccion:
    // 1. Se leen precios y nombres actuales de los productos (datos frescos).
    // 2. Se verifica el stock disponible (fisico - reservas) DENTRO de la tx.
    // 3. Se crea la venta, items, movimientos y se descuenta el stock.
    // Si cualquier producto falla la validacion, toda la tx hace rollback.
    const resultado = await prisma.$transaction(async (tx) => {
      // Leer productos y reservas dentro de la transaccion.
      const productos = await tx.producto.findMany({
        where: { id: { in: productosIds } },
        select: { id: true, cantidad: true, precio: true, nombre: true, codigo: true },
      })
      const mapaProductos = new Map(productos.map((p) => [p.id, p]))

      // obtenerReservasPorProducto acepta tx para mantener atomicidad.
      const reservas = await obtenerReservasPorProducto(productosIds, tx)

      // Validar stock disponible para cada item.
      const itemsValidados: {
        productoId: number
        cantidad: number
        precio: number
        nombre: string
        codigo: string
      }[] = []

      for (const [productoId, cantidad] of consolidados.entries()) {
        const p = mapaProductos.get(productoId)
        if (!p) throw new Error(`PRODUCTO_NO_ENCONTRADO:${productoId}`)

        const reservado = reservas.get(productoId) ?? 0
        const disponible = Math.max(0, p.cantidad - reservado)
        if (cantidad > disponible) {
          const detalle = reservado > 0
            ? ` (físico ${p.cantidad} − reservado ${reservado} en cotizaciones)`
            : ''
          throw new Error(`STOCK_INSUFICIENTE:${p.nombre}::${cantidad}::${disponible}::${detalle}`)
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
        // decrement es atomico: PostgreSQL ejecuta SET cantidad = cantidad - N
        await tx.producto.update({
          where: { id: it.productoId },
          data: { cantidad: { decrement: it.cantidad } },
        })
      }

      return { venta: v, itemsValidados, total }
    })

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Venta',
      entidadId: resultado.venta.id,
      datos: {
        despues: {
          id: resultado.venta.id,
          total: resultado.total,
          totalItems: resultado.itemsValidados.length,
          totalUnidades: resultado.itemsValidados.reduce((s, it) => s + it.cantidad, 0),
          notas: notas || null,
          items: resultado.itemsValidados.map((it) => ({
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

    return NextResponse.json(resultado.venta, { status: 201 })
  } catch (error) {
    // Manejar errores de negocio lanzados desde dentro de la transaccion.
    if (error instanceof Error) {
      if (error.message.startsWith('STOCK_INSUFICIENTE:')) {
        const partes = error.message.split('::')
        const nombre = partes[0].replace('STOCK_INSUFICIENTE:', '')
        const solicitado = partes[1]
        const disponible = partes[2]
        const detalle = partes[3] ?? ''
        return NextResponse.json(
          {
            error: `Stock insuficiente para "${nombre}". Solicitas ${solicitado}, disponible ${disponible}${detalle}.`,
          },
          { status: 400 }
        )
      }
      if (error.message.startsWith('PRODUCTO_NO_ENCONTRADO:')) {
        return NextResponse.json(
          { error: 'Uno o más productos no fueron encontrados.' },
          { status: 404 }
        )
      }
    }
    console.error('Error al registrar venta:', error)
    return NextResponse.json(
      { error: 'Error al registrar la venta' },
      { status: 500 }
    )
  }
}
