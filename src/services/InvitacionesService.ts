import { prisma } from '@/lib/db'
import { AppError } from '@/lib/AppError'
import { registrarAuditoria } from '@/lib/auditoria'
import { EmailService } from './EmailService'
import { z } from 'zod'

const crearSchema = z.object({
  email: z.string().email('Email inválido'),
  rol: z.enum(['ADMIN', 'USUARIO']).optional().default('USUARIO'),
})

const DIAS_EXPIRACION = 7

export const InvitacionesService = {
  async crear(
    datos: unknown,
    usuarioId: string,
    empresaId: string,
    empresaNombre: string,
    ip: string,
  ) {
    const parsed = crearSchema.safeParse(datos)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message || 'Datos inválidos', 400)
    }

    const { email, rol } = parsed.data

    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } })
    if (usuarioExistente) {
      if (usuarioExistente.empresaId === empresaId) {
        throw new AppError('Este usuario ya pertenece a tu empresa', 400)
      }
      throw new AppError('Este email ya está registrado en otra empresa', 400)
    }

    const invitacionExistente = await prisma.invitacion.findFirst({
      where: { email, empresaId, estado: 'PENDIENTE' },
    })
    if (invitacionExistente) {
      throw new AppError('Ya existe una invitación pendiente para este email', 400)
    }

    const creador = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nombre: true },
    })

    const invitacion = await prisma.invitacion.create({
      data: {
        email,
        empresaId,
        rol,
        expiraEn: new Date(Date.now() + DIAS_EXPIRACION * 24 * 60 * 60 * 1000),
        creadoPorId: usuarioId,
      },
    })

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Invitacion',
      entidadId: invitacion.id,
      datos: { email, rol },
      usuarioId,
      empresaId,
      ip,
    })

    await EmailService.enviarInvitacion({
      email,
      token: invitacion.token,
      empresaNombre,
      invitarPorNombre: creador?.nombre || 'Un administrador',
    })

    return invitacion
  },

  async listar(empresaId: string) {
    return prisma.invitacion.findMany({
      where: { empresaId },
      orderBy: { creadoEn: 'desc' },
      include: {
        creadoPor: { select: { id: true, nombre: true } },
      },
    })
  },

  async cancelar(id: string, empresaId: string, usuarioId: string, ip: string) {
    const invitacion = await prisma.invitacion.findFirst({
      where: { id, empresaId, estado: 'PENDIENTE' },
    })
    if (!invitacion) {
      throw new AppError('Invitación no encontrada o ya fue procesada', 404)
    }

    const actualizada = await prisma.invitacion.update({
      where: { id },
      data: { estado: 'CANCELADA' },
    })

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Invitacion',
      entidadId: id,
      datos: { email: invitacion.email },
      usuarioId,
      empresaId,
      ip,
    })

    return actualizada
  },

  async aceptar(token: string, neonAuthId: string, email: string, nombre: string) {
    const invitacion = await prisma.invitacion.findUnique({ where: { token } })
    if (!invitacion) {
      throw new AppError('Invitación no encontrada', 404)
    }
    if (invitacion.estado !== 'PENDIENTE') {
      throw new AppError('Esta invitación ya fue procesada', 400)
    }
    if (invitacion.email !== email) {
      throw new AppError('Este email no coincide con la invitación', 400)
    }
    if (new Date() > invitacion.expiraEn) {
      await prisma.invitacion.update({
        where: { id: invitacion.id },
        data: { estado: 'EXPIRADA' },
      })
      throw new AppError('Esta invitación ha expirado', 400)
    }

    const [usuario] = await Promise.all([
      prisma.usuario.create({
        data: {
          neonAuthId,
          email,
          nombre,
          empresaId: invitacion.empresaId,
          estado: 'ACTIVO',
          rol: invitacion.rol,
        },
      }),
      prisma.invitacion.update({
        where: { id: invitacion.id },
        data: { estado: 'ACEPTADA', aceptadaEn: new Date() },
      }),
    ])

    return usuario
  },

  async obtenerPorToken(token: string) {
    const invitacion = await prisma.invitacion.findUnique({
      where: { token },
      include: { empresa: { select: { nombre: true } } },
    })
    if (!invitacion) return null
    if (invitacion.estado !== 'PENDIENTE') return null
    if (new Date() > invitacion.expiraEn) {
      await prisma.invitacion.update({
        where: { id: invitacion.id },
        data: { estado: 'EXPIRADA' },
      })
      return null
    }
    return invitacion
  },
}
