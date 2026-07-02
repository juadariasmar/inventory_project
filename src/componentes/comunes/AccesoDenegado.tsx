'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, ArrowRight } from 'lucide-react'
import { Button } from './Button'

export default function AccesoDenegado() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 relative">
          <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping opacity-75" />
          <ShieldAlert className="w-8 h-8 relative z-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Acceso Restringido</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No tienes los permisos necesarios para acceder a esta sección o tu sesión no es válida.
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-3">
          <div className="flex gap-1 items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Redireccionando al panel principal...
          </span>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => router.push('/')}
            variant="secondary"
            className="w-full text-xs font-semibold flex items-center justify-center gap-2 group"
          >
            <span>Ir de inmediato</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
