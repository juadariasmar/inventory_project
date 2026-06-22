import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import FormularioCategoria from '@/componentes/productos/FormularioCategoria'
import Link from 'next/link'

export default function PaginaNuevaCategoria() {
  return (
    <LayoutProtegido>
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/categorias" className="hover:text-blue-600">
            Categorías
          </Link>
          <span>/</span>
          <span>Nueva</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Nueva Categoría</h1>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
          <FormularioCategoria />
        </div>
      </div>
    </LayoutProtegido>
  )
}
