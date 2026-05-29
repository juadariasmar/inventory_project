'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Punto {
  nombre: string
  cantidadVendida: number
}

export default function GraficoAltaRotacion({ datos }: { datos: Punto[] }) {
  const datosCortados = datos.map((d) => ({
    ...d,
    nombreCorto: d.nombre.length > 18 ? d.nombre.slice(0, 16) + '…' : d.nombre,
  }))

  return (
    <div className="w-full h-72 sm:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datosCortados}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis dataKey="nombreCorto" type="category" tick={{ fontSize: 11 }} width={120} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="cantidadVendida" fill="#2563eb" name="Unidades vendidas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
