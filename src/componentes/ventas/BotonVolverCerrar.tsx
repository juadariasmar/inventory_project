'use client'

export default function BotonVolverCerrar() {
  return (
    <button
      type="button"
      onClick={() => window.close()}
      className="text-blue-600 hover:underline text-sm"
    >
      ← Volver a Ventas
    </button>
  )
}
