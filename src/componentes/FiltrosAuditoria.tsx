'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ACCIONES, ENTIDADES } from '@/lib/auditoria'

interface UsuarioLite {
  id: string
  nombre: string
  email: string
}

interface Propiedades {
  usuarios: UsuarioLite[]
  permiteExportar: boolean
}

export default function FiltrosAuditoria({ usuarios, permiteExportar }: Propiedades) {
  const router = useRouter()
  const sp = useSearchParams()

  const [usuario, setUsuario] = useState(sp.get('usuario') ?? '')
  const [entidad, setEntidad] = useState(sp.get('entidad') ?? '')
  const [accion, setAccion] = useState(sp.get('accion') ?? '')
  const [desde, setDesde] = useState(sp.get('desde') ?? '')
  const [hasta, setHasta] = useState(sp.get('hasta') ?? '')

  useEffect(() => {
    const params = new URLSearchParams()
    if (usuario) params.set('usuario', usuario)
    if (entidad) params.set('entidad', entidad)
    if (accion) params.set('accion', accion)
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    // No conservamos 'pagina' al cambiar filtros: regresamos a la primera.
    const qs = params.toString()
    router.replace(qs ? `/auditoria?${qs}` : '/auditoria', { scroll: false })
  }, [usuario, entidad, accion, desde, hasta, router])

  const hayFiltros = !!(usuario || entidad || accion || desde || hasta)

  const limpiar = () => {
    setUsuario(''); setEntidad(''); setAccion(''); setDesde(''); setHasta('')
  }

  const urlExportar = () => {
    const params = new URLSearchParams()
    if (usuario) params.set('usuario', usuario)
    if (entidad) params.set('entidad', entidad)
    if (accion) params.set('accion', accion)
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    return `/api/auditoria/exportar?${params.toString()}`
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Usuario</label>
          <select
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre} (@{u.email})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Entidad</label>
          <select
            value={entidad}
            onChange={(e) => setEntidad(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {ENTIDADES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Acción</label>
          <select
            value={accion}
            onChange={(e) => setAccion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
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
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {hayFiltros ? (
          <button
            type="button"
            onClick={limpiar}
            className="text-blue-600 hover:text-blue-800 underline text-sm self-start"
          >
            Limpiar filtros
          </button>
        ) : <span />}
        {permiteExportar && (
          <a
            href={urlExportar()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm text-center"
          >
            Exportar a Excel
          </a>
        )}
      </div>
    </div>
  )
}
