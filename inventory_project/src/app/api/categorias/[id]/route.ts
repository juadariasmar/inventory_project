import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface Parametros {
  params: Promise<{ id: string }>
}

// DELETE - Eliminar una categoría
export async function DELETE(request: NextRequest, { params }: Parametros) {
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

    await prisma.categoria.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ mensaje: 'Categoría eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}
