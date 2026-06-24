import { redirect } from 'next/navigation'
import { obtenerSesion } from '@/lib/permisos'
import BarraNavegacion from '@/componentes/BarraNavegacion'
import OnboardingContenido from './OnboardingContenido'

export default async function OnboardingPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/auth/sign-in')
  if (sesion.user.onboardingCompletado) redirect('/')

  return (
    <>
      <BarraNavegacion sesion={sesion} />
      <OnboardingContenido />
    </>
  )
}
