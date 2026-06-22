import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp } from '@/lib/auditoria'
import { ProductosService } from '@/services/ProductosService'
import { AppError } from '@/lib/AppError'

// GET - Obtener todos los productos (con paginacion por cursor)
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion();
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  try {
    const cursorStr = request.nextUrl.searchParams.get('cursor')
    const limiteStr = request.nextUrl.searchParams.get('limite')
    
    const limite = Math.min(parseInt(limiteStr ?? '50', 10), 100)
    const cursor = cursorStr && !isNaN(parseInt(cursorStr, 10)) ? parseInt(cursorStr, 10) : undefined

    const resultado = await ProductosService.obtenerTodos(cursor, limite)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo producto (solo ADMIN)
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const datos = await request.json()
    const ip = extraerIp(request)
    
    const producto = await ProductosService.crear(datos, ip)

    revalidatePath('/movimientos')
    revalidatePath('/movimientos/nuevo')
    revalidatePath('/productos')
    revalidatePath('/')
    revalidatePath('/analisis')

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    console.error('Error al crear producto:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
