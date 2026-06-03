'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface CategoriaConteo {
  id: number
  nombre: string
  prefijo: string
  productosCount: number
}

interface Propiedades {
  categoriasIniciales: CategoriaConteo[]
}

function normalizarParaPrefijo(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function prefijoSugeridoLocal(nombre: string, prefijosEnUso: Set<string>): string {
  const limpio = normalizarParaPrefijo(nombre)
  const base = limpio.length > 0 ? limpio : 'CAT'
  let intento = 0
  let candidato = base.slice(0, 3) || 'CAT'
  while (prefijosEnUso.has(candidato)) {
    intento++
    if (3 + intento <= base.length) {
      candidato = base.slice(0, 3 + intento)
    } else {
      candidato = `${base.slice(0, 3) || 'CAT'}${intento}`
    }
    if (intento > 1000) break
  }
  return candidato
}

export default function PanelCategorias({ categoriasIniciales }: Propiedades) {
  const router = useRouter()
  const [categorias, setCategorias] = useState<CategoriaConteo[]>(categoriasIniciales)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoPrefijo, setNuevoPrefijo] = useState('')
  const [prefijoEditadoManual, setPrefijoEditadoManual] = useState(false)
  const [creando, setCreando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editPrefijo, setEditPrefijo] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Mantener prefijo sugerido sincronizado con el nombre (mientras el
  // usuario no lo edite manualmente).
  useEffect(() => {
    if (prefijoEditadoManual) return
    const enUso = new Set(categorias.map((c) => c.prefijo))
    if (nuevoNombre.trim()) {
      setNuevoPrefijo(prefijoSugeridoLocal(nuevoNombre, enUso))
    } else {
      setNuevoPrefijo('')
    }
  }, [nuevoNombre, categorias, prefijoEditadoManual])

  const recargar = async () => {
    try {
      const r = await fetch('/api/categorias')
      if (r.ok) {
        const data = await r.json()
        setCategorias(
          data.map((c: { id: number; nombre: string; prefijo: string; _count: { productos: number } }) => ({
            id: c.id,
            nombre: c.nombre,
            prefijo: c.prefijo,
            productosCount: c._count.productos,
          }))
        )
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
        body: JSON.stringify({ nombre, prefijo: nuevoPrefijo || undefined }),
      })
      if (r.ok) {
        const cat = await r.json()
        setExito(`Categoría "${nombre}" creada con prefijo ${cat.prefijo}.`)
        setNuevoNombre('')
        setNuevoPrefijo('')
        setPrefijoEditadoManual(false)
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

  const empezarEdicion = (c: CategoriaConteo) => {
    setEditandoId(c.id)
    setEditNombre(c.nombre)
    setEditPrefijo(c.prefijo)
    setError('')
    setExito('')
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setEditNombre('')
    setEditPrefijo('')
  }

  const guardarEdicion = async (id: number) => {
    const nombre = editNombre.trim()
    const prefijo = editPrefijo.trim().toUpperCase()
    if (!nombre || !prefijo) {
      setError('Nombre y prefijo son obligatorios.')
      return
    }
    setGuardandoEdit(true)
    setError('')
    setExito('')
    try {
      const r = await fetch(`/api/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, prefijo }),
      })
      if (r.ok) {
        setExito(`Categoría "${nombre}" actualizada.`)
        cancelarEdicion()
        await recargar()
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo actualizar la categoría.')
      }
    } catch {
      setError('Error al actualizar la categoría.')
    } finally {
      setGuardandoEdit(false)
    }
  }

  const eliminar = async (id: number, nombre: string, productosCount: number) => {
    if (productosCount > 0) {
      alert(
        `No se puede eliminar "${nombre}" porque tiene ${productosCount} producto(s) asociado(s).\n\nReasigna los productos a otra categoría primero.`
      )
      return
    }
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return
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

  const totalProductos = categorias.reduce((s, c) => s + c.productosCount, 0)

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
                  className="px-4 py-3 hover:bg-gray-50"
                >
                  {editandoId === c.id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2">
                        <input
                          type="text"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          placeholder="Nombre"
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={editPrefijo}
                          onChange={(e) => setEditPrefijo(e.target.value.toUpperCase())}
                          maxLength={8}
                          placeholder="Prefijo"
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          Los códigos existentes no se renombran.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={cancelarEdicion}
                            disabled={guardandoEdit}
                            className="text-sm text-gray-600 hover:text-gray-800 px-2"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => guardarEdicion(c.id)}
                            disabled={guardandoEdit}
                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50"
                          >
                            {guardandoEdit ? 'Guardando…' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {c.nombre}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {c.prefijo}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {c.productosCount} producto{c.productosCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => empezarEdicion(c)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(c.id, c.nombre, c.productosCount)}
                          disabled={eliminandoId === c.id || c.productosCount > 0}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={c.productosCount > 0 ? 'Tiene productos asociados' : 'Eliminar'}
                        >
                          {eliminandoId === c.id ? 'Eliminando…' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  )}
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
              Nombre *
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ej: Bebidas"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefijo
            </label>
            <input
              type="text"
              value={nuevoPrefijo}
              onChange={(e) => {
                setNuevoPrefijo(e.target.value.toUpperCase())
                setPrefijoEditadoManual(true)
              }}
              maxLength={8}
              placeholder="Auto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">
              {prefijoEditadoManual
                ? 'Editado manualmente. Debe ser único.'
                : 'Sugerido automáticamente del nombre. Editable.'}
            </p>
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
            El prefijo se usa para autogenerar los códigos de los productos de
            esta categoría (ej: <span className="font-mono">BEB-00001</span>).
          </p>
        </div>
      </div>
    </div>
  )
}
