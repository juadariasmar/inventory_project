import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'
import { generarPrefijoSugerido } from '@/lib/codigos'

// GET - Obtener todas las categorías
export async function GET() {
  if (!(await obtenerSesion())?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  try {
    const categorias = await prisma.categoria.findMany({
      include: {
        _count: {
          select: { productos: true },
        },
      },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(categorias)
  } catch (error) {
    console.error('Error al obtener categorías:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear una nueva categoría (solo ADMIN)
// Acepta { nombre, prefijo? }. Si no se envia prefijo, se autogenera.
export async function POST(request: NextRequest) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const datos = await request.json()
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : ''
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio.' },
        { status: 400 }
      )
    }

    let prefijo = typeof datos.prefijo === 'string' ? datos.prefijo.trim().toUpperCase() : ''
    const existentes = await prisma.categoria.findMany({
      select: { prefijo: true },
    })
    const prefijosEnUso = new Set(existentes.map((c) => c.prefijo))

    if (!prefijo) {
      prefijo = generarPrefijoSugerido(nombre, prefijosEnUso)
    } else if (prefijosEnUso.has(prefijo)) {
      return NextResponse.json(
        { error: `Ya existe una categoría con el prefijo "${prefijo}". Elige uno distinto.` },
        { status: 409 }
      )
    } else if (!/^[A-Z0-9]{2,8}$/.test(prefijo)) {
      return NextResponse.json(
        { error: 'El prefijo debe tener entre 2 y 8 letras o números (sin espacios ni símbolos).' },
        { status: 400 }
      )
    }

    const categoria = await prisma.categoria.create({
      data: { nombre, prefijo },
    })

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Categoria',
      entidadId: categoria.id,
      datos: { despues: categoria },
      ip: extraerIp(request),
    })

    revalidatePath('/categorias')
    revalidatePath('/productos/categorias')
    revalidatePath('/productos/nuevo')
    revalidatePath('/productos', 'layout')

    return NextResponse.json(categoria, { status: 201 })
  } catch (error) {
    console.error('Error al crear categoría:', error)
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
