'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

function ContenidoInvitacion() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [estado, setEstado] = useState<'cargando' | 'valida' | 'invalida' | 'aceptando' | 'aceptada' | 'error'>('cargando')
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [emailInvitacion, setEmailInvitacion] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    let cancel = false
    const validar = async () => {
      try {
        const r = await fetch(`/api/invitaciones/validar?token=${encodeURIComponent(token)}`)
        if (cancel) return
        if (!r.ok) {
          const err = await r.json()
          setEstado('invalida')
          setMensaje(err.error || 'Invitación no válida o expirada')
          return
        }
        const data = await r.json()
        if (cancel) return
        setEmpresaNombre(data.empresaNombre)
        setEmailInvitacion(data.email)
        setEstado('valida')
      } catch {
        if (!cancel) {
          setEstado('invalida')
          setMensaje('Error al validar la invitación')
        }
      }
    }
    validar()
    return () => { cancel = true }
  }, [token])

  const handleAceptar = async () => {
    setEstado('aceptando')
    setMensaje('')

    try {
      const resSesion = await fetch('/api/auth/session')
      const sesion = await resSesion.json()
      const neonAuthId = sesion?.user?.id
      const email = sesion?.user?.email

      if (!neonAuthId || !email) {
        setEstado('error')
        setMensaje('Debes iniciar sesión para aceptar la invitación.')
        return
      }

      if (email !== emailInvitacion) {
        setEstado('error')
        setMensaje(`Esta invitación fue enviada a ${emailInvitacion}, pero has iniciado sesión con ${email}. Usa la cuenta correcta.`)
        return
      }

      const r = await fetch('/api/invitaciones/aceptar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, neonAuthId, email, nombre: sesion.user.nombre || email }),
      })

      if (r.ok) {
        setEstado('aceptada')
        setMensaje(`¡Bienvenido a ${empresaNombre}!`)
      } else {
        const err = await r.json()
        setEstado('error')
        setMensaje(err.error || 'Error al aceptar la invitación')
      }
    } catch {
      setEstado('error')
      setMensaje('Error al procesar la invitación')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-border p-8 text-center">
        {estado === 'cargando' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-gray-500">Validando invitación...</p>
          </div>
        )}

        {estado === 'valida' && (
          <div>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">¡Has sido invitado!</h1>
            <p className="text-sm text-gray-600 mb-1">
              Has sido invitado a unirte a <strong>{empresaNombre}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              La invitación fue enviada a <strong>{emailInvitacion}</strong>.
            </p>
            <button
              type="button"
              onClick={handleAceptar}
              className="w-full px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              Aceptar invitación
            </button>
          </div>
        )}

        {estado === 'aceptando' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-gray-500">Aceptando invitación...</p>
          </div>
        )}

        {estado === 'aceptada' && (
          <div>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">{mensaje}</h1>
            <p className="text-sm text-gray-600 mb-6">Ya eres parte del equipo.</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        )}

        {(estado === 'invalida' || estado === 'error') && (
          <div>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {estado === 'invalida' ? 'Invitación inválida' : 'Error'}
            </h1>
            <p className="text-sm text-gray-600 mb-6">{mensaje}</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaginaInvitacion() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    }>
      <ContenidoInvitacion />
    </Suspense>
  )
}
