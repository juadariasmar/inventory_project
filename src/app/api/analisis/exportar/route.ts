import { NextResponse } from 'next/server'
import { obtenerTodoAnalisis } from '@/lib/analisis'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import {
  FORMATO_DECIMAL_2,
  FORMATO_MONEDA,
  generarLibroExcel,
} from '@/lib/excel'

export async function GET() {
  if (!(await tienePermiso('EXPORTAR_REPORTES'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const sesion = await obtenerSesion()
    const empresaId = sesion?.user?.empresaId
    if (!empresaId) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
    }
    const {
      inventarioGeneral,
      stockAgotarse,
      sinMovimientos,
      altaRotacion,
      stockCritico,
      resumen,
    } = await obtenerTodoAnalisis(empresaId)

    const ahora = new Date()
    // YYYYMMDD-HHMMSS en hora local de Colombia para que cada descarga tenga
    // nombre unico (evita que el navegador reutilice extensiones de descargas
    // previas con prefijo similar).
    const stampCo = ahora
      .toLocaleString('sv-SE', { timeZone: 'America/Bogota', hour12: false })
      .replace(/[-: ]/g, '')
      .slice(0, 14)
    const nombreArchivo = `analisis_inventario_${stampCo.slice(0, 8)}_${stampCo.slice(8)}.xlsx`
    const fechaCo = ahora.toLocaleString('es-MX', { timeZone: 'America/Bogota' })

    const buffer = await generarLibroExcel({
      titulo: 'Análisis de inventario',
      subtitulo: 'Sistema de Inventario',
      autor: sesion?.user?.name ?? 'Sistema de Inventario',
      hojas: [
        // ---------- Resumen ----------
        {
          nombre: 'Resumen',
          titulo: 'Resumen del análisis',
          subtitulo: `Generado el ${fechaCo} por ${sesion?.user?.name ?? 'Sistema'}`,
          columnas: [
            { encabezado: 'Indicador', key: 'indicador', ancho: 48 },
            { encabezado: 'Valor', key: 'valor', ancho: 22, alineacion: 'right' },
          ],
          filas: [
            { indicador: 'Productos en inventario', valor: inventarioGeneral.length },
            { indicador: 'En riesgo de agotarse (siguientes 7 días)', valor: stockAgotarse.length },
            { indicador: 'Sin movimientos recientes', valor: sinMovimientos.length },
            { indicador: 'En zona crítica (stock por debajo del mínimo)', valor: stockCritico.length },
            { indicador: 'Productos de alta rotación analizados', valor: altaRotacion.length },
            {
              indicador: 'Valor total del inventario (COP)',
              valor: `$${inventarioGeneral.reduce((s, p) => s + p.valorEnStock, 0).toLocaleString('es-MX')}`,
            },
          ],
        },

        // ---------- Inventario general ----------
        {
          nombre: 'Inventario general',
          titulo: 'Inventario general',
          subtitulo: 'Listado completo del catálogo con estado y valor en stock.',
          columnas: [
            { encabezado: 'Código', key: 'codigo', ancho: 12 },
            { encabezado: 'Producto', key: 'nombre', ancho: 30 },
            { encabezado: 'Categoría', key: 'categoria', ancho: 18 },
            { encabezado: 'Cantidad', key: 'cantidad', ancho: 12, alineacion: 'right' },
            { encabezado: 'Stock mínimo', key: 'stockMinimo', ancho: 14, alineacion: 'right' },
            { encabezado: 'Precio unitario', key: 'precio', ancho: 16, formato: FORMATO_MONEDA, alineacion: 'right' },
            { encabezado: 'Valor en stock', key: 'valorEnStock', ancho: 18, formato: FORMATO_MONEDA, alineacion: 'right' },
            { encabezado: 'Estado', key: 'estado', ancho: 14 },
            { encabezado: 'Días sin actividad', key: 'diasDesdeUltimaActividad', ancho: 18, alineacion: 'right' },
          ],
          filas: inventarioGeneral.map((p) => ({
            codigo: p.codigo,
            nombre: p.nombre,
            categoria: p.categoria,
            cantidad: p.cantidad,
            stockMinimo: p.stockMinimo,
            precio: p.precio,
            valorEnStock: p.valorEnStock,
            estado: p.estado,
            diasDesdeUltimaActividad:
              p.diasDesdeUltimaActividad === null ? 'Sin actividad' : p.diasDesdeUltimaActividad,
          })),
          mensajeVacio: 'No hay productos registrados.',
        },

        // ---------- Stock por agotarse ----------
        {
          nombre: 'Por agotarse',
          titulo: 'Productos en riesgo de agotarse',
          subtitulo: 'Proyección basada en el consumo de los últimos 30 días.',
          columnas: [
            { encabezado: 'Código', key: 'codigo', ancho: 12 },
            { encabezado: 'Producto', key: 'nombre', ancho: 30 },
            { encabezado: 'Cantidad actual', key: 'cantidadActual', ancho: 16, alineacion: 'right' },
            { encabezado: 'Consumo/día', key: 'consumoDiarioPromedio', ancho: 14, formato: FORMATO_DECIMAL_2, alineacion: 'right' },
            { encabezado: 'Días para agotarse', key: 'diasParaAgotarse', ancho: 18, alineacion: 'right' },
          ],
          filas: stockAgotarse.map((a) => ({
            codigo: a.codigo,
            nombre: a.nombre,
            cantidadActual: a.cantidadActual,
            consumoDiarioPromedio: a.consumoDiarioPromedio,
            diasParaAgotarse: a.diasParaAgotarse === null ? 'Sin histórico' : a.diasParaAgotarse,
          })),
          mensajeVacio: 'No hay productos en riesgo de agotarse.',
        },

        // ---------- Productos sin movimientos ----------
        {
          nombre: 'Sin movimientos',
          titulo: 'Productos sin movimientos recientes',
          subtitulo: 'Productos con más de 30 días sin entradas ni salidas.',
          columnas: [
            { encabezado: 'Código', key: 'codigo', ancho: 12 },
            { encabezado: 'Producto', key: 'nombre', ancho: 30 },
            { encabezado: 'Cantidad', key: 'cantidadActual', ancho: 12, alineacion: 'right' },
            { encabezado: 'Días sin movimiento', key: 'diasSinMovimiento', ancho: 20, alineacion: 'right' },
            { encabezado: 'Valor inmovilizado', key: 'valorInmovilizado', ancho: 18, formato: FORMATO_MONEDA, alineacion: 'right' },
          ],
          filas: sinMovimientos.map((p) => ({
            codigo: p.codigo,
            nombre: p.nombre,
            cantidadActual: p.cantidadActual,
            diasSinMovimiento: p.diasSinMovimiento,
            valorInmovilizado: p.valorInmovilizado,
          })),
          mensajeVacio: 'Todos los productos han tenido movimientos recientes.',
        },

        // ---------- Alta rotación ----------
        {
          nombre: 'Alta rotación',
          titulo: 'Top productos de alta rotación',
          subtitulo: 'Productos con más salidas en los últimos 30 días.',
          columnas: [
            { encabezado: 'Código', key: 'codigo', ancho: 12 },
            { encabezado: 'Producto', key: 'nombre', ancho: 30 },
            { encabezado: 'Salidas registradas', key: 'totalSalidas', ancho: 20, alineacion: 'right' },
            { encabezado: 'Unidades vendidas', key: 'cantidadVendida', ancho: 20, alineacion: 'right' },
          ],
          filas: altaRotacion.map((p) => ({
            codigo: p.codigo,
            nombre: p.nombre,
            totalSalidas: p.totalSalidas,
            cantidadVendida: p.cantidadVendida,
          })),
          mensajeVacio: 'Aún no hay movimientos suficientes para calcular la rotación.',
        },

        // ---------- Stock crítico ----------
        {
          nombre: 'Stock crítico',
          titulo: 'Stock por debajo del mínimo',
          subtitulo: 'Sugerencia de compra para cubrir 14 días de ventas según el consumo histórico.',
          columnas: [
            { encabezado: 'Código', key: 'codigo', ancho: 12 },
            { encabezado: 'Producto', key: 'nombre', ancho: 30 },
            { encabezado: 'Cantidad actual', key: 'cantidadActual', ancho: 16, alineacion: 'right' },
            { encabezado: 'Stock mínimo', key: 'stockMinimo', ancho: 14, alineacion: 'right' },
            { encabezado: 'Consumo/día', key: 'consumoDiarioPromedio', ancho: 14, formato: FORMATO_DECIMAL_2, alineacion: 'right' },
            { encabezado: 'Sugerencia compra', key: 'sugerenciaCompra', ancho: 18, alineacion: 'right' },
          ],
          filas: stockCritico.map((a) => ({
            codigo: a.codigo,
            nombre: a.nombre,
            cantidadActual: a.cantidadActual,
            stockMinimo: a.stockMinimo,
            consumoDiarioPromedio: a.consumoDiarioPromedio,
            sugerenciaCompra: a.sugerenciaCompra,
          })),
          mensajeVacio: 'No hay productos en zona crítica.',
        },

        // ---------- Movimientos diarios ----------
        {
          nombre: 'Movimientos diarios',
          titulo: 'Movimientos diarios (últimos 30 días)',
          subtitulo: 'Conteo de entradas y salidas registradas por día.',
          columnas: [
            { encabezado: 'Fecha', key: 'fecha', ancho: 14 },
            { encabezado: 'Entradas', key: 'entradas', ancho: 12, alineacion: 'right' },
            { encabezado: 'Salidas', key: 'salidas', ancho: 12, alineacion: 'right' },
          ],
          filas: resumen.map((r) => ({
            fecha: r.fecha,
            entradas: r.entradas,
            salidas: r.salidas,
          })),
          mensajeVacio: 'No hay movimientos registrados en el período.',
        },
      ],
    })

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('Error al exportar análisis:', e)
    return NextResponse.json(
      { error: 'Error al generar el archivo' },
      { status: 500 }
    )
  }
}
