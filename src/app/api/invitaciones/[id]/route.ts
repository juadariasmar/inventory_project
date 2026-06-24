import { NextRequest, NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/permisos'
import { extraerIp } from '@/lib/auditoria'
import { InvitacionesService } from '@/services/InvitacionesService'
import { AppError } from '@/lib/AppError'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId || sesion.user.rol !== 'ADMIN' || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const ip = extraerIp(_request) || '127.0.0.1'
    await InvitacionesService.cancelar(id, sesion.user.empresaId, sesion.user.id, ip)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al cancelar invitación:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error al cancelar invitación' }, { status: 500 })
  }
}
