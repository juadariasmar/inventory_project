import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'
import { TipoNotificacion } from '@prisma/client'

export const NotificacionesService = {
  async obtenerTodas(empresaId: string, usuarioId?: string, soloNoLeidas = false) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    return prisma.notificacion.findMany({
      where: {
        empresaId,
        ...(usuarioId ? { OR: [{ usuarioId }, { usuarioId: null }] } : {}),
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    })
  },

  async contarNoLeidas(empresaId: string, usuarioId?: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    return prisma.notificacion.count({
      where: {
        empresaId,
        leida: false,
        ...(usuarioId ? { OR: [{ usuarioId }, { usuarioId: null }] } : {}),
      },
    })
  },

  async marcarLeida(id: number) {
    const notif = await prisma.notificacion.findUnique({ where: { id } })
    if (!notif) throw new AppError('Notificación no encontrada', 404)

    return prisma.notificacion.update({
      where: { id },
      data: { leida: true, leidaEn: new Date() },
    })
  },

  async marcarTodasLeidas(empresaId: string, usuarioId: string) {
    return prisma.notificacion.updateMany({
      where: { empresaId, leida: false, OR: [{ usuarioId }, { usuarioId: null }] },
      data: { leida: true, leidaEn: new Date() },
    })
  },

  async crear(tipo: TipoNotificacion, titulo: string, empresaId: string, mensaje?: string, link?: string, usuarioId?: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    return prisma.notificacion.create({
      data: {
        tipo,
        titulo,
        mensaje: mensaje || null,
        link: link || null,
        usuarioId: usuarioId || null,
        empresaId,
      },
    })
  },

  async generarAlertasStock(empresaId: string) {
    const { obtenerStockCritico } = await import('../lib/analisis')
    const alertas = await obtenerStockCritico(empresaId)

    for (const a of alertas.slice(0, 10)) {
      await prisma.notificacion.create({
        data: {
          tipo: 'STOCK_CRITICO',
          titulo: `Stock crítico: ${a.nombre}`,
          mensaje: `Quedan ${a.cantidadActual} unidades (mínimo ${a.stockMinimo}). Sugerencia: comprar ${a.sugerenciaCompra}.`,
          link: `/productos/${a.productoId}`,
          empresaId,
        },
      })
    }
  },
}
