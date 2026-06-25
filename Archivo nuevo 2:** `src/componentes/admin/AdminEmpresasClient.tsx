'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useToast } from '@/componentes/comunes/ProveedorToast'
import ConfirmarAccion from '@/componentes/comunes/ConfirmarAccion'

interface EmpresaConConteos {
  id: string
  nombre: string
  creadoEn: string
  usuarios: number
  productos: number
}

interface Props {
  empresas: EmpresaConConteos[]
}

export default function AdminEmpresasClient({ empresas: empresasInicial }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [empresas, setEmpresas] = useState(empresasInicial)
  const [modal, setModal] = useState<{ tipo: 'crear' | 'editar'; empresa?: EmpresaConConteos } | null>(null)
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleOpenCreate = () => {
    setNombre('')
    setModal({ tipo: 'crear' })
  }

  const handleOpenEdit = (empresa: EmpresaConConteos) => {
    setNombre(empresa.nombre)
    setModal({ tipo: 'editar', empresa })
  }

  const handleCloseModal = () => {
    setModal(null)
    setNombre('')
  }

  const handleSave = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    try {
      if (modal?.tipo === 'crear') {
        const res = await fetch('/api/empresas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nombre.trim() }),
        })
        if (!res.ok) {
          const error = await res.json()
          toast({ titulo: error.error || 'Error al crear empresa', variant: 'error' })
        } else {
          toast({ titulo: 'Empresa creada exitosamente', variant: 'success' })
          router.refresh()
          const empresasActualizadas = await fetch('/api/empresas').then(r => r.json())
          setEmpresas(empresasActualizadas)
        }
      } else if (modal?.tipo === 'editar' && modal.empresa) {
        const res = await fetch(`/api/empresas/${modal.empresa.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nombre.trim() }),
        })
        if (!res.ok) {
          const error = await res.json()
          toast({ titulo: error.error || 'Error al actualizar empresa', variant: 'error' })
        } else {
          toast({ titulo: 'Empresa actualizada', variant: 'success' })
          router.refresh()
          const empresasActualizadas = await fetch('/api/empresas').then(r => r.json())
          setEmpresas(empresasActualizadas)
        }
      }
      handleCloseModal()
    } catch {
      toast({ titulo: 'Error de red', variant: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/empresas/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        toast({ titulo: error.error || 'Error al eliminar empresa', variant: 'error' })
      } else {
        toast({ titulo: 'Empresa eliminada', variant: 'success' })
        router.refresh()
        const empresasActualizadas = await fetch('/api/empresas').then(r => r.json())
        setEmpresas(empresasActualizadas)
      }
    } catch {
      toast({ titulo: 'Error de red', variant: 'error' })
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administración global de empresas registradas.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva empresa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Creada
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {empresas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay empresas registradas.
                  </td>
                </tr>
              )}
              {empresas.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {emp.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(emp.creadoEn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {emp.usuarios}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                    {emp.productos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(emp)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar empresa"
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <ConfirmarAccion
                      titulo="Eliminar empresa"
                      descripcion={`¿Estás seguro de eliminar la empresa "${emp.nombre}"? Esta acción no se puede deshacer.`}
                      accion="Eliminar"
                      variant="danger"
                      onConfirm={() => handleDelete(emp.id)}
                      trigger={
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar empresa"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diálogo crear / editar */}
      <Dialog.Root open={modal !== null} onOpenChange={(open) => { if (!open) handleCloseModal() }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md rounded-xl bg-white p-6 shadow-2xl focus:outline-none">
            <Dialog.Title className="text-lg font-bold text-gray-900">
              {modal?.tipo === 'crear' ? 'Nueva empresa' : 'Editar empresa'}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 mt-2">
              {modal?.tipo === 'crear'
                ? 'Crea una empresa y asígnale el primer administrador.'
                : 'Modifica el nombre de la empresa seleccionada.'}
            </Dialog.Description>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nombre de la empresa"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={guardando}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleSave}
                disabled={guardando || !nombre.trim()}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-semibold hover:bg-primary-hover disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : modal?.tipo === 'crear' ? 'Crear' : 'Actualizar'}
              </button>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
