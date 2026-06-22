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
  categoria: string
  unidadesVendidas: number
  ingresoTotal: number
}

export default function GraficoVentasCategoria({ datos }: { datos: Punto[] }) {
  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="categoria"
            tick={{ fontSize: 11 }}
            width={120}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value, name) => {
              const n = typeof value === 'number' ? value : Number(value)
              return name === 'ingresoTotal'
                ? [`$${n.toLocaleString('es-MX')}`, 'Ingreso']
                : [String(n), 'Unidades']
            }}
          />
          <Bar dataKey="ingresoTotal" fill="#7c3aed" name="ingresoTotal" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
