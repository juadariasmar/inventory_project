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

export async function requerirSesion() {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    throw new Error('NO_AUTORIZADO')
  }
  return sesion
}

export async function requerirRol(rol: Rol) {
  const sesion = await requerirSesion()
  if (sesion.user.rol !== rol) {
    throw new Error('PROHIBIDO')
  }
  return sesion
}

/**
 * Devuelve los permisos efectivos del usuario actual.
 * El rol ADMIN concede automáticamente todos los permisos.
 */
export async function obtenerPermisos(): Promise<Permiso[]> {
  const sesion = await obtenerSesion()
  if (!sesion?.user) return []
  if (sesion.user.rol === 'ADMIN') {
    return Object.values(Permiso)
  }
  const usuario = await prisma.usuario.findUnique({
    where: { id: parseInt(sesion.user.id, 10) },
    select: { permisos: true },
  })
  return usuario?.permisos ?? []
}

export async function tienePermiso(permiso: Permiso): Promise<boolean> {
  const permisos = await obtenerPermisos()
  return permisos.includes(permiso)
}

export async function requerirPermiso(permiso: Permiso) {
  const sesion = await requerirSesion()
  const ok = await tienePermiso(permiso)
  if (!ok) {
    throw new Error('PROHIBIDO')
  }
  return sesion
}
