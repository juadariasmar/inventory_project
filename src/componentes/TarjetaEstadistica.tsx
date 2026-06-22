interface PropiedadesTarjeta {
  titulo: string
  valor: string | number
  icono: React.ReactNode
  colorFondo: string
}

export default function TarjetaEstadistica({
  titulo,
  valor,
  icono,
  colorFondo,
}: PropiedadesTarjeta) {
  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border flex flex-col gap-2 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-full ${colorFondo} flex-shrink-0`}>
          {icono}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{titulo}</p>
          <p className="text-3xl font-black text-foreground tracking-tight mt-1 break-words leading-tight">
            {valor}
          </p>
        </div>
      </div>
    </div>
  )
}
