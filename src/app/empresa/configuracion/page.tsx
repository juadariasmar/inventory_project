import { redirect } from 'next/navigation'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { obtenerSesion } from '@/lib/permisos'
import FormularioConfiguracion from './FormularioConfiguracion'

export const dynamic = 'force-dynamic'

export default async function PaginaConfiguracion() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || (sesion.user.rol !== 'ADMIN' && sesion.user.rol !== 'SUPER_ADMIN')) {
    redirect('/auth/sign-in')
  }

  return (
    <LayoutProtegido>
      <FormularioConfiguracion />
    </LayoutProtegido>
  )
}
