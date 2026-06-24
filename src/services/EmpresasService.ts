import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';
import { registrarAuditoria } from '../lib/auditoria';

export const EmpresasService = {
  async obtenerTodas() {
    return await prisma.empresa.findMany({
      orderBy: { creadoEn: 'desc' }
    });
  },

  async obtenerPorId(id: string) {
    const empresa = await prisma.empresa.findUnique({
      where: { id }
    });
    if (!empresa) {
      throw new AppError('Empresa no encontrada', 404);
    }
    return empresa;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async crear(datos: any, ip: string, usuarioId: string) {
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    if (!nombre) {
      throw new AppError('El nombre de la empresa es obligatorio', 400);
    }

    const empresa = await prisma.empresa.create({
      data: { nombre }
    });

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Empresa',
      entidadId: empresa.id,
      datos: { despues: empresa },
      usuarioId,
      ip,
      empresaId: empresa.id
    });

    return empresa;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async actualizar(id: string, datos: any, ip: string, usuarioId: string) {
    const antes = await prisma.empresa.findUnique({
      where: { id }
    });
    if (!antes) {
      throw new AppError('Empresa no encontrada', 404);
    }

    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : undefined;
    if (nombre === '') {
      throw new AppError('El nombre de la empresa es obligatorio', 400);
    }

    const empresa = await prisma.empresa.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre })
      }
    });

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Empresa',
      entidadId: id,
      datos: { antes, despues: empresa },
      usuarioId,
      ip,
      empresaId: id
    });

    return empresa;
  },

  async eliminar(id: string, ip: string, usuarioId: string) {
    const antes = await prisma.empresa.findUnique({
      where: { id }
    });
    if (!antes) {
      throw new AppError('Empresa no encontrada', 404);
    }

    const usuariosCount = await prisma.usuario.count({
      where: { empresaId: id }
    });
    if (usuariosCount > 0) {
      throw new AppError('No se puede eliminar la empresa porque tiene usuarios asociados', 400);
    }

    const productosCount = await prisma.producto.count({
      where: { empresaId: id }
    });
    if (productosCount > 0) {
      throw new AppError('No se puede eliminar la empresa porque tiene productos asociados', 400);
    }

    await prisma.empresa.delete({
      where: { id }
    });

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Empresa',
      entidadId: id,
      datos: { antes },
      usuarioId,
      ip,
      empresaId: id
    });

    return antes;
  }
};
