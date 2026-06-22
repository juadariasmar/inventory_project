'use client'

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface Punto {
  estado: string
  cantidad: number
}

const COLORES: Record<string, string> = {
  'Sin stock': '#9ca3af',
  'Stock bajo': '#dc2626',
  'Normal': '#16a34a',
}

export default function GraficoDistribucionStock({ datos }: { datos: Punto[] }) {
  const total = datos.reduce((s, d) => s + d.cantidad, 0)
  const conPorcentaje = datos.map((d) => ({
    ...d,
    pct: total > 0 ? Math.round((d.cantidad / total) * 100) : 0,
  }))

  if (total === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No hay productos registrados para mostrar la distribución.
      </p>
    )
  }

  return (
    <div className="w-full h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={conPorcentaje}
            dataKey="cantidad"
            nameKey="estado"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={(props: { name?: string; payload?: { pct?: number } }) =>
              `${props.name ?? ''} ${props.payload?.pct ?? 0}%`
            }
            labelLine={false}
          >
            {conPorcentaje.map((d) => (
              <Cell key={d.estado} fill={COLORES[d.estado] ?? '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value) => {
              const n = typeof value === 'number' ? value : Number(value)
              return [`${n} productos`, '']
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
