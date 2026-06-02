'use client'

export default function BotonImprimir({
  texto = 'Imprimir / Guardar PDF',
}: { texto?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm print:hidden"
    >
      {texto}
    </button>
  )
}
