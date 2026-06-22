import { NextRequest, NextResponse } from 'next/server'
import { MovimientosService } from '@/services/MovimientosService'
import { AppError } from '@/lib/AppError'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { extraerIp } from '@/lib/auditoria'
import { revalidatePath } from 'next/cache'

// GET - Obtener todos los movimientos (con paginacion por cursor)
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

    const resultado = await MovimientosService.obtenerMovimientos(cursor, limite)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo movimiento
export async function POST(request: NextRequest) {
  try {
    const session = await obtenerSesion()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const data = await request.json()
    const tipo = data.tipo

    const puedeRegistrar = await tienePermiso('REGISTRAR_MOVIMIENTOS')
    const puedeVender = await tienePermiso('REALIZAR_VENTAS')
    const autorizado = puedeRegistrar || (puedeVender && tipo === 'salida')
    if (!autorizado) {
      return NextResponse.json(
        { error: 'No tienes permiso para realizar este movimiento' },
        { status: 403 }
      )
    }

    const ip = extraerIp(request)
    const usuarioId = String(session.user.id)
    
    const movimiento = await MovimientosService.registrarMovimiento(data, usuarioId, ip || '')
    
    revalidatePath('/movimientos')
    revalidatePath('/movimientos/nuevo')
    revalidatePath('/productos')
    revalidatePath('/analisis')
    revalidatePath('/')

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al crear movimiento:', error)
    return NextResponse.json({ error: 'Error al crear movimiento' }, { status: 500 })
  }
}
