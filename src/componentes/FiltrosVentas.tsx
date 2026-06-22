'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UsuarioLite {
  id: string
  nombre: string
  email: string
}

interface Propiedades {
  // Solo se muestra el filtro por vendedor si el usuario es admin.
  esAdmin: boolean
  vendedores: UsuarioLite[]
}

export default function FiltrosVentas({ esAdmin, vendedores }: Propiedades) {
  const router = useRouter()
  const sp = useSearchParams()

  const [vendedor, setVendedor] = useState(sp.get('vendedor') ?? '')
  const [desde, setDesde] = useState(sp.get('desde') ?? '')
  const [hasta, setHasta] = useState(sp.get('hasta') ?? '')

  useEffect(() => {
    const params = new URLSearchParams()
    if (vendedor) params.set('vendedor', vendedor)
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    const qs = params.toString()
    router.replace(qs ? `/ventas?${qs}` : '/ventas', { scroll: false })
  }, [vendedor, desde, hasta, router])

  const hayFiltros = !!(vendedor || desde || hasta)

  const limpiar = () => {
    setVendedor('')
    setDesde('')
    setHasta('')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className={`grid grid-cols-1 ${esAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        {esAdmin && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vendedor</label>
            <select
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} (@{v.email})
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {hayFiltros && (
        <div className="mt-3">
          <button
            type="button"
            onClick={limpiar}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
