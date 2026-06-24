import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'

export const ClientesService = {
  async obtenerTodos(empresaId: string, busqueda?: string, limite = 200) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    return prisma.cliente.findMany({
      where: {
        empresaId,
        ...(busqueda
          ? {
              OR: [
                { nombre: { contains: busqueda, mode: 'insensitive' } },
                { documento: { contains: busqueda, mode: 'insensitive' } },
                { email: { contains: busqueda, mode: 'insensitive' } },
                { telefono: { contains: busqueda, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { id: 'desc' },
      take: limite,
    })
  },

  async obtenerPorId(id: number, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    const cliente = await prisma.cliente.findFirst({
      where: { id, empresaId },
    })
    if (!cliente) throw new AppError('Cliente no encontrado', 404)
    return cliente
  },

  async obtenerHistorial(id: number, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    const cliente = await prisma.cliente.findFirst({
      where: { id, empresaId },
      include: {
        ventas: {
          orderBy: { creadoEn: 'desc' },
          take: 20,
        },
        cotizaciones: {
          where: { estado: 'PENDIENTE' },
          orderBy: { creadoEn: 'desc' },
          take: 10,
        },
        _count: {
          select: { ventas: true, cotizaciones: true },
        },
      },
    })
    if (!cliente) throw new AppError('Cliente no encontrado', 404)
    return cliente
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async crear(datos: any, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : ''
    if (!nombre) throw new AppError('El nombre del cliente es obligatorio', 400)

    if (datos.documento) {
      const existente = await prisma.cliente.findFirst({
        where: { documento: datos.documento, empresaId },
      })
      if (existente) throw new AppError('Ya existe un cliente con ese documento', 409)
    }

    return prisma.cliente.create({
      data: {
        nombre,
        documento: datos.documento || null,
        email: datos.email || null,
        telefono: datos.telefono || null,
        direccion: datos.direccion || null,
        notas: datos.notas || null,
        empresaId,
      },
    })
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async actualizar(id: number, datos: any, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    const existente = await prisma.cliente.findFirst({ where: { id, empresaId } })
    if (!existente) throw new AppError('Cliente no encontrado', 404)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (datos.nombre) data.nombre = datos.nombre
    if (datos.documento) {
      const duplicado = await prisma.cliente.findFirst({
        where: { documento: datos.documento, empresaId, id: { not: id } },
      })
      if (duplicado) throw new AppError('El documento ya está en uso', 409)
      data.documento = datos.documento
    }
    if (datos.email !== undefined) data.email = datos.email || null
    if (datos.telefono !== undefined) data.telefono = datos.telefono || null
    if (datos.direccion !== undefined) data.direccion = datos.direccion || null
    if (datos.notas !== undefined) data.notas = datos.notas || null

    return prisma.cliente.update({ where: { id }, data })
  },
}
