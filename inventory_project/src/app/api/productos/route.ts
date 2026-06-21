import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { siguienteCodigoConsecutivoPorCategoria } from '@/lib/codigos'

// GET - Obtener todos los productos (con paginacion por cursor)
export async function GET(request: NextRequest) {
  if (!(await obtenerSesion())?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  try {
    const cursorStr = request.nextUrl.searchParams.get('cursor')
    const limiteStr = request.nextUrl.searchParams.get('limite')
    
    const limite = Math.min(parseInt(limiteStr ?? '50', 10), 100)
    const cursor = cursorStr && !isNaN(parseInt(cursorStr, 10)) ? parseInt(cursorStr, 10) : undefined

    const productos = await prisma.producto.findMany({
      include: { categoria: true },
      orderBy: { creadoEn: 'desc' },
      take: limite + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hayMas = productos.length > limite
    const items = hayMas ? productos.slice(0, limite) : productos
    const nextCursor = hayMas ? items[items.length - 1].id : null

    return NextResponse.json({
      items,
      nextCursor,
      total: items.length
    })
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

    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : ''
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio.' },
        { status: 400 }
      )
    }

    const categoriaId = parseInt(datos.categoriaId, 10)
    if (!categoriaId || Number.isNaN(categoriaId)) {
      return NextResponse.json(
        { error: 'La categoría es obligatoria.' },
        { status: 400 }
      )
    }
    const categoriaExiste = await prisma.categoria.findUnique({
      where: { id: categoriaId },
      select: { id: true },
    })
    if (!categoriaExiste) {
      return NextResponse.json(
        { error: 'La categoría seleccionada no existe.' },
        { status: 400 }
      )
    }

    let codigo = typeof datos.codigo === 'string' ? datos.codigo.trim() : ''
    if (!codigo) {
      codigo = await siguienteCodigoConsecutivoPorCategoria(categoriaId)
    }

    const precio = parseFloat(datos.precio)
    if (!Number.isFinite(precio) || precio < 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido.' },
        { status: 400 }
      )
    }

    const producto = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.producto.create({
        data: {
          nombre,
          descripcion: datos.descripcion || null,
          codigo,
          precio,
          cantidad: cantidadInicial,
          stockMinimo: parseInt(datos.stockMinimo) || 1,
          categoriaId,
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

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Producto',
      entidadId: producto.id,
      datos: { despues: producto },
      ip: extraerIp(request),
    })

    revalidatePath('/movimientos')
    revalidatePath('/movimientos/nuevo')
    revalidatePath('/productos')
    revalidatePath('/')
    revalidatePath('/analisis')

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese código.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
