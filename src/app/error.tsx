'use client'

import React, { useEffect } from 'react'
import AccesoDenegado from '@/componentes/comunes/AccesoDenegado'
import { Button } from '@/componentes/comunes/Button'
import { RotateCw, AlertTriangle } from 'lucide-react'

export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global Error Boundary]:', error)
  }, [error])

  const isAuthError =
    error.message?.includes('401') ||
    error.message?.includes('403') ||
    error.message?.toLowerCase().includes('no autorizado') ||
    error.message?.toLowerCase().includes('acceso denegado') ||
    error.message?.toLowerCase().includes('permiso') ||
    error.message?.toLowerCase().includes('empresa') ||
    error.message?.toLowerCase().includes('session')

  if (isAuthError) {
    return <AccesoDenegado />
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center text-amber-500 dark:text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Algo salió mal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ha ocurrido un error inesperado al cargar esta página. Por favor, intenta de nuevo.
          </p>
        </div>

        {error.message && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-mono text-left max-h-32 overflow-y-auto border border-slate-100 dark:border-slate-800">
            {error.message}
          </div>
        )}

        <div className="pt-2 flex gap-3">
          <Button
            onClick={() => reset()}
            variant="primary"
            className="flex-1 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            <span>Reintentar</span>
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="secondary"
            className="flex-1 text-xs font-semibold"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
