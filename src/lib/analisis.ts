import { prisma } from './db'
import {
  MARGEN_ALERTA_STOCK,
  calcularSugerenciaCompraInteligente,
} from './inventario'

export interface AlertaStockAgotarse {
  productoId: number
  nombre: string
  codigo: string
  cantidadActual: number
  stockMinimo: number
  consumoDiarioPromedio: number
  // null cuando el producto no tiene historial de ventas pero su stock
  // ya está bajo el umbral crítico (no se puede proyectar agotamiento).
  diasParaAgotarse: number | null
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
  consumoDiarioPromedio: number
  sugerenciaCompra: number
}

export interface ResumenMovimientos {
  fecha: string
  entradas: number
  salidas: number
}

export interface VentaDiaria {
  fecha: string
  numeroVentas: number
  totalIngreso: number
}

export interface CategoriaVentas {
  categoria: string
  unidadesVendidas: number
  ingresoTotal: number
}

export interface DistribucionStock {
  estado: 'Sin stock' | 'Stock bajo' | 'Normal'
  cantidad: number
}

export interface FilaInventarioGeneral {
  productoId: number
  codigo: string
  nombre: string
  categoria: string
  cantidad: number
  stockMinimo: number
  precio: number
  valorEnStock: number
  estado: 'Sin stock' | 'Stock bajo' | 'Normal'
  diasDesdeUltimaActividad: number | null
}

const DIAS_VENTANA_CONSUMO = 30
const DIAS_LIMITE_AGOTARSE = 7
const DIAS_SIN_MOVIMIENTO = 30
const TOP_ROTACION = 10
const MAX_PRODUCTOS_ANALISIS = 500

/**
 * Calcula la cantidad de unidades que han salido por producto en los últimos N días,
 * para luego estimar el consumo diario promedio.
 */
async function consumoPorProducto(empresaId: string, diasVentana: number) {
  const desde = new Date()
  desde.setDate(desde.getDate() - diasVentana)

  // Excluir salidas cuya venta haya sido cancelada (ya fueron revertidas
  // por la entrada de devolucion, contarlas inflaria el consumo aparente).
  const salidas = await prisma.movimiento.groupBy({
    by: ['productoId'],
    where: {
      empresaId,
      tipo: 'salida',
      creadoEn: { gte: desde },
      OR: [{ ventaId: null }, { venta: { canceladaEn: null } }],
    },
    _sum: { cantidad: true },
    _count: { _all: true },
  })

  return new Map(
    salidas.map((s) => [
      s.productoId,
      {
        cantidadVendida: s._sum?.cantidad ?? 0,
        totalSalidas: s._count?._all ?? 0,
      },
    ])
  )
}

export async function obtenerStockPorAgotarse(empresaId: string): Promise<AlertaStockAgotarse[]> {
  const productos = await prisma.producto.findMany({
    where: { empresaId },
    select: { id: true, nombre: true, codigo: true, cantidad: true, stockMinimo: true },
  })
  const consumo = await consumoPorProducto(empresaId, DIAS_VENTANA_CONSUMO)

  const alertas: AlertaStockAgotarse[] = []
  for (const p of productos) {
    if (p.cantidad <= 0) continue
    const datos = consumo.get(p.id)
    const cantidadVendida = datos?.cantidadVendida ?? 0
    const tieneHistorial = cantidadVendida > 0
    const enUmbralCritico = p.cantidad <= p.stockMinimo + MARGEN_ALERTA_STOCK

    if (tieneHistorial) {
      const consumoDiarioPromedio = cantidadVendida / DIAS_VENTANA_CONSUMO
      const diasParaAgotarse = p.cantidad / consumoDiarioPromedio
      // Mostrar si el cálculo proyecta agotamiento en 7 días O si el stock
      // ya está en zona crítica (regla "si ya está bajo, alertar siempre").
      if (diasParaAgotarse <= DIAS_LIMITE_AGOTARSE || enUmbralCritico) {
        alertas.push({
          productoId: p.id,
          nombre: p.nombre,
          codigo: p.codigo,
          cantidadActual: p.cantidad,
          stockMinimo: p.stockMinimo,
          consumoDiarioPromedio: Math.round(consumoDiarioPromedio * 100) / 100,
          diasParaAgotarse: Math.round(diasParaAgotarse * 10) / 10,
        })
      }
    } else if (enUmbralCritico) {
      // Sin historial pero el stock ya está en zona crítica.
      alertas.push({
        productoId: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        cantidadActual: p.cantidad,
        stockMinimo: p.stockMinimo,
        consumoDiarioPromedio: 0,
        diasParaAgotarse: null,
      })
    }
  }
  // Sin histórico primero (más urgente), luego por días ascendente.
  return alertas.sort((a, b) => {
    if (a.diasParaAgotarse === null && b.diasParaAgotarse === null) {
      return a.cantidadActual - b.cantidadActual
    }
    if (a.diasParaAgotarse === null) return -1
    if (b.diasParaAgotarse === null) return 1
    return a.diasParaAgotarse - b.diasParaAgotarse
  })
}

