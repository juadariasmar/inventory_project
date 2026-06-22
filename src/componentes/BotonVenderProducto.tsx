'use client'

import { useState } from 'react'
import { agregarAlCarrito } from '@/lib/carrito'

interface Propiedades {
  id: number
  nombre: string
  codigo: string
  stockActual: number
  precio: number
}

export default function BotonVenderProducto({
  id,
  nombre,
  codigo,
  stockActual,
  precio,
}: Propiedades) {
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null)

  const agregar = () => {
    const resultado = agregarAlCarrito({
      productoId: id,
      codigo,
      nombre,
      precio,
      stock: stockActual,
    })
    if (resultado.ok) {
      setMensaje({
        texto: `${nombre} agregado a la venta (${resultado.cantidadEnCarrito} ud).`,
        tipo: 'ok',
      })
    } else {
      setMensaje({
        texto: resultado.mensaje ?? 'No se pudo agregar.',
        tipo: 'error',
      })
    }
    setTimeout(() => setMensaje(null), 2500)
  }

  return (
    <>
      <button
        type="button"
        onClick={agregar}
        disabled={stockActual <= 0}
        className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-hover transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] inline-flex items-center justify-center font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title={stockActual <= 0 ? 'Sin stock' : 'Agregar a la venta actual'}
      >
        Vender
      </button>
      {mensaje && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-sm ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {mensaje.texto}
        </div>
      )}
    </>
  )
}
