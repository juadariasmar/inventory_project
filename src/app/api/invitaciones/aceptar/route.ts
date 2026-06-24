import { NextRequest, NextResponse } from 'next/server'
import { InvitacionesService } from '@/services/InvitacionesService'
import { AppError } from '@/lib/AppError'

export async function POST(request: NextRequest) {
  try {
    const { token, neonAuthId, email, nombre } = await request.json()

    if (!token || !neonAuthId || !email || !nombre) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos (token, neonAuthId, email, nombre)' },
        { status: 400 },
      )
    }

    const usuario = await InvitacionesService.aceptar(token, neonAuthId, email, nombre)
    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Error al aceptar invitación:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error al aceptar invitación' }, { status: 500 })
  }
}