export async function obtenerProductosSinMovimientos(empresaId: string): Promise<AlertaSinMovimientos[]> {
  const [productos, ultimosMovimientos] = await Promise.all([
    prisma.producto.findMany({
      where: { empresaId },
      select: { id: true, nombre: true, codigo: true, cantidad: true, precio: true },
      take: MAX_PRODUCTOS_ANALISIS,
    }),
    prisma.movimiento.groupBy({
      by: ['productoId'],
      where: { empresaId },
      _max: { creadoEn: true },
    }),
  ])

  const mapaUltimoMov = new Map(ultimosMovimientos.map((m) => [m.productoId, m._max.creadoEn]))
  const hoy = new Date()
  const alertas: AlertaSinMovimientos[] = []

  for (const p of productos) {
    if (p.cantidad <= 0) continue
    const ultimo = mapaUltimoMov.get(p.id)
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

async function obtenerAltaRotacion(empresaId: string): Promise<ProductoAltaRotacion[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - DIAS_VENTANA_CONSUMO)

  const salidas = await prisma.movimiento.groupBy({
    by: ['productoId'],
    where: {
      empresaId,
      tipo: 'salida',
      creadoEn: { gte: desde },
      OR: [{ ventaId: null }, { venta: { canceladaEn: null } }],
    },
    _sum: { cantidad: true },
    _count: { _all: true },
    orderBy: { _sum: { cantidad: 'desc' } },
    take: TOP_ROTACION,
  })

  if (salidas.length === 0) return []

  const productos = await prisma.producto.findMany({
    where: { id: { in: salidas.map((s) => s.productoId) }, empresaId },
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
        totalSalidas: s._count?._all ?? 0,
        cantidadVendida: s._sum?.cantidad ?? 0,
      }
    })
    .filter((x): x is ProductoAltaRotacion => x !== null)
}

export async function obtenerStockCritico(empresaId: string): Promise<AlertaStockCritico[]> {
  const [productos, consumo] = await Promise.all([
    prisma.producto.findMany({
      where: { empresaId },
      select: { id: true, nombre: true, codigo: true, cantidad: true, stockMinimo: true },
    }),
    consumoPorProducto(empresaId, DIAS_VENTANA_CONSUMO),
  ])

  return productos
    .filter((p) => p.cantidad <= p.stockMinimo + MARGEN_ALERTA_STOCK)
    .map((p) => {
      const cantidadVendida = consumo.get(p.id)?.cantidadVendida ?? 0
      const consumoDiarioPromedio = cantidadVendida / DIAS_VENTANA_CONSUMO
      return {
        productoId: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        cantidadActual: p.cantidad,
        stockMinimo: p.stockMinimo,
        consumoDiarioPromedio: Math.round(consumoDiarioPromedio * 100) / 100,
        sugerenciaCompra: calcularSugerenciaCompraInteligente(
          p.stockMinimo,
          p.cantidad,
          consumoDiarioPromedio,
        ),
      }
    })
    .sort((a, b) => b.sugerenciaCompra - a.sugerenciaCompra)
}

/**
 * Resumen de movimientos por día en los últimos N días para gráficos.
 */
