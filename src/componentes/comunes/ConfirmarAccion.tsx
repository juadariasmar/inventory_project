'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@radix-ui/react-alert-dialog'
import { useState } from 'react'

interface ConfirmarAccionProps {
  trigger: React.ReactNode
  titulo: string
  descripcion: string
  accion: string
  variant?: 'danger' | 'primary'
  onConfirm: () => Promise<void> | void
  disabled?: boolean
}

export default function ConfirmarAccion({
  trigger,
  titulo,
  descripcion,
  accion,
  variant = 'danger',
  onConfirm,
  disabled,
}: ConfirmarAccionProps) {
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleConfirm = async () => {
    setCargando(true)
    try {
      await onConfirm()
      setAbierto(false)
    } finally {
      setCargando(false)
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md rounded-xl bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-gray-900">
            {titulo}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-gray-600 mt-2">
            {descripcion}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex justify-end gap-3">
          <AlertDialogCancel asChild>
            <button
              type="button"
              disabled={cargando}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              type="button"
              disabled={cargando}
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                variant === 'danger'
                  ? 'bg-error hover:bg-error-hover focus:ring-error'
                  : 'bg-primary hover:bg-primary-hover focus:ring-primary'
              }`}
            >
              {cargando ? 'Procesando...' : accion}
            </button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
