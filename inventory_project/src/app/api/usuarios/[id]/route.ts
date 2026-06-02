import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'

// GET - Obtener un usuario
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const usuario = await prisma.usuario.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true, nombreUsuario: true, nombre: true, rol: true, permisos: true, creadoEn: true },
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

    const datosActualizar: {
      nombre?: string
      nombreUsuario?: string
      rol?: 'ADMIN' | 'USUARIO'
      contrasena?: string
      permisos?: ('VER_ANALISIS' | 'EXPORTAR_REPORTES')[]
    } = {}

    if (datos.nombre) datosActualizar.nombre = datos.nombre
    if (datos.nombreUsuario) datosActualizar.nombreUsuario = datos.nombreUsuario
    if (datos.rol === 'ADMIN' || datos.rol === 'USUARIO') datosActualizar.rol = datos.rol

    if (datos.contrasena && datos.contrasena.length > 0) {
      if (datos.contrasena.length < 6) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
      }
      datosActualizar.contrasena = await bcrypt.hash(datos.contrasena, 10)
    }

    if (Array.isArray(datos.permisos)) {
      const permisosValidos = ['VER_ANALISIS', 'EXPORTAR_REPORTES', 'REGISTRAR_MOVIMIENTOS', 'REALIZAR_VENTAS'] as const
      datosActualizar.permisos = datos.permisos.filter((p: string) =>
        permisosValidos.includes(p as typeof permisosValidos[number])
      )
    }

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: datosActualizar,
      select: { id: true, nombreUsuario: true, nombre: true, rol: true, permisos: true, creadoEn: true },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

// DELETE - Eliminar usuario (solo ADMIN, no puede eliminarse a sí mismo)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { id } = await params
    const usuarioId = parseInt(id, 10)
    const sesion = await obtenerSesion()

    if (sesion?.user?.id === usuarioId.toString()) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      )
    }

    await prisma.usuario.delete({ where: { id: usuarioId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
