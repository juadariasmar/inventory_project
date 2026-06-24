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
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border flex flex-col gap-3 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-full ${colorFondo} flex-shrink-0`}>{icono}</div>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider truncate">{titulo}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cifras.map((c, i) => (
          <div key={i} className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">
              {c.etiqueta}
            </p>
            <p className="text-2xl font-black text-foreground tracking-tight mt-1 break-words leading-tight">
              {c.valor}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
