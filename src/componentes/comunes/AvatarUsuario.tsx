'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, useEffect } from 'react'
import { LogOut, User } from 'lucide-react'
import { authClient } from '@/lib/auth/client'

function obtenerIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  return (
    (partes[0]?.[0]?.toUpperCase() ?? '') +
    (partes.length > 1 ? partes[partes.length - 1]?.[0]?.toUpperCase() ?? '' : '')
  )
}

interface AvatarUsuarioProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sesion: { user?: Record<string, any> } | null
}

export default function AvatarUsuario({ sesion }: AvatarUsuarioProps) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nombre = sesion?.user?.nombre ?? ''
  const iniciales = useMemo(() => obtenerIniciales(nombre), [nombre])

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', cerrar)
    return () => document.removeEventListener('keydown', cerrar)
  }, [abierto])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold hover:bg-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        title={nombre}
        aria-label="Menú de cuenta"
        aria-expanded={abierto}
      >
        {iniciales}
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">{nombre}</p>
              <p className="text-xs text-gray-500">{iniciales}</p>
            </div>
            <Link
              href="/account/seguridad"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="w-4 h-4" />
              Seguridad
            </Link>
            <button
              type="button"
              onClick={() => { authClient.signOut(); setAbierto(false) }}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  )
}
