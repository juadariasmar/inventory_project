import { redirect } from 'next/navigation'
import { obtenerSesion } from '@/lib/permisos'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import nextDynamic from 'next/dynamic'

const GraficoMovimientos = nextDynamic(() => import('@/componentes/graficos/GraficoMovimientos'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
})
const GraficoAltaRotacion = nextDynamic(() => import('@/componentes/graficos/GraficoAltaRotacion'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
})
const GraficoVentasDiarias = nextDynamic(() => import('@/componentes/graficos/GraficoVentasDiarias'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
})
const GraficoVentasCategoria = nextDynamic(() => import('@/componentes/graficos/GraficoVentasCategoria'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
})
const GraficoDistribucionStock = nextDynamic(() => import('@/componentes/graficos/GraficoDistribucionStock'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
})

import BotonExportarAnalisis from '@/componentes/comunes/BotonExportarAnalisis'
import InventarioGeneralAgrupado from '@/componentes/productos/InventarioGeneralAgrupado'
import { obtenerTodoAnalisis } from '@/lib/analisis'
import { tienePermiso } from '@/lib/permisos'
import { Suspense } from 'react'
import { AutoScroller } from './AutoScroller'

export const dynamic = 'force-dynamic'

async function ContenidoAnalisis() {
  if (!(await tienePermiso('VER_ANALISIS'))) {
    redirect('/')
  }

  const sesion = await obtenerSesion()
  if (!sesion?.user?.empresaId) redirect('/auth/sign-in')
  const empresaId = sesion.user.empresaId

  const [analisis, puedeExportar] = await Promise.all([
    obtenerTodoAnalisis(empresaId),
    tienePermiso('EXPORTAR_REPORTES')
  ])

  const {
    inventarioGeneral,
    stockAgotarse,
    sinMovimientos,
    altaRotacion,
    stockCritico,
    resumen,
    ventasPorDia,
    ventasPorCategoria,
    distribucionStock,
  } = analisis

  // Contar productos UNICOS para evitar duplicados: muchos productos en
  // stock critico tambien aparecen en "por agotarse" porque ahora ambas
  // listas comparten el criterio de zona critica.
  const productosUnicosEnAlerta = new Set<number>()
  for (const a of stockCritico) productosUnicosEnAlerta.add(a.productoId)
  for (const a of stockAgotarse) productosUnicosEnAlerta.add(a.productoId)
  for (const a of sinMovimientos) productosUnicosEnAlerta.add(a.productoId)
  const totalAlertas = productosUnicosEnAlerta.size

  return (
    <div className="space-y-6">
        <AutoScroller />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Análisis e informes</h1>
            <p className="text-sm text-gray-600">
              Reportes automáticos sobre el comportamiento del inventario
            </p>
          </div>
          {puedeExportar && <BotonExportarAnalisis />}
        </div>

        {/* Inventario general */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Inventario general
          </h2>
          {inventarioGeneral.length > 0 ? (
            <InventarioGeneralAgrupado datos={inventarioGeneral} />
          ) : (
            <p className="text-gray-500 text-sm">
              Aún no hay productos registrados.
            </p>
          )}
        </section>

        {/* Resumen de alertas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <TarjetaAlerta
            titulo="Stock crítico"
            valor={stockCritico.length}
            color="bg-red-50 text-red-700 border-red-200"
          />
          <TarjetaAlerta
            titulo="Por agotarse"
            valor={stockAgotarse.length}
            color="bg-amber-50 text-amber-700 border-amber-200"
          />
          <TarjetaAlerta
            titulo="Sin movimientos"
            valor={sinMovimientos.length}
            color="bg-blue-50 text-blue-700 border-blue-200"
          />
          <TarjetaAlerta
            titulo="Total alertas"
            valor={totalAlertas}
            color="bg-gray-50 text-gray-700 border-gray-200"
          />
        </div>

        {/* Gráfico de movimientos */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Movimientos diarios (últimos 30 días)
          </h2>
          <GraficoMovimientos datos={resumen} />
        </section>

        {/* Ventas diarias */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Ventas diarias (últimos 30 días)
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Línea verde: total cobrado por día. Línea azul punteada: número de
            ventas registradas (con su propio eje a la derecha).
          </p>
          <GraficoVentasDiarias datos={ventasPorDia} />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Ventas por categoría */}
          <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Top categorías por ingreso (últimos 30 días)
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Suma del ingreso por venta agrupado por categoría del producto.
            </p>
            {ventasPorCategoria.length > 0 ? (
              <GraficoVentasCategoria datos={ventasPorCategoria} />
            ) : (
              <p className="text-gray-500 text-sm">
                Aún no hay ventas registradas para mostrar este ranking.
              </p>
            )}
          </section>

          {/* Distribución de stock */}
          <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">
              Distribución del inventario
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Proporción de productos en cada estado de stock.
            </p>
            <GraficoDistribucionStock datos={distribucionStock} />
          </section>
        </div>

        {/* Top alta rotación */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Top 10 productos con alta rotación (últimos 30 días)
          </h2>
          {altaRotacion.length > 0 ? (
            <>
              <GraficoAltaRotacion datos={altaRotacion} />
              <TablaAltaRotacion datos={altaRotacion} />
            </>
          ) : (
            <p className="text-gray-500 text-sm">
              Aún no hay suficientes movimientos de salida para calcular la rotación.
            </p>
          )}
        </section>

        {/* Productos en riesgo */}
        <section id="por-agotarse" className="bg-white rounded-lg shadow-md p-4 sm:p-6 scroll-mt-20">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Productos en riesgo de agotarse
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Productos con stock dentro del umbral crítico o cuyo agotamiento se
            proyecta en 7 días o menos según el consumo histórico.
          </p>
          {stockAgotarse.length > 0 ? (
            <TablaStockAgotarse datos={stockAgotarse} />
          ) : (
            <p className="text-gray-500 text-sm">
              No hay productos en riesgo de agotarse.
            </p>
          )}
        </section>

        {/* Sin movimientos */}
        <section id="sin-movimientos" className="bg-white rounded-lg shadow-md p-4 sm:p-6 scroll-mt-20">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Productos sin movimientos (más de 30 días)
          </h2>
          {sinMovimientos.length > 0 ? (
            <TablaSinMovimientos datos={sinMovimientos} />
          ) : (
            <p className="text-gray-500 text-sm">
              Todos los productos han tenido movimientos recientes.
            </p>
          )}
        </section>

        {/* Stock crítico */}
        <section id="stock-critico" className="bg-white rounded-lg shadow-md p-4 sm:p-6 scroll-mt-20">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Stock por debajo del mínimo
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            La sugerencia de compra cubre 14 días de ventas según el consumo de
            los últimos 30 días, más el stock mínimo como colchón. Si el producto
            no tiene historial reciente, se sugiere el mínimo para salir del
            umbral crítico.
          </p>
          {stockCritico.length > 0 ? (
            <TablaStockCritico datos={stockCritico} />
          ) : (
            <p className="text-gray-500 text-sm">No hay productos con stock crítico.</p>
          )}
        </section>
      </div>
  )
}

export default function PaginaAnalisis() {
  return (
    <LayoutProtegido>
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      }>
        <ContenidoAnalisis />
      </Suspense>
    </LayoutProtegido>
  )
}

function TarjetaAlerta({
  titulo,
  valor,
  color,
}: {
  titulo: string
  valor: number
  color: string
}) {
  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${color}`}>
      <div className="text-xs sm:text-sm font-medium uppercase tracking-wide">
        {titulo}
      </div>
      <div className="text-2xl sm:text-3xl font-bold mt-1">{valor}</div>
    </div>
  )
}

function TablaResponsive({
  cabeceras,
  filas,
}: {
  cabeceras: string[]
  filas: (string | number)[][]
}) {
  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {cabeceras.map((c) => (
                <th
                  key={c}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filas.map((fila, i) => (
              <tr key={i}>
                {fila.map((c, j) => (
                  <td key={j} className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden divide-y divide-gray-200">
        {filas.map((fila, i) => (
          <div key={i} className="py-3 grid grid-cols-2 gap-1 text-sm">
            {cabeceras.map((c, j) => (
              <div key={j} className="contents">
                <div className="text-gray-500 text-xs">{c}</div>
                <div className="text-gray-800">{fila[j]}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

function TablaStockAgotarse({
  datos,
}: {
  datos: { nombre: string; codigo: string; cantidadActual: number; consumoDiarioPromedio: number; diasParaAgotarse: number | null }[]
}) {
  return (
    <TablaResponsive
      cabeceras={['Producto', 'Código', 'Cantidad', 'Consumo/día', 'Días restantes']}
      filas={datos.map((d) => [
        d.nombre,
        d.codigo,
        d.cantidadActual,
        d.consumoDiarioPromedio,
        d.diasParaAgotarse === null ? 'Sin histórico' : d.diasParaAgotarse,
      ])}
    />
  )
}

function TablaSinMovimientos({
  datos,
}: {
  datos: { nombre: string; codigo: string; cantidadActual: number; diasSinMovimiento: number; valorInmovilizado: number }[]
}) {
  return (
    <TablaResponsive
      cabeceras={['Producto', 'Código', 'Cantidad', 'Días sin mov.', 'Valor inmovilizado']}
      filas={datos.map((d) => [
        d.nombre,
        d.codigo,
        d.cantidadActual,
        d.diasSinMovimiento,
        `$${d.valorInmovilizado.toLocaleString('es-MX')}`,
      ])}
    />
  )
}

function TablaAltaRotacion({
  datos,
}: {
  datos: { nombre: string; codigo: string; totalSalidas: number; cantidadVendida: number }[]
}) {
  return (
    <div className="mt-4">
      <TablaResponsive
        cabeceras={['Producto', 'Código', 'Salidas', 'Unidades vendidas']}
        filas={datos.map((d) => [d.nombre, d.codigo, d.totalSalidas, d.cantidadVendida])}
      />
    </div>
  )
}

function TablaStockCritico({
  datos,
}: {
  datos: { nombre: string; codigo: string; cantidadActual: number; stockMinimo: number; consumoDiarioPromedio: number; sugerenciaCompra: number }[]
}) {
  return (
    <TablaResponsive
      cabeceras={['Producto', 'Código', 'Cantidad', 'Mínimo', 'Consumo/día', 'Sugerencia compra']}
      filas={datos.map((d) => [
        d.nombre,
        d.codigo,
        d.cantidadActual,
        d.stockMinimo,
        d.consumoDiarioPromedio,
        d.sugerenciaCompra,
      ])}
    />
  )
}

