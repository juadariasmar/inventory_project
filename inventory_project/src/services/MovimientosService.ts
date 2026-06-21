import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/AppError';
import { StockService } from './StockService';

export const MovimientosService = {
  async obtenerMovimientos(cursor?: number, limite: number = 50) {
    const movimientos = await prisma.movimiento.findMany({
      include: { producto: true },
      orderBy: { creadoEn: 'desc' },
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

  async registrarMovimiento(data: any, usuarioId: number, ip: string) {
    const { productoId: rawProductoId, tipo, cantidad: rawCantidad, notas } = data;
    
    const productoId = parseInt(rawProductoId, 10);
    const cantidad = parseInt(rawCantidad, 10);

    if (tipo !== 'entrada' && tipo !== 'salida') {
      throw new AppError('El tipo de movimiento debe ser "entrada" o "salida".', 400);
    }

    if (!productoId || isNaN(productoId) || isNaN(cantidad) || cantidad <= 0) {
      throw new AppError('Se requiere un productoId valido y una cantidad mayor a 0.', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: productoId },
        select: { id: true, cantidad: true, nombre: true }
      });

      if (!producto) {
        throw new AppError('Producto no encontrado', 404);
      }

      if (tipo === 'salida') {
        const reservas = await tx.itemCotizacion.aggregate({
          where: {
            productoId: producto.id,
            cotizacion: { estado: 'PENDIENTE' }
          },
          _sum: { cantidad: true }
        });
        const stockReservado = reservas._sum.cantidad || 0;
        
        StockService.validarDisponibilidad(producto, cantidad, stockReservado);
      }

      const movimiento = await tx.movimiento.create({
        data: { 
          productoId, 
          tipo, 
          cantidad, 
          notas: notas || null 
        },
        include: { producto: true }
      });

      await tx.producto.update({
        where: { id: productoId },
        data: tipo === 'entrada'
          ? { cantidad: { increment: cantidad } }
          : { cantidad: { decrement: cantidad } },
      });

      await tx.auditoria.create({
        data: {
          usuarioId,
          accion: 'CREAR',
          entidad: 'Movimiento',
          entidadId: movimiento.id,
          datos: { despues: movimiento } as unknown as Prisma.InputJsonObject,
          ip
        }
      });

      return movimiento;
    });
  }
};
