'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Building2, Users, LayoutDashboard, Sparkles } from 'lucide-react'

export default function OnboardingContenido() {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)

  const completarOnboarding = async (ruta: string) => {
    setCargando(true)
    try {
      await fetch('/api/usuarios/onboarding', { method: 'PATCH' })
    } finally {
      router.push(ruta)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 mb-6">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido a tu empresa!
          </h1>
          <p className="text-gray-500 text-lg">
            Tu empresa se ha creado automaticamente. Elige por donde empezar:
          </p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => completarOnboarding('/empresa/configuracion')}
            disabled={cargando}
            className="group flex items-center gap-5 p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left disabled:opacity-50"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">Configurar mi empresa</h3>
              <p className="text-sm text-gray-500">Personaliza el nombre, moneda e impuestos</p>
            </div>
            <span className="text-indigo-600 text-sm font-medium group-hover:translate-x-0.5 transition-transform">Ir &rarr;</span>
          </button>

          <button
            onClick={() => completarOnboarding('/empresa/configuracion')}
            disabled={cargando}
            className="group flex items-center gap-5 p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left disabled:opacity-50"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">Invitar usuarios</h3>
              <p className="text-sm text-gray-500">Agrega colaboradores a tu empresa</p>
            </div>
            <span className="text-indigo-600 text-sm font-medium group-hover:translate-x-0.5 transition-transform">Ir &rarr;</span>
          </button>

          <button
            onClick={() => completarOnboarding('/')}
            disabled={cargando}
            className="group flex items-center gap-5 p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left disabled:opacity-50"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <LayoutDashboard className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">Ir al panel principal</h3>
              <p className="text-sm text-gray-500">Empieza a gestionar tu inventario ahora</p>
            </div>
            <span className="text-indigo-600 text-sm font-medium group-hover:translate-x-0.5 transition-transform">Ir &rarr;</span>
          </button>
        </div>

        {cargando && (
          <p className="text-center text-sm text-gray-400 mt-6">Redirigiendo...</p>
        )}
      </div>
    </div>
  )
}
