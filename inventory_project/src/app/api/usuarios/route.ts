import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { esAdmin } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

/**
 * Valida la fortaleza de una contraseña.
 * Retorna un string con el mensaje de error, o null si es válida.
 */
function validarContrasena(contrasena: string): string | null {
  if (contrasena.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Z]/.test(contrasena)) return 'La contraseña debe incluir al menos una letra mayúscula.'
  if (!/[0-9]/.test(contrasena)) return 'La contraseña debe incluir al menos un número.'
  return null
}

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

    if (!datos.nombreUsuario || !datos.contrasena || !datos.nombre) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    const errorContrasena = validarContrasena(datos.contrasena)
    if (errorContrasena) {
      return NextResponse.json({ error: errorContrasena }, { status: 400 })
    }

    const existente = await prisma.usuario.findUnique({
      where: { nombreUsuario: datos.nombreUsuario },
    })
    if (existente) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 409 })
    }

    const hash = await bcrypt.hash(datos.contrasena, 10)

    const permisosValidos = ['VER_ANALISIS', 'EXPORTAR_REPORTES', 'REGISTRAR_MOVIMIENTOS', 'REALIZAR_VENTAS'] as const
    const permisos = Array.isArray(datos.permisos)
      ? datos.permisos.filter((p: string) => permisosValidos.includes(p as typeof permisosValidos[number]))
      : []

    const usuario = await prisma.usuario.create({
      data: {
        nombreUsuario: datos.nombreUsuario,
        contrasena: hash,
        nombre: datos.nombre,
        rol: datos.rol === 'ADMIN' ? 'ADMIN' : 'USUARIO',
        permisos,
      },
      select: {
        id: true,
        nombreUsuario: true,
        nombre: true,
        rol: true,
        permisos: true,
        creadoEn: true,
      },
    })

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Usuario',
      entidadId: usuario.id,
      datos: { despues: usuario },
      ip: extraerIp(request),
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
