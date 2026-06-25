import { redirect } from 'next/navigation'
import LayoutProtegido from '@/componentes/comunes/LayoutProtegido'
import { obtenerSesion, esSuperAdmin } from '@/lib/permisos'
import { prisma } from '@/lib/db'
import AdminEmpresasClient from '@/componentes/admin/AdminEmpresasClient'

export const dynamic = 'force-dynamic'

export default async function PaginaAdminEmpresas() {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    redirect('/auth/sign-in')
  }
  if (!(await esSuperAdmin())) {
    redirect('/')
  }

  const empresas = await prisma.empresa.findMany({
    orderBy: { creadoEn: 'desc' },
    include: {
      _count: {
        select: { usuarios: true, productos: true },
      },
    },
  })

  const empresasConConteos = empresas.map((emp) => ({
    id: emp.id,
    nombre: emp.nombre,
    creadoEn: emp.creadoEn.toISOString(),
    usuarios: emp._count.usuarios,
    productos: emp._count.productos,
  }))

  return (
    <LayoutProtegido>
      <AdminEmpresasClient empresas={empresasConConteos} />
    </LayoutProtegido>
  )
}
