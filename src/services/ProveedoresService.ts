import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';
import { registrarAuditoria } from '../lib/auditoria';

export const ProveedoresService = {
  async obtenerTodos(empresaId: string, limite = 200) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    return await prisma.proveedor.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      take: limite,
    });
  },

  async obtenerPorId(id: number, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    const proveedor = await prisma.proveedor.findFirst({
      where: { id, empresaId },
    });
    if (!proveedor) {
      throw new AppError('Proveedor no encontrado', 404);
    }
    return proveedor;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async crear(datos: any, ip: string, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    if (!nombre) {
      throw new AppError('El nombre es obligatorio.', 400);
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre,
        nit: typeof datos.nit === 'string' ? datos.nit.trim() || null : null,
        contacto: typeof datos.contacto === 'string' ? datos.contacto.trim() || null : null,
        telefono: typeof datos.telefono === 'string' ? datos.telefono.trim() || null : null,
        email: typeof datos.email === 'string' ? datos.email.trim() || null : null,
        direccion: typeof datos.direccion === 'string' ? datos.direccion.trim() || null : null,
        empresaId,
      },
    });

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Proveedor',
      entidadId: String(proveedor.id),
      datos: { despues: proveedor },
      ip,
      empresaId,
    });

    return proveedor;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async actualizar(id: number, datos: any, ip: string, empresaId: string) {
    const antes = await this.obtenerPorId(id, empresaId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cambios: Record<string, any> = {};
    if (typeof datos.nombre === 'string') {
      const nombre = datos.nombre.trim();
      if (!nombre) throw new AppError('El nombre es obligatorio.', 400);
      cambios.nombre = nombre;
    }
    if (typeof datos.nit === 'string') cambios.nit = datos.nit.trim() || null;
    if (typeof datos.contacto === 'string') cambios.contacto = datos.contacto.trim() || null;
    if (typeof datos.telefono === 'string') cambios.telefono = datos.telefono.trim() || null;
    if (typeof datos.email === 'string') cambios.email = datos.email.trim() || null;
    if (typeof datos.direccion === 'string') cambios.direccion = datos.direccion.trim() || null;
    if (typeof datos.activo === 'boolean') cambios.activo = datos.activo;

    const proveedor = await prisma.proveedor.update({
      where: { id },
      data: cambios,
    });

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Proveedor',
      entidadId: String(proveedor.id),
      datos: { antes, despues: proveedor },
      ip,
      empresaId,
    });

    return proveedor;
  },

  async eliminar(id: number, ip: string, empresaId: string) {
    const antes = await this.obtenerPorId(id, empresaId);

    const ordenes = await prisma.ordenCompra.count({ where: { proveedorId: id, empresaId } });
    if (ordenes > 0) {
      throw new AppError('No se puede eliminar un proveedor con órdenes de compra asociadas', 409);
    }

    await prisma.proveedor.delete({ where: { id } });

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Proveedor',
      entidadId: String(id),
      datos: { antes },
      ip,
      empresaId,
    });

    return { ok: true };
  },
};