async function obtenerResumenMovimientos(empresaId: string, dias = 30): Promise<ResumenMovimientos[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  desde.setHours(0, 0, 0, 0)

  const movimientos = await prisma.movimiento.findMany({
    where: { empresaId, creadoEn: { gte: desde } },
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

async function obtenerInventarioGeneral(empresaId: string): Promise<FilaInventarioGeneral[]> {
  const [productos, ultimosMovimientos] = await Promise.all([
    prisma.producto.findMany({
      where: { empresaId },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        precio: true,
        cantidad: true,
        stockMinimo: true,
        categoria: { select: { nombre: true } },
      },
      orderBy: { nombre: 'asc' },
      take: MAX_PRODUCTOS_ANALISIS,
    }),
    prisma.movimiento.groupBy({
      by: ['productoId'],
      where: { empresaId },
      _max: { creadoEn: true },
    }),
  ])

  const mapaUltimoMov = new Map(ultimosMovimientos.map((m) => [m.productoId, m._max.creadoEn]))
  const hoy = new Date()
  return productos.map((p) => {
    const ultimo = mapaUltimoMov.get(p.id)
    const diasDesdeUltimaActividad = ultimo
      ? Math.floor((hoy.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24))
      : null
    let estado: FilaInventarioGeneral['estado']
    if (p.cantidad <= 0) estado = 'Sin stock'
    else if (p.cantidad <= p.stockMinimo + MARGEN_ALERTA_STOCK) estado = 'Stock bajo'
    else estado = 'Normal'

    return {
      productoId: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      categoria: p.categoria?.nombre ?? 'Sin categoría',
      cantidad: p.cantidad,
      stockMinimo: p.stockMinimo,
      precio: p.precio,
      valorEnStock: Math.round(p.precio * p.cantidad),
      estado,
      diasDesdeUltimaActividad,
    }
  })
}

/**
 * Ventas por día (últimos N días): numero de ventas (Venta.id distintos) y
 * total ingresado (suma de Venta.total). Util para grafico de linea.
 */
async function obtenerVentasPorDia(empresaId: string, dias = 30): Promise<VentaDiaria[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  desde.setHours(0, 0, 0, 0)

  const ventas = await prisma.venta.findMany({
    where: { empresaId, creadoEn: { gte: desde }, canceladaEn: null },
    select: { total: true, creadoEn: true },
    orderBy: { creadoEn: 'asc' },
  })

  const mapa = new Map<string, { numeroVentas: number; totalIngreso: number }>()
  for (let i = 0; i <= dias; i++) {
    const d = new Date(desde)
    d.setDate(d.getDate() + i)
    mapa.set(d.toISOString().slice(0, 10), { numeroVentas: 0, totalIngreso: 0 })
  }
  for (const v of ventas) {
    const k = v.creadoEn.toISOString().slice(0, 10)
    const acc = mapa.get(k)
    if (!acc) continue
    acc.numeroVentas += 1
    acc.totalIngreso += v.total
  }
  return Array.from(mapa.entries()).map(([fecha, { numeroVentas, totalIngreso }]) => ({
    fecha,
    numeroVentas,
    totalIngreso: Math.round(totalIngreso),
  }))
}

/**
 * Categorías con más ventas (top N) por unidades vendidas y por ingreso total.
 */
async function obtenerVentasPorCategoria(empresaId: string, dias = 30, top = 8): Promise<CategoriaVentas[]> {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  desde.setHours(0, 0, 0, 0)

  const items = await prisma.itemVenta.groupBy({
    by: ['productoId'],
    where: {
      venta: { empresaId, creadoEn: { gte: desde }, canceladaEn: null },
    },
    _sum: { cantidad: true, subtotal: true },
  })

  if (items.length === 0) return []

  const productosIds = items.map((i) => i.productoId)
  const productos = await prisma.producto.findMany({
    where: { id: { in: productosIds } },
    select: { id: true, categoria: { select: { nombre: true } } },
  })
  const mapaCategoria = new Map(productos.map((p) => [p.id, p.categoria?.nombre ?? 'Sin categoría']))

  const agrupado = new Map<string, { unidadesVendidas: number; ingresoTotal: number }>()
  for (const it of items) {
    const cat = mapaCategoria.get(it.productoId) ?? 'Sin categoría'
    const acc = agrupado.get(cat) ?? { unidadesVendidas: 0, ingresoTotal: 0 }
    acc.unidadesVendidas += it._sum.cantidad ?? 0
    acc.ingresoTotal += it._sum.subtotal ?? 0
    agrupado.set(cat, acc)
  }
  return Array.from(agrupado.entries())
    .map(([categoria, datos]) => ({
      categoria,
      unidadesVendidas: datos.unidadesVendidas,
      ingresoTotal: Math.round(datos.ingresoTotal),
    }))
    .sort((a, b) => b.ingresoTotal - a.ingresoTotal)
    .slice(0, top)
}

/**
 * Distribucion del inventario por estado (sin stock / stock bajo / normal).
 */
async function obtenerDistribucionStock(empresaId: string): Promise<DistribucionStock[]> {
  const productos = await prisma.producto.findMany({
    where: { empresaId },
    select: { cantidad: true, stockMinimo: true },
  })
  let sinStock = 0, stockBajo = 0, normal = 0
  for (const p of productos) {
    if (p.cantidad <= 0) sinStock++
    else if (p.cantidad <= p.stockMinimo + MARGEN_ALERTA_STOCK) stockBajo++
    else normal++
  }
  return [
    { estado: 'Sin stock', cantidad: sinStock },
    { estado: 'Stock bajo', cantidad: stockBajo },
    { estado: 'Normal', cantidad: normal },
  ]
}


export async function obtenerTodoAnalisis(empresaId: string) {
  const [
    inventarioGeneral,
    stockAgotarse,
    sinMovimientos,
    altaRotacion,
    stockCritico,
    resumen,
    ventasPorDia,
    ventasPorCategoria,
    distribucionStock,
  ] = await Promise.all([
    obtenerInventarioGeneral(empresaId),
    obtenerStockPorAgotarse(empresaId),
    obtenerProductosSinMovimientos(empresaId),
    obtenerAltaRotacion(empresaId),
    obtenerStockCritico(empresaId),
    obtenerResumenMovimientos(empresaId, 30),
    obtenerVentasPorDia(empresaId, 30),
    obtenerVentasPorCategoria(empresaId, 30, 8),
    obtenerDistribucionStock(empresaId),
  ])
  return {
    inventarioGeneral,
    stockAgotarse,
    sinMovimientos,
    altaRotacion,
    stockCritico,
    resumen,
    ventasPorDia,
    ventasPorCategoria,
    distribucionStock,
  }
}
