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
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-full ${colorFondo} flex-shrink-0`}>
          {icono}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{titulo}</p>
          <p className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold text-gray-800 break-words leading-tight mt-1">
            {valor}
          </p>
        </div>
      </div>
    </div>
  )
}
