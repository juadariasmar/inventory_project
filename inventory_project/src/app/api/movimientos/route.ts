import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { obtenerSesion, tienePermiso } from '@/lib/permisos'
import { extraerIp, registrarAuditoria } from '@/lib/auditoria'

// GET - Obtener todos los movimientos (cualquier usuario autenticado)
export async function GET() {
  if (!(await obtenerSesion())?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  try {
    const movimientos = await prisma.movimiento.findMany({
      include: { producto: true },
      orderBy: { creadoEn: 'desc' },
    })
    return NextResponse.json(movimientos)
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo movimiento
//   - REGISTRAR_MOVIMIENTOS habilita cualquier tipo (entrada y salida)
//   - REALIZAR_VENTAS habilita solo movimientos de salida (via boton Vender o
//     pantalla Ventas)
export async function POST(request: NextRequest) {
  if (!(await obtenerSesion())?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  try {
    const datos = await request.json()

    const productoId = parseInt(datos.productoId)
    const cantidad = parseInt(datos.cantidad)
    const tipo = datos.tipo // 'entrada' o 'salida'

    // Validar tipo antes de cualquier operacion de BD.
    if (tipo !== 'entrada' && tipo !== 'salida') {
      return NextResponse.json(
        { error: 'El tipo de movimiento debe ser "entrada" o "salida".' },
        { status: 400 }
      )
    }

    if (!productoId || isNaN(productoId) || isNaN(cantidad) || cantidad <= 0) {
      return NextResponse.json(
        { error: 'Se requiere un productoId valido y una cantidad mayor a 0.' },
        { status: 400 }
      )
    }

    const puedeRegistrar = await tienePermiso('REGISTRAR_MOVIMIENTOS')
    const puedeVender = await tienePermiso('REALIZAR_VENTAS')
    const autorizado = puedeRegistrar || (puedeVender && tipo === 'salida')
    if (!autorizado) {
      return NextResponse.json(
        { error: 'No tienes permiso para realizar este movimiento' },
        { status: 403 }
      )
    }

    // Toda la operacion (validacion de stock + creacion + actualizacion) ocurre
    // dentro de la transaccion para evitar race conditions.
    // Se usa increment/decrement atomico: PostgreSQL ejecuta
    //   UPDATE productos SET cantidad = cantidad +/- N WHERE id = X
    // lo que es seguro ante accesos concurrentes.
    const movimiento = await prisma.$transaction(async (tx) => {
      // Verificar existencia y stock dentro de la tx.
      const producto = await tx.producto.findUnique({
        where: { id: productoId },
        select: { id: true, cantidad: true },
      })

      if (!producto) throw new Error('PRODUCTO_NO_ENCONTRADO')

      if (tipo === 'salida' && producto.cantidad < cantidad) {
        throw new Error(`STOCK_INSUFICIENTE:${producto.cantidad}:${cantidad}`)
      }

      const mov = await tx.movimiento.create({
        data: {
          productoId,
          tipo,
          cantidad,
          notas: datos.notas || null,
        },
        include: { producto: true },
      })

      // Actualizacion atomica: no usa valor absoluto precalculado fuera de la tx.
      await tx.producto.update({
        where: { id: productoId },
        data: tipo === 'entrada'
          ? { cantidad: { increment: cantidad } }
          : { cantidad: { decrement: cantidad } },
      })

      return mov
    })

    await registrarAuditoria({
      accion: 'CREAR',
      entidad: 'Movimiento',
      entidadId: movimiento.id,
      datos: {
        despues: movimiento,
      },
      ip: extraerIp(request),
    })

    revalidatePath('/movimientos')
    revalidatePath('/movimientos/nuevo')
    revalidatePath('/productos')
    revalidatePath('/analisis')
    revalidatePath('/')

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PRODUCTO_NO_ENCONTRADO') {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
      }
      if (error.message.startsWith('STOCK_INSUFICIENTE:')) {
        const [, actual, solicitado] = error.message.split(':')
        return NextResponse.json(
          { error: `No hay suficiente stock para esta salida. Disponible: ${actual}, solicitado: ${solicitado}.` },
          { status: 400 }
        )
      }
    }
    console.error('Error al crear movimiento:', error)
    return NextResponse.json(
      { error: 'Error al crear movimiento' },
      { status: 500 }
    )
  }
}
