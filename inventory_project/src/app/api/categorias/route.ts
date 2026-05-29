import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'

// GET - Obtener todas las categorías
export async function GET() {
  if (!(await obtenerSesion())?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  try {
    const categorias = await prisma.categoria.findMany({
      include: {
        _count: {
          select: { productos: true },
        },
      },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva categoría (solo ADMIN)
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const datos = await request.json()

    const categoria = await prisma.categoria.create({
      data: {
        nombre: datos.nombre,
      },
    })

    return NextResponse.json(categoria, { status: 201 })
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
