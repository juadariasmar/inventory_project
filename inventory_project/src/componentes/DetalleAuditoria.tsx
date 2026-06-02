'use client'

import { useState } from 'react'

interface Propiedades {
  datos: unknown
}

export default function DetalleAuditoria({ datos }: Propiedades) {
  const [abierto, setAbierto] = useState(false)

  if (datos === null || datos === undefined) {
    return <span className="text-gray-400">—</span>
  }

  const json = JSON.stringify(datos, null, 2)

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="text-blue-600 hover:text-blue-800 text-xs underline"
      >
        {abierto ? 'Ocultar' : 'Ver detalles'}
      </button>
      {abierto && (
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-64 max-w-md whitespace-pre-wrap break-words">
{json}
        </pre>
      )}
    </div>
  )
}
