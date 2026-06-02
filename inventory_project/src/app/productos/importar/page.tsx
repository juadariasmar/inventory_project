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
            Carga masiva de productos desde un archivo .csv o .xlsx (Excel).
            Útil para cargar el catálogo inicial o agregar muchos productos a la vez.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Cómo funciona</h2>
          <p className="text-sm text-gray-700">
            Sube cualquier archivo <strong>.csv</strong> o <strong>.xlsx</strong>{' '}
            que contenga los productos a importar. El sistema busca por sí mismo
            las columnas necesarias en cualquier orden, ignora las que no
            reconozca y maneja variaciones comunes en los nombres (con o sin
            tildes, mayúsculas, espacios o sinónimos como <em>SKU</em>,{' '}
            <em>artículo</em>, <em>existencias</em>, etc.).
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm space-y-2">
            <p className="font-semibold text-blue-900">Campos que se buscarán:</p>
            <ul className="list-disc list-inside text-blue-900 space-y-1">
              <li><strong>código</strong> (requerido, único) — acepta: codigo, sku, referencia, cod.</li>
              <li><strong>nombre</strong> (requerido) — acepta: nombre, producto, artículo, item.</li>
              <li><strong>descripción</strong> (opcional) — descripcion, observación, detalle.</li>
              <li><strong>precio</strong> (requerido, número &ge; 0) — precio, valor, precio venta, pvp. Se ignoran el símbolo $ y los separadores de miles.</li>
              <li><strong>cantidad</strong> (opcional, entero &ge; 0, por defecto 0) — cantidad, stock, existencia, unidades.</li>
              <li><strong>stock mínimo</strong> (opcional, por defecto 1) — stockMinimo, mínimo, alerta, umbral.</li>
              <li><strong>categoría</strong> (opcional) — categoría, tipo, grupo. Si la categoría no existe, se crea automáticamente al importar.</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
            <p className="text-amber-900">
              <strong>Recomendación:</strong> los códigos deben ser únicos. Si un
              código ya existe en el sistema, esa fila se rechaza y el resto se
              importa normalmente.
            </p>
          </div>

          <a
            href="/api/productos/plantilla"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm"
          >
            ⬇ Descargar plantilla CSV (opcional)
          </a>
        </div>

        <FormularioImportarProductos />
      </div>
    </LayoutProtegido>
  )
}
