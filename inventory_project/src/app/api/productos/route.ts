import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Obtener todos los productos
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: { categoria: true },
      orderBy: { creadoEn: 'desc' },
    })
    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo producto
export async function POST(request: NextRequest) {
  try {
    const datos = await request.json()

    const producto = await prisma.producto.create({
      data: {
        nombre: datos.nombre,
        descripcion: datos.descripcion || null,
        codigo: datos.codigo,
        precio: parseFloat(datos.precio),
        cantidad: parseInt(datos.cantidad) || 0,
        stockMinimo: parseInt(datos.stockMinimo) || 5,
        categoriaId: datos.categoriaId ? parseInt(datos.categoriaId) : null,
      },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
