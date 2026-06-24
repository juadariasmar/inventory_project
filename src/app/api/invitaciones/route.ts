import { NextRequest, NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/permisos'
import { extraerIp } from '@/lib/auditoria'
import { InvitacionesService } from '@/services/InvitacionesService'
import { AppError } from '@/lib/AppError'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId || sesion.user.rol !== 'ADMIN' || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const datos = await request.json()
    const ip = extraerIp(request) || '127.0.0.1'

    const empresa = await prisma.empresa.findUnique({
      where: { id: sesion.user.empresaId },
      select: { nombre: true },
    })

    const invitacion = await InvitacionesService.crear(
      datos,
      sesion.user.id,
      sesion.user.empresaId,
      empresa?.nombre || '',
      ip,
    )
    return NextResponse.json(invitacion, { status: 201 })
  } catch (error) {
    console.error('Error al crear invitación:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error al crear invitación' }, { status: 500 })
  }
}

export async function GET() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const invitaciones = await InvitacionesService.listar(sesion.user.empresaId)
    return NextResponse.json(invitaciones)
  } catch (error) {
    console.error('Error al listar invitaciones:', error)
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    return NextResponse.json({ error: 'Error al listar invitaciones' }, { status: 500 })
  }
}
