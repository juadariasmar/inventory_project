import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

type Accion = 'CREAR' | 'MODIFICAR' | 'ELIMINAR'

interface RegistrarParams {
  usuarioId: string
  accion: Accion
  recursoId: number
  descripcion: string
  datosAntes?: Record<string, unknown>
  datosDespues?: Record<string, unknown>
  ip: string
  empresaId: string
}

export const HistorialService = {
  async registrar(params: RegistrarParams) {
    await prisma.historialMovimientos.create({
      data: {
        usuarioId: params.usuarioId,
        accion: params.accion,
        recursoId: params.recursoId,
        descripcion: params.descripcion,
        datosAntes: params.datosAntes as Prisma.InputJsonValue | undefined,
        datosDespues: params.datosDespues as Prisma.InputJsonValue | undefined,
        ip: params.ip,
        empresaId: params.empresaId,
      },
    })
  },

  async obtenerHistorial(recursoId: number, empresaId: string) {
    return prisma.historialMovimientos.findMany({
      where: { recursoId, empresaId },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    })
  },
}
