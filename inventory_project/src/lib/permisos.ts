import { getServerSession } from 'next-auth'
import { opcionesAuth } from './auth'
import { Rol } from '@prisma/client'

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
