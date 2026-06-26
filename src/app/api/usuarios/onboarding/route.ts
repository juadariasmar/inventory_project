import { NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/permisos'
import { prisma } from '@/lib/db'

export async function PATCH() {
  const sesion = await obtenerSesion()
  if (!sesion) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const usuarioId = typeof sesion.user.id === 'string' ? sesion.user.id : String(sesion.user.id)

  await prisma.usuario.update({
    where: { id: usuarioId, empresaId: sesion.user.empresaId! },
    data: { onboardingCompletado: true },
  })

  return NextResponse.json({ ok: true })
}
