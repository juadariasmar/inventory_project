import { NextRequest, NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/permisos'
import { NotificacionesService } from '@/services/NotificacionesService'
import { AppError } from '@/lib/AppError'

export async function POST() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }

  try {
    const usuarioId = typeof sesion.user.id === 'string' ? sesion.user.id : String(sesion.user.id)
    await NotificacionesService.marcarTodasLeidas(empresaId, usuarioId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error al marcar notificaciones' }, { status: 500 })
  }
}
