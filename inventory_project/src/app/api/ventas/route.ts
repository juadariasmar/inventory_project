import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { VentasService } from '@/services/VentasService'
import { AppError } from '@/lib/AppError'

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

    const vendedorId = sesion.user.id ? parseInt(sesion.user.id, 10) : null

    const resultado = await VentasService.registrarVenta(consolidados, vendedorId, notas)

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
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al registrar venta:', error)
    return NextResponse.json(
      { error: 'Error al registrar la venta' },
      { status: 500 }
    )
  }
}
