'use client'

import { Sun, Moon } from 'lucide-react'
import { useTema } from './ProveedorTema'

export function TemaToggle({ className = '' }: { className?: string }) {
  const { tema, toggleTema } = useTema()

  return (
    <button
      type="button"
      onClick={toggleTema}
      className={`relative p-2 rounded-lg transition-fast hover:bg-muted text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      aria-label={tema === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={tema === 'light' ? 'Modo oscuro' : 'Modo claro'}
    >
      {tema === 'light' ? (
        <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
      ) : (
        <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
      )}
    </button>
  )
}
