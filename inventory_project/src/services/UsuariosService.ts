import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'

// Removed manual password validation since Neon Auth manages credentials

const permisosValidos = ['VER_ANALISIS', 'EXPORTAR_REPORTES', 'REGISTRAR_MOVIMIENTOS', 'REALIZAR_VENTAS'] as const

export const UsuariosService = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async crearUsuario(datos: any) {
    if (!datos.email || !datos.nombre) {
      throw new AppError('Campos requeridos faltantes', 400)
    }

    const existente = await prisma.usuario.findUnique({
      where: { email: datos.email },
    })
    if (existente) {
      throw new AppError('El nombre de usuario ya existe', 409)
    }

    const permisos = Array.isArray(datos.permisos)
      ? datos.permisos.filter((p: string) => permisosValidos.includes(p as typeof permisosValidos[number]))
      : []

    return await prisma.usuario.create({
      data: {
        neonAuthId: `pending-${Date.now()}`,
        email: datos.email,
        nombre: datos.nombre,
        rol: datos.rol === 'ADMIN' ? 'ADMIN' : 'USUARIO',
        permisos,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        permisos: true,
        creadoEn: true,
      },
    })
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async actualizarUsuario(id: string, datos: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const datosActualizar: any = {}

    if (datos.nombre) datosActualizar.nombre = datos.nombre
    if (datos.email) datosActualizar.email = datos.email
    if (datos.rol === 'ADMIN' || datos.rol === 'USUARIO') datosActualizar.rol = datos.rol
    if (['PENDIENTE', 'ACTIVO', 'SUSPENDIDO'].includes(datos.estado)) datosActualizar.estado = datos.estado



    if (Array.isArray(datos.permisos)) {
      datosActualizar.permisos = datos.permisos.filter((p: string) =>
        permisosValidos.includes(p as typeof permisosValidos[number])
      )
    }

    const existe = await prisma.usuario.findUnique({ where: { id } })
    if (!existe) throw new AppError('Usuario no encontrado', 404)

    return await prisma.usuario.update({
      where: { id },
      data: datosActualizar,
      select: { id: true, email: true, nombre: true, rol: true, estado: true, permisos: true, creadoEn: true },
    })
  },

  async eliminarUsuario(id: string, usuarioLogueadoId: string) {
    if (usuarioLogueadoId === id) {
      throw new AppError('No puedes eliminar tu propio usuario', 400)
    }

    const existe = await prisma.usuario.findUnique({ where: { id } })
    if (!existe) throw new AppError('Usuario no encontrado', 404)

    await prisma.usuario.delete({ where: { id } })
    return true
  }
}
