'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, X, UserPlus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Invitacion {
  id: string
  email: string
  token: string
  rol: string
  estado: string
  expiraEn: string | Date
  creadoEn: string | Date
  creadoPor?: { id: string; nombre: string } | null
}

interface Props {
  invitaciones: Invitacion[]
}

export default function GestorInvitaciones({ invitaciones: invitacionesIniciales }: Props) {
  const router = useRouter()
  const [invitaciones, setInvitaciones] = useState(invitacionesIniciales)
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<'USUARIO' | 'ADMIN'>('USUARIO')
  const [invitando, setInvitando] = useState(false)
  const [cancelandoId, setCancelandoId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const handleInvitar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setInvitando(true)
    setError('')
    setExito('')
    try {
      const r = await fetch('/api/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), rol }),
      })
      if (r.ok) {
        const nueva = await r.json()
        setInvitaciones((prev) => [nueva, ...prev])
        setEmail('')
        setExito(`Invitación enviada a ${email}`)
        router.refresh()
      } else {
        const err = await r.json()
        setError(err.error || 'Error al invitar')
      }
    } catch {
      setError('Error al enviar invitación')
    } finally {
      setInvitando(false)
    }
  }

  const handleCancelar = async (id: string) => {
    setCancelandoId(id)
    setError('')
    try {
      const r = await fetch(`/api/invitaciones/${id}`, { method: 'DELETE' })
      if (r.ok) {
        setInvitaciones((prev) => prev.map((inv) => inv.id === id ? { ...inv, estado: 'CANCELADA' } : inv))
        setExito('Invitación cancelada')
        router.refresh()
      } else {
        const err = await r.json()
        setError(err.error || 'Error al cancelar')
      }
    } catch {
      setError('Error al cancelar invitación')
    } finally {
      setCancelandoId(null)
    }
  }

  const badgeEstado = (estado: string) => {
    const estilos: Record<string, string> = {
      PENDIENTE: 'bg-amber-100 text-amber-800',
      ACEPTADA: 'bg-emerald-100 text-emerald-800',
      EXPIRADA: 'bg-gray-100 text-gray-500',
      CANCELADA: 'bg-red-100 text-red-800',
    }
    const etiquetas: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      ACEPTADA: 'Aceptada',
      EXPIRADA: 'Expirada',
      CANCELADA: 'Cancelada',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${estilos[estado] || 'bg-gray-100'}`}>
        {etiquetas[estado] || estado}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-lg font-semibold text-gray-800">Invitaciones</h2>
      </div>

      <div className="p-6">
        <form onSubmit={handleInvitar} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <label htmlFor="invitar-email" className="sr-only">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                id="invitar-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="email@ejemplo.com"
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as 'USUARIO' | 'ADMIN')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="USUARIO">Usuario</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <button
            type="submit"
            disabled={invitando || !email.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {invitando ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
            ) : 'Invitar'}
          </button>
        </form>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 p-3 rounded-md text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {exito && (
          <div className="mb-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md text-sm">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {exito}
          </div>
        )}

        {invitaciones.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hay invitaciones pendientes.</p>
        ) : (
          <div className="space-y-2">
            {invitaciones.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className="text-sm font-medium text-gray-900 truncate">{inv.email}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 uppercase">{inv.rol}</span>
                    <span className="text-gray-300">·</span>
                    {badgeEstado(inv.estado)}
                    {inv.creadoPor && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">por {inv.creadoPor.nombre}</span>
                      </>
                    )}
                  </div>
                </div>
                {inv.estado === 'PENDIENTE' && (
                  <button
                    type="button"
                    onClick={() => handleCancelar(inv.id)}
                    disabled={cancelandoId === inv.id}
                    className="ml-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    aria-label="Cancelar invitación"
                  >
                    {cancelandoId === inv.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
