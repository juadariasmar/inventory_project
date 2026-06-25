import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/AppError';
import { StockService } from './StockService';

export const MovimientosService = {
  async obtenerMovimientos(empresaId: string, cursor?: number, limite: number = 50) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    const movimientos = await prisma.movimiento.findMany({
      where: { empresaId },
      include: { producto: true },
      // Use composite ordering so that cursor uniquely identifies a position
      orderBy: [
        { creadoEn: 'desc' },
        { id: 'desc' },
      ],
      take: limite + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hayMas = movimientos.length > limite;
    const items = hayMas ? movimientos.slice(0, limite) : movimientos;
    const nextCursor = hayMas ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      total: items.length
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async registrarMovimiento(data: any, usuarioId: string, ip: string, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    const { productoId: rawProductoId, tipo, cantidad: rawCantidad, notas } = data;

    // Parse and validate integers – reject fractions
    const productoId = parseInt(rawProductoId, 10);
    const cantidad = parseInt(rawCantidad, 10);

    if (tipo !== 'entrada' && tipo !== 'salida') {
      throw new AppError('El tipo de movimiento debe ser "entrada" o "salida".', 400);
    }

    if (
      !productoId ||
      isNaN(productoId) ||
      !Number.isInteger(Number(rawProductoId)) ||
      isNaN(cantidad) ||
      cantidad <= 0 ||
      !Number.isInteger(Number(rawCantidad))
    ) {
      throw new AppError(
        'Se requiere un productoId válido y una cantidad entera mayor a 0.',
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Pessimistic lock on the product row for this empresa
      await tx.$queryRaw`SELECT id FROM "Producto" WHERE id = ${productoId} AND "empresaId" = ${empresaId} FOR UPDATE`;

      const producto = await tx.producto.findUnique({
        where: { id: productoId },
        select: { id: true, cantidad: true, nombre: true, empresaId: true }
      });

      if (!producto || producto.empresaId !== empresaId) {
        throw new AppError('Producto no encontrado o no pertenece a la empresa', 404);
      }

      if (tipo === 'salida') {
        const reservas = await tx.itemCotizacion.aggregate({
          where: {
            productoId: producto.id,
            cotizacion: { estado: 'PENDIENTE', empresaId }
          },
          _sum: { cantidad: true }
        });
        const stockReservado = reservas._sum.cantidad || 0;

        StockService.validarDisponibilidad(
          producto as Parameters<typeof StockService.validarDisponibilidad>[0],
          cantidad,
          stockReservado
        );
      }

      // Update product *before* creating the movement so that the
      // returned movimiento.producto reflects the latest stock.
      await tx.producto.update({
        where: { id: productoId },
        data:
          tipo === 'entrada'
            ? { cantidad: { increment: cantidad } }
            : { cantidad: { decrement: cantidad } },
      });

      const movimiento = await tx.movimiento.create({
        data: {
          productoId,
          tipo,
          cantidad,
          notas: notas || null,
          empresaId
        },
        include: { producto: true }
      });

      await tx.auditoria.create({
        data: {
          usuarioId,
          empresaId,
          accion: 'CREAR',
          entidad: 'Movimiento',
          entidadId: String(movimiento.id),
          datos: { despues: movimiento } as unknown as Prisma.InputJsonObject,
          ip
        }
      });

      return movimiento;
    });
  }
};
