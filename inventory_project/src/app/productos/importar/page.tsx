import { redirect } from 'next/navigation'
import LayoutProtegido from '@/componentes/LayoutProtegido'
import FormularioImportarProductos from '@/componentes/FormularioImportarProductos'
import { obtenerSesion } from '@/lib/permisos'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PaginaImportarProductos() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.rol !== 'ADMIN') {
    redirect('/')
  }

  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/productos" className="hover:text-blue-600">Productos</Link>
          <span>/</span>
          <span className="text-gray-800">Importar desde CSV</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Importar productos desde CSV
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Carga masiva de productos desde un archivo .csv. Útil para cargar
            el catálogo inicial o agregar muchos productos a la vez.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Antes de empezar</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              <strong>Descarga la plantilla</strong> y úsala como base. Tiene los
              encabezados correctos y filas de ejemplo.
            </li>
            <li>
              Abre la plantilla en Excel o un editor de texto, agrega tus
              productos respetando las columnas.
            </li>
            <li>
              Guarda como <strong>.csv (delimitado por comas)</strong>.
            </li>
            <li>
              Sube el archivo aquí y revisa el reporte.
            </li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm space-y-2">
            <p className="font-semibold text-blue-900">Columnas del CSV:</p>
            <ul className="list-disc list-inside text-blue-900 space-y-1">
              <li><strong>codigo</strong> (requerido, único)</li>
              <li><strong>nombre</strong> (requerido)</li>
              <li><strong>descripcion</strong> (opcional)</li>
              <li><strong>precio</strong> (requerido, número &ge; 0)</li>
              <li><strong>cantidad</strong> (opcional, entero &ge; 0, por defecto 0)</li>
              <li><strong>stockMinimo</strong> (opcional, entero &ge; 0, por defecto 1)</li>
              <li><strong>categoria</strong> (opcional, nombre exacto de una categoría existente)</li>
            </ul>
          </div>

          <a
            href="/api/productos/plantilla"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm"
          >
            ⬇ Descargar plantilla CSV
          </a>
        </div>

        <FormularioImportarProductos />
      </div>
    </LayoutProtegido>
  )
}
