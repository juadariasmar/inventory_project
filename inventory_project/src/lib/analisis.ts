import { prisma } from './db'
import { MARGEN_ALERTA_STOCK } from './inventario'

export interface AlertaStockAgotarse {
  productoId: number
  nombre: string
  codigo: string
  cantidadActual: number
  consumoDiarioPromedio: number
  diasParaAgotarse: number
}

export interface AlertaSinMovimientos {
  productoId: number
  nombre: string
  codigo: string
  cantidadActual: number
  diasSinMovimiento: number
  valorInmovilizado: number
}

export interface ProductoAltaRotacion {
  productoId: number
  nombre: string
  codigo: string
  totalSalidas: number
  cantidadVendida: number
}

export interface AlertaStockCritico {
  productoId: number
  nombre: string
  codigo: string
  cantidadActual: number
  stockMinimo: number
  faltanteParaDuplicarMinimo: number
}

export interface ResumenMovimientos {
  fecha: string
  entradas: number
  salidas: number
}

const DIAS_VENTANA_CONSUMO = 30
const DIAS_LIMITE_AGOTARSE = 7
const DIAS_SIN_MOVIMIENTO = 30
const TOP_ROTACION = 10

/**
 * Calcula la cantidad de unidades que han salido por producto en los últimos N días,
 * para luego estimar el consumo diario promedio.
 */
async function consumoPorProducto(diasVentana: number) {
  const desde = new Date()
  desde.setDate(desde.getDate() - diasVentana)

  const salidas = await prisma.movimiento.groupBy({
    by: ['productoId'],
    where: { tipo: 'salida', creadoEn: { gte: desde } },
    _sum: { cantidad: true },
    _count: { _all: true },
  })

  return new Map(
    salidas.map((s) => [
      s.productoId,
      {
        cantidadVendida: s._sum.cantidad ?? 0,
        totalSalidas: s._count._all,
      },
    ])
  )
}

export async function obtenerStockPorAgotarse(): Promise<AlertaStockAgotarse[]> {
  const productos = await prisma.producto.findMany({
    select: { id: true, nombre: true, codigo: true, cantidad: true },
  })
  const consumo = await consumoPorProducto(DIAS_VENTANA_CONSUMO)

  const alertas: AlertaStockAgotarse[] = []
  for (const p of productos) {
    const datos = consumo.get(p.id)
    if (!datos || datos.cantidadVendida === 0) continue

    const consumoDiarioPromedio = datos.cantidadVendida / DIAS_VENTANA_CONSUMO
    if (consumoDiarioPromedio <= 0 || p.cantidad <= 0) continue

    const diasParaAgotarse = p.cantidad / consumoDiarioPromedio
    if (diasParaAgotarse <= DIAS_LIMITE_AGOTARSE) {
      alertas.push({
        productoId: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        cantidadActual: p.cantidad,
        consumoDiarioPromedio: Math.round(consumoDiarioPromedio * 100) / 100,
        diasParaAgotarse: Math.round(diasParaAgotarse * 10) / 10,
      })
    }
  }
  return alertas.sort((a, b) => a.diasParaAgotarse - b.diasParaAgotarse)
}

export async function obtenerProductosSinMovimientos(): Promise<AlertaSinMovimientos[]> {
  const productos = await prisma.producto.findMany({
    select: {
      id: true,
      nombre: true,
      codigo: true,
      cantidad: true,
      precio: true,
      movimientos: {
        orderBy: { creadoEn: 'desc' },
        take: 1,
        select: { creadoEn: true },
      },
    },
  })

  const hoy = new Date()
  const alertas: AlertaSinMovimientos[] = []
  for (const p of productos) {
    if (p.cantidad <= 0) continue
    const ultimo = p.movimientos[0]?.creadoEn
    const diasSinMovimiento = ultimo
      ? Math.floor((hoy.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24))
      : DIAS_SIN_MOVIMIENTO + 1

    if (diasSinMovimiento >= DIAS_SIN_MOVIMIENTO) {
      alertas.push({
        productoId: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        cantidadActual: p.cantidad,
        diasSinMovimiento,
        valorInmovilizado: Math.round(p.precio * p.cantidad),
      })
    }
  }
  return alertas.sort((a, b) => b.valorInmovilizado - a.valorInmovilizado)
}

