import { prisma } from '@/lib/db'
import { siguienteCodigoConsecutivoPorCategoria } from '@/lib/codigos'
import { registrarAuditoria } from '@/lib/auditoria'
import { AppError } from '@/lib/AppError'

export const ProductosService = {
  async obtenerTodos(cursor?: number, limite: number = 50) {
    const limiteReal = Math.min(limite, 100)
    
    const productos = await prisma.producto.findMany({
      include: { categoria: true },
      orderBy: { creadoEn: 'desc' },
      take: limiteReal + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hayMas = productos.length > limiteReal
    const items = hayMas ? productos.slice(0, limiteReal) : productos
    const nextCursor = hayMas ? items[items.length - 1].id : null

    return {
      items,
      nextCursor,
      total: items.length
    }
  },

  async crear(datos: any, ip: string | null) {
    const cantidadInicial = parseInt(datos.cantidad) || 0

    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : ''
    if (!nombre) {
      throw new AppError('El nombre es obligatorio.', 400)
    }

    const categoriaId = parseInt(datos.categoriaId, 10)
    if (!categoriaId || Number.isNaN(categoriaId)) {
      throw new AppError('La categoría es obligatoria.', 400)
    }
    const categoriaExiste = await prisma.categoria.findUnique({
      where: { id: categoriaId },
      select: { id: true },
    })
    if (!categoriaExiste) {
      throw new AppError('La categoría seleccionada no existe.', 400)
    }

    let codigo = typeof datos.codigo === 'string' ? datos.codigo.trim() : ''
    if (!codigo) {
      codigo = await siguienteCodigoConsecutivoPorCategoria(categoriaId)
    }

    const precio = parseFloat(datos.precio)
    if (!Number.isFinite(precio) || precio < 0) {
      throw new AppError('El precio debe ser un número válido.', 400)
    }

    try {
      const producto = await prisma.$transaction(async (tx) => {
        const nuevo = await tx.producto.create({
          data: {
            nombre,
            descripcion: datos.descripcion || null,
            codigo,
            precio,
            cantidad: cantidadInicial,
            stockMinimo: parseInt(datos.stockMinimo) || 1,
            categoriaId,
          },
        })

        if (cantidadInicial > 0) {
          await tx.movimiento.create({
            data: {
              productoId: nuevo.id,
              tipo: 'entrada',
              cantidad: cantidadInicial,
              notas: 'Stock inicial',
            },
          })
        }

        return nuevo
      })

      await registrarAuditoria({
        accion: 'CREAR',
        entidad: 'Producto',
        entidadId: producto.id,
        datos: { despues: producto },
        ip,
      })

      return producto
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        throw new AppError('Ya existe un producto con ese código.', 409)
      }
      throw error
    }
  }
}
