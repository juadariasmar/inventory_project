import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';

export const CategoriasService = {
  async obtenerTodos() {
    return await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' }
    });
  },
  
  async crear(data: { nombre: string; descripcion?: string | null; prefijo: string }) {
    if (!data.nombre || !data.prefijo) {
      throw new AppError('El nombre y el prefijo son obligatorios', 400);
    }
    return await prisma.categoria.create({ data });
  }
};
