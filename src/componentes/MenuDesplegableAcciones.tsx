'use client'

import { useState, useRef, useEffect } from 'react'

interface Propiedades {
  children: React.ReactNode
}

export default function MenuDesplegableAcciones({ children }: Propiedades) {
  const [abierto, setAbierto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickFuera = (evento: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(evento.target as Node)) {
        setAbierto(false)
      }
    }
    if (abierto) {
      document.addEventListener('mousedown', handleClickFuera)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickFuera)
    }
  }, [abierto])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Opciones"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
