'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Propiedades {
  children: React.ReactNode
}

export default function MenuDesplegableAcciones({ children }: Propiedades) {
  const [abierto, setAbierto] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const ANCHO = 192 // w-48

  const actualizarPosicion = () => {
    const r = botonRef.current?.getBoundingClientRect()
    if (!r) return
    let left = r.right - ANCHO
    if (left < 8) left = 8
    setCoords({ top: r.bottom + 4, left })
  }

  const alternar = () => {
    if (!abierto) actualizarPosicion()
    setAbierto((v) => !v)
  }

  useEffect(() => {
    if (!abierto) return
    const onClickFuera = (e: MouseEvent) => {
      const t = e.target as Node
      if (botonRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setAbierto(false)
    }
    const cerrar = () => setAbierto(false)
    document.addEventListener('mousedown', onClickFuera)
    // El menú es position:fixed; al hacer scroll/resize se cierra para no quedar desalineado.
    window.addEventListener('scroll', cerrar, true)
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('mousedown', onClickFuera)
      window.removeEventListener('scroll', cerrar, true)
      window.removeEventListener('resize', cerrar)
    }
  }, [abierto])

  return (
    <div className="inline-block text-left">
      <button
        ref={botonRef}
        type="button"
        onClick={alternar}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Opciones"
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {abierto && coords && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: ANCHO }}
          className="z-50 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          onClick={() => setAbierto(false)}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            {children}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
