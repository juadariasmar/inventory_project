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
// Reglas sobre la cantidad:
//  - Si la nueva cantidad es MENOR a la actual, se rechaza la edición.
//    Para reducir stock debe usarse un movimiento de salida desde /movimientos.
//  - Si la nueva cantidad es MAYOR, se crea automáticamente un movimiento de
//    entrada con la diferencia y nota "Ajuste por edición".
//  - Si es igual, solo se actualizan los otros campos.
export async function PUT(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    const productoId = parseInt(id)
    const datos = await request.json()
    const nuevaCantidad = parseInt(datos.cantidad)

    const actual = await prisma.producto.findUnique({
      where: { id: productoId },
      select: { cantidad: true },
    })

    if (!actual) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (nuevaCantidad < actual.cantidad) {
      return NextResponse.json(
        {
          error:
            'No se puede reducir la cantidad desde la edición del producto. ' +
            'Para descontar stock, registra un movimiento de salida desde Movimientos.',
        },
        { status: 400 }
      )
    }

    const delta = nuevaCantidad - actual.cantidad

    const producto = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.producto.update({
        where: { id: productoId },
        data: {
          nombre: datos.nombre,
          descripcion: datos.descripcion || null,
          codigo: datos.codigo,
          precio: parseFloat(datos.precio),
          cantidad: nuevaCantidad,
          stockMinimo: parseInt(datos.stockMinimo),
          categoriaId: datos.categoriaId ? parseInt(datos.categoriaId) : null,
        },
      })

      if (delta > 0) {
        await tx.movimiento.create({
          data: {
            productoId,
            tipo: 'entrada',
            cantidad: delta,
            notas: 'Ajuste por edición',
          },
        })
      }

      return actualizado
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
