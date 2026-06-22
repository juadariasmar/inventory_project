import { redirect } from 'next/navigation'
import { obtenerSesion } from '@/lib/permisos'
import BarraNavegacion from '../BarraNavegacion'
import PendienteAprobacion from './PendienteAprobacion'

interface PropiedadesLayout {
  children: React.ReactNode
}

export default async function LayoutProtegido({ children }: PropiedadesLayout) {
  const sesion = await obtenerSesion()

  if (!sesion) {
    redirect('/auth/sign-in')
  }

  if (sesion.user.estado === 'PENDIENTE') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <BarraNavegacion sesion={sesion} />
        <PendienteAprobacion />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BarraNavegacion sesion={sesion} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
