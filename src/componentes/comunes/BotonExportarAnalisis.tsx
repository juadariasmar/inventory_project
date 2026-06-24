'use client'

import { FileDown } from 'lucide-react'

export default function BotonExportarAnalisis() {
  return (
    <a
      href="/api/analisis/exportar"
      className="px-4 py-2 bg-success text-white rounded-md hover:bg-success-hover transition-colors text-center inline-flex items-center gap-2"
    >
      <FileDown className="w-4 h-4" />
      Exportar a Excel
    </a>
  )
}
