'use client'

import { agregarAlCarrito } from '@/lib/carrito'
import { useToast } from '../comunes/ProveedorToast'

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
  const { toast } = useToast()

  const agregar = () => {
    const resultado = agregarAlCarrito({
      productoId: id,
      codigo,
      nombre,
      precio,
      stock: stockActual,
    })
    if (resultado.ok) {
      toast({
        titulo: 'Producto agregado',
        descripcion: `${nombre} agregado a la venta (${resultado.cantidadEnCarrito} ud).`,
        variant: 'success',
      })
    } else {
      toast({
        titulo: 'No se pudo agregar',
        descripcion: resultado.mensaje ?? 'No se pudo agregar el producto.',
        variant: 'error',
      })
    }
  }

  return (
    <button
      type="button"
      onClick={agregar}
      disabled={stockActual <= 0}
      aria-label={stockActual <= 0 ? `Sin stock para ${nombre}` : `Agregar ${nombre} a la venta`}
      className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-hover transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] inline-flex items-center justify-center font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      title={stockActual <= 0 ? 'Sin stock' : 'Agregar a la venta actual'}
    >
      Vender
    </button>
  )
}
