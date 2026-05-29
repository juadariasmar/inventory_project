'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface PuntoResumen {
  fecha: string
  entradas: number
  salidas: number
}

export default function GraficoMovimientos({ datos }: { datos: PuntoResumen[] }) {
  const datosFormateados = datos.map((d) => ({
    ...d,
    etiqueta: d.fecha.slice(5),
  }))

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datosFormateados} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="entradas" fill="#16a34a" name="Entradas" />
          <Bar dataKey="salidas" fill="#dc2626" name="Salidas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
