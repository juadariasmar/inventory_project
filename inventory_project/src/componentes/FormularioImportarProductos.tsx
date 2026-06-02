'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ResultadoFila {
  linea: number
  codigo: string
  nombre: string
  estado: 'creado' | 'error'
  mensaje?: string
  productoId?: number
}

interface RespuestaImport {
  total: number
  creados: number
  errores: number
  resultados: ResultadoFila[]
}

export default function FormularioImportarProductos() {
  const router = useRouter()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [respuesta, setRespuesta] = useState<RespuestaImport | null>(null)

  const subir = async () => {
    setError('')
    setRespuesta(null)
    if (!archivo) {
      setError('Selecciona un archivo CSV.')
      return
    }
    setSubiendo(true)
    try {
      const csv = await archivo.text()
      const resp = await fetch('/api/productos/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      })
      const datos = await resp.json()
      if (!resp.ok) {
        setError(datos.error || 'Error al procesar el archivo.')
        return
      }
      setRespuesta(datos)
      if (datos.creados > 0) router.refresh()
    } catch (e) {
      console.error(e)
      setError('Error al leer o enviar el archivo.')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Subir archivo</h2>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Archivo CSV
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setArchivo(f)
              setRespuesta(null)
              setError('')
            }}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {archivo && (
            <p className="text-xs text-gray-500 mt-1">
              Seleccionado: <strong>{archivo.name}</strong> ({Math.round(archivo.size / 1024)} KB)
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={subir}
          disabled={!archivo || subiendo}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {subiendo ? 'Procesando…' : 'Importar'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>
      )}

      {respuesta && (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1 bg-gray-100 rounded-full">
              Total: <strong>{respuesta.total}</strong>
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
              Creados: <strong>{respuesta.creados}</strong>
            </span>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
              Errores: <strong>{respuesta.errores}</strong>
            </span>
          </div>

          {respuesta.creados > 0 && (
            <Link href="/productos" className="text-blue-600 hover:underline text-sm">
              Ver productos →
            </Link>
          )}

          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Línea</th>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-left">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {respuesta.resultados.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-500">{r.linea}</td>
                    <td className="px-3 py-2 font-mono">{r.codigo || '—'}</td>
                    <td className="px-3 py-2">{r.nombre || '—'}</td>
                    <td className="px-3 py-2">
                      {r.estado === 'creado' ? (
                        <span className="text-green-700">
                          ✓ Creado{r.productoId ? ` (#${r.productoId})` : ''}
                          {r.mensaje && <span className="text-amber-600 ml-2 text-xs">{r.mensaje}</span>}
                        </span>
                      ) : (
                        <span className="text-red-700">✗ {r.mensaje}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
