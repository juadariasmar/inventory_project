import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { esAdmin } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { UsuariosService } from '@/services/UsuariosService'
import { AppError } from '@/lib/AppError'



// GET - Listar usuarios (solo ADMIN)
export async function GET() {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombreUsuario: true,
        nombre: true,
        rol: true,
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

  try {
    const datos = await request.json()

    const usuario = await UsuariosService.crearUsuario(datos)

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Usuario',
      entidadId: usuario.id,
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
