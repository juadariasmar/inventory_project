import { getServerSession } from 'next-auth'
import { opcionesAuth } from './auth'
import { Permiso } from '@prisma/client'
import { prisma } from './db'
import { cache } from 'react'

export async function obtenerSesion() {
  return await getServerSession(opcionesAuth)
}

export async function esAdmin() {
  const sesion = await obtenerSesion()
  return sesion?.user?.rol === 'ADMIN'
}

const obtenerPermisosUsuario = cache(async (usuarioId: number) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { permisos: true },
  })
  return usuario?.permisos ?? []
})

export async function tienePermiso(permiso: Permiso): Promise<boolean> {
  const sesion = await obtenerSesion()
  if (!sesion?.user) return false
  if (sesion.user.rol === 'ADMIN') return true

  const permisos = await obtenerPermisosUsuario(parseInt(sesion.user.id, 10))
  return permisos.includes(permiso)
}
