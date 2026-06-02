import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

interface Parametros {
  params: Promise<{ id: string }>
}

// DELETE - Eliminar una categoría (solo ADMIN)
export async function DELETE(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params

    // Verificar si hay productos asociados
    const productosAsociados = await prisma.producto.count({
      where: { categoriaId: parseInt(id) },
    })

    if (productosAsociados > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una categoría con productos asociados' },
        { status: 400 }
      )
    }

    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id: parseInt(id) },
    })

    await prisma.categoria.delete({
      where: { id: parseInt(id) },
    })

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Categoria',
      entidadId: parseInt(id),
      datos: { antes: categoriaExistente },
      ip: extraerIp(request),
    })

    revalidatePath('/categorias')
    revalidatePath('/productos/nuevo')
    revalidatePath('/productos', 'layout')

    return NextResponse.json({ mensaje: 'Categoría eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}
