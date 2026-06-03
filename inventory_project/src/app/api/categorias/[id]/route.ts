import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

interface Parametros {
  params: Promise<{ id: string }>
}

// PUT - Actualizar nombre y/o prefijo de una categoría (solo ADMIN)
// El prefijo nuevo aplica a futuros códigos autogenerados; los códigos
// existentes NO se renombran (mantienen el formato anterior).
export async function PUT(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    const categoriaId = parseInt(id)
    if (!categoriaId || Number.isNaN(categoriaId)) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
    }

    const datos = await request.json()
    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : ''
    const prefijo = typeof datos.prefijo === 'string' ? datos.prefijo.trim().toUpperCase() : ''

    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio.' },
        { status: 400 }
      )
    }
    if (!prefijo) {
      return NextResponse.json(
        { error: 'El prefijo es obligatorio.' },
        { status: 400 }
      )
    }
    if (!/^[A-Z0-9]{2,8}$/.test(prefijo)) {
      return NextResponse.json(
        { error: 'El prefijo debe tener entre 2 y 8 letras o números (sin espacios ni símbolos).' },
        { status: 400 }
      )
    }

    const actual = await prisma.categoria.findUnique({
      where: { id: categoriaId },
    })
    if (!actual) {
      return NextResponse.json(
        { error: 'Categoría no encontrada.' },
        { status: 404 }
      )
    }

    if (prefijo !== actual.prefijo || nombre !== actual.nombre) {
      const conflicto = await prisma.categoria.findFirst({
        where: {
          id: { not: categoriaId },
          OR: [{ prefijo }, { nombre }],
        },
      })
      if (conflicto) {
        const motivo = conflicto.prefijo === prefijo ? 'prefijo' : 'nombre'
        return NextResponse.json(
          { error: `Ya existe otra categoría con ese ${motivo}.` },
          { status: 409 }
        )
      }
    }

    const actualizada = await prisma.categoria.update({
      where: { id: categoriaId },
      data: { nombre, prefijo },
    })

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Categoria',
      entidadId: categoriaId,
      datos: { antes: actual, despues: actualizada },
      ip: extraerIp(request),
    })

    revalidatePath('/categorias')
    revalidatePath('/productos/categorias')
    revalidatePath('/productos/nuevo')
    revalidatePath('/productos', 'layout')

    return NextResponse.json(actualizada)
  } catch (error) {
    console.error('Error al actualizar categoría:', error)
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una categoría (solo ADMIN)
export async function DELETE(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params

    // Verificar si hay productos asociados
    const productosAsociados = await prisma.producto.count({
      where: { categoriaId: parseInt(id) },
    })

    if (productosAsociados > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una categoría con productos asociados' },
        { status: 400 }
      )
    }

    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id: parseInt(id) },
    })

    await prisma.categoria.delete({
      where: { id: parseInt(id) },
    })

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Categoria',
      entidadId: parseInt(id),
      datos: { antes: categoriaExistente },
      ip: extraerIp(request),
    })

    revalidatePath('/categorias')
    revalidatePath('/productos/nuevo')
    revalidatePath('/productos', 'layout')

    return NextResponse.json({ mensaje: 'Categoría eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar categoría:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}
