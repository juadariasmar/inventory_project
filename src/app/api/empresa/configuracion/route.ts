import { NextRequest, NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/permisos'
import { extraerIp } from '@/lib/auditoria'
import { ConfiguracionService } from '@/services/ConfiguracionService'
import { AppError } from '@/lib/AppError'

export async function GET() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const config = await ConfiguracionService.obtener(sesion.user.empresaId)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error al obtener configuración:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId || sesion.user.rol !== 'ADMIN' || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const datos = await request.json()
    const ip = extraerIp(request) || '127.0.0.1'
    const config = await ConfiguracionService.actualizar(
      sesion.user.empresaId,
      datos,
      sesion.user.id,
      ip,
    )
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error al actualizar configuración:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
