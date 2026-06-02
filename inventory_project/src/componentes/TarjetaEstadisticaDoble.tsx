interface SubCifra {
  etiqueta: string
  valor: string | number
}

interface Propiedades {
  titulo: string
  icono: React.ReactNode
  colorFondo: string
  cifras: SubCifra[]
}

export default function TarjetaEstadisticaDoble({
  titulo,
  icono,
  colorFondo,
  cifras,
}: Propiedades) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-full ${colorFondo}`}>{icono}</div>
        <p className="text-sm font-semibold text-gray-700">{titulo}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cifras.map((c, i) => (
          <div key={i}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {c.etiqueta}
            </p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{c.valor}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
