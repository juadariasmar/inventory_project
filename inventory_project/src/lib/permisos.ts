import { auth } from '@/lib/auth/server'
import { Permiso } from '@prisma/client'
import { prisma } from './db'
import { cache } from 'react'

export const obtenerSesion = cache(async () => {
  const sesionNeon = await auth.getSession()
  if (!sesionNeon?.user?.id) return null

  let usuario = await prisma.usuario.findUnique({
    where: { neonAuthId: sesionNeon.user.id },
  })

  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: {
        neonAuthId: sesionNeon.user.id,
        email: sesionNeon.user.email || '',
        nombre: sesionNeon.user.name || sesionNeon.user.email || 'Usuario',
        estado: 'PENDIENTE',
        rol: 'USUARIO',
      },
    })
  }

  return { ...sesionNeon, user: { ...sesionNeon.user, ...usuario } }
})

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

  const idParaBuscar = typeof sesion.user.id === 'number' ? sesion.user.id : parseInt(String(sesion.user.id), 10)
  const permisos = await obtenerPermisosUsuario(idParaBuscar)
  return permisos.includes(permiso)
}
