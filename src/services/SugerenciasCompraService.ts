import { prisma } from '../lib/db'
import { AppError } from '../lib/AppError'
import { calcularSugerenciaCompraInteligente, MARGEN_ALERTA_STOCK } from '../lib/inventario'
import { OrdenesCompraService } from './OrdenesCompraService'

const DIAS_VENTANA_CONSUMO = 30

export interface SugerenciaProducto {
  productoId: number
  nombre: string
  codigo: string
  stockActual: number
  stockMinimo: number
  consumoDiario: number
  sugerencia: number
  proveedorSugerido: { id: number; nombre: string } | null
}

export const SugerenciasCompraService = {
  async generarSugerencias(empresaId: string): Promise<SugerenciaProducto[]> {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    const desde = new Date()
    desde.setDate(desde.getDate() - DIAS_VENTANA_CONSUMO)

    const [productos, consumo, proveedores] = await Promise.all([
      prisma.producto.findMany({
        where: { empresaId },
        select: {
          id: true, nombre: true, codigo: true, cantidad: true, stockMinimo: true,
          itemsOrdenCompra: {
            where: { ordenCompra: { estado: { not: 'CANCELADA' } } },
            select: { ordenCompra: { select: { proveedorId: true, proveedor: { select: { id: true, nombre: true } } } } },
            take: 3,
            orderBy: { ordenCompra: { creadoEn: 'desc' } },
          },
        },
        take: 500,
      }),
      prisma.movimiento.groupBy({
        by: ['productoId'],
        where: {
          empresaId,
          tipo: 'salida',
          creadoEn: { gte: desde },
        },
        _sum: { cantidad: true },
      }),
      prisma.proveedor.findMany({
        where: { empresaId, activo: true },
        select: { id: true, nombre: true },
      }),
    ])

    const mapaConsumo = new Map(consumo.map((c) => [c.productoId, c._sum.cantidad ?? 0]))

    return productos
      .filter((p) => p.cantidad <= p.stockMinimo + MARGEN_ALERTA_STOCK)
      .map((p) => {
        const cantidadVendida = mapaConsumo.get(p.id) ?? 0
        const consumoDiario = cantidadVendida / DIAS_VENTANA_CONSUMO
        const sugerencia = calcularSugerenciaCompraInteligente(
          p.stockMinimo,
          p.cantidad,
          consumoDiario,
        )
        const ultimoProveedor = p.itemsOrdenCompra[0]?.ordenCompra?.proveedor
        return {
          productoId: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          stockActual: p.cantidad,
          stockMinimo: p.stockMinimo,
          consumoDiario: Math.round(consumoDiario * 100) / 100,
          sugerencia,
          proveedorSugerido: ultimoProveedor ? { id: ultimoProveedor.id, nombre: ultimoProveedor.nombre } : null,
        }
      })
      .filter((s) => s.sugerencia > 0)
      .sort((a, b) => b.sugerencia - a.sugerencia)
  },

  async crearOrdenDesdeSugerencia(
    empresaId: string,
    proveedorId: number,
    items: { productoId: number; cantidad: number; costoUnitario: number }[],
    ip: string,
  ) {
    if (!empresaId) throw new AppError('empresaId es requerido', 400)

    return OrdenesCompraService.crear(
      { proveedorId, items, notas: 'Generada automáticamente desde sugerencias de compra' },
      ip,
      empresaId,
    )
  },
}
