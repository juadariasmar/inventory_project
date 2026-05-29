'use client'

import { useState } from 'react'

export default function BotonExportarAnalisis() {
  const [descargando, setDescargando] = useState(false)

  const manejarDescarga = async () => {
    setDescargando(true)
    try {
      const respuesta = await fetch('/api/analisis/exportar')
      if (!respuesta.ok) {
        const e = await respuesta.json().catch(() => ({}))
        alert(e?.error || 'No se pudo exportar el reporte')
        return
      }
      const blob = await respuesta.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const fecha = new Date().toISOString().slice(0, 10)
      a.download = `analisis_inventario_${fecha}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)
      alert('Error al exportar el reporte')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <button
      onClick={manejarDescarga}
      disabled={descargando}
      className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors text-center"
    >
      {descargando ? 'Generando...' : '⬇ Exportar CSV'}
    </button>
  )
}
