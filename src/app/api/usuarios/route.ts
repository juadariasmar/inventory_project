import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { UsuariosService } from '@/services/UsuariosService'
import { AppError } from '@/lib/AppError'



// GET - Listar usuarios (solo ADMIN)
export async function GET() {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const sesion = await obtenerSesion();
  const empresaId = sesion?.user?.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { empresaId },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        creadoEn: true,
      },
      orderBy: { creadoEn: 'desc' },
    })
    return NextResponse.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

// POST - Crear usuario (solo ADMIN)
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const sesion = await obtenerSesion();
  const empresaId = sesion?.user?.empresaId;
  if (!empresaId) {
    return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 })
  }

  try {
    const datos = await request.json()

    const usuario = await UsuariosService.crearUsuario(datos, empresaId)

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Usuario',
      entidadId: usuario.id,
      empresaId,
      datos: { despues: usuario },
      ip: extraerIp(request),
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al crear usuario:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
