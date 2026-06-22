import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { UsuariosService } from '@/services/UsuariosService'
import { AppError } from '@/lib/AppError'



// GET - Obtener un usuario
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const usuario = await prisma.usuario.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true, email: true, nombre: true, rol: true, permisos: true, creadoEn: true },
  })
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }
  return NextResponse.json(usuario)
}

// PUT - Actualizar usuario (solo ADMIN)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const datos = await request.json()
    const usuarioId = parseInt(id, 10)

    const antes = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true, nombre: true, rol: true, permisos: true, creadoEn: true },
    })

    const usuario = await UsuariosService.actualizarUsuario(usuarioId, datos)

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Usuario',
      entidadId: usuario.id,
      datos: {
        antes,
        despues: usuario,
        contrasenaCambiada: Boolean(datos.contrasena && datos.contrasena.length > 0),
      },
      ip: extraerIp(request),
    })

    return NextResponse.json(usuario)
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

// DELETE - Eliminar usuario (solo ADMIN, no puede eliminarse a sí mismo)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const usuarioId = parseInt(id, 10)
    const sesion = await obtenerSesion()
    
    const usuarioLogueadoId = sesion?.user?.id ? Number(sesion.user.id) : -1

    const antes = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true, nombre: true, rol: true, permisos: true, creadoEn: true },
    })

    await UsuariosService.eliminarUsuario(usuarioId, usuarioLogueadoId)

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Usuario',
      entidadId: usuarioId,
      datos: { antes },
      ip: extraerIp(request),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