export async function obtenerAltaRotacion(): Promise<ProductoAltaRotacion[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - DIAS_VENTANA_CONSUMO)

  const salidas = await prisma.movimiento.groupBy({
    by: ['productoId'],
    where: { tipo: 'salida', creadoEn: { gte: desde } },
    _sum: { cantidad: true },
    _count: { _all: true },
    orderBy: { _sum: { cantidad: 'desc' } },
    take: TOP_ROTACION,
  })

  if (salidas.length === 0) return []

  const productos = await prisma.producto.findMany({
    where: { id: { in: salidas.map((s) => s.productoId) } },
    select: { id: true, nombre: true, codigo: true },
  })
  const mapaProductos = new Map(productos.map((p) => [p.id, p]))

  return salidas
    .map((s) => {
      const p = mapaProductos.get(s.productoId)
      if (!p) return null
      return {
        productoId: s.productoId,
        nombre: p.nombre,
        codigo: p.codigo,
        totalSalidas: s._count._all,
        cantidadVendida: s._sum.cantidad ?? 0,
      }
    })
    .filter((x): x is ProductoAltaRotacion => x !== null)
}

export async function obtenerStockCritico(): Promise<AlertaStockCritico[]> {
  const productos = await prisma.producto.findMany({
    select: { id: true, nombre: true, codigo: true, cantidad: true, stockMinimo: true },
  })

  return productos
    .filter((p) => p.cantidad <= p.stockMinimo + MARGEN_ALERTA_STOCK)
    .map((p) => ({
      productoId: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      cantidadActual: p.cantidad,
      stockMinimo: p.stockMinimo,
      faltanteParaDuplicarMinimo: Math.max(0, p.stockMinimo * 2 - p.cantidad),
    }))
    .sort((a, b) => a.cantidadActual - b.cantidadActual)
}

/**
 * Resumen de movimientos por día en los últimos N días para gráficos.
 */
export async function obtenerResumenMovimientos(dias = 30): Promise<ResumenMovimientos[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  desde.setHours(0, 0, 0, 0)

  const movimientos = await prisma.movimiento.findMany({
    where: { creadoEn: { gte: desde } },
    select: { tipo: true, cantidad: true, creadoEn: true },
    orderBy: { creadoEn: 'asc' },
  })

  const mapa = new Map<string, { entradas: number; salidas: number }>()
  for (let i = 0; i <= dias; i++) {
    const d = new Date(desde)
    d.setDate(d.getDate() + i)
    const k = d.toISOString().slice(0, 10)
    mapa.set(k, { entradas: 0, salidas: 0 })
  }

  for (const m of movimientos) {
    const k = m.creadoEn.toISOString().slice(0, 10)
    const acc = mapa.get(k)
    if (!acc) continue
    if (m.tipo === 'entrada') acc.entradas += m.cantidad
    else acc.salidas += m.cantidad
  }

  return Array.from(mapa.entries()).map(([fecha, { entradas, salidas }]) => ({
    fecha,
    entradas,
    salidas,
  }))
}

export async function obtenerTodoAnalisis() {
  const [stockAgotarse, sinMovimientos, altaRotacion, stockCritico, resumen] = await Promise.all([
    obtenerStockPorAgotarse(),
    obtenerProductosSinMovimientos(),
    obtenerAltaRotacion(),
    obtenerStockCritico(),
    obtenerResumenMovimientos(30),
  ])
  return { stockAgotarse, sinMovimientos, altaRotacion, stockCritico, resumen }
}
