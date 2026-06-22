'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Punto {
  fecha: string
  numeroVentas: number
  totalIngreso: number
}

export default function GraficoVentasDiarias({ datos }: { datos: Punto[] }) {
  const datosFormateados = datos.map((d) => ({
    ...d,
    etiqueta: d.fecha.slice(5),
  }))

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datosFormateados} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            yAxisId="izq"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            yAxisId="der"
            orientation="right"
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            labelFormatter={(label) => `Fecha: ${label}`}
            formatter={(value, name) => {
              const n = typeof value === 'number' ? value : Number(value)
              return name === 'totalIngreso'
                ? [`$${n.toLocaleString('es-MX')}`, 'Ingreso']
                : [String(n), 'N° de ventas']
            }}
          />
          <Line
            yAxisId="izq"
            type="monotone"
            dataKey="totalIngreso"
            stroke="#059669"
            strokeWidth={2}
            dot={false}
            name="totalIngreso"
          />
          <Line
            yAxisId="der"
            type="monotone"
            dataKey="numeroVentas"
            stroke="#2563eb"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
            name="numeroVentas"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
