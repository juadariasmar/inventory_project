'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import BarraSeleccionMultiple from '@/componentes/BarraSeleccionMultiple'

interface ProductoEnCategoria {
  id: number
  codigo: string
  nombre: string
  cantidad: number
  stockMinimo: number
  precio: number
}

interface CategoriaConteo {
  id: number
  nombre: string
  prefijo: string
  productosCount: number
  productos?: ProductoEnCategoria[]
}

interface Propiedades {
  categoriasIniciales: CategoriaConteo[]
}

function normalizarParaBusqueda(s: string): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
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
  const [busqueda, setBusqueda] = useState('')
  const [expandidaId, setExpandidaId] = useState<number | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoPrefijoManual, setNuevoPrefijoManual] = useState('')
  const [prefijoEditadoManual, setPrefijoEditadoManual] = useState(false)
  const [creando, setCreando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set())
  const [eliminandoBulk, setEliminandoBulk] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [editPrefijo, setEditPrefijo] = useState('')
  const [guardandoEdit, setGuardandoEdit] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const nuevoPrefijo = useMemo(() => {
    if (prefijoEditadoManual) return nuevoPrefijoManual
    if (!nuevoNombre.trim()) return ''
    const enUso = new Set(categorias.map((c) => c.prefijo))
    return prefijoSugeridoLocal(nuevoNombre, enUso)
  }, [nuevoNombre, categorias, prefijoEditadoManual, nuevoPrefijoManual])

  const recargar = async () => {
    try {
      const r = await fetch('/api/categorias')
      if (r.ok) {
        const data = await r.json()
        // Preservar los productos que ya tenemos en memoria; el endpoint
        // /api/categorias solo trae el _count. El listado completo viene
        // por router.refresh() en el server component.
        const productosPorId = new Map(
          categorias.map((c) => [c.id, c.productos])
        )
        setCategorias(
          data.map((c: { id: number; nombre: string; prefijo: string; _count: { productos: number } }) => ({
            id: c.id,
            nombre: c.nombre,
            prefijo: c.prefijo,
            productosCount: c._count.productos,
            productos: productosPorId.get(c.id),
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
        setNuevoPrefijoManual('')
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

  const categoriasFiltradas = useMemo(() => {
    const q = normalizarParaBusqueda(busqueda)
    if (!q) return categorias
    return categorias.filter((c) => {
      if (normalizarParaBusqueda(c.nombre).includes(q)) return true
      if (c.prefijo.toLowerCase().includes(q)) return true
      // Tambien matchea si el termino aparece en algun producto de la
      // categoria (nombre o codigo). Util para encontrar "donde esta este
      // producto" sin saber su categoria.
      if (c.productos?.some(
        (p) =>
          normalizarParaBusqueda(p.nombre).includes(q) ||
          p.codigo.toLowerCase().includes(q)
      )) return true
      return false
    })
  }, [categorias, busqueda])

  // --- Seleccion multiple (solo categorias sin productos) ---
  const idsVaciasEnVista = categoriasFiltradas
    .filter((c) => c.productosCount === 0)
    .map((c) => c.id)
  const seleccionadasEnVista = idsVaciasEnVista.filter((id) => seleccionadas.has(id))
  const todasSeleccionadas =
    idsVaciasEnVista.length > 0 && seleccionadasEnVista.length === idsVaciasEnVista.length

  const togglearCategoria = (id: number) => {
    setSeleccionadas((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }
  const togglearTodasVacias = () => {
    if (todasSeleccionadas) {
      setSeleccionadas((prev) => {
        const nuevo = new Set(prev)
        idsVaciasEnVista.forEach((id) => nuevo.delete(id))
        return nuevo
      })
    } else {
      setSeleccionadas((prev) => {
        const nuevo = new Set(prev)
        idsVaciasEnVista.forEach((id) => nuevo.add(id))
        return nuevo
      })
    }
  }
  const limpiarSeleccionCats = () => setSeleccionadas(new Set())

  const eliminarSeleccionadas = async () => {
    const ids = Array.from(seleccionadas)
    if (ids.length === 0) return
    if (!confirm(`¿Eliminar ${ids.length} categoría(s)?`)) return
    setEliminandoBulk(true)
    try {
      const r = await fetch('/api/categorias/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (r.ok) {
        setExito(`Se eliminaron ${ids.length} categoría(s).`)
        limpiarSeleccionCats()
        await recargar()
        router.refresh()
      } else {
        const e = await r.json().catch(() => ({}))
        setError(e.error || 'No se pudo eliminar.')
      }
    } catch {
      setError('Error al eliminar.')
    } finally {
      setEliminandoBulk(false)
    }
  }

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
              {categoriasFiltradas.length === categorias.length
                ? `${categorias.length} categoría${categorias.length !== 1 ? 's' : ''} · ${totalProductos} producto${totalProductos !== 1 ? 's' : ''}`
                : `${categoriasFiltradas.length} de ${categorias.length} categorías`}
            </span>
          </div>

          {/* Buscador + select all */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por categoría, prefijo o producto…"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  title="Limpiar"
                >
                  ✕
                </button>
              )}
            </div>
            {idsVaciasEnVista.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={todasSeleccionadas}
                  onChange={togglearTodasVacias}
                  className="cursor-pointer"
                />
                Seleccionar las {idsVaciasEnVista.length} vacías
              </label>
            )}
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
          ) : categoriasFiltradas.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              Sin resultados para &quot;{busqueda}&quot;.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
              {categoriasFiltradas.map((c) => (
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
                    <>
                      <div className="flex justify-between items-center">
                        {c.productosCount === 0 ? (
                          <input
                            type="checkbox"
                            checked={seleccionadas.has(c.id)}
                            onChange={() => togglearCategoria(c.id)}
                            className="mr-2 cursor-pointer"
                            title="Seleccionar para borrado masivo"
                          />
                        ) : (
                          <span className="w-4 mr-2" />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandidaId(expandidaId === c.id ? null : c.id)
                          }
                          disabled={c.productosCount === 0}
                          className="flex items-center gap-2 text-left flex-1 min-w-0 disabled:cursor-default"
                          title={c.productosCount === 0 ? 'Sin productos' : 'Ver productos'}
                        >
                          <span
                            className={`text-xs text-gray-400 transition-transform ${
                              expandidaId === c.id ? 'rotate-90' : ''
                            } ${c.productosCount === 0 ? 'invisible' : ''}`}
                          >
                            ▸
                          </span>
                          <div className="min-w-0">
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
                        </button>
                        <div className="flex gap-3 ml-2">
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

                      {/* Acordeon: productos de la categoria */}
                      {expandidaId === c.id && c.productos && c.productos.length > 0 && (
                        <div className="mt-3 ml-5 border-l-2 border-blue-100 pl-3">
                          <ul className="divide-y divide-gray-100 text-sm">
                            {c.productos.map((p) => {
                              const sinStock = p.cantidad <= 0
                              const stockBajo = !sinStock && p.cantidad <= p.stockMinimo + 2
                              return (
                                <li
                                  key={p.id}
                                  className="py-2 grid grid-cols-[1fr_auto_auto] items-center gap-3"
                                >
                                  <Link
                                    href={`/productos/${p.id}/detalle`}
                                    className="min-w-0 hover:text-blue-700"
                                  >
                                    <div className="font-medium text-gray-800 truncate">
                                      {p.nombre}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">
                                      {p.codigo}
                                    </div>
                                  </Link>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      sinStock
                                        ? 'bg-red-100 text-red-700'
                                        : stockBajo
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {p.cantidad} en stock
                                  </span>
                                  <span className="text-sm text-gray-700 whitespace-nowrap">
                                    ${p.precio.toLocaleString('es-MX')}
                                  </span>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}
                    </>
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
                setNuevoPrefijoManual(e.target.value.toUpperCase())
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

      <BarraSeleccionMultiple
        cantidad={seleccionadas.size}
        etiquetaItem="categoría"
        onEliminar={eliminarSeleccionadas}
        onLimpiar={limpiarSeleccionCats}
        trabajando={eliminandoBulk}
      />
    </div>
  )
}
