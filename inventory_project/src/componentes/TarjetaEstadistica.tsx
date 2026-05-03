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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorFondo}`}>
          {icono}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{titulo}</p>
          <p className="text-2xl font-bold text-gray-800">{valor}</p>
        </div>
      </div>
    </div>
  )
}
