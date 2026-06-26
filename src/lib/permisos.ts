import { auth } from '@/lib/auth/server'
import { Permiso } from '@prisma/client'
import { prisma } from './db'
import { cache } from 'react'
import { esEmailAdministrador } from './adminEmails'

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
    const emailFallback = data.user.email
    // Si ALLOWLIST_REGISTRO está definida, solo permite auto-creación para emails en esa lista
    if (process.env.ALLOWLIST_REGISTRO && emailFallback) {
      const permitidos = process.env.ALLOWLIST_REGISTRO.split(',').map(e => e.trim().toLowerCase())
      if (!permitidos.includes(emailFallback.toLowerCase()) && !esEmailAdministrador(emailFallback)) {
        console.warn(`[Auth] Auto-registro bloqueado para ${emailFallback} — no está en ALLOWLIST_REGISTRO`)
        return null
      }
    }
    console.warn(`[Auth Fallback] Creando usuario ${data.user.email} en obtenerSesion. El webhook de Neon Auth no llegó a tiempo o falló.`)
    const empresa = await prisma.empresa.create({
      data: { nombre: `Empresa de ${data.user.email ?? 'usuario'}` },
    })
    usuario = await prisma.usuario.create({
      data: {
        neonAuthId: data.user.id,
        email: data.user.email || '',
        nombre: data.user.name || data.user.email || 'Usuario',
        estado: 'ACTIVO',
        rol: 'ADMIN',
        empresaId: empresa.id,
      },
    })
  }

  if (
    usuario &&
    esEmailAdministrador(usuario.email) &&
    (usuario.rol !== 'SUPER_ADMIN' || usuario.estado !== 'ACTIVO')
  ) {
    usuario = await prisma.usuario.update({
      where: { id: usuario.id },
      data: { rol: 'SUPER_ADMIN', estado: 'ACTIVO' },
    })
  }

  return { ...data, user: { ...data.user, ...usuario } }
})

export async function esAdmin() {
  const sesion = await obtenerSesion()
  return (sesion?.user?.rol === 'ADMIN' || sesion?.user?.rol === 'SUPER_ADMIN') && sesion?.user?.estado === 'ACTIVO'
}

export async function esSuperAdmin() {
  const sesion = await obtenerSesion()
  if (!sesion?.user) return false
  return sesion.user.rol === 'SUPER_ADMIN' && sesion.user.estado === 'ACTIVO'
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
  if (sesion.user.rol === 'SUPER_ADMIN' || sesion.user.rol === 'ADMIN') return true

  const idParaBuscar = typeof sesion.user.id === 'string' ? sesion.user.id : String(sesion.user.id)
  const permisos = await obtenerPermisosUsuario(idParaBuscar)
  return permisos.includes(permiso)
}
