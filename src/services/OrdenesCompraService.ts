import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/AppError';
import { registrarAuditoria } from '../lib/auditoria';

interface ItemOrdenInput {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
}

interface CrearOrdenInput {
  proveedorId: number;
  notas?: string;
  items: ItemOrdenInput[];
}

export const OrdenesCompraService = {
  async obtenerTodos(empresaId: string, limite = 200) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    return await prisma.ordenCompra.findMany({
      where: { empresaId },
      include: {
        proveedor: { select: { nombre: true } },
        _count: { select: { items: true } },
      },
      orderBy: { creadoEn: 'desc' },
      take: limite,
    });
  },

  async obtenerPorId(id: number, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    const orden = await prisma.ordenCompra.findFirst({
      where: { id, empresaId },
      include: {
        proveedor: { select: { id: true, nombre: true, nit: true, telefono: true, contacto: true, direccion: true, email: true } },
        items: { include: { producto: { select: { nombre: true, codigo: true } } } },
      },
    });
    if (!orden) {
      throw new AppError('Orden de compra no encontrada', 404);
    }
    return orden;
  },

  async crear(datos: CrearOrdenInput, ip: string, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);

    const proveedorId = Number(datos.proveedorId);
    if (!Number.isInteger(proveedorId)) {
      throw new AppError('proveedorId inválido', 400);
    }

    const proveedor = await prisma.proveedor.findFirst({
      where: { id: proveedorId, empresaId },
    });
    if (!proveedor) {
      throw new AppError('Proveedor no encontrado', 404);
    }

    const items = datos.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('La orden debe tener al menos un ítem', 400);
    }

    for (const it of items) {
      if (!Number.isInteger(it.productoId)) {
        throw new AppError('productoId inválido en un ítem', 400);
      }
      if (!Number.isInteger(it.cantidad) || it.cantidad <= 0) {
        throw new AppError('La cantidad de cada ítem debe ser un entero mayor a 0', 400);
      }
      if (typeof it.costoUnitario !== 'number' || Number.isNaN(it.costoUnitario) || it.costoUnitario < 0) {
        throw new AppError('El costo unitario de cada ítem debe ser un número mayor o igual a 0', 400);
      }
    }

    const ids = [...new Set(items.map((it) => it.productoId))];
    const productos = await prisma.producto.findMany({
      where: { id: { in: ids }, empresaId },
      select: { id: true },
    });
    if (productos.length !== ids.length) {
      throw new AppError('Producto no encontrado o no pertenece a la empresa', 404);
    }

    const total = items.reduce((s, it) => s + it.cantidad * it.costoUnitario, 0);

    const orden = await prisma.ordenCompra.create({
      data: {
        empresaId,
        proveedorId,
        estado: 'BORRADOR',
        total,
        notas: datos.notas || null,
        items: {
          create: items.map((it) => ({
            productoId: it.productoId,
            cantidad: it.cantidad,
            costoUnitario: it.costoUnitario,
            subtotal: it.cantidad * it.costoUnitario,
          })),
        },
      },
      include: { items: true, proveedor: true },
    });

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'OrdenCompra',
      entidadId: String(orden.id),
      datos: { despues: orden },
      ip,
      empresaId,
    });

    return orden;
  },

  async recibir(id: number, ip: string, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);

    return await prisma.$transaction(async (tx) => {
      const orden = await tx.ordenCompra.findUnique({
        where: { id, empresaId },
        include: { items: { select: { id: true, productoId: true, cantidad: true, costoUnitario: true, subtotal: true } } },
      });

      if (!orden) {
        throw new AppError('Orden de compra no encontrada', 404);
      }
      if (orden.estado !== 'BORRADOR') {
        throw new AppError('La orden ya fue recibida o cancelada', 409);
      }

      // Bloqueo pesimista de filas de Producto antes de tocar el inventario.
      const ids = [...new Set(orden.items.map((i) => i.productoId))].sort((a, b) => a - b);
      if (ids.length) {
        await tx.$queryRaw`SELECT id FROM "Producto" WHERE id IN (${Prisma.join(ids)}) AND "empresaId" = ${empresaId} ORDER BY id FOR UPDATE`;
      }

      for (const it of orden.items) {
        await tx.movimiento.create({
          data: {
            productoId: it.productoId,
            tipo: 'entrada',
            cantidad: it.cantidad,
            notas: `Orden de compra #${id}`,
            ordenCompraId: id,
            empresaId,
          },
        });
        await tx.producto.update({
          where: { id: it.productoId },
          data: { cantidad: { increment: it.cantidad } },
        });
      }

      const actualizada = await tx.ordenCompra.update({
        where: { id, empresaId },
        data: { estado: 'RECIBIDA', recibidaEn: new Date() },
        include: { items: true },
      });

      // Auditoría dentro de la transacción (atómica con el Kárdex).
      await tx.auditoria.create({
        data: {
          usuarioId: null,
          empresaId,
          accion: 'ACTUALIZAR',
          entidad: 'OrdenCompra',
          entidadId: String(id),
          datos: { recibida: true } as unknown as Prisma.InputJsonObject,
          ip,
        },
      });

      return actualizada;
    });
  },

  async cancelar(id: number, ip: string, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);

    const orden = await prisma.ordenCompra.findFirst({ where: { id, empresaId } });
    if (!orden) {
      throw new AppError('Orden de compra no encontrada', 404);
    }
    if (orden.estado !== 'BORRADOR') {
      throw new AppError('Solo se pueden cancelar órdenes en borrador', 409);
    }

    const actualizada = await prisma.ordenCompra.update({
      where: { id, empresaId },
      data: { estado: 'CANCELADA' },
    });

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'OrdenCompra',
      entidadId: String(id),
      datos: { antes: orden, despues: actualizada },
      ip,
      empresaId,
    });

    return actualizada;
  },
};
