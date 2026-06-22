import { NextResponse } from 'next/server'
import { obtenerTodoAnalisis } from '@/lib/analisis'
import { tienePermiso, obtenerSesion } from '@/lib/permisos'

export async function GET() {
  if (!(await tienePermiso('VER_ANALISIS'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const sesion = await obtenerSesion()
  const empresaId = sesion?.user?.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }
  try {
    const datos = await obtenerTodoAnalisis(empresaId)
    return NextResponse.json(datos)
  } catch (error) {
    console.error('Error al obtener análisis:', error)
    return NextResponse.json({ error: 'Error al obtener análisis' }, { status: 500 })
  }
}
