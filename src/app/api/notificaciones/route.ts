import { NextRequest, NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/permisos'
import { NotificacionesService } from '@/services/NotificacionesService'
import { AppError } from '@/lib/AppError'

export async function GET(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }

  try {
    const soloNoLeidas = request.nextUrl.searchParams.get('soloNoLeidas') === 'true'
    const usuarioId = typeof sesion.user.id === 'string' ? sesion.user.id : String(sesion.user.id)

    if (request.nextUrl.searchParams.get('contador') === 'true') {
      const count = await NotificacionesService.contarNoLeidas(empresaId, usuarioId)
      return NextResponse.json({ count })
    }

    const notificaciones = await NotificacionesService.obtenerTodas(empresaId, usuarioId, soloNoLeidas)
    return NextResponse.json(notificaciones)
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al obtener notificaciones:', error)
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}
