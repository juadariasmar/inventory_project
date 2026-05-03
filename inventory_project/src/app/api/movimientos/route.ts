import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Obtener todos los movimientos
export async function GET() {
  try {
    const movimientos = await prisma.movimiento.findMany({
      include: { producto: true },
      orderBy: { creadoEn: 'desc' },
    })
    return NextResponse.json(movimientos)
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo movimiento y actualizar stock
export async function POST(request: NextRequest) {
  try {
    const datos = await request.json()

    const productoId = parseInt(datos.productoId)
    const cantidad = parseInt(datos.cantidad)
    const tipo = datos.tipo // 'entrada' o 'salida'

    // Obtener el producto actual
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Calcular nueva cantidad
    const nuevaCantidad =
      tipo === 'entrada'
        ? producto.cantidad + cantidad
        : producto.cantidad - cantidad

    // Validar que no quede stock negativo
    if (nuevaCantidad < 0) {
      return NextResponse.json(
        { error: 'No hay suficiente stock para esta salida' },
        { status: 400 }
      )
    }

    // Crear el movimiento y actualizar el producto en una transacción
    const [movimiento] = await prisma.$transaction([
      prisma.movimiento.create({
        data: {
          productoId,
          tipo,
          cantidad,
          notas: datos.notas || null,
        },
        include: { producto: true },
      }),
      prisma.producto.update({
        where: { id: productoId },
        data: { cantidad: nuevaCantidad },
      }),
    ])

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    console.error('Error al crear movimiento:', error)
    return NextResponse.json(
      { error: 'Error al crear movimiento' },
      { status: 500 }
    )
  }
}
