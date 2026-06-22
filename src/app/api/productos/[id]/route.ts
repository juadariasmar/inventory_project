import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

interface Parametros {
  params: Promise<{ id: string }>
}

// GET - Obtener un producto por ID
export async function GET(request: NextRequest, { params }: Parametros) {
  const sesion = await obtenerSesion();
  if (!sesion?.user || sesion.user.estado !== 'ACTIVO') {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  try {
    const { id } = await params
    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: { categoria: true },
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al obtener producto:', error)
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un producto (solo ADMIN)
// Reglas sobre la cantidad:
//  - Si la nueva cantidad es MENOR a la actual, se rechaza la edición.
//    Para reducir stock debe usarse un movimiento de salida desde /movimientos.
//  - Si la nueva cantidad es MAYOR, se crea automáticamente un movimiento de
//    entrada con la diferencia y nota "Ajuste por edición".
//  - Si es igual, solo se actualizan los otros campos.
export async function PUT(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    const productoId = parseInt(id)
    if (isNaN(productoId) || productoId <= 0) {
      return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
    }

    const datos = await request.json()
    const nuevaCantidad = parseInt(String(datos.cantidad ?? ''), 10)
    if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
      return NextResponse.json({ error: 'La cantidad debe ser un número entero no negativo.' }, { status: 400 })
    }

    const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : ''
    if (!nombre || nombre.length < 2) {
      return NextResponse.json({ error: 'El nombre debe tener al menos 2 caracteres.' }, { status: 400 })
    }

    const precio = parseFloat(datos.precio)
    if (!Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ error: 'El precio debe ser un número válido no negativo.' }, { status: 400 })
    }

    const stockMinimo = parseInt(String(datos.stockMinimo ?? '1'), 10)
    if (isNaN(stockMinimo) || stockMinimo < 0) {
      return NextResponse.json({ error: 'El stock mínimo debe ser un número entero no negativo.' }, { status: 400 })
    }

    const actual = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!actual) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    if (nuevaCantidad < actual.cantidad) {
      return NextResponse.json(
        {
          error:
            'No se puede reducir la cantidad desde la edición del producto. ' +
            'Para descontar stock, registra un movimiento de salida desde Movimientos.',
        },
        { status: 400 }
      )
    }

    const categoriaId = parseInt(datos.categoriaId, 10)
    if (!categoriaId || Number.isNaN(categoriaId)) {
      return NextResponse.json(
        { error: 'La categoría es obligatoria.' },
        { status: 400 }
      )
    }
    if (categoriaId !== actual.categoriaId) {
      const existe = await prisma.categoria.findUnique({
        where: { id: categoriaId },
        select: { id: true },
      })
      if (!existe) {
        return NextResponse.json(
          { error: 'La categoría seleccionada no existe.' },
          { status: 400 }
        )
      }
    }

    const delta = nuevaCantidad - actual.cantidad

    const producto = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.producto.update({
        where: { id: productoId },
        data: {
          nombre: datos.nombre,
          descripcion: datos.descripcion || null,
          codigo: datos.codigo,
          precio: parseFloat(datos.precio),
          cantidad: nuevaCantidad,
          stockMinimo: parseInt(datos.stockMinimo),
          categoriaId,
        },
      })

      if (delta > 0) {
        await tx.movimiento.create({
          data: {
            productoId,
            tipo: 'entrada',
            cantidad: delta,
            notas: 'Ajuste por edición',
            empresaId: actual.empresaId,
          },
        })
      }

      return actualizado
    })

    await registrarAuditoria({
      accion: 'ACTUALIZAR',
      entidad: 'Producto',
      entidadId: producto.id,
      datos: { antes: actual, despues: producto },
      ip: extraerIp(request),
    })

    revalidatePath('/movimientos')
    revalidatePath('/movimientos/nuevo')
    revalidatePath('/productos')
    revalidatePath('/')
    revalidatePath('/analisis')

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese código.' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un producto (solo ADMIN)
// Elimina también todos los movimientos asociados en la misma transacción,
// ya que existe foreign key entre Movimiento.productoId y Producto.id.
export async function DELETE(request: NextRequest, { params }: Parametros) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  try {
    const { id } = await params
    const productoId = parseInt(id)

    const productoExistente = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!productoExistente) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.movimiento.deleteMany({ where: { productoId } })
      await tx.producto.delete({ where: { id: productoId } })
    })

    await registrarAuditoria({
      accion: 'ELIMINAR',
      entidad: 'Producto',
      entidadId: productoId,
      datos: { antes: productoExistente },
      ip: extraerIp(request),
    })

    revalidatePath('/movimientos')
    revalidatePath('/movimientos/nuevo')
    revalidatePath('/productos')
    revalidatePath('/')
    revalidatePath('/analisis')

    return NextResponse.json({ mensaje: 'Producto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}
