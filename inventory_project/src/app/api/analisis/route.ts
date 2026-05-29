import { NextResponse } from 'next/server'
import { obtenerTodoAnalisis } from '@/lib/analisis'
import { tienePermiso } from '@/lib/permisos'

export async function GET() {
  if (!(await tienePermiso('VER_ANALISIS'))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const datos = await obtenerTodoAnalisis()
    return NextResponse.json(datos)
  } catch (error) {
    console.error('Error al obtener análisis:', error)
    return NextResponse.json({ error: 'Error al obtener análisis' }, { status: 500 })
  }
}
