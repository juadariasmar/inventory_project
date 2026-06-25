'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import {
  cantidadTotalCarrito,
  EVENTO_CARRITO_CAMBIO,
  obtenerCarrito,
} from '@/lib/carrito'

export default function CarritoFlotante() {
  const router = useRouter()
  const [cantidad, setCantidad] = useState(0)

  useEffect(() => {
    const actualizar = () => {
      try {
        const items = obtenerCarrito()
        if (items.length === 0) { setCantidad(0); return }
        setCantidad(cantidadTotalCarrito(items))
      } catch {
        setCantidad(0)
      }
    }
    actualizar()
    window.addEventListener(EVENTO_CARRITO_CAMBIO, actualizar)
    window.addEventListener('storage', actualizar)
    return () => {
      window.removeEventListener(EVENTO_CARRITO_CAMBIO, actualizar)
      window.removeEventListener('storage', actualizar)
    }
  }, [])

  if (cantidad === 0) return null

  return (
    <button
      type="button"
      onClick={() => router.push('/venta-rapida')}
      title={`Ir a venta rápida (${cantidad} producto${cantidad !== 1 ? 's' : ''} en el carrito)`}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-colors"
      aria-label={`Carrito con ${cantidad} producto${cantidad !== 1 ? 's' : ''}`}
    >
      <ShoppingCart className="w-5 h-5" />
      <span className="font-bold text-sm">{cantidad}</span>
    </button>
  )
}
