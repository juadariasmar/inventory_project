'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface CategoriaConteo {
  id: number
  nombre: string
  _count?: { productos: number }
  productosCount?: number
}

interface Propiedades {
  categoriasIniciales: { id: number; nombre: string; productosCount: number }[]
}

export default function PanelCategorias({ categoriasIniciales }: Propiedades) {
  const router = useRouter()
  const [categorias, setCategorias] = useState<CategoriaConteo[]>(
    categoriasIniciales.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      _count: { productos: c.productosCount },
    }))
  )
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const recargar = async () => {
    try {
      const r = await fetch('/api/categorias')
      if (r.ok) {
        const data = await r.json()
        setCategorias(data)
      }
    } catch {}
  }

  const crear = async () => {
    const nombre = nuevoNombre.trim()
    if (!nombre) {
      setError('El nombre es obligatorio.')
      return
    }
    setCreando(true)
    setError('')
    setExito('')
    try {
      const r = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      })
      if (r.ok) {
        setExito(`Categoría "${nombre}" creada.`)
        setNuevoNombre('')
        await recargar()
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo crear la categoría.')
      }
    } catch {
      setError('Error al crear la categoría.')
    } finally {
      setCreando(false)
    }
  }

  const eliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?\n\nLos productos asociados quedarán sin categoría.`)) {
      return
    }
    setEliminandoId(id)
    setError('')
    setExito('')
    try {
      const r = await fetch(`/api/categorias/${id}`, { method: 'DELETE' })
      if (r.ok) {
        setExito(`Categoría "${nombre}" eliminada.`)
        await recargar()
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo eliminar la categoría.')
      }
    } catch {
      setError('Error al eliminar la categoría.')
    } finally {
      setEliminandoId(null)
    }
  }

  const totalProductos = categorias.reduce(
    (s, c) => s + (c._count?.productos ?? 0),
    0
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal: lista */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <div className="flex justify-between items-baseline">
            <h2 className="text-lg font-bold text-gray-800">
              Categorías existentes
            </h2>
            <span className="text-sm text-gray-500">
              {categorias.length} categoría{categorias.length !== 1 ? 's' : ''} ·{' '}
              {totalProductos} producto{totalProductos !== 1 ? 's' : ''}
            </span>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {exito && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md text-sm">
              {exito}
            </div>
          )}

          {categorias.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No hay categorías. Crea la primera en el panel de la derecha.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
              {categorias.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between items-center px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {c.nombre}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c._count?.productos ?? 0} producto
                      {(c._count?.productos ?? 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminar(c.id, c.nombre)}
                    disabled={eliminandoId === c.id}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {eliminandoId === c.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sidebar: crear */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
          <h2 className="text-lg font-bold text-gray-800">Nueva categoría</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  crear()
                }
              }}
              placeholder="Ej: Bebidas"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={crear}
            disabled={creando || !nuevoNombre.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
          >
            {creando ? 'Creando…' : '+ Crear categoría'}
          </button>
          <p className="text-xs text-gray-500">
            Los nombres deben ser únicos. Al eliminar una categoría, los productos
            asociados quedan sin categoría (no se eliminan).
          </p>
        </div>
      </div>
    </div>
  )
}
