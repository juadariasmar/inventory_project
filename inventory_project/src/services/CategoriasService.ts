import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';
import { generarPrefijoSugerido } from '../lib/codigos';
import { registrarAuditoria } from '../lib/auditoria';

export const CategoriasService = {
  async obtenerTodos(empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    return await prisma.categoria.findMany({
      where: { empresaId },
      include: {
        _count: {
          select: { productos: true },
        },
      },
      orderBy: { nombre: 'asc' }
    });
  },
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async crear(datos: any, ip: string, empresaId: string) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400);
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    if (!nombre) {
      throw new AppError('El nombre es obligatorio.', 400);
    }

    let prefijo = typeof datos.prefijo === 'string' ? datos.prefijo.trim().toUpperCase() : '';
    const existentes = await prisma.categoria.findMany({
      where: { empresaId },
      select: { prefijo: true },
    });
    const prefijosEnUso = new Set(existentes.map((c) => c.prefijo));

    if (!prefijo) {
      prefijo = generarPrefijoSugerido(nombre, prefijosEnUso);
    } else if (prefijosEnUso.has(prefijo)) {
      throw new AppError(`Ya existe una categoría con el prefijo "${prefijo}". Elige uno distinto.`, 409);
    } else if (!/^[A-Z0-9]{2,8}$/.test(prefijo)) {
      throw new AppError('El prefijo debe tener entre 2 y 8 letras o números (sin espacios ni símbolos).', 400);
    }

    const categoria = await prisma.categoria.create({
      data: { nombre, prefijo, empresaId }
    });

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Categoria',
      entidadId: String(categoria.id),
      datos: { despues: categoria },
      ip,
      empresaId
    });

    return categoria;
  }
};
