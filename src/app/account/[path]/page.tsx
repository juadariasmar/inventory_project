import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { AccountView } from '@neondatabase/auth-ui'
import { accountViewPaths } from '@neondatabase/auth-ui/server'

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }))
}

export default async function CuentaPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params
  return (
    <LayoutProtegido>
      <AccountView path={path} />
    </LayoutProtegido>
  )
}
