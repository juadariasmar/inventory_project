import React from 'react'
import { LucideIcon, PackageOpen } from 'lucide-react'

interface EstadoVacioProps {
  icono?: LucideIcon
  titulo: string
  descripcion?: string
  accion?: React.ReactNode
}

export function EstadoVacio({ icono: Icono = PackageOpen, titulo, descripcion, accion }: EstadoVacioProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Icono className="h-8 w-8 text-gray-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{titulo}</h3>
      {descripcion && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{descripcion}</p>
      )}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  )
}
