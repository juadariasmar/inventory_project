import { NextRequest, NextResponse } from 'next/server'
import { obtenerSesion } from '@/lib/permisos'
import { ClientesService } from '@/services/ClientesService'
import { AppError } from '@/lib/AppError'

interface Parametros {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }

  try {
    const { id } = await params
    const cliente = await ClientesService.obtenerHistorial(parseInt(id, 10), empresaId)
    return NextResponse.json(cliente)
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al obtener historial:', error)
    return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 })
  }
}
