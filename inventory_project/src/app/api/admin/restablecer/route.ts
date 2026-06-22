import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { esAdmin, obtenerSesion } from '@/lib/permisos'

// POST /api/admin/restablecer
//   body: { confirmacion: "RESTABLECER" }
//
// Restablece la BD al estado de "empresa nueva":
//   BORRA en transaccion: cotizaciones + items, ventas + items,
//     movimientos, productos, categorias, auditoria
//   CONSERVA: usuarios y sus permisos
//
// Solo ADMIN. La frase de confirmacion debe ser exactamente "RESTABLECER".
export async function POST(request: NextRequest) {
  const sesion = await obtenerSesion()
  if (!sesion?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'Solo un administrador puede restablecer.' }, { status: 403 })
  }

  try {
    const datos = await request.json().catch(() => ({}))
    const expectedToken = process.env.RESET_TOKEN

    if (!expectedToken || datos.token !== expectedToken) {
      return NextResponse.json(
        { error: 'Token de seguridad inválido o faltante.' },
        { status: 403 }
      )
    }

    if (datos.confirmacion !== 'RESTABLECER') {
      return NextResponse.json(
        { error: 'Confirmación inválida. Escribe exactamente "RESTABLECER".' },
        { status: 400 }
      )
    }

    // Conteo previo para reportar al usuario.
    const [productos, categorias, movimientos, ventas, cotizaciones, auditorias] =
      await Promise.all([
        prisma.producto.count(),
        prisma.categoria.count(),
        prisma.movimiento.count(),
        prisma.venta.count(),
        prisma.cotizacion.count(),
        prisma.auditoria.count(),
      ])

    // Orden: hijos antes que padres por las FK.
    await prisma.$transaction(async (tx) => {
      await tx.itemCotizacion.deleteMany({})
      await tx.cotizacion.deleteMany({})
      await tx.itemVenta.deleteMany({})
      // Movimientos antes de ventas: tienen FK opcional a venta pero el
      // cascade es SetNull; igual los borramos para limpieza total.
      await tx.movimiento.deleteMany({})
      await tx.venta.deleteMany({})
      await tx.producto.deleteMany({})
      await tx.categoria.deleteMany({})
      // Auditoria al final: si algun paso anterior falla, el registro
      // historico se conserva.
      await tx.auditoria.deleteMany({})
    })

    // Invalidar todas las paginas que dependen de estos datos.
    revalidatePath('/', 'layout')

    return NextResponse.json({
      ok: true,
      borrados: {
        productos,
        categorias,
        movimientos,
        ventas,
        cotizaciones,
        auditorias,
      },
    })
  } catch (error) {
    console.error('Error al restablecer datos:', error)
    return NextResponse.json(
      { error: 'Error al restablecer la base de datos.' },
      { status: 500 }
    )
  }
}
