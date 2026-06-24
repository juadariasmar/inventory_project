'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, History, X } from 'lucide-react'

interface Cliente {
  id: number
  nombre: string
  documento: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  notas: string | null
}

export default function VistaClientes({ empresaId }: { empresaId: string }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrandoForm, setMostrandoForm] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [form, setForm] = useState({ nombre: '', documento: '', email: '', telefono: '', direccion: '', notas: '' })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = () => {
    const q = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''
    fetch(`/api/clientes${q}`)
      .then((r) => r.json())
      .then(setClientes)
      .catch(() => setError('Error al cargar clientes'))
  }

  useEffect(() => { cargar() }, [busqueda])

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ nombre: '', documento: '', email: '', telefono: '', direccion: '', notas: '' })
    setError('')
    setMostrandoForm(true)
  }

  const abrirEditar = async (c: Cliente) => {
    setEditando(c)
    setForm({
      nombre: c.nombre,
      documento: c.documento || '',
      email: c.email || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      notas: c.notas || '',
    })
    setError('')
    setMostrandoForm(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true)
    setError('')
    try {
      const r = await fetch(editando ? `/api/clientes/${editando.id}` : '/api/clientes', {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        setMostrandoForm(false)
        cargar()
      } else {
        const err = await r.json()
        setError(err.error || 'Error al guardar')
      }
    } catch {
      setError('Error al guardar cliente')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, documento, email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <section className="bg-white rounded-lg shadow-md p-6">
        {clientes.length === 0 ? (
          <p className="text-sm text-gray-500">No hay clientes registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Nombre</th>
                  <th className="pb-3 pr-4 font-medium">Documento</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Teléfono</th>
                  <th className="pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{c.nombre}</td>
                    <td className="py-3 pr-4 text-gray-500">{c.documento || '-'}</td>
                    <td className="py-3 pr-4 text-gray-500">{c.email || '-'}</td>
                    <td className="py-3 pr-4 text-gray-500">{c.telefono || '-'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(c)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/clientes/${c.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Historial"
                        >
                          <History className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mostrandoForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {editando ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
              <button type="button" onClick={() => setMostrandoForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <input type="text" placeholder="Nombre *" value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <input type="text" placeholder="Documento (NIT/CC)" value={form.documento}
              onChange={(e) => setForm((p) => ({ ...p, documento: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <input type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <input type="tel" placeholder="Teléfono" value={form.telefono}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <input type="text" placeholder="Dirección" value={form.direccion}
              onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <textarea placeholder="Notas" value={form.notas} rows={2}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMostrandoForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={guardar} disabled={guardando}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors">
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
