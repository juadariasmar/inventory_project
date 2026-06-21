import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'
import { AppError } from '../lib/AppError'

function validarContrasena(contrasena: string): string | null {
  if (contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(contrasena)) return 'La contraseña debe incluir al menos una letra mayúscula.'
  if (!/[0-9]/.test(contrasena)) return 'La contraseña debe incluir al menos un número.'
  return null
}

const permisosValidos = ['VER_ANALISIS', 'EXPORTAR_REPORTES', 'REGISTRAR_MOVIMIENTOS', 'REALIZAR_VENTAS'] as const

export const UsuariosService = {
  async crearUsuario(datos: any) {
    if (!datos.nombreUsuario || !datos.contrasena || !datos.nombre) {
      throw new AppError('Campos requeridos faltantes', 400)
    }

    const errorContrasena = validarContrasena(datos.contrasena)
    if (errorContrasena) {
      throw new AppError(errorContrasena, 400)
    }

    const existente = await prisma.usuario.findUnique({
      where: { nombreUsuario: datos.nombreUsuario },
    })
    if (existente) {
      throw new AppError('El nombre de usuario ya existe', 409)
    }

    const hash = await bcrypt.hash(datos.contrasena, 10)

    const permisos = Array.isArray(datos.permisos)
      ? datos.permisos.filter((p: string) => permisosValidos.includes(p as typeof permisosValidos[number]))
      : []

    return await prisma.usuario.create({
      data: {
        nombreUsuario: datos.nombreUsuario,
        contrasena: hash,
        nombre: datos.nombre,
        rol: datos.rol === 'ADMIN' ? 'ADMIN' : 'USUARIO',
        permisos,
      },
      select: {
        id: true,
        nombreUsuario: true,
        nombre: true,
        rol: true,
        permisos: true,
        creadoEn: true,
      },
    })
  },

  async actualizarUsuario(id: number, datos: any) {
    const datosActualizar: any = {}

    if (datos.nombre) datosActualizar.nombre = datos.nombre
    if (datos.nombreUsuario) datosActualizar.nombreUsuario = datos.nombreUsuario
    if (datos.rol === 'ADMIN' || datos.rol === 'USUARIO') datosActualizar.rol = datos.rol

    if (datos.contrasena && datos.contrasena.length > 0) {
      const errorContrasena = validarContrasena(datos.contrasena)
      if (errorContrasena) {
        throw new AppError(errorContrasena, 400)
      }
      datosActualizar.contrasena = await bcrypt.hash(datos.contrasena, 10)
    }

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
      select: { id: true, nombreUsuario: true, nombre: true, rol: true, permisos: true, creadoEn: true },
    })
  },

  async eliminarUsuario(id: number, usuarioLogueadoId: number) {
    if (usuarioLogueadoId === id) {
      throw new AppError('No puedes eliminar tu propio usuario', 400)
    }

    const existe = await prisma.usuario.findUnique({ where: { id } })
    if (!existe) throw new AppError('Usuario no encontrado', 404)

    await prisma.usuario.delete({ where: { id } })
    return true
  }
}
