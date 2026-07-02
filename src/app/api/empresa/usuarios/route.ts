import { NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/permisos'
import { prisma } from '@/lib/db'

export async function GET() {
  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const usuarios = await prisma.usuario.findMany({
    where: { empresaId: sesion.user.empresaId },
    select: { id: true, nombre: true, email: true, rol: true, estado: true },
    orderBy: { creadoEn: 'asc' },
  })

  return NextResponse.json({
    usuarios,
    esAdmin: sesion.user.rol === 'ADMIN' || sesion.user.rol === 'SUPER_ADMIN',
  })
}
