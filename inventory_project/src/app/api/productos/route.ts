import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'

// GET - Obtener todos los productos
export async function GET() {
  if (!(await obtenerSesion())?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
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

// POST - Crear un nuevo producto (solo ADMIN)
// Si la cantidad inicial es > 0, registra automáticamente un movimiento de entrada
// con nota "Stock inicial" para mantener trazabilidad completa.
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const datos = await request.json()
    const cantidadInicial = parseInt(datos.cantidad) || 0

    const producto = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.producto.create({
        data: {
          nombre: datos.nombre,
          descripcion: datos.descripcion || null,
          codigo: datos.codigo,
          precio: parseFloat(datos.precio),
          cantidad: cantidadInicial,
          stockMinimo: parseInt(datos.stockMinimo) || 1,
          categoriaId: datos.categoriaId ? parseInt(datos.categoriaId) : null,
        },
      })

      if (cantidadInicial > 0) {
        await tx.movimiento.create({
          data: {
            productoId: nuevo.id,
            tipo: 'entrada',
            cantidad: cantidadInicial,
            notas: 'Stock inicial',
          },
        })
      }

      return nuevo
    })

    revalidatePath('/movimientos')
    revalidatePath('/movimientos/nuevo')
    revalidatePath('/productos')
    revalidatePath('/')
    revalidatePath('/analisis')

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
