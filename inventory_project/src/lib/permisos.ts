import { getServerSession } from 'next-auth'
import { opcionesAuth } from './auth'
import { Rol, Permiso } from '@prisma/client'
import { prisma } from './db'

export async function obtenerSesion() {
  return await getServerSession(opcionesAuth)
}

export async function esAdmin() {
  const sesion = await obtenerSesion()
  return sesion?.user?.rol === 'ADMIN'
}



export async function tienePermiso(permiso: Permiso): Promise<boolean> {
  const sesion = await obtenerSesion()
  if (!sesion?.user) return false
  if (sesion.user.rol === 'ADMIN') return true

  const usuario = await prisma.usuario.findUnique({
    where: { id: parseInt(sesion.user.id, 10) },
    select: { permisos: true },
  })
  const permisos = usuario?.permisos ?? []
  return permisos.includes(permiso)
}
