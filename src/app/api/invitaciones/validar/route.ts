import { NextRequest, NextResponse } from 'next/server'
import { InvitacionesService } from '@/services/InvitacionesService'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }

  try {
    const invitacion = await InvitacionesService.obtenerPorToken(token)
    if (!invitacion) {
      return NextResponse.json({ error: 'Invitación no encontrada o expirada' }, { status: 404 })
    }
    return NextResponse.json({
      valida: true,
      email: invitacion.email,
      empresaNombre: invitacion.empresa.nombre,
      expiraEn: invitacion.expiraEn,
    })
  } catch (error) {
    console.error('Error al validar invitación:', error)
    return NextResponse.json({ error: 'Error al validar invitación' }, { status: 500 })
  }
}
