'use client'

import React from 'react'
import nextDynamic from 'next/dynamic'

const Loading = () => (
  <div className="h-64 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-sm">
    Cargando gráfico...
  </div>
)

export const GraficoMovimientos = nextDynamic(
  () => import('@/componentes/graficos/GraficoMovimientos'),
  { ssr: false, loading: Loading }
)

export const GraficoAltaRotacion = nextDynamic(
  () => import('@/componentes/graficos/GraficoAltaRotacion'),
  { ssr: false, loading: Loading }
)

export const GraficoVentasDiarias = nextDynamic(
  () => import('@/componentes/graficos/GraficoVentasDiarias'),
  { ssr: false, loading: Loading }
)

export const GraficoVentasCategoria = nextDynamic(
  () => import('@/componentes/graficos/GraficoVentasCategoria'),
  { ssr: false, loading: Loading }
)

export const GraficoDistribucionStock = nextDynamic(
  () => import('@/componentes/graficos/GraficoDistribucionStock'),
  { ssr: false, loading: Loading }
)
