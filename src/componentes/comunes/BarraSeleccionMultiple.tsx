'use client'

interface Propiedades {
  cantidad: number
  etiquetaItem?: string
  onEliminar: () => void
  onLimpiar: () => void
  trabajando?: boolean
}

// Barra flotante que aparece en la parte inferior cuando hay items
// seleccionados en una lista. Pensada para acciones bulk (eliminar varios).
// Reutilizable en productos, categorias y movimientos.
export default function BarraSeleccionMultiple({
  cantidad,
  etiquetaItem = 'item',
  onEliminar,
  onLimpiar,
  trabajando,
}: Propiedades) {
  if (cantidad === 0) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white shadow-2xl rounded-full px-4 py-2 flex items-center gap-3">
      <span className="text-sm" role="status" aria-live="polite">
        <strong>{cantidad}</strong> {etiquetaItem}
        {cantidad !== 1 ? 's' : ''} seleccionado{cantidad !== 1 ? 's' : ''}
      </span>
      <button
        type="button"
        onClick={onLimpiar}
        disabled={trabajando}
        className="text-xs text-gray-300 hover:text-white px-2"
      >
        Quitar selección
      </button>
      <button
        type="button"
        onClick={onEliminar}
        disabled={trabajando}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-full text-sm font-semibold disabled:opacity-50"
      >
        {trabajando ? 'Eliminando…' : `Eliminar ${cantidad}`}
      </button>
    </div>
  )
}
