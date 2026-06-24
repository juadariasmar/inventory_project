import { NextRequest, NextResponse } from 'next/server'
import { obtenerSesion, esAdmin } from '@/lib/permisos'
import { SugerenciasCompraService } from '@/services/SugerenciasCompraService'
import { extraerIp } from '@/lib/auditoria'
import { AppError } from '@/lib/AppError'

export async function GET() {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'Solo administradores pueden ver sugerencias' }, { status: 403 })
  }

  try {
    const sugerencias = await SugerenciasCompraService.generarSugerencias(empresaId)
    return NextResponse.json(sugerencias)
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al generar sugerencias:', error)
    return NextResponse.json({ error: 'Error al generar sugerencias' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const empresaId = sesion.user.empresaId
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'Solo administradores pueden crear órdenes' }, { status: 403 })
  }

  try {
    const datos = await request.json()
    const ip = extraerIp(request) || '127.0.0.1'

    const orden = await SugerenciasCompraService.crearOrdenDesdeSugerencia(
      empresaId,
      datos.proveedorId,
      datos.items,
      ip,
    )
    return NextResponse.json(orden, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al crear orden desde sugerencia:', error)
    return NextResponse.json({ error: 'Error al crear orden de compra' }, { status: 500 })
  }
}
