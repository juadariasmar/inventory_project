'use client'

import { useState } from 'react'
import {
  describirAuditoria,
  type RegistroParaDescribir,
} from '@/lib/auditoriaDescripcion'

interface Propiedades {
  registro: RegistroParaDescribir
}

export default function DetalleAuditoria({ registro }: Propiedades) {
  const [abierto, setAbierto] = useState(false)

  const resumen = describirAuditoria(registro)
  const tieneJson = registro.datos !== null && registro.datos !== undefined
  const json = tieneJson ? JSON.stringify(registro.datos, null, 2) : ''

  return (
    <div>
      <div className="text-sm text-gray-800">{resumen}</div>
      {tieneJson && (
        <>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="mt-1 text-xs text-gray-500 hover:text-blue-700 underline"
          >
            {abierto ? 'Ocultar datos técnicos' : 'Ver datos técnicos'}
          </button>
          {abierto && (
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-64 max-w-md whitespace-pre-wrap break-words">
{json}
            </pre>
          )}
        </>
      )}
    </div>
  )
}
