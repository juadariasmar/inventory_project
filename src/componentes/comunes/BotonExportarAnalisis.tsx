'use client'

// Enlace directo al endpoint de exportar. El servidor envia el archivo
// XLSX con su Content-Disposition propio (incluye timestamp en el nombre),
// asi que NO se sobreescribe desde aqui con un download forzado para evitar
// que el navegador termine guardando una extension distinta a la del archivo.

export default function BotonExportarAnalisis() {
  return (
    <a
      href="/api/analisis/exportar"
      className="px-4 py-2 bg-success text-white rounded-md hover:bg-success-hover transition-colors text-center inline-block"
    >
      ⬇ Exportar a Excel
    </a>
  )
}
