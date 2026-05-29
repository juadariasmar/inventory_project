import { redirect } from 'next/navigation'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import GraficoMovimientos from '@/componentes/GraficoMovimientos'
import GraficoAltaRotacion from '@/componentes/GraficoAltaRotacion'
import BotonExportarAnalisis from '@/componentes/BotonExportarAnalisis'
import { obtenerTodoAnalisis } from '@/lib/analisis'
import { tienePermiso } from '@/lib/permisos'

export default async function PaginaAnalisis() {
  if (!(await tienePermiso('VER_ANALISIS'))) {
    redirect('/')
  }

  const { stockAgotarse, sinMovimientos, altaRotacion, stockCritico, resumen } =
    await obtenerTodoAnalisis()
  const puedeExportar = await tienePermiso('EXPORTAR_REPORTES')

  const totalAlertas =
    stockAgotarse.length + sinMovimientos.length + stockCritico.length

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Análisis e informes</h1>
            <p className="text-sm text-gray-600">
              Reportes automáticos sobre el comportamiento del inventario
            </p>
          </div>
          {puedeExportar && <BotonExportarAnalisis />}
        </div>

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

        {/* Stock por agotarse */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Productos por agotarse en menos de 7 días
          </h2>
          {stockAgotarse.length > 0 ? (
            <TablaStockAgotarse datos={stockAgotarse} />
          ) : (
            <p className="text-gray-500 text-sm">No hay productos en riesgo de agotarse.</p>
          )}
        </section>

        {/* Sin movimientos */}
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
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
        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Stock por debajo del mínimo
          </h2>
          {stockCritico.length > 0 ? (
            <TablaStockCritico datos={stockCritico} />
          ) : (
            <p className="text-gray-500 text-sm">No hay productos con stock crítico.</p>
          )}
        </section>
      </div>
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
      <div className="hidden md:block overflow-x-auto">
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
      <div className="md:hidden divide-y divide-gray-200">
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
  datos: { nombre: string; codigo: string; cantidadActual: number; consumoDiarioPromedio: number; diasParaAgotarse: number }[]
}) {
  return (
    <TablaResponsive
      cabeceras={['Producto', 'Código', 'Cantidad', 'Consumo/día', 'Días restantes']}
      filas={datos.map((d) => [
        d.nombre,
        d.codigo,
        d.cantidadActual,
        d.consumoDiarioPromedio,
        d.diasParaAgotarse,
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
  datos: { nombre: string; codigo: string; cantidadActual: number; stockMinimo: number; faltanteParaDuplicarMinimo: number }[]
}) {
  return (
    <TablaResponsive
      cabeceras={['Producto', 'Código', 'Cantidad', 'Mínimo', 'Sugerencia compra']}
      filas={datos.map((d) => [
        d.nombre,
        d.codigo,
        d.cantidadActual,
        d.stockMinimo,
        d.faltanteParaDuplicarMinimo,
      ])}
    />
  )
}
