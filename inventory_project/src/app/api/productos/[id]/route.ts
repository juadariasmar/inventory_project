import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'

interface Parametros {
  params: Promise<{ id: string }>
}

// GET - Obtener un producto por ID
export async function GET(request: NextRequest, { params }: Parametros) {
  if (!(await obtenerSesion())?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  try {
    const { id } = await params
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: { categoria: true },
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al obtener producto:', error)
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un producto (solo ADMIN)
export async function PUT(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    const datos = await request.json()

    const producto = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion || null,
        codigo: datos.codigo,
        precio: parseFloat(datos.precio),
        cantidad: parseInt(datos.cantidad),
        stockMinimo: parseInt(datos.stockMinimo),
        categoriaId: datos.categoriaId ? parseInt(datos.categoriaId) : null,
      },
    })

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un producto (solo ADMIN)
export async function DELETE(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    await prisma.producto.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ mensaje: 'Producto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}
