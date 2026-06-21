import { prisma } from '../lib/db';
import { AppError } from '../lib/AppError';
import { generarPrefijoSugerido } from '../lib/codigos';
import { registrarAuditoria } from '../lib/auditoria';

export const CategoriasService = {
  async obtenerTodos() {
    return await prisma.categoria.findMany({
      include: {
        _count: {
          select: { productos: true },
        },
      },
      orderBy: { nombre: 'asc' }
    });
  },
  
  async crear(datos: any, ip: string) {
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
    if (!nombre) {
      throw new AppError('El nombre es obligatorio.', 400);
    }

    let prefijo = typeof datos.prefijo === 'string' ? datos.prefijo.trim().toUpperCase() : '';
    const existentes = await prisma.categoria.findMany({
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
      data: { nombre, prefijo }
    });

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Categoria',
      entidadId: categoria.id,
      datos: { despues: categoria },
      ip,
    });

    return categoria;
  }
};
