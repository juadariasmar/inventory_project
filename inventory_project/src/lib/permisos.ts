import { auth } from '@/lib/auth/server'
import { Permiso } from '@prisma/client'
import { prisma } from './db'
import { cache } from 'react'

export const obtenerSesion = cache(async () => {
  const { data } = await auth.getSession()
  if (!data?.user?.id) return null

  let usuario = await prisma.usuario.findUnique({
    where: { neonAuthId: data.user.id },
  })

  if (!usuario && data.user.email) {
    usuario = await prisma.usuario.findUnique({
      where: { email: data.user.email }
    })
    if (usuario) {
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { neonAuthId: data.user.id }
      })
    }
  }

  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: {
        neonAuthId: data.user.id,
        email: data.user.email || '',
        nombre: data.user.name || data.user.email || 'Usuario',
        estado: 'PENDIENTE',
        rol: 'USUARIO',
      },
    })
  }

  return { ...data, user: { ...data.user, ...usuario } }
})

export async function esAdmin() {
  const sesion = await obtenerSesion()
  return sesion?.user?.rol === 'ADMIN' && sesion?.user?.estado === 'ACTIVO'
}

const obtenerPermisosUsuario = cache(async (usuarioId: string) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { permisos: true },
  })
  return usuario?.permisos ?? []
})

export async function tienePermiso(permiso: Permiso): Promise<boolean> {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') return false
  if (sesion.user.rol === 'ADMIN') return true

  const idParaBuscar = typeof sesion.user.id === 'string' ? sesion.user.id : String(sesion.user.id)
  const permisos = await obtenerPermisosUsuario(idParaBuscar)
  return permisos.includes(permiso)
}
