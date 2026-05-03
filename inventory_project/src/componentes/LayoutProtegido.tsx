'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import BarraNavegacion from './BarraNavegacion'

interface PropiedadesLayout {
  children: React.ReactNode
}

export default function LayoutProtegido({ children }: PropiedadesLayout) {
  const { data: sesion, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (!sesion) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BarraNavegacion />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
