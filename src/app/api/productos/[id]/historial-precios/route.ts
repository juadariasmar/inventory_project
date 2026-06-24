import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { obtenerSesion } from '@/lib/permisos'
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
    const productoId = parseInt(id, 10)

    const producto = await prisma.producto.findFirst({
      where: { id: productoId, empresaId },
      select: { id: true },
    })
    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const historial = await prisma.historialPrecio.findMany({
      where: { productoId, empresaId },
      include: { cambiadoPor: { select: { nombre: true, email: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 50,
    })

    return NextResponse.json(historial)
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al obtener historial de precios:', error)
    return NextResponse.json({ error: 'Error al obtener historial de precios' }, { status: 500 })
  }
}
