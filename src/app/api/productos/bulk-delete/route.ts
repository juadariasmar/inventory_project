import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

// POST /api/productos/bulk-delete  body: { ids: number[] }
// Borra varios productos en una sola transaccion. Cada uno arrastra sus
// movimientos (igual que la eliminacion individual). Si algun producto
// esta referenciado por ventas o cotizaciones, la transaccion entera falla
// para no dejar la BD en un estado inconsistente.
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const sesion = await obtenerSesion()
  const empresaId = sesion?.user?.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }
  try {
    const datos = await request.json().catch(() => ({}))
    const idsCrudos = datos.ids
    if (!Array.isArray(idsCrudos) || idsCrudos.length === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar al menos un producto.' },
        { status: 400 }
      )
    }
    const ids = idsCrudos
      .map((x) => parseInt(String(x), 10))
      .filter((n) => Number.isInteger(n) && n > 0)
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs inválidos.' },
        { status: 400 }
      )
    }

    const productos = await prisma.producto.findMany({
      where: { id: { in: ids }, empresaId },
      select: { id: true, nombre: true, codigo: true, cantidad: true },
    })
    if (productos.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró ningún producto con esos IDs.' },
        { status: 404 }
      )
    }

    // Buscar referencias bloqueantes (items de venta o cotizacion).
    const [conItemsVenta, conItemsCotizacion] = await Promise.all([
      prisma.itemVenta.findMany({
        where: { productoId: { in: ids }, venta: { empresaId } },
        select: { productoId: true },
        distinct: ['productoId'],
      }),
      prisma.itemCotizacion.findMany({
        where: { productoId: { in: ids }, cotizacion: { empresaId } },
        select: { productoId: true },
        distinct: ['productoId'],
      }),
    ])
    const bloqueados = new Set([
      ...conItemsVenta.map((x) => x.productoId),
      ...conItemsCotizacion.map((x) => x.productoId),
    ])
    if (bloqueados.size > 0) {
      const nombres = productos
        .filter((p) => bloqueados.has(p.id))
        .map((p) => `"${p.nombre}"`)
        .slice(0, 5)
        .join(', ')
      const sobrante = bloqueados.size > 5 ? ` y ${bloqueados.size - 5} más` : ''
      return NextResponse.json(
        {
          error: `${bloqueados.size} producto(s) tienen ventas o cotizaciones asociadas: ${nombres}${sobrante}. No se borrará nada hasta que se eliminen sus ventas/cotizaciones o uses "Restablecer datos".`,
        },
        { status: 409 }
      )
    }

    const idsValidos = productos.map((p) => p.id)
    await prisma.$transaction(async (tx) => {
      const conStock = productos.filter((p) => p.cantidad > 0)
      if (conStock.length > 0) {
        await tx.movimiento.createMany({
          data: conStock.map((p) => ({
            productoId: p.id,
            empresaId,
            tipo: 'salida' as const,
            cantidad: p.cantidad,
            notas: `Producto "${p.nombre}" eliminado del inventario (borrado masivo)`,
          })),
        })
      }
      await tx.movimiento.deleteMany({ where: { productoId: { in: idsValidos }, empresaId } })
      await tx.producto.deleteMany({ where: { id: { in: idsValidos }, empresaId } })
    })

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Producto',
      datos: {
        operacion: 'BULK_DELETE',
        cantidad: productos.length,
        productos: productos.map((p) => ({ id: p.id, nombre: p.nombre, codigo: p.codigo })),
      },
      ip: extraerIp(request),
    })

    revalidatePath('/productos')
    revalidatePath('/productos/categorias')
    revalidatePath('/movimientos')
    revalidatePath('/analisis')
    revalidatePath('/')

    return NextResponse.json({
      eliminados: productos.length,
      ids: idsValidos,
    })
  } catch (error) {
    console.error('Error en bulk delete de productos:', error)
    return NextResponse.json(
      { error: 'Error al eliminar productos.' },
      { status: 500 }
    )
  }
}
