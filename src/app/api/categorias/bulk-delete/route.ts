import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

// POST /api/categorias/bulk-delete  body: { ids: number[] }
// Solo borra categorias SIN productos. Si alguna tiene productos, la
// transaccion falla y no borra nada.
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
        { error: 'Debes seleccionar al menos una categoría.' },
        { status: 400 }
      )
    }
    const ids = idsCrudos
      .map((x) => parseInt(String(x), 10))
      .filter((n) => Number.isInteger(n) && n > 0)
    if (ids.length === 0) {
      return NextResponse.json({ error: 'IDs inválidos.' }, { status: 400 })
    }

    const categorias = await prisma.categoria.findMany({
      where: { id: { in: ids }, empresaId },
      include: { _count: { select: { productos: true } } },
    })
    if (categorias.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró ninguna categoría con esos IDs.' },
        { status: 404 }
      )
    }

    const conProductos = categorias.filter((c) => c._count.productos > 0)
    if (conProductos.length > 0) {
      const nombres = conProductos
        .map((c) => `"${c.nombre}" (${c._count.productos})`)
        .slice(0, 5)
        .join(', ')
      const sobrante = conProductos.length > 5 ? ` y ${conProductos.length - 5} más` : ''
      return NextResponse.json(
        {
          error: `${conProductos.length} categoría(s) tienen productos asociados: ${nombres}${sobrante}. Reasigna o borra esos productos primero.`,
        },
        { status: 409 }
      )
    }

    const idsValidos = categorias.map((c) => c.id)
    await prisma.categoria.deleteMany({ where: { id: { in: idsValidos }, empresaId } })

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Categoria',
      datos: {
        operacion: 'BULK_DELETE',
        cantidad: categorias.length,
        categorias: categorias.map((c) => ({ id: c.id, nombre: c.nombre, prefijo: c.prefijo })),
      },
      ip: extraerIp(request),
    })

    revalidatePath('/productos/categorias')
    revalidatePath('/productos')
    revalidatePath('/productos/nuevo')
    revalidatePath('/categorias')

    return NextResponse.json({
      eliminadas: categorias.length,
      ids: idsValidos,
    })
  } catch (error) {
    console.error('Error en bulk delete de categorias:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categorías.' },
      { status: 500 }
    )
  }
}
