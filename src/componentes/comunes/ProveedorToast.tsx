'use client'

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@radix-ui/react-toast'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ToastData {
  id: string
  titulo: string
  descripcion?: string
  variant?: 'success' | 'error' | 'info'
}

interface ToastContextType {
  toast: (data: Omit<ToastData, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ProveedorToast')
  }
  return ctx
}

export default function ProveedorToast({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const toast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...data, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const eliminar = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const iconos = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }

  const colores = {
    success: 'border-l-4 border-emerald-500',
    error: 'border-l-4 border-red-500',
    info: 'border-l-4 border-blue-500',
  }

  const coloresTexto = {
    success: 'text-emerald-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider swipeDirection="right" duration={4000}>
        {children}

        {toasts.map((t) => {
          const Icono = iconos[t.variant || 'info']
          return (
            <Toast
              key={t.id}
              open
              onOpenChange={(open: boolean) => { if (!open) eliminar(t.id) }}
              className={`fixed bottom-4 right-4 z-[100] w-[90vw] max-w-sm bg-white rounded-lg shadow-2xl p-4 ${colores[t.variant || 'info']} data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out`}
            >
              <div className="flex items-start gap-3">
                <Icono className={`w-5 h-5 mt-0.5 shrink-0 ${coloresTexto[t.variant || 'info']}`} />
                <div className="flex-1 min-w-0">
                  <ToastTitle className={`text-sm font-semibold ${coloresTexto[t.variant || 'info']}`}>
                    {t.titulo}
                  </ToastTitle>
                  {t.descripcion && (
                    <ToastDescription className="text-sm text-gray-600 mt-1">
                      {t.descripcion}
                    </ToastDescription>
                  )}
                </div>
                <ToastClose asChild>
                  <button
                    type="button"
                    className="shrink-0 text-gray-400 hover:text-gray-600"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </ToastClose>
              </div>
            </Toast>
          )
        })}

        <ToastViewport className="fixed bottom-0 right-0 z-[100] flex flex-col p-6 gap-2 w-full max-w-sm outline-none" />
      </ToastProvider>
    </ToastContext.Provider>
  )
}
