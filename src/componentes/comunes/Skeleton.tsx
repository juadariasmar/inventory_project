import React from 'react'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  )
}

export function TablaSkeleton({ filas = 5, columnas = 4 }: { filas?: number; columnas?: number }) {
  return (
    <div role="status" aria-label="Cargando tabla" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex gap-4 mb-6">
        {Array.from({ length: columnas }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: filas }).map((_, f) => (
        <div key={`f-${f}`} className="flex gap-4">
          {Array.from({ length: columnas }).map((_, c) => (
            <Skeleton key={`c-${f}-${c}`} className="h-8 flex-1" />
          ))}
        </div>
      ))}
      <span className="sr-only">Cargando datos...</span>
    </div>
  )
}
