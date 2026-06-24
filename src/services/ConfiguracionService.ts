import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'
import { registrarAuditoria } from '../lib/auditoria'
import { z } from 'zod'

const configSchema = z.object({
  moneda: z.string().min(1).max(10),
  simboloMoneda: z.string().min(1).max(5),
  impuestos: z.number().min(0).max(100),
  logoUrl: z.string().url().optional().nullable(),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  nombrePersonalizado: z.string().min(1).max(100).optional().nullable(),
})

export const ConfiguracionService = {
  async obtener(empresaId: string) {
    const config = await prisma.configuracionEmpresa.findUnique({
      where: { empresaId },
    })
    if (!config) {
      return await prisma.configuracionEmpresa.create({
        data: { empresaId },
      })
    }
    return config
  },

  async actualizar(empresaId: string, datos: unknown, usuarioId: string, ip: string) {
    const parsed = configSchema.safeParse(datos)
    if (!parsed.success) {
      throw new AppError('Datos de configuración inválidos: ' + parsed.error.message, 400)
    }

    const antes = await prisma.configuracionEmpresa.findUnique({
      where: { empresaId },
    })

    const config = await prisma.configuracionEmpresa.upsert({
      where: { empresaId },
      update: parsed.data,
      create: { empresaId, ...parsed.data },
    })

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'ConfiguracionEmpresa',
      entidadId: config.id,
      datos: { antes, despues: config },
      usuarioId,
      ip,
      empresaId,
    })

    return config
  },
}
